import crypto from "node:crypto";
import request from "supertest";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../src/app.js";
import { env } from "../../src/config/env.js";
import { stripe } from "../../src/config/stripe.js";
import {
  cleanupAppointmentFixture,
  createAppointmentFixture,
  createPendingStripeAppointment,
  prisma,
} from "../setup/database.js";
import { getPhase4BoundaryMocks } from "../setup/phase4-mocks.js";

const phase4BoundaryMocks = getPhase4BoundaryMocks();

type AppointmentFixture = Awaited<
  ReturnType<typeof createAppointmentFixture>
>;

type PendingStripeAppointment = Awaited<
  ReturnType<typeof createPendingStripeAppointment>
>;

function createCheckoutEventPayload(
  type: "checkout.session.completed" | "checkout.session.expired",
  fixture: AppointmentFixture,
  appointment: PendingStripeAppointment,
  options?: {
    paymentIntentId?: string;
    expiresAt?: number;
  },
) {
  const paymentIntentId =
    options?.paymentIntentId ?? `pi_test_${crypto.randomUUID()}`;
  const expiresAt =
    options?.expiresAt ?? Math.floor(Date.now() / 1000) + 30 * 60;

  return JSON.stringify({
    id: `evt_test_${crypto.randomUUID()}`,
    object: "event",
    api_version: "2026-06-30.basil",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: appointment.stripeCheckoutSessionId,
        object: "checkout.session",
        client_reference_id: appointment.id,
        expires_at: expiresAt,
        livemode: false,
        metadata: {
          appointmentId: appointment.id,
          customerId: fixture.customer.id,
        },
        mode: "payment",
        payment_intent:
          type === "checkout.session.completed"
            ? paymentIntentId
            : null,
        payment_status:
          type === "checkout.session.completed" ? "paid" : "unpaid",
        status:
          type === "checkout.session.completed" ? "complete" : "expired",
      },
    },
    livemode: false,
    pending_webhooks: 1,
    request: null,
    type,
  });
}

function createSignature(payload: string) {
  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret: env.STRIPE_WEBHOOK_SECRET,
  });
}

function postWebhook(payload: string, signature = createSignature(payload)) {
  return request(app)
    .post("/api/stripe/webhook")
    .set("Content-Type", "application/json")
    .set("stripe-signature", signature)
    .send(payload);
}

describe("POST /api/stripe/webhook", () => {
  let fixture: AppointmentFixture | undefined;

  beforeEach(() => {
    phase4BoundaryMocks.createCheckoutSession.mockReset();
    phase4BoundaryMocks.retrieveCheckoutSession.mockReset();
    phase4BoundaryMocks.expireCheckoutSession.mockReset();
    phase4BoundaryMocks.deliverEmail.mockReset();
    phase4BoundaryMocks.deliverEmail.mockResolvedValue({
      id: "email_test",
      provider: "console",
    });
  });

  afterEach(async () => {
    if (fixture) {
      await cleanupAppointmentFixture(fixture);
      fixture = undefined;
    }
  });

  async function arrangePendingStripeAppointment(prefix: string) {
    fixture = await createAppointmentFixture(prefix);
    const sessionId = `cs_test_${crypto.randomUUID()}`;
    const appointment = await createPendingStripeAppointment(
      fixture,
      sessionId,
    );

    return {
      fixture,
      appointment,
    };
  }

  it("accepts a signed completed event and persists the payment", async () => {
    const arranged = await arrangePendingStripeAppointment(
      "webhook-completed",
    );
    const paymentIntentId = `pi_test_${crypto.randomUUID()}`;
    const payload = createCheckoutEventPayload(
      "checkout.session.completed",
      arranged.fixture,
      arranged.appointment,
      { paymentIntentId },
    );

    const response = await postWebhook(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { id: arranged.appointment.id },
    });

    expect(appointment).toMatchObject({
      customerId: arranged.fixture.customer.id,
      barberId: arranged.fixture.barber.id,
      serviceId: arranged.fixture.service.id,
      paymentMethod: "STRIPE",
      paymentStatus: "PAID",
      stripeCheckoutSessionId:
        arranged.appointment.stripeCheckoutSessionId,
      stripePaymentIntentId: paymentIntentId,
    });
    expect(appointment.paidAt).toBeInstanceOf(Date);
    expect(phase4BoundaryMocks.deliverEmail).toHaveBeenCalledOnce();
    expect(phase4BoundaryMocks.deliverEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: arranged.fixture.customer.email,
      }),
    );
  });

  it("handles the same completed event idempotently", async () => {
    const arranged = await arrangePendingStripeAppointment(
      "webhook-idempotent",
    );
    const payload = createCheckoutEventPayload(
      "checkout.session.completed",
      arranged.fixture,
      arranged.appointment,
    );
    const signature = createSignature(payload);

    // Sequential delivery makes the paidAt stability assertion deterministic
    // while exercising the production PENDING guard used for Stripe retries.
    const firstResponse = await postWebhook(payload, signature);
    const afterFirstDelivery = await prisma.appointment.findUniqueOrThrow({
      where: { id: arranged.appointment.id },
    });
    const secondResponse = await postWebhook(payload, signature);
    const afterSecondDelivery = await prisma.appointment.findUniqueOrThrow({
      where: { id: arranged.appointment.id },
    });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(afterFirstDelivery.paymentStatus).toBe("PAID");
    expect(afterSecondDelivery.paymentStatus).toBe("PAID");
    expect(afterFirstDelivery.paidAt).toBeInstanceOf(Date);
    expect(afterSecondDelivery.paidAt).toEqual(afterFirstDelivery.paidAt);
    expect(afterSecondDelivery.updatedAt).toEqual(afterFirstDelivery.updatedAt);
    expect(phase4BoundaryMocks.deliverEmail).toHaveBeenCalledOnce();
    await expect(
      prisma.appointment.count({
        where: { id: arranged.appointment.id },
      }),
    ).resolves.toBe(1);
  });

  it("expires and cancels a pending Stripe appointment", async () => {
    const arranged = await arrangePendingStripeAppointment(
      "webhook-expired",
    );
    const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
    const payload = createCheckoutEventPayload(
      "checkout.session.expired",
      arranged.fixture,
      arranged.appointment,
      { expiresAt },
    );

    const response = await postWebhook(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { id: arranged.appointment.id },
    });
    const expectedExpiry = new Date(expiresAt * 1000);

    expect(appointment).toMatchObject({
      paymentStatus: "EXPIRED",
      status: "CANCELLED",
      cancelledBy: "SYSTEM",
      cancellationReason: "Stripe Checkout Session expired",
      paidAt: null,
      stripePaymentIntentId: null,
    });
    expect(appointment.cancelledAt).toEqual(expectedExpiry);
    expect(appointment.paymentExpiresAt).toEqual(expectedExpiry);
    expect(phase4BoundaryMocks.deliverEmail).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature without changing payment state", async () => {
    const arranged = await arrangePendingStripeAppointment(
      "webhook-invalid-signature",
    );
    const payload = createCheckoutEventPayload(
      "checkout.session.completed",
      arranged.fixture,
      arranged.appointment,
    );

    const response = await postWebhook(
      payload,
      "t=1,v1=invalid-signature",
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Invalid Stripe webhook signature",
    });
    expect(JSON.stringify(response.body)).not.toContain(
      env.STRIPE_WEBHOOK_SECRET,
    );
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { id: arranged.appointment.id },
    });

    expect(appointment).toMatchObject({
      paymentStatus: "PENDING",
      status: "PENDING",
      paidAt: null,
      stripePaymentIntentId: null,
    });
    expect(phase4BoundaryMocks.deliverEmail).not.toHaveBeenCalled();
  });

  it("keeps a completed payment when email delivery fails", async () => {
    const arranged = await arrangePendingStripeAppointment(
      "webhook-email-failure",
    );
    const paymentIntentId = `pi_test_${crypto.randomUUID()}`;
    const payload = createCheckoutEventPayload(
      "checkout.session.completed",
      arranged.fixture,
      arranged.appointment,
      { paymentIntentId },
    );
    const signature = createSignature(payload);
    phase4BoundaryMocks.deliverEmail.mockRejectedValue(
      new Error("Email provider unavailable"),
    );

    const firstResponse = await postWebhook(payload, signature);
    const afterFirstDelivery = await prisma.appointment.findUniqueOrThrow({
      where: { id: arranged.appointment.id },
    });
    const retryResponse = await postWebhook(payload, signature);
    const afterRetry = await prisma.appointment.findUniqueOrThrow({
      where: { id: arranged.appointment.id },
    });

    expect(firstResponse.status).toBe(200);
    expect(retryResponse.status).toBe(200);
    expect(afterFirstDelivery).toMatchObject({
      paymentStatus: "PAID",
      stripePaymentIntentId: paymentIntentId,
    });
    expect(afterFirstDelivery.paidAt).toBeInstanceOf(Date);
    expect(afterRetry.paidAt).toEqual(afterFirstDelivery.paidAt);
    expect(afterRetry.updatedAt).toEqual(afterFirstDelivery.updatedAt);
    expect(phase4BoundaryMocks.deliverEmail).toHaveBeenCalledOnce();
  });
});

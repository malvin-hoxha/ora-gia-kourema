import type Stripe from "stripe";
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
import { authenticateCustomer } from "../helpers/auth.js";
import {
  cleanupAppointmentFixture,
  createAppointmentFixture,
  prisma,
} from "../setup/database.js";
import { getPhase4BoundaryMocks } from "../setup/phase4-mocks.js";

const phase4BoundaryMocks = getPhase4BoundaryMocks();

type AppointmentFixture = Awaited<
  ReturnType<typeof createAppointmentFixture>
>;

function createCheckoutSession(
  fixture: AppointmentFixture,
): Stripe.Checkout.Session {
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60 + 5;

  return {
    id: `cs_test_${fixture.customer.id}`,
    object: "checkout.session",
    client_reference_id: null,
    customer_email: fixture.customer.email,
    expires_at: expiresAt,
    livemode: false,
    metadata: {
      appointmentId: "set-by-the-route",
      customerId: fixture.customer.id,
    },
    mode: "payment",
    payment_intent: null,
    payment_status: "unpaid",
    status: "open",
    url: `https://checkout.stripe.test/${fixture.customer.id}`,
  } as unknown as Stripe.Checkout.Session;
}

describe("POST /api/appointments", () => {
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

  async function arrangeAuthenticatedCustomer(prefix: string) {
    fixture = await createAppointmentFixture(prefix);
    const authentication = await authenticateCustomer(app, {
      email: fixture.customer.email,
      password: fixture.password,
    });

    return {
      fixture,
      cookieHeader: authentication.cookieHeader,
    };
  }

  it("creates a PAY_AT_STORE appointment for the authenticated customer", async () => {
    const arranged = await arrangeAuthenticatedCustomer("pay-at-store");

    const response = await request(app)
      .post("/api/appointments")
      .set("Cookie", arranged.cookieHeader)
      .send({
        ...arranged.fixture.requestBody,
        paymentMethod: "PAY_AT_STORE",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      message: "Appointment created successfully",
      data: {
        customer: { id: arranged.fixture.customer.id },
        barber: { id: arranged.fixture.barber.id },
        service: { id: arranged.fixture.service.id },
        paymentMethod: "PAY_AT_STORE",
        paymentStatus: "UNPAID",
        priceAtBooking: 24.5,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        paymentExpiresAt: null,
        checkoutUrl: null,
      },
    });

    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { id: response.body.data.id as string },
    });

    expect(appointment).toMatchObject({
      customerId: arranged.fixture.customer.id,
      barberId: arranged.fixture.barber.id,
      serviceId: arranged.fixture.service.id,
      paymentMethod: "PAY_AT_STORE",
      paymentStatus: "UNPAID",
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      paymentExpiresAt: null,
    });
    expect(Number(appointment.priceAtBooking)).toBe(24.5);
    expect(phase4BoundaryMocks.createCheckoutSession).not.toHaveBeenCalled();
    expect(phase4BoundaryMocks.deliverEmail).toHaveBeenCalledOnce();
    expect(phase4BoundaryMocks.deliverEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: arranged.fixture.customer.email,
      }),
    );
  });

  it("rejects an overlapping active appointment without side effects", async () => {
    const arranged = await arrangeAuthenticatedCustomer("appointment-overlap");
    const existingAppointment = await prisma.appointment.create({
      data: {
        customerId: arranged.fixture.customer.id,
        barberId: arranged.fixture.barber.id,
        serviceId: arranged.fixture.service.id,
        startsAt: arranged.fixture.startsAt,
        endsAt: arranged.fixture.endsAt,
        status: "PENDING",
        paymentMethod: "PAY_AT_STORE",
        paymentStatus: "UNPAID",
        priceAtBooking: arranged.fixture.service.price,
      },
    });

    const response = await request(app)
      .post("/api/appointments")
      .set("Cookie", arranged.cookieHeader)
      .send({
        ...arranged.fixture.requestBody,
        paymentMethod: "STRIPE",
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "The selected appointment slot is no longer available",
    });
    await expect(
      prisma.appointment.findMany({
        where: { barberId: arranged.fixture.barber.id },
      }),
    ).resolves.toEqual([existingAppointment]);
    expect(phase4BoundaryMocks.createCheckoutSession).not.toHaveBeenCalled();
    expect(phase4BoundaryMocks.deliverEmail).not.toHaveBeenCalled();
  });

  it("creates a pending Stripe appointment and a real Checkout request", async () => {
    const arranged = await arrangeAuthenticatedCustomer("stripe-checkout");
    const checkoutSession = createCheckoutSession(arranged.fixture);
    phase4BoundaryMocks.createCheckoutSession.mockImplementation(
      async (params) => ({
        ...checkoutSession,
        client_reference_id: params.client_reference_id ?? null,
        customer_email: params.customer_email ?? null,
        metadata: {
          appointmentId: String(params.metadata?.appointmentId),
          customerId: String(params.metadata?.customerId),
        },
      }),
    );

    const response = await request(app)
      .post("/api/appointments")
      .set("Cookie", arranged.cookieHeader)
      .send({
        ...arranged.fixture.requestBody,
        paymentMethod: "STRIPE",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      message: "Appointment created. Complete the online payment.",
      data: {
        customer: { id: arranged.fixture.customer.id },
        paymentMethod: "STRIPE",
        paymentStatus: "PENDING",
        priceAtBooking: 24.5,
        stripeCheckoutSessionId: checkoutSession.id,
        stripePaymentIntentId: null,
        checkoutUrl: checkoutSession.url,
      },
    });

    const appointmentId = response.body.data.id as string;
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointmentId },
    });
    const expectedExpiry = new Date(checkoutSession.expires_at * 1000);

    expect(appointment).toMatchObject({
      customerId: arranged.fixture.customer.id,
      barberId: arranged.fixture.barber.id,
      serviceId: arranged.fixture.service.id,
      paymentMethod: "STRIPE",
      paymentStatus: "PENDING",
      stripeCheckoutSessionId: checkoutSession.id,
      stripePaymentIntentId: null,
      paidAt: null,
    });
    expect(Number(appointment.priceAtBooking)).toBe(24.5);
    expect(appointment.paymentExpiresAt).toEqual(expectedExpiry);
    expect(new Date(response.body.data.paymentExpiresAt)).toEqual(
      expectedExpiry,
    );

    const stripeRequest =
      phase4BoundaryMocks.createCheckoutSession.mock.calls[0]?.[0];

    expect(stripeRequest).toBeDefined();
    expect(stripeRequest).toMatchObject({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: arranged.fixture.customer.email,
      client_reference_id: appointmentId,
      metadata: {
        appointmentId,
        customerId: arranged.fixture.customer.id,
      },
      payment_intent_data: {
        metadata: {
          appointmentId,
          customerId: arranged.fixture.customer.id,
        },
      },
      success_url:
        `${env.FRONTEND_URL}/booking/payment-success` +
        "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:
        `${env.FRONTEND_URL}/booking/payment-cancelled` +
        `?appointmentId=${encodeURIComponent(appointmentId)}`,
    });
    expect(stripeRequest?.line_items?.[0]).toMatchObject({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: 2450,
      },
    });
    expect(phase4BoundaryMocks.deliverEmail).not.toHaveBeenCalled();
  });

  it("persists a PAY_AT_STORE appointment when email delivery fails", async () => {
    const arranged = await arrangeAuthenticatedCustomer("email-failure");
    phase4BoundaryMocks.deliverEmail.mockRejectedValue(
      new Error("Email provider unavailable"),
    );

    const response = await request(app)
      .post("/api/appointments")
      .set("Cookie", arranged.cookieHeader)
      .send({
        ...arranged.fixture.requestBody,
        paymentMethod: "PAY_AT_STORE",
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Appointment created successfully");
    const appointment = await prisma.appointment.findUniqueOrThrow({
      where: { id: response.body.data.id as string },
    });

    expect(appointment.paymentMethod).toBe("PAY_AT_STORE");
    expect(appointment.paymentStatus).toBe("UNPAID");
    expect(phase4BoundaryMocks.deliverEmail).toHaveBeenCalledOnce();
    expect(phase4BoundaryMocks.createCheckoutSession).not.toHaveBeenCalled();
  });
});

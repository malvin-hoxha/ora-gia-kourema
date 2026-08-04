import { Router } from "express";
import Stripe from "stripe";

import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";
import { prisma } from "../lib/prisma.js";

import { safelySendEmail, sendBookingCreatedEmail, } from "../services/email/email.service.js";

export const stripeWebhookRouter = Router();

function getAppointmentId(session: Stripe.Checkout.Session,) {
  return (
    session.metadata?.appointmentId ??
    session.client_reference_id
  );
}

function getPaymentIntentId(session: Stripe.Checkout.Session,) {
  const paymentIntent = session.payment_intent;

  if (typeof paymentIntent === "string") {
    return paymentIntent;
  }

  return paymentIntent?.id ?? null;
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  if (
    session.payment_status !== "paid"
  ) {
    console.warn(
      "Checkout completed without paid status:",
      session.id,
      session.payment_status,
    );

    return;
  }

  const appointmentId =
    getAppointmentId(session);

  if (!appointmentId) {
    throw new Error(
      `Stripe Session ${session.id} does not contain an appointmentId`,
    );
  }

  const paymentIntentId =
    getPaymentIntentId(session);

  /*
   * Load the appointment details before updating
   * it so that we have everything needed for the
   * confirmation email.
   */
  const appointmentForEmail =
    await prisma.appointment.findFirst({
      where: {
        id: appointmentId,

        stripeCheckoutSessionId:
          session.id,

        paymentMethod: "STRIPE",
        paymentStatus: "PENDING",
      },

      select: {
        id: true,
        startsAt: true,
        priceAtBooking: true,

        customer: {
          select: {
            name: true,
            email: true,
          },
        },

        barber: {
          select: {
            name: true,
          },
        },

        service: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });

  if (!appointmentForEmail) {
    console.log(
      "Stripe Checkout Session was already processed or did not match:",
      session.id,
    );

    return;
  }

  /*
   * Only the first webhook delivery can change
   * PENDING to PAID.
   */
  const updateResult =
    await prisma.appointment.updateMany({
      where: {
        id: appointmentId,

        stripeCheckoutSessionId:
          session.id,

        paymentMethod: "STRIPE",
        paymentStatus: "PENDING",
      },

      data: {
        paymentStatus: "PAID",

        stripePaymentIntentId:
          paymentIntentId,

        paidAt: new Date(),
      },
    });

  if (updateResult.count === 0) {
    console.log(
      "Stripe Checkout Session was already processed:",
      session.id,
    );

    return;
  }

  /*
   * Email failure must not make Stripe retry
   * an otherwise successful payment webhook.
   */
  await safelySendEmail(() =>
    sendBookingCreatedEmail({
      customerName:
        appointmentForEmail.customer.name,

      customerEmail:
        appointmentForEmail.customer.email,

      barberName:
        appointmentForEmail.barber.name,

      serviceName:
        appointmentForEmail.service.name,

      startsAt:
        appointmentForEmail.startsAt,

      price: Number(
        appointmentForEmail.priceAtBooking ??
          appointmentForEmail.service.price,
      ),
    }),
  );

  console.log(
    "Stripe appointment payment completed:",
    {
      appointmentId,
      checkoutSessionId:
        session.id,
      paymentIntentId,
    },
  );
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session,) {
  const appointmentId = getAppointmentId(session);

  if (!appointmentId) {
    throw new Error( `Expired Stripe Session ${session.id} does not contain an appointmentId`,);
  }

  const expiredAt = session.expires_at ? new Date( session.expires_at * 1000, ) : new Date();

  /*
   * A paid appointment cannot be expired because
   * the where condition only accepts PENDING
   * payments.
   */
  const updateResult = await prisma.appointment.updateMany({
      where: {
        id: appointmentId,

        stripeCheckoutSessionId: session.id,

        paymentMethod: "STRIPE",
        paymentStatus: "PENDING",
      },

      data: {
        paymentStatus: "EXPIRED",

        status: "CANCELLED",

        cancelledAt: expiredAt,
        cancelledBy: "SYSTEM",

        cancellationReason: "Stripe Checkout Session expired",

        paymentExpiresAt: expiredAt,
      },
    });

  if (updateResult.count === 0) {
    console.log("Expired Stripe Session was already processed or did not match:", session.id,);

    return;
  }

  console.log("Stripe appointment payment expired:", {
      appointmentId,
      checkoutSessionId: session.id,
    },
  );
}

stripeWebhookRouter.post( "/", async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature ||  Array.isArray(signature)) {
      res.status(400).json({ message: "Missing Stripe signature", });

      return;
    }

    if (!Buffer.isBuffer(req.body)) {
      res.status(400).json({ message: "Stripe webhook body must be raw",});

      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent( req.body, signature, env.STRIPE_WEBHOOK_SECRET, );
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error,);

      res.status(400).json({
        message: "Invalid Stripe webhook signature",
      });

      return;
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;

          await handleCheckoutCompleted( session, );

          break;
        }

        case "checkout.session.expired": {
          const session = event.data.object as Stripe.Checkout.Session;

          await handleCheckoutExpired(session,);

          break;
        }

        default: {
          console.log(`Unhandled Stripe event: ${event.type}`,);
        }
      }

      res.status(200).json({received: true,});
    } catch (error) {
      /*
       * Returning 500 causes Stripe to retry the
       * webhook later.
       */
      console.error("Stripe webhook processing failed:",error,);

      res.status(500).json({
        message: "Stripe webhook processing failed",
      });
    }
  },
);
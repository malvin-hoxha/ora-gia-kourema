import { DateTime } from "luxon";

import { env } from "../config/env.js";
import { stripe } from "../config/stripe.js";

type CreateAppointmentCheckoutSessionInput = {
  appointmentId: string;
  customerId: string;
  customerEmail: string;
  barberName: string;
  serviceName: string;
  startsAt: Date;
  price: number;
};

function convertEurosToCents(amount: number,) {
  const amountInCents = Math.round(amount * 100);

  if (!Number.isSafeInteger(amountInCents) || amountInCents <= 0) {
    throw new Error(
      "Invalid Stripe payment amount",
    );
  }

  return amountInCents;
}

export async function createAppointmentCheckoutSession(input: CreateAppointmentCheckoutSessionInput,) {
    /*
    * Stripe allows Checkout Sessions to expire
    * between 30 minutes and 24 hours.
    *
    * The small safety offset prevents network
    * latency from making a 30-minute expiration
    * appear slightly shorter than the minimum.
    */

    const expirationSafetySeconds = env.STRIPE_CHECKOUT_EXPIRES_MINUTES === 1440 ? -5 : 5;

    const expiresAt = Math.floor(Date.now() / 1000) + env.STRIPE_CHECKOUT_EXPIRES_MINUTES * 60 + expirationSafetySeconds;

    const localStartsAt = DateTime.fromJSDate(
        input.startsAt,
        {
            zone: "utc",
        },
        )
        .setZone(env.BARBERSHOP_TIME_ZONE)
        .setLocale("el")
        .toFormat("dd/LL/yyyy HH:mm"
    );

    const metadata = { appointmentId: input.appointmentId, customerId: input.customerId, };

    const checkoutSession = await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: ["card"],

        success_url: `${env.CLIENT_URL}` + "/booking/payment-success" + "?session_id={CHECKOUT_SESSION_ID}",

        cancel_url: `${env.CLIENT_URL}` + "/booking/payment-cancelled" + `?appointmentId=${encodeURIComponent(input.appointmentId,)}`,

        customer_email: input.customerEmail,

        client_reference_id: input.appointmentId,

        metadata,

        payment_intent_data: { metadata, },

        line_items: [{
            quantity: 1,

            price_data: {
                currency: env.STRIPE_CURRENCY,

                unit_amount: convertEurosToCents(input.price,),

                product_data: {
                    name: input.serviceName,

                    description: `Ραντεβού με ${input.barberName}` + ` — ${localStartsAt}`,
                },
            },
        },],
        expires_at: expiresAt,
    });

    if (!checkoutSession.url) {
        await safelyExpireCheckoutSession( checkoutSession.id,);

        throw new Error(
        "Stripe Checkout Session URL is missing",
        );
    }

  return checkoutSession;
}

export async function safelyExpireCheckoutSession(checkoutSessionId: string,) {
  try {
    await stripe.checkout.sessions.expire(checkoutSessionId,);
  } catch (error) {
    console.error("Failed to expire Stripe Checkout Session:", error,);
  }
}
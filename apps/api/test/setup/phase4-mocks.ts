import type Stripe from "stripe";
import { vi } from "vitest";

import type {
  SendEmailInput,
  SendEmailResult,
} from "../../src/services/email/email.types.js";

type CreateCheckoutSession = (
  params: Stripe.Checkout.SessionCreateParams,
) => Promise<Stripe.Checkout.Session>;

type RetrieveCheckoutSession = (
  sessionId: string,
) => Promise<Stripe.Checkout.Session>;

type ExpireCheckoutSession = (
  sessionId: string,
) => Promise<Stripe.Checkout.Session>;

type DeliverEmail = (
  input: SendEmailInput,
) => Promise<SendEmailResult>;

const phase4BoundaryMocks = vi.hoisted(() => {
  const processGlobal = globalThis as typeof globalThis & {
    __phase4BoundaryMocks?: {
      createCheckoutSession: ReturnType<typeof vi.fn<CreateCheckoutSession>>;
      retrieveCheckoutSession: ReturnType<
        typeof vi.fn<RetrieveCheckoutSession>
      >;
      expireCheckoutSession: ReturnType<typeof vi.fn<ExpireCheckoutSession>>;
      deliverEmail: ReturnType<typeof vi.fn<DeliverEmail>>;
    };
  };

  processGlobal.__phase4BoundaryMocks ??= {
    createCheckoutSession: vi.fn<CreateCheckoutSession>(),
    retrieveCheckoutSession: vi.fn<RetrieveCheckoutSession>(),
    expireCheckoutSession: vi.fn<ExpireCheckoutSession>(),
    deliverEmail: vi.fn<DeliverEmail>(),
  };

  return processGlobal.__phase4BoundaryMocks;
});

export function getPhase4BoundaryMocks() {
  return phase4BoundaryMocks;
}

vi.mock("../../src/config/stripe.js", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../src/config/stripe.js")
  >();

  actual.stripe.checkout.sessions.create =
    phase4BoundaryMocks.createCheckoutSession as unknown as
      typeof actual.stripe.checkout.sessions.create;
  actual.stripe.checkout.sessions.retrieve =
    phase4BoundaryMocks.retrieveCheckoutSession as unknown as
      typeof actual.stripe.checkout.sessions.retrieve;
  actual.stripe.checkout.sessions.expire =
    phase4BoundaryMocks.expireCheckoutSession as unknown as
      typeof actual.stripe.checkout.sessions.expire;

  return actual;
});

vi.mock(
  "../../src/services/email/email.provider.js",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("../../src/services/email/email.provider.js")
    >();

    return {
      ...actual,
      sendEmail: phase4BoundaryMocks.deliverEmail,
    };
  },
);

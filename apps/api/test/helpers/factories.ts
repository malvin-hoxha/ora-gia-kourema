import crypto from "node:crypto";
import { DateTime } from "luxon";

export const TEST_PASSWORD = "Phase2TestPassword123";

export function createRegistrationInput() {
  return {
    name: "Integration Test Customer",
    email: `registration-${crypto.randomUUID()}@example.test`,
    phone: "+306900000000",
    password: "Phase1TestPassword123",
  };
}

export function createPasswordUserInput(
  prefix = "auth",
) {
  return {
    name: "Integration Test Customer",
    email: `${prefix}-${crypto.randomUUID()}@example.test`,
    phone: "+306900000001",
    password: TEST_PASSWORD,
  };
}

export function createGoogleIdentity(
  prefix = "google",
) {
  const uniqueId = crypto.randomUUID();

  return {
    providerAccountId: `${prefix}-${uniqueId}`,
    email: `${prefix}-${uniqueId}@example.test`,
    name: "Integration Google User",
  };
}

export function createFutureAppointmentDateTime() {
  const timeZone =
    process.env.BARBERSHOP_TIME_ZONE ?? "Europe/Athens";
  const startsAt = DateTime.now()
    .setZone(timeZone)
    .plus({ days: 2 })
    .startOf("day")
    .set({ hour: 12, minute: 0 });

  if (!startsAt.isValid || !startsAt.toISO()) {
    throw new Error("Unable to create a future appointment time");
  }

  return startsAt;
}

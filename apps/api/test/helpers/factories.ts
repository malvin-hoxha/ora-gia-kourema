import crypto from "node:crypto";

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

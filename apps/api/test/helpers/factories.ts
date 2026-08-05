import crypto from "node:crypto";

export function createRegistrationInput() {
  return {
    name: "Integration Test Customer",
    email: `registration-${crypto.randomUUID()}@example.test`,
    phone: "+306900000000",
    password: "Phase1TestPassword123",
  };
}

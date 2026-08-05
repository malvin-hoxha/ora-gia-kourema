import { ipKeyGenerator } from "express-rate-limit";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import {
  loginAccountRateLimiter,
  loginIpRateLimiter,
} from "../../src/middleware/auth-rate-limit.middleware.js";
import { createPasswordUserInput } from "../helpers/factories.js";
import {
  cleanupAuthData,
  createPasswordUser,
  prisma,
} from "../setup/database.js";

function getConfiguredAccountLimit(headers: Record<string, unknown>) {
  const policy = headers["ratelimit-policy"];

  if (typeof policy !== "string") {
    throw new Error("Login response did not include RateLimit-Policy");
  }

  const quotas = [...policy.matchAll(/\bq=(\d+)\b/g)].map(
    (match) => Number(match[1]),
  );

  if (quotas.length === 0) {
    throw new Error("Unable to derive the configured login rate limit");
  }

  return Math.min(...quotas);
}

describe("POST /api/auth/login rate limiting", () => {
  const createdEmails = new Set<string>();
  let limitedEmail: string | undefined;
  let observedIpAddress: string | undefined;

  afterEach(async () => {
    if (limitedEmail) {
      loginAccountRateLimiter.resetKey(`email:${limitedEmail}`);
    }

    const possibleIpAddresses = new Set([
      observedIpAddress,
      "127.0.0.1",
      "::1",
      "::ffff:127.0.0.1",
    ]);

    for (const ipAddress of possibleIpAddresses) {
      if (ipAddress) {
        loginIpRateLimiter.resetKey(
          ipKeyGenerator(ipAddress, 56),
        );
      }
    }

    for (const email of createdEmails) {
      await cleanupAuthData(email);
    }

    createdEmails.clear();
    limitedEmail = undefined;
    observedIpAddress = undefined;
  });

  it("returns 429 after the configured failed-login threshold", async () => {
    const limitedInput = createPasswordUserInput("rate-limited");
    await createPasswordUser(limitedInput);
    createdEmails.add(limitedInput.email);
    limitedEmail = limitedInput.email;

    const makeFailedLogin = () =>
      request(app)
        .post("/api/auth/login")
        .send({
          email: limitedInput.email,
          password: "IncorrectPassword123",
        });

    const firstResponse = await makeFailedLogin();

    expect(firstResponse.status).toBe(401);

    const configuredLimit = getConfiguredAccountLimit(
      firstResponse.headers,
    );

    for (let attempt = 2; attempt <= configuredLimit; attempt += 1) {
      const response = await makeFailedLogin();
      expect(response.status).toBe(401);
    }

    const limitedResponse = await makeFailedLogin();

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      message:
        "Too many failed login attempts for this account. Please try again later.",
    });

    await expect(
      prisma.session.count({
        where: { user: { email: limitedInput.email } },
      }),
    ).resolves.toBe(0);

    const successfulInput = createPasswordUserInput("rate-success");
    const { user: successfulUser } = await createPasswordUser(
      successfulInput,
    );
    createdEmails.add(successfulInput.email);

    const successfulResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: successfulInput.email,
        password: successfulInput.password,
      });

    expect(successfulResponse.status).toBe(200);

    const successfulSession = await prisma.session.findFirstOrThrow({
      where: { userId: successfulUser.id },
    });

    observedIpAddress = successfulSession.ipAddress ?? undefined;
  });
});

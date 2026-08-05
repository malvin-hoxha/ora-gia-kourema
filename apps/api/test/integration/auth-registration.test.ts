import argon2 from "argon2";
import request from "supertest";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../../src/constants/auth.constants.js";
import { createRegistrationInput } from "../helpers/factories.js";
import {
  cleanupRegistrationUser,
  disconnectTestDatabase,
  prisma,
} from "../setup/database.js";

function findCookie(
  setCookies: string[],
  cookieName: string,
) {
  return setCookies.find((cookie) =>
    cookie.startsWith(`${cookieName}=`),
  );
}

function extractCookieValue(cookie: string) {
  const firstSegment = cookie.split(";", 1)[0];
  const separatorIndex = firstSegment?.indexOf("=") ?? -1;

  if (!firstSegment || separatorIndex < 0) {
    throw new Error("Response contained a malformed authentication cookie");
  }

  return decodeURIComponent(firstSegment.slice(separatorIndex + 1));
}

describe("POST /api/auth/register", () => {
  let registeredEmail: string | undefined;

  afterEach(async () => {
    if (registeredEmail) {
      await cleanupRegistrationUser(registeredEmail);
      registeredEmail = undefined;
    }
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("creates a customer and authenticated session", async () => {
    const registration = createRegistrationInput();
    registeredEmail = registration.email;

    const response = await request(app)
      .post("/api/auth/register")
      .send(registration);

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      role: "CUSTOMER",
    });
    expect(response.body.data.user).not.toHaveProperty("passwordHash");

    const rawSetCookies: unknown =
      response.headers["set-cookie"];

    const setCookies = Array.isArray(rawSetCookies)
      ? rawSetCookies.filter(
          (cookie): cookie is string =>
            typeof cookie === "string",
        )
      : typeof rawSetCookies === "string"
        ? [rawSetCookies]
        : [];

    expect(setCookies.length).toBeGreaterThan(0);

    const accessCookie = findCookie(
      setCookies,
      ACCESS_TOKEN_COOKIE,
    );

    const refreshCookie = findCookie(
      setCookies,
      REFRESH_TOKEN_COOKIE,
    );

    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();
    expect(accessCookie).toMatch(/; HttpOnly(?:;|$)/i);
    expect(refreshCookie).toMatch(/; HttpOnly(?:;|$)/i);
    expect(accessCookie).toMatch(/; SameSite=Lax(?:;|$)/i);
    expect(refreshCookie).toMatch(/; SameSite=Lax(?:;|$)/i);

    const users = await prisma.user.findMany({
      where: { email: registration.email },
    });

    expect(users).toHaveLength(1);

    const user = users[0];

    expect(user).toBeDefined();
    expect(user?.passwordHash).toBeTruthy();
    expect(user?.passwordHash).not.toBe(registration.password);

    if (!user?.passwordHash) {
      throw new Error("Registered user has no password hash");
    }

    await expect(
      argon2.verify(user.passwordHash, registration.password),
    ).resolves.toBe(true);

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);

    const session = sessions[0];

    expect(session).toBeDefined();
    expect(session?.revokedAt).toBeNull();
    expect(session?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    if (!session || !refreshCookie) {
      throw new Error("Registration did not create a complete session");
    }

    const refreshToken = extractCookieValue(refreshCookie);

    await expect(
      argon2.verify(session.refreshTokenHash, refreshToken),
    ).resolves.toBe(true);
  });
});

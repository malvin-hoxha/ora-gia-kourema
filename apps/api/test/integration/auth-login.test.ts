import argon2 from "argon2";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../../src/constants/auth.constants.js";
import {
  extractCookieValue,
  findCookie,
  getSetCookies,
  requireCookie,
} from "../helpers/cookies.js";
import { createPasswordUserInput } from "../helpers/factories.js";
import {
  cleanupAuthData,
  createPasswordUser,
  prisma,
} from "../setup/database.js";

describe("POST /api/auth/login", () => {
  const createdEmails = new Set<string>();

  afterEach(async () => {
    for (const email of createdEmails) {
      await cleanupAuthData(email);
    }

    createdEmails.clear();
  });

  it("rejects an incorrect password", async () => {
    const input = createPasswordUserInput("login-invalid");
    const { user } = await createPasswordUser(input);
    createdEmails.add(input.email);

    const sessionsBefore = await prisma.session.count({
      where: { userId: user.id },
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: input.email,
        password: "IncorrectPassword123",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid email or password",
    });

    const setCookies = getSetCookies(response.headers);

    expect(findCookie(setCookies, ACCESS_TOKEN_COOKIE)).toBeUndefined();
    expect(findCookie(setCookies, REFRESH_TOKEN_COOKIE)).toBeUndefined();

    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(sessionsBefore);
  });

  it("creates an authenticated session", async () => {
    const input = createPasswordUserInput("login-success");
    const { user } = await createPasswordUser(input);
    createdEmails.add(input.email);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: input.email,
        password: input.password,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual({
      id: user.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: "CUSTOMER",
    });
    expect(response.body.data.user).not.toHaveProperty("passwordHash");

    const setCookies = getSetCookies(response.headers);
    const accessCookie = requireCookie(
      setCookies,
      ACCESS_TOKEN_COOKIE,
    );
    const refreshCookie = requireCookie(
      setCookies,
      REFRESH_TOKEN_COOKIE,
    );

    expect(accessCookie).toMatch(/; HttpOnly(?:;|$)/i);
    expect(refreshCookie).toMatch(/; HttpOnly(?:;|$)/i);
    expect(accessCookie).toMatch(/; SameSite=Lax(?:;|$)/i);
    expect(refreshCookie).toMatch(/; SameSite=Lax(?:;|$)/i);

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);

    const session = sessions[0];

    expect(session).toBeDefined();
    expect(session?.revokedAt).toBeNull();
    expect(session?.expiresAt.getTime()).toBeGreaterThan(Date.now());

    if (!session) {
      throw new Error("Login did not create a session");
    }

    const refreshToken = extractCookieValue(refreshCookie);

    await expect(
      argon2.verify(session.refreshTokenHash, refreshToken),
    ).resolves.toBe(true);
  });
});

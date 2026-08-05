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
  getSetCookies,
  requireCookie,
  toCookieHeader,
} from "../helpers/cookies.js";
import { createPasswordUserInput } from "../helpers/factories.js";
import {
  cleanupAuthData,
  createPasswordUser,
  prisma,
} from "../setup/database.js";

function expectClearedCookie(cookie: string, cookieName: string) {
  expect(cookie).toMatch(new RegExp(`^${cookieName}=;`, "i"));
  expect(cookie).toMatch(/; Path=\/(?:;|$)/i);
  expect(cookie).toMatch(/; SameSite=Lax(?:;|$)/i);
  expect(cookie).toMatch(
    /; Expires=Thu, 01 Jan 1970 00:00:00 GMT(?:;|$)/i,
  );
}

describe("POST /api/auth/refresh", () => {
  let createdEmail: string | undefined;

  afterEach(async () => {
    if (createdEmail) {
      await cleanupAuthData(createdEmail);
      createdEmail = undefined;
    }
  });

  it("rotates the refresh token", async () => {
    const input = createPasswordUserInput("refresh-success");
    const { user } = await createPasswordUser(input);
    createdEmail = input.email;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: input.email, password: input.password });

    expect(loginResponse.status).toBe(200);

    const initialRefreshCookie = requireCookie(
      getSetCookies(loginResponse.headers),
      REFRESH_TOKEN_COOKIE,
    );
    const initialRefreshToken = extractCookieValue(
      initialRefreshCookie,
    );
    const initialSession = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
    });

    const response = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", toCookieHeader(initialRefreshCookie));

    expect(response.status).toBe(200);

    const setCookies = getSetCookies(response.headers);
    requireCookie(setCookies, ACCESS_TOKEN_COOKIE);
    const newRefreshCookie = requireCookie(
      setCookies,
      REFRESH_TOKEN_COOKIE,
    );
    const newRefreshToken = extractCookieValue(newRefreshCookie);

    expect(newRefreshToken).not.toBe(initialRefreshToken);

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);

    const rotatedSession = sessions[0];

    expect(rotatedSession).toBeDefined();
    expect(rotatedSession?.id).toBe(initialSession.id);
    expect(rotatedSession?.refreshTokenHash).not.toBe(
      initialSession.refreshTokenHash,
    );
    expect(rotatedSession?.revokedAt).toBeNull();

    if (!rotatedSession) {
      throw new Error("Refresh did not preserve the session");
    }

    await expect(
      argon2.verify(
        rotatedSession.refreshTokenHash,
        newRefreshToken,
      ),
    ).resolves.toBe(true);
    await expect(
      argon2.verify(
        rotatedSession.refreshTokenHash,
        initialRefreshToken,
      ),
    ).resolves.toBe(false);
  });

  it("rejects an invalid refresh token and clears auth cookies", async () => {
    const input = createPasswordUserInput("refresh-invalid");
    const { user } = await createPasswordUser(input);
    createdEmail = input.email;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: input.email, password: input.password });

    expect(loginResponse.status).toBe(200);

    const unrelatedSession = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
    });
    const sessionsBefore = await prisma.session.count();

    const response = await request(app)
      .post("/api/auth/refresh")
      .set(
        "Cookie",
        `${REFRESH_TOKEN_COOKIE}=not-a-valid-refresh-token`,
      );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Refresh token is invalid or expired",
    });

    const setCookies = getSetCookies(response.headers);
    const clearedAccessCookie = requireCookie(
      setCookies,
      ACCESS_TOKEN_COOKIE,
    );
    const clearedRefreshCookie = requireCookie(
      setCookies,
      REFRESH_TOKEN_COOKIE,
    );

    expectClearedCookie(clearedAccessCookie, ACCESS_TOKEN_COOKIE);
    expectClearedCookie(clearedRefreshCookie, REFRESH_TOKEN_COOKIE);

    await expect(prisma.session.count()).resolves.toBe(sessionsBefore);

    const sessionAfter = await prisma.session.findUniqueOrThrow({
      where: { id: unrelatedSession.id },
    });

    expect(sessionAfter.revokedAt).toBeNull();
    expect(sessionAfter.refreshTokenHash).toBe(
      unrelatedSession.refreshTokenHash,
    );
  });
});

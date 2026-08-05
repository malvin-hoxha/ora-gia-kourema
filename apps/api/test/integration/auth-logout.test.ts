import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../../src/constants/auth.constants.js";
import {
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

describe("POST /api/auth/logout", () => {
  let createdEmail: string | undefined;

  afterEach(async () => {
    if (createdEmail) {
      await cleanupAuthData(createdEmail);
      createdEmail = undefined;
    }
  });

  it("revokes the authenticated session and clears auth cookies", async () => {
    const input = createPasswordUserInput("logout");
    const { user } = await createPasswordUser(input);
    createdEmail = input.email;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: input.email, password: input.password });

    expect(loginResponse.status).toBe(200);

    const refreshCookie = requireCookie(
      getSetCookies(loginResponse.headers),
      REFRESH_TOKEN_COOKIE,
    );
    const sessionBefore = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
    });

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", toCookieHeader(refreshCookie));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Logout successful" });

    const setCookies = getSetCookies(response.headers);
    expectClearedCookie(
      requireCookie(setCookies, ACCESS_TOKEN_COOKIE),
      ACCESS_TOKEN_COOKIE,
    );
    expectClearedCookie(
      requireCookie(setCookies, REFRESH_TOKEN_COOKIE),
      REFRESH_TOKEN_COOKIE,
    );

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.id).toBe(sessionBefore.id);
    expect(sessions[0]?.revokedAt).toBeInstanceOf(Date);

    const missingCookieResponse = await request(app).post(
      "/api/auth/logout",
    );

    expect(missingCookieResponse.status).toBe(200);
    expect(missingCookieResponse.body).toEqual({
      message: "Logout successful",
    });
    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(1);
  });
});

import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { ACCESS_TOKEN_COOKIE } from "../../src/constants/auth.constants.js";
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

async function getDatabaseCounts() {
  const [
    users,
    sessions,
    authAccounts,
    barbers,
    services,
    barberServices,
    workingHours,
    timeOff,
    appointments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.session.count(),
    prisma.authAccount.count(),
    prisma.barber.count(),
    prisma.service.count(),
    prisma.barberService.count(),
    prisma.workingHours.count(),
    prisma.timeOff.count(),
    prisma.appointment.count(),
  ]);

  return {
    users,
    sessions,
    authAccounts,
    barbers,
    services,
    barberServices,
    workingHours,
    timeOff,
    appointments,
  };
}

describe("GET /api/admin/overview authentication", () => {
  let createdEmail: string | undefined;

  afterEach(async () => {
    if (createdEmail) {
      await cleanupAuthData(createdEmail);
      createdEmail = undefined;
    }
  });

  it("rejects a request without authentication without mutating auth data", async () => {
    const before = await getDatabaseCounts();

    const response = await request(app).get("/api/admin/overview");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Authentication required",
    });
    await expect(getDatabaseCounts()).resolves.toEqual(before);
  });

  it("rejects an authenticated CUSTOMER", async () => {
    const input = createPasswordUserInput("admin-role");
    await createPasswordUser(input);
    createdEmail = input.email;

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: input.email,
        password: input.password,
      });

    expect(loginResponse.status).toBe(200);

    const accessCookie = requireCookie(
      getSetCookies(loginResponse.headers),
      ACCESS_TOKEN_COOKIE,
    );

    const response = await request(app)
      .get("/api/admin/overview")
      .set("Cookie", toCookieHeader(accessCookie));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "You do not have permission to access this resource",
    });
  });
});

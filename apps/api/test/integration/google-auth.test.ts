import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { VerifiedGoogleIdentity } from "../../src/services/google-auth.service.js";

const googleVerificationMock = vi.hoisted(() => ({
  verify: vi.fn<
    (credential: string) => Promise<VerifiedGoogleIdentity>
  >(),
}));

vi.mock(
  "../../src/services/google-auth.service.js",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("../../src/services/google-auth.service.js")
    >();

    return {
      ...actual,
      verifyGoogleCredential: googleVerificationMock.verify,
    };
  },
);

import { app } from "../../src/app.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../../src/constants/auth.constants.js";
import { GoogleCredentialError } from "../../src/services/google-auth.service.js";
import {
  findCookie,
  getSetCookies,
  requireCookie,
} from "../helpers/cookies.js";
import {
  createGoogleIdentity,
  createPasswordUserInput,
} from "../helpers/factories.js";
import {
  cleanupAuthData,
  createPasswordUser,
  prisma,
} from "../setup/database.js";

const MOCK_CREDENTIAL = "mock-google-credential";

function expectAuthenticationCookies(headers: Record<string, unknown>) {
  const setCookies = getSetCookies(headers);
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
}

function expectNoAuthenticationCookies(
  headers: Record<string, unknown>,
) {
  const setCookies = getSetCookies(headers);

  expect(findCookie(setCookies, ACCESS_TOKEN_COOKIE)).toBeUndefined();
  expect(findCookie(setCookies, REFRESH_TOKEN_COOKIE)).toBeUndefined();
}

describe("Google authentication", () => {
  const createdEmails = new Set<string>();

  afterEach(async () => {
    googleVerificationMock.verify.mockReset();

    for (const email of createdEmails) {
      await cleanupAuthData(email);
    }

    createdEmails.clear();
  });

  it("creates and authenticates a new Google user", async () => {
    const identity = createGoogleIdentity("google-new");
    createdEmails.add(identity.email);
    googleVerificationMock.verify.mockResolvedValue(identity);

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: MOCK_CREDENTIAL });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      name: identity.name,
      email: identity.email,
      role: "CUSTOMER",
    });
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expectAuthenticationCookies(response.headers);

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: identity.email },
      include: {
        authAccounts: true,
        sessions: true,
      },
    });

    expect(user.passwordHash).toBeNull();
    expect(user.role).toBe("CUSTOMER");
    expect(user.authAccounts).toHaveLength(1);
    expect(user.authAccounts[0]).toMatchObject({
      provider: "GOOGLE",
      providerAccountId: identity.providerAccountId,
    });
    expect(user.sessions).toHaveLength(1);
  });

  it("authenticates an existing linked Google account without duplicates", async () => {
    const identity = createGoogleIdentity("google-linked");
    createdEmails.add(identity.email);

    const existingUser = await prisma.user.create({
      data: {
        name: identity.name,
        email: identity.email,
        passwordHash: null,
        role: "CUSTOMER",
        authAccounts: {
          create: {
            provider: "GOOGLE",
            providerAccountId: identity.providerAccountId,
          },
        },
      },
    });

    googleVerificationMock.verify.mockResolvedValue(identity);

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: MOCK_CREDENTIAL });

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe(existingUser.id);
    expectAuthenticationCookies(response.headers);
    await expect(
      prisma.user.count({ where: { email: identity.email } }),
    ).resolves.toBe(1);
    await expect(
      prisma.authAccount.count({
        where: { userId: existingUser.id },
      }),
    ).resolves.toBe(1);
    await expect(
      prisma.session.count({ where: { userId: existingUser.id } }),
    ).resolves.toBe(1);
  });

  it("requires explicit linking for an existing password account", async () => {
    const input = createPasswordUserInput("google-link-required");
    const { user } = await createPasswordUser(input);
    createdEmails.add(input.email);

    const identity = {
      ...createGoogleIdentity("google-link-required-provider"),
      email: input.email,
    };
    googleVerificationMock.verify.mockResolvedValue(identity);

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: MOCK_CREDENTIAL });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: "ACCOUNT_LINK_REQUIRED",
      data: { email: input.email },
    });
    await expect(
      prisma.authAccount.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
  });

  it("rejects Google linking with the wrong password", async () => {
    const input = createPasswordUserInput("google-link-wrong");
    const { user } = await createPasswordUser(input);
    createdEmails.add(input.email);

    const identity = {
      ...createGoogleIdentity("google-link-wrong-provider"),
      email: input.email,
    };
    googleVerificationMock.verify.mockResolvedValue(identity);

    const response = await request(app)
      .post("/api/auth/google/link")
      .send({
        credential: MOCK_CREDENTIAL,
        password: "IncorrectPassword123",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Email or password is incorrect",
    });
    expectNoAuthenticationCookies(response.headers);
    await expect(
      prisma.authAccount.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
  });

  it("links a Google account with the correct password", async () => {
    const input = createPasswordUserInput("google-link-success");
    const { user } = await createPasswordUser(input);
    createdEmails.add(input.email);

    const identity = {
      ...createGoogleIdentity("google-link-success-provider"),
      email: input.email,
    };
    googleVerificationMock.verify.mockResolvedValue(identity);

    const response = await request(app)
      .post("/api/auth/google/link")
      .send({
        credential: MOCK_CREDENTIAL,
        password: input.password,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.user.id).toBe(user.id);
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expectAuthenticationCookies(response.headers);

    const authAccounts = await prisma.authAccount.findMany({
      where: { userId: user.id },
    });

    expect(authAccounts).toHaveLength(1);
    expect(authAccounts[0]).toMatchObject({
      provider: "GOOGLE",
      providerAccountId: identity.providerAccountId,
    });
    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(1);
  });

  it("rejects an invalid Google credential without persisting auth data", async () => {
    const identity = createGoogleIdentity("google-invalid");
    const countsBefore = await Promise.all([
      prisma.user.count(),
      prisma.authAccount.count(),
      prisma.session.count(),
    ]);

    googleVerificationMock.verify.mockRejectedValue(
      new GoogleCredentialError("Google credential is invalid"),
    );

    const loginResponse = await request(app)
      .post("/api/auth/google")
      .send({ credential: MOCK_CREDENTIAL });

    expect(loginResponse.status).toBe(401);
    expect(loginResponse.body).toEqual({
      message: "Google credential is invalid",
    });
    expectNoAuthenticationCookies(loginResponse.headers);

    const linkResponse = await request(app)
      .post("/api/auth/google/link")
      .send({
        credential: MOCK_CREDENTIAL,
        password: "AnyPassword123",
      });

    expect(linkResponse.status).toBe(401);
    expect(linkResponse.body).toEqual({
      message: "Google credential is invalid",
    });
    expectNoAuthenticationCookies(linkResponse.headers);
    await expect(
      Promise.all([
        prisma.user.count(),
        prisma.authAccount.count(),
        prisma.session.count(),
      ]),
    ).resolves.toEqual(countsBefore);
    await expect(
      prisma.user.findUnique({ where: { email: identity.email } }),
    ).resolves.toBeNull();
  });

  it("rejects a different Google account for an already linked email", async () => {
    const existingIdentity = createGoogleIdentity("google-mismatch-old");
    const replacementIdentity = {
      ...createGoogleIdentity("google-mismatch-new"),
      email: existingIdentity.email,
    };
    createdEmails.add(existingIdentity.email);

    const user = await prisma.user.create({
      data: {
        name: existingIdentity.name,
        email: existingIdentity.email,
        passwordHash: null,
        role: "CUSTOMER",
        authAccounts: {
          create: {
            provider: "GOOGLE",
            providerAccountId: existingIdentity.providerAccountId,
          },
        },
      },
    });

    const existingAccount = await prisma.authAccount.findFirstOrThrow({
      where: { userId: user.id },
    });

    googleVerificationMock.verify.mockResolvedValue(
      replacementIdentity,
    );

    const response = await request(app)
      .post("/api/auth/google")
      .send({ credential: MOCK_CREDENTIAL });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      code: "GOOGLE_ACCOUNT_MISMATCH",
    });

    const accountsAfter = await prisma.authAccount.findMany({
      where: { userId: user.id },
    });

    expect(accountsAfter).toEqual([existingAccount]);
    await expect(
      prisma.session.count({ where: { userId: user.id } }),
    ).resolves.toBe(0);
  });
});

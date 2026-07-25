import crypto from "node:crypto";
import argon2 from "argon2";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
} from "../utils/jwt.js";

type UserForTokens = {
  id: string;
  role: "CUSTOMER" | "BARBER" | "ADMIN";
};

type SessionMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

export async function createAuthSession(
  user: UserForTokens,
  metadata: SessionMetadata,
) {
  const expiresAt = new Date(
    Date.now() +
      env.REFRESH_TOKEN_EXPIRES_DAYS *
        24 *
        60 *
        60 *
        1000,
  );

  const temporaryHash = await argon2.hash(
    crypto.randomUUID(),
  );

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: temporaryHash,
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    },
    select: {
      id: true,
    },
  });

  const accessToken = await signAccessToken({
    userId: user.id,
    role: user.role,
  });

  const refreshToken = await signRefreshToken({
    userId: user.id,
    sessionId: session.id,
  });

  const refreshTokenHash = await argon2.hash(
    refreshToken,
  );

  await prisma.session.update({
    where: {
      id: session.id,
    },
    data: {
      refreshTokenHash,
    },
  });

  return {
    sessionId: session.id,
    accessToken,
    refreshToken,
  };
}
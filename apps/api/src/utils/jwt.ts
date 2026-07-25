import {
  jwtVerify,
  SignJWT,
  type JWTPayload,
} from "jose";
import { env } from "../config/env.js";

const accessSecret = new TextEncoder().encode( //encode => to bytes / Uint8Array
  env.JWT_ACCESS_SECRET,
);

const refreshSecret = new TextEncoder().encode( //encode => to bytes / Uint8Array
  env.JWT_REFRESH_SECRET,
);

/* JWTPayload
  iss?: string; // issuer
  aud?: string | string[]; // audience
  exp?: number; // expiration
  iat?: number; // issued at
  sub?: string; // subject

*/
export type AccessTokenPayload = JWTPayload & {
  sub: string;
  role: "CUSTOMER" | "BARBER" | "ADMIN";
  type: "access";
};

export type RefreshTokenPayload = JWTPayload & {
  sub: string;
  sessionId: string;
  type: "refresh";
};

export async function signAccessToken(input: {
  userId: string;
  role: "CUSTOMER" | "BARBER" | "ADMIN";
}) {
  return new SignJWT({
    role: input.role,
    type: "access",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(
      `${env.ACCESS_TOKEN_EXPIRES_MINUTES}m`,
    )
    .sign(accessSecret);
}

export async function signRefreshToken(input: {
  userId: string;
  sessionId: string;
}) {
  return new SignJWT({
    sessionId: input.sessionId,
    type: "refresh",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime(
      `${env.REFRESH_TOKEN_EXPIRES_DAYS}d`,
    )
    .sign(refreshSecret);
}

export async function verifyAccessToken(token: string,): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(
    token,
    accessSecret,
  );

  if (
    payload.type !== "access" ||
    typeof payload.sub !== "string" ||
    !["CUSTOMER", "BARBER", "ADMIN"].includes(
      String(payload.role),
    )
  ) {
    throw new Error("Invalid access token");
  }

  return payload as AccessTokenPayload;
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(
    token,
    refreshSecret,
  );

  if (
    payload.type !== "refresh" ||
    typeof payload.sub !== "string" ||
    typeof payload.sessionId !== "string"
  ) {
    throw new Error("Invalid refresh token");
  }

  return payload as RefreshTokenPayload;
}
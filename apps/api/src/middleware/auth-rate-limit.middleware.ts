import type { Request } from "express";

import { ipKeyGenerator, rateLimit, } from "express-rate-limit";

const AUTH_WINDOW_MS = 15 * 60 * 1000;

const IPV6_SUBNET = 56;

function getRequestIpKey(req: Request,) {
  const ip = req.ip ?? req.socket.remoteAddress;

  if (!ip) {
    return "unknown";
  }

  return ipKeyGenerator(
    ip,
    IPV6_SUBNET,
  );
}

function getNormalizedEmailKey(req: Request,) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (email) {
    return `email:${email}`;
  }

  return `ip:${getRequestIpKey(req)}`;
}

/*
 * Registration counts successful and failed
 * requests, because it also protects against
 * automated account creation.
 */

export const registerRateLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: 5,

    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: IPV6_SUBNET,

    message: {
      message: "Too many registration attempts. Please try again later.",
    },
});

/*
 * Protects the login endpoint against one IP
 * trying many different accounts.
 */

export const loginIpRateLimiter =  rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: 20,

    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: IPV6_SUBNET,

    skipSuccessfulRequests: true,

    message: {
      message: "Too many login attempts. Please try again later.",
    },
});

/*
 * Protects one account even when attempts come
 * from different IP addresses.
 *
 * Successful logins are removed from the count.
 */

export const loginAccountRateLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: 5,

    standardHeaders: "draft-8",
    legacyHeaders: false,

    keyGenerator: getNormalizedEmailKey,

    skipSuccessfulRequests: true,

    message: {
      message: "Too many failed login attempts for this account. Please try again later.",
    },
});

export const googleLoginRateLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: 20,

    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: IPV6_SUBNET,

    message: {
      message: "Too many Google sign-in attempts. Please try again later.",
    },
});

/*
 * This route performs Argon2 password
 * verification, so it has a stricter limit.
 */
export const googleAccountLinkRateLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: 5,

    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: IPV6_SUBNET,

    skipSuccessfulRequests: true,

    message: {
      message: "Too many Google account linking attempts. Please try again later.",
    },
});

/*
 * Higher limit because refresh is normally an
 * automatic browser operation.
 */
export const refreshRateLimiter = rateLimit({
    windowMs: AUTH_WINDOW_MS,
    limit: 120,

    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: IPV6_SUBNET,

    message: {
      message: "Too many session refresh attempts. Please try again later.",
    },
});
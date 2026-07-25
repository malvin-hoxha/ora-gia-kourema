import type {
  CookieOptions,
  Response,
} from "express";

import { env } from "../config/env.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "../constants/auth.constants.js";

const isProduction = env.NODE_ENV === "production";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};

export function setAuthCookies (res: Response, tokens: {accessToken: string, refreshToken: string}) {
    res.cookie(
        ACCESS_TOKEN_COOKIE,
        tokens.accessToken,
        {
            ...baseCookieOptions,
            maxAge: env.ACCESS_TOKEN_EXPIRES_MINUTES * 60 * 1000,
        }
    );

    res.cookie(
        REFRESH_TOKEN_COOKIE,
        tokens.refreshToken,
        {
        ...baseCookieOptions,
        maxAge:
            env.REFRESH_TOKEN_EXPIRES_DAYS *
            24 *
            60 *
            60 *
            1000,
        },
    );
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(
    ACCESS_TOKEN_COOKIE,
    baseCookieOptions,
  );

  res.clearCookie(
    REFRESH_TOKEN_COOKIE,
    baseCookieOptions,
  );
}
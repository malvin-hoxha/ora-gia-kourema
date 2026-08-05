import type { Express } from "express";
import request from "supertest";

import { ACCESS_TOKEN_COOKIE } from "../../src/constants/auth.constants.js";
import {
  getSetCookies,
  requireCookie,
  toCookieHeader,
} from "./cookies.js";

export async function authenticateCustomer(
  app: Express,
  credentials: {
    email: string;
    password: string;
  },
) {
  const response = await request(app)
    .post("/api/auth/login")
    .send(credentials);

  if (response.status !== 200) {
    throw new Error(
      `Customer authentication failed with status ${response.status}`,
    );
  }

  const accessCookie = requireCookie(
    getSetCookies(response.headers),
    ACCESS_TOKEN_COOKIE,
  );

  return {
    cookieHeader: toCookieHeader(accessCookie),
    response,
  };
}

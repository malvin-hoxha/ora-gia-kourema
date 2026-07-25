import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { ACCESS_TOKEN_COOKIE } from "../constants/auth.constants.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const accessToken =
    req.cookies[ACCESS_TOKEN_COOKIE];

  if (
    !accessToken ||
    typeof accessToken !== "string"
  ) {
    res.status(401).json({
      message: "Authentication required",
    });

    return;
  }

  try {
    const payload = await verifyAccessToken(
      accessToken,
    );

    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({
      message: "Access token is invalid or expired",
    });
  }
}
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

type UserRole =
  | "CUSTOMER"
  | "BARBER"
  | "ADMIN";

export function requireRole(
  ...allowedRoles: UserRole[] //one or more parameters
) {

  //return a new function => the real middleware e.g. realMiddleware(req, res, next)
  return ( req: Request, res: Response, next: NextFunction, ) => {
    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message:
          "You do not have permission to access this resource",
      });

      return;
    }

    next();
  };
}
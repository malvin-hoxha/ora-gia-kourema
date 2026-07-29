import argon2 from "argon2";
import { Router } from "express";
import { REFRESH_TOKEN_COOKIE } from "../constants/auth.constants.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import {
  loginSchema,
  registerSchema,
} from "../schemas/auth.schema.js";
import { createAuthSession } from "../services/auth.service.js";
import {
  clearAuthCookies,
  setAuthCookies,
} from "../utils/auth-cookies.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsedBody = registerSchema.safeParse(
    req.body,
  );

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid registration data",
      errors:
        parsedBody.error.flatten().fieldErrors,
    });

    return;
  }

  const {
    name,
    email,
    phone,
    password,
  } = parsedBody.data;

  try {
    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existingUser) {
      res.status(409).json({
        message:
          "An account with this email already exists",
      });

      return;
    }

    const passwordHash = await argon2.hash(
      password,
      {
        type: argon2.argon2id,
      },
    );

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await createAuthSession(
      {
        id: user.id,
        role: user.role,
      },
      {
        userAgent: req.get("user-agent"),
        ipAddress: req.ip,
      },
    );

    setAuthCookies(res, tokens);

    res.status(201).json({
      message: "Account created successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(
      "Registration failed:",
      error,
    );

    res.status(500).json({
      message: "Unable to create account",
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const parsedBody = loginSchema.safeParse(
    req.body,
  );

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid login data",
      errors:
        parsedBody.error.flatten().fieldErrors,
    });

    return;
  }

  const { email, password } = parsedBody.data;

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      res.status(401).json({
        message: "Invalid email or password",
      });

      return;
    }

    const passwordMatches =
      await argon2.verify(
        user.passwordHash,
        password,
      );

    if (!passwordMatches) {
      res.status(401).json({
        message: "Invalid email or password",
      });

      return;
    }

    const tokens = await createAuthSession(
      {
        id: user.id,
        role: user.role,
      },
      {
        userAgent: req.get("user-agent"),
        ipAddress: req.ip,
      },
    );

    setAuthCookies(res, tokens);

    res.status(200).json({
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login failed:", error);

    res.status(500).json({
      message: "Unable to log in",
    });
  }
});

authRouter.post("/refresh", async (req, res) => {
  const refreshToken =
    req.cookies[REFRESH_TOKEN_COOKIE];

  if (
    !refreshToken ||
    typeof refreshToken !== "string"
  ) {
    clearAuthCookies(res);

    res.status(401).json({
      message: "Refresh token is missing",
    });

    return;
  }

  try {
    const payload = await verifyRefreshToken(
      refreshToken,
    );

    const session =
      await prisma.session.findUnique({
        where: {
          id: payload.sessionId,
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
            },
          },
        },
      });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      clearAuthCookies(res);

      res.status(401).json({
        message: "Session is invalid or expired",
      });

      return;
    }

    const tokenMatches = await argon2.verify(
      session.refreshTokenHash,
      refreshToken,
    );

    if (!tokenMatches) {
      await prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      clearAuthCookies(res);

      res.status(401).json({
        message: "Refresh token reuse detected",
      });

      return;
    }

    const accessToken = await signAccessToken({
      userId: session.user.id,
      role: session.user.role,
    });

    const newRefreshToken =
      await signRefreshToken({
        userId: session.user.id,
        sessionId: session.id,
      });

    const newRefreshTokenHash =
      await argon2.hash(newRefreshToken);

    await prisma.session.update({
      where: {
        id: session.id,
      },
      data: {
        refreshTokenHash:
          newRefreshTokenHash,
      },
    });

    setAuthCookies(res, {
      accessToken,
      refreshToken: newRefreshToken,
    });

    res.status(200).json({
      message: "Session refreshed successfully",
    });
  } catch {
    clearAuthCookies(res);

    res.status(401).json({
      message: "Refresh token is invalid or expired",
    });
  }
});

authRouter.post("/logout", async (req, res) => {
  const refreshToken =
    req.cookies[REFRESH_TOKEN_COOKIE];

  if (
    refreshToken &&
    typeof refreshToken === "string"
  ) {
    try {
      const payload = await verifyRefreshToken(
        refreshToken,
      );

      await prisma.session.updateMany({
        where: {
          id: payload.sessionId,
          userId: payload.sub,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      // Invalid tokens are still cleared.
    }
  }

  clearAuthCookies(res);

  res.status(200).json({
    message: "Logout successful",
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found",
      });

      return;
    }

    res.status(200).json({
      data: {
        user,
      },
    });
  },
);
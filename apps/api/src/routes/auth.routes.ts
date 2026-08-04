import argon2 from "argon2";
import { Router, type Request, type Response, } from "express";
import { REFRESH_TOKEN_COOKIE } from "../constants/auth.constants.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";
import { loginSchema, registerSchema, googleAccountLinkSchema, googleLoginSchema,} from "../schemas/auth.schema.js";
import { createAuthSession } from "../services/auth.service.js";
import { clearAuthCookies, setAuthCookies,} from "../utils/auth-cookies.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, RefreshTokenVerificationError, } from "../utils/jwt.js";
import { Prisma, } from "../generated/prisma/client.js";
import { GoogleCredentialError, verifyGoogleCredential, } from "../services/google-auth.service.js";
import { googleAccountLinkRateLimiter, googleLoginRateLimiter, loginAccountRateLimiter,
loginIpRateLimiter, refreshRateLimiter, registerRateLimiter,
} from "../middleware/auth-rate-limit.middleware.js";

export const authRouter = Router();

authRouter.post("/register", registerRateLimiter, async (req, res) => {
  const parsedBody = registerSchema.safeParse( req.body,);

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

authRouter.post("/login", loginIpRateLimiter, loginAccountRateLimiter, async (req, res) => {
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

authRouter.post("/google", googleLoginRateLimiter, async (req, res) => {
    const parsedBody = googleLoginSchema.safeParse( req.body, );

    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid Google login data",

        errors: parsedBody.error.flatten().fieldErrors,
      });

      return;
    }

    try {
      const googleIdentity = await verifyGoogleCredential( parsedBody.data.credential, );

      /*
       * Πρώτα ψάχνουμε με Google sub.
       *
       * Το composite unique προέρχεται από:
       * @@unique([provider, providerAccountId])
       */
      const linkedAccount = await prisma.authAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "GOOGLE",

              providerAccountId: googleIdentity.providerAccountId,
            },
          },

          select: {
            user: {
              select: authenticatedUserSelect,
            },
          },
        });

      /*
       * Το Google account είναι ήδη
       * συνδεδεμένο με User.
       */
      if (linkedAccount) {
        await completeAuthentication( req, res,
          linkedAccount.user,
          "Google login successful",
        );

        return;
      }

      /*
       * Δεν βρέθηκε Google AuthAccount.
       * Ελέγχουμε αν υπάρχει ήδη User
       * με το verified Google email.
       */
      const existingUser = await prisma.user.findUnique({
          where: {
            email:
              googleIdentity.email,
          },

          select: {
            id: true,
            passwordHash: true,

            authAccounts: {
              where: {
                provider: "GOOGLE",
              },

              select: {
                providerAccountId: true,
              },
            },
          },
        });

      if (existingUser) {
        const existingGoogleAccount = existingUser.authAccounts[0];

        /*
         * Υπάρχει ήδη διαφορετικό Google
         * account στον ίδιο User.
         */
        if (existingGoogleAccount) {
          res.status(409).json({
            code: "GOOGLE_ACCOUNT_MISMATCH",

            message: "This account is linked to a different Google account",
          });

          return;
        }

        /*
         * Υπάρχει password account.
         * Δεν κάνουμε αυτόματο linking.
         * Το frontend θα ζητήσει password.
         */
        if (existingUser.passwordHash) {
          res.status(409).json({
            code: "ACCOUNT_LINK_REQUIRED",

            message: "An account with this email already exists. Enter your password to connect Google.",

            data: {
              email: googleIdentity.email,
            },
          });

          return;
        }

        /*
         * Υπάρχει User χωρίς password και
         * χωρίς Google AuthAccount.
         * Αυτό είναι ασυνεπής κατάσταση.
         */
        res.status(409).json({
          code: "ACCOUNT_LINK_UNAVAILABLE",

          message: "This account cannot be linked automatically",
        });

        return;
      }

      /*
       * Πραγματικά νέος χρήστης.
       *
       * Δημιουργούμε μαζί:
       * - User
       * - AuthAccount
       *
       * Ο νέος Google user είναι πάντα CUSTOMER.
       */
      const createdUser = await prisma.user.create({
          data: {
            name: googleIdentity.name,

            email: googleIdentity.email,

            passwordHash: null,
            role: "CUSTOMER",

            authAccounts: {
              create: {
                provider: "GOOGLE",

                providerAccountId: googleIdentity.providerAccountId,
              },
            },
          },

          select: authenticatedUserSelect,
        });

      await completeAuthentication( req, res, createdUser, "Google account created successfully",
      );
    } catch (error) {
      if ( error instanceof GoogleCredentialError
      ) {
        res.status(401).json({ message: error.message, });

        return;
      }

      /*
       * Προστασία από δύο ταυτόχρονα
       * requests που επιχειρούν να
       * δημιουργήσουν τον ίδιο User ή
       * AuthAccount.
       */
      if (
        isUniqueConstraintError(error)
      ) {
        res.status(409).json({ message: "The Google account state changed. Please try signing in again.", });

        return;
      }

      console.error( "Google login failed:", error, );

      res.status(500).json({ message: "Unable to sign in with Google", });
    }
  },
);

authRouter.post("/google/link", googleAccountLinkRateLimiter, async (req, res) => {
    const parsedBody = googleAccountLinkSchema.safeParse( req.body,);

    if (!parsedBody.success) {
      res.status(400).json({
        message: "Invalid Google account linking data",

        errors: parsedBody.error.flatten().fieldErrors,
      });

      return;
    }

    try {
      /*
       * Επαληθεύουμε ξανά το credential.
       * Δεν εμπιστευόμαστε email ή Google ID
       * που θα έστελνε χειροκίνητα το frontend.
       */
      const googleIdentity =
        await verifyGoogleCredential(parsedBody.data.credential,);

      const user = await prisma.user.findUnique({
          where: {
            email: googleIdentity.email,
          },

          select: {
            ...authenticatedUserSelect,

            passwordHash: true,

            authAccounts: {
              where: {
                provider: "GOOGLE",
              },

              select: {
                providerAccountId: true,
              },
            },
          },
        });

      /*
       * Χρησιμοποιούμε κοινό μήνυμα ώστε να
       * μη δίνουμε περιττές πληροφορίες για
       * την κατάσταση του account.
       */
      if (!user?.passwordHash) {
        res.status(401).json({ message: "Email or password is incorrect", });

        return;
      }

      const passwordMatches = await argon2.verify( user.passwordHash, parsedBody.data.password, );

      if (!passwordMatches) {
        res.status(401).json({ message: "Email or password is incorrect", });

        return;
      }

      const existingGoogleAccount = user.authAccounts[0];

      if (existingGoogleAccount) {
        /*
         * Ήδη συνδεδεμένο με το ίδιο
         * Google account: idempotent login.
         */
        if (
          existingGoogleAccount.providerAccountId === googleIdentity.providerAccountId
        ) {
          await completeAuthentication( req, res, user, "Google account is already connected", );

          return;
        }

        res.status(409).json({
          code: "GOOGLE_ACCOUNT_MISMATCH",

          message: "This account is linked to a different Google account",
        });

        return;
      }

      /*
       * Ελέγχουμε μήπως το Google account
       * είναι ήδη συνδεδεμένο με άλλον User.
       */
      const providerAccount = await prisma.authAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "GOOGLE",

              providerAccountId: googleIdentity.providerAccountId,
            },
          },

          select: {
            userId: true,
          },
        });

      if ( providerAccount && providerAccount.userId !== user.id
      ) {
        res.status(409).json({
          code: "GOOGLE_ACCOUNT_ALREADY_LINKED",

          message: "This Google account is already connected to another user",
        });

        return;
      }

      await prisma.authAccount.create({
        data: {
          userId: user.id,
          provider: "GOOGLE",

          providerAccountId: googleIdentity.providerAccountId,
        },
      });

      await completeAuthentication( req, res, user, "Google account connected successfully", );
    } catch (error) {
      if ( error instanceof GoogleCredentialError ) {
        res.status(401).json({ message: error.message, });

        return;
      }

      if ( isUniqueConstraintError(error) ) {
        res.status(409).json({ message: "The Google account was connected by another request. Please try signing in again.", });

        return;
      }

      console.error( "Google account linking failed:", error, );

      res.status(500).json({ message: "Unable to connect Google account", });
    }
  },
);

authRouter.post("/refresh", refreshRateLimiter, async (req, res) => {
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
      /*
      * The presented token is already known to
      * be invalid, so remove it from the browser
      * even if database revocation later fails.
      */
      clearAuthCookies(res);

      try {
        await prisma.session.update({
          where: {
            id: session.id,
          },

          data: {
            revokedAt: new Date(),
          },
        });
      } catch (error) {
        console.error(
          "Failed to revoke session after refresh token reuse detection:",
          error,
        );

        res.status(500).json({
          message:
            "Unable to secure the session",
        });

        return;
      }

      res.status(401).json({
        message:
          "Refresh token reuse detected",
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
  } catch (error) {
      if ( error instanceof RefreshTokenVerificationError ) {
        clearAuthCookies(res);

        res.status(401).json({ message: "Refresh token is invalid or expired", });

        return;
      }

      /*
      * Database, Argon2, token-signing or other
      * internal failures must not invalidate an
      * otherwise valid browser session.
      */
      console.error( "Failed to refresh session:", error, );

      res.status(500).json({ message: "Unable to refresh session. Please try again.", });
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

const authenticatedUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

type AuthenticatedUser = Prisma.UserGetPayload<{ select: typeof authenticatedUserSelect; }>;

async function completeAuthentication(
  req: Request,
  res: Response,
  user: AuthenticatedUser,
  message: string,
) {
  const tokens = await createAuthSession({
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
    message,
    data: {
      user,
    },
  });
}

function isUniqueConstraintError( error: unknown, ) {
  return ( error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" );
}
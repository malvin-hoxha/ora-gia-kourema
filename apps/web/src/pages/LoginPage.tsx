import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  MailIcon,
  ScissorsIcon,
} from "lucide-react";
import {
  useState,
  useCallback,
  type FormEvent,
} from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import { ApiError } from "../api/api-client";
import { useAuth } from "../auth/useAuth";
import type { AuthUser, } from "../api/auth.api";
import { GoogleSignInButton, } from "../components/auth/GoogleSignInButton";

type PendingGoogleLink = {
  credential: string;
  email: string;
};

function getPostLoginPath( role: AuthUser["role"],) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "BARBER") {
    return "/staff";
  }

  return "/";
}

function isRecord( value: unknown, ): value is Record<string, unknown> {
  return ( typeof value === "object" && value !== null );
}

function getApiErrorCode( error: ApiError, ) {
  if (!isRecord(error.data)) {
    return null;
  }

  return typeof error.data.code === "string" ? error.data.code : null;
}

function getApiErrorEmail( error: ApiError, ) {
  if (!isRecord(error.data)) {
    return null;
  }

  const nestedData = error.data.data;

  if (!isRecord(nestedData)) {
    return null;
  }

  return typeof nestedData.email === "string" ? nestedData.email : null;
}

export function LoginPage() {
    const navigate = useNavigate();

    const {
      user,
      login,
      googleLogin,
      linkGoogleAccount,
      isAuthenticated,
      isLoading: isAuthLoading,
    } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [pendingGoogleLink, setPendingGoogleLink,] = useState<PendingGoogleLink | null>( null,);

    const [  googleLinkPassword, setGoogleLinkPassword,] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [error, setError] = useState<string | null>(null,);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            setIsSubmitting(true);
            setError(null);

            const authenticatedUser =
              await login({
                email,
                password,
              });

            navigate(
              getPostLoginPath(
                authenticatedUser.role,
              ),
              {
                replace: true,
              },
            );
        } catch (error) {
            if (error instanceof ApiError) {
                setError(error.message);
            } else {
                setError("Παρουσιάστηκε κάποιο πρόβλημα. Προσπάθησε ξανά.",);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleGoogleCredential = useCallback( async ( credential: string, ) => {
        try {
          setIsSubmitting(true);
          setError(null);
          setPendingGoogleLink(null);

          const authenticatedUser =
            await googleLogin({
              credential,
            });

          navigate(
            getPostLoginPath(
              authenticatedUser.role,
            ),
            {
              replace: true,
            },
          );
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.status === 409 &&
            getApiErrorCode(error) ===
              "ACCOUNT_LINK_REQUIRED"
          ) {
            setPendingGoogleLink({
              credential,

              email:
                getApiErrorEmail(error) ??
                "το υπάρχον email",
            });

            setGoogleLinkPassword("");
            setError(null);

            return;
          }

          if (error instanceof ApiError) {
            setError(error.message);
          } else {
            setError(
              "Η σύνδεση με Google απέτυχε. Προσπάθησε ξανά.",
            );
          }
        } finally {
          setIsSubmitting(false);
        }
      },
      [
        googleLogin,
        navigate,
      ],
    );

    async function handleGoogleAccountLink( event: FormEvent<HTMLFormElement>,) {
      event.preventDefault();

      if (!pendingGoogleLink) {
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const authenticatedUser =
          await linkGoogleAccount({
            credential:
              pendingGoogleLink.credential,

            password:
              googleLinkPassword,
          });

        setPendingGoogleLink(null);
        setGoogleLinkPassword("");

        navigate(
          getPostLoginPath(
            authenticatedUser.role,
          ),
          {
            replace: true,
          },
        );
      } catch (error) {
        if (error instanceof ApiError) {
          setError(error.message);
        } else {
          setError(
            "Η σύνδεση του Google λογαριασμού απέτυχε.",
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    }

    if (isAuthLoading) {
        return (
        <div className="flex min-h-screen items-center justify-center bg-white">
            <LoaderCircleIcon className="size-7 animate-spin text-orange-500" />
        </div>
        );
    }

    if (isAuthenticated && user) {
      return (
        <Navigate to={getPostLoginPath( user.role, )} replace />
      );
    }

     return (
    <main className="relative isolate min-h-screen overflow-hidden bg-white px-5 py-10 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:56px_56px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.14)_0%,transparent_70%)]"
      />

      <div className="relative mx-auto max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-slate-900"
        >
          <ArrowLeftIcon className="size-4" />
          Επιστροφή στην αρχική
        </Link>

        <div className="mt-10 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div className="flex items-center gap-2 border-b border-black/5 bg-[#f0f0f0] px-4 py-3">
            <div className="size-3 rounded-full bg-red-400" />
            <div className="size-3 rounded-full bg-amber-400" />
            <div className="size-3 rounded-full bg-emerald-400" />

            <div className="mx-4 h-5 flex-1 rounded-md bg-white/80" />
          </div>

          <div className="p-7 sm:p-9">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <ScissorsIcon className="size-5" />
            </div>

            <h1 className="mt-7 font-serif text-4xl tracking-[-0.035em] text-slate-900">
              Καλώς επέστρεψες.
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Συνδέσου για να διαχειριστείς τα ραντεβού σου.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Email
                </span>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-50">
                  <MailIcon className="size-4 text-gray-400" />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                    autoComplete="email"
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-gray-400"
                    placeholder="you@example.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  Κωδικός
                </span>

                <div className="mt-2 flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-50">
                  <LockKeyholeIcon className="size-4 text-gray-400" />

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    autoComplete="current-password"
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-gray-400"
                    placeholder="••••••••"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                )}

                Σύνδεση
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-black/10" />

              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                ή
              </span>

              <div className="h-px flex-1 bg-black/10" />
            </div>

            {pendingGoogleLink ? (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
                <h2 className="font-semibold text-slate-900">
                  Σύνδεση λογαριασμών
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Υπάρχει ήδη λογαριασμός με το email{" "}
                  <strong>
                    {pendingGoogleLink.email}
                  </strong>
                  . Πληκτρολόγησε τον υπάρχοντα κωδικό
                  σου για να συνδέσεις το Google account.
                </p>

                <form
                  onSubmit={
                    handleGoogleAccountLink
                  }
                  className="mt-5 space-y-4"
                >
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Υπάρχων κωδικός
                    </span>

                    <div className="mt-2 flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100">
                      <LockKeyholeIcon className="size-4 text-gray-400" />

                      <input
                        type="password"
                        value={
                          googleLinkPassword
                        }
                        onChange={(event) =>
                          setGoogleLinkPassword(
                            event.target.value,
                          )
                        }
                        required
                        autoComplete="current-password"
                        className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting && (
                      <LoaderCircleIcon className="size-4 animate-spin" />
                    )}

                    Σύνδεση με Google
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setPendingGoogleLink(
                        null,
                      );

                      setGoogleLinkPassword(
                        "",
                      );

                      setError(null);
                    }}
                    className="w-full text-sm font-medium text-gray-500 transition hover:text-slate-900"
                  >
                    Ακύρωση
                  </button>
                </form>
              </div>
            ) : (
              <GoogleSignInButton
                disabled={isSubmitting}
                onCredential={
                  handleGoogleCredential
                }
              />
            )}

            <p className="mt-7 text-center text-sm text-gray-500">
              Δεν έχεις λογαριασμό;{" "}
              <Link
                to="/register"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                Δημιούργησε λογαριασμό
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
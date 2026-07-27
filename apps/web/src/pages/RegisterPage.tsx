import {
  ArrowLeftIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  MailIcon,
  PhoneIcon,
  ScissorsIcon,
  UserIcon,
} from "lucide-react";
import {
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { ApiError } from "../api/api-client";
import { useAuth } from "../auth/useAuth";
import type { ReactNode } from "react";

export function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

   const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null,);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoaderCircleIcon className="size-7 animate-spin text-orange-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>,) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      await register({
        name,
        email,
        phone: phone || undefined,
        password,
      });

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError(
          "Παρουσιάστηκε κάποιο πρόβλημα. Προσπάθησε ξανά.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
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

      <div className="relative mx-auto max-w-lg">
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
              Δημιούργησε λογαριασμό.
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Κλείσε και διαχειρίσου τα ραντεβού σου εύκολα.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              <AuthInput
                label="Ονοματεπώνυμο"
                type="text"
                value={name}
                onChange={setName}
                autoComplete="name"
                placeholder="Leonidas Papadopoulos"
                icon={<UserIcon className="size-4" />}
              />

              <AuthInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                placeholder="you@example.com"
                icon={<MailIcon className="size-4" />}
              />

              <AuthInput
                label="Τηλέφωνο"
                type="tel"
                value={phone}
                onChange={setPhone}
                autoComplete="tel"
                placeholder="6900000000"
                required={false}
                icon={<PhoneIcon className="size-4" />}
              />

              <AuthInput
                label="Κωδικός"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Τουλάχιστον 8 χαρακτήρες"
                icon={
                  <LockKeyholeIcon className="size-4" />
                }
              />

              <p className="text-xs leading-5 text-gray-400">
                Ο κωδικός πρέπει να περιέχει κεφαλαίο,
                πεζό γράμμα και αριθμό.
              </p>

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

                Δημιουργία λογαριασμού
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-500">
              Έχεις ήδη λογαριασμό;{" "}
              <Link
                to="/login"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                Σύνδεση
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

type AuthInputProps = {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
  icon: ReactNode;
  required?: boolean;
};

function AuthInput({
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
  icon,
  required = true,
}: AuthInputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="mt-2 flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-50">
        <span className="text-gray-400">{icon}</span>

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          required={required}
          autoComplete={autoComplete}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-gray-400"
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}
import type { ReactNode } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";
import { LoaderCircleIcon } from "lucide-react";
import { useAuth } from "./useAuth";

type AdminRouteProps = {
  children: ReactNode;
};

export function AdminRoute({
  children,
}: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <LoaderCircleIcon className="size-7 animate-spin text-orange-500" />
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <Navigate
        to={
          user.role === "BARBER"
            ? "/staff"
            : "/dashboard"
        }
        replace
      />
    );
  }

  return children;
}
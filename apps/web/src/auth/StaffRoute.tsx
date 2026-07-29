import {
  LoaderCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Navigate,
} from "react-router-dom";
import { useAuth } from "./useAuth";

type StaffRouteProps = {
  children: ReactNode;
};

export function StaffRoute({
  children,
}: StaffRouteProps) {
  const {
    user,
    isAuthenticated,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoaderCircleIcon className="size-7 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    user.role !== "BARBER" &&
    user.role !== "ADMIN"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}
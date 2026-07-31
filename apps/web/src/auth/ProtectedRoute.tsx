import { LoaderCircleIcon } from "lucide-react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./useAuth";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: Array<"CUSTOMER" | "BARBER" | "ADMIN">;
};

export function ProtectedRoute({children, allowedRoles}: ProtectedRouteProps) {
    const location = useLocation(); //information about current URL, we need the e.g. pathname='/appointments'
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

    if (!isAuthenticated) {
        return (
            <Navigate to="/login" replace state={{from: location.pathname}} /> 
            //replace => '/dashboard' with '/login' and cannot go back to '/dashboard'
            //state => redirect to where user was before login
        )
    }

    if ( user && allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <Navigate
            to={'/'}
            replace
            />
        );
    }

    

    return children;
}
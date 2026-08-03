import { useCallback,  useEffect,  useMemo,  useState,  type ReactNode} from "react";

import { getCurrentUser, LoginUser as loginUser, logoutUser, registerUser, type AuthUser, type LoginInput, googleLoginUser,
type RegisterInput,  linkGoogleAccount as linkGoogleAccountRequest, type GoogleAccountLinkInput, type GoogleLoginInput,} 
from "../api/auth.api";
import { ApiError } from "../api/api-client";
import { AuthContext, type AuthContextValue } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({children}: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);

    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const response = await getCurrentUser();
            setUser(response.data.user);
        } catch (error){
            if (error instanceof ApiError && error.status === 401) {
                setUser(null);
                return;
            }
            console.error("Failed to retrieve current user:",error,);
            setUser(null);
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        async function initializeAuth() {
            try {
                const response = await getCurrentUser();

                if (isActive) {
                    setUser(response.data.user);
                }
            } catch (error) {
                if (
                isActive &&
                !(
                    error instanceof ApiError &&
                    error.status === 401
                )
                ) {
                console.error(
                    "Failed to initialize authentication:",
                    error,
                );
                }

                if (isActive) {
                setUser(null);
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        void initializeAuth();

        return () => {
            isActive = false;
        };
    }, []);

    const login = useCallback(
        async (input: LoginInput) => {
            const response = await loginUser(input);

            const authenticatedUser =
            response.data.user;

            setUser(authenticatedUser);

            return authenticatedUser;
        },
        [],
    );

    const googleLogin = useCallback( async (input: GoogleLoginInput) => {
        const response = await googleLoginUser(input);

        const authenticatedUser = response.data.user;

        setUser(authenticatedUser);

        return authenticatedUser;
    },[],);

    const linkGoogleAccount = useCallback( async (input: GoogleAccountLinkInput,) => {
        const response = await linkGoogleAccountRequest( input, );

        const authenticatedUser = response.data.user;

        setUser(authenticatedUser);

        return authenticatedUser;
    },[],);

    const register = useCallback(async (input: RegisterInput) => {
        const response = await registerUser(input);
        setUser(response.data.user);
        },
        [],
    );

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
        }
    }, []);

     const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: user !== null,
            isLoading,
            login,
            register,
            logout,
            refresh: refreshUser,
            googleLogin,
            linkGoogleAccount,
            }),
        [
            user,
            isLoading,
            login,
            register,
            logout,
            refreshUser,
            googleLogin,
            linkGoogleAccount,
        ],
    );


    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
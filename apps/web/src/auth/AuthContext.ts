import { createContext } from "react";
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
} from "../api/auth.api";

export type AuthContextValue = {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (input: LoginInput) => Promise<AuthUser>;
    register: (input: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
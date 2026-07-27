import { apiRequest } from "./api-client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "CUSTOMER" | "BARBER" | "ADMIN";
  createdAt?: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

type AuthResponse = {
  message: string;
  data: {
    user: AuthUser;
  };
};

type CurrentUserResponse = {
  data: {
    user: AuthUser;
  };
};


export async function registerUser(
    input: RegisterInput,
) {
    return apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
        retryOnUnauthorized: false,
    });
};

export async function LoginUser(
    input: LoginInput
) {
    return apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
        retryOnUnauthorized: false,
    });
};

export async function getCurrentUser() {
  return apiRequest<CurrentUserResponse>("/auth/me");
};

export async function logoutUser() {
    return apiRequest<{message: string}>("/auth/logout", {
        method: "POST",
        retryOnUnauthorized: false
    });
};
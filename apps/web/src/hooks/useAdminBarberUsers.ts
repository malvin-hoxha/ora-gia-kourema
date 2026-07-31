import { useQuery } from "@tanstack/react-query";
import { getAdminBarberUsers } from "../api/admin-barbers.api";

export const adminBarberUsersQueryKey = [
  "admin-barber-users",
] as const;

export function useAdminBarberUsers() {
  return useQuery({
    queryKey: adminBarberUsersQueryKey,
    queryFn: getAdminBarberUsers,
    staleTime: 30_000,
  });
}

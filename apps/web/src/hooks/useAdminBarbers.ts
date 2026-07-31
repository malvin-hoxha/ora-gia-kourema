import { useQuery } from "@tanstack/react-query";
import { getAdminBarbers } from "../api/admin-barbers.api";

export const adminBarbersQueryKey = [
  "admin-barbers",
] as const;

export function useAdminBarbers() {
  return useQuery({
    queryKey: adminBarbersQueryKey,
    queryFn: getAdminBarbers,
    staleTime: 30_000,
  });
}

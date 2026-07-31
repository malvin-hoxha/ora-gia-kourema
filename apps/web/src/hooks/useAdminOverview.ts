import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "../api/admin.api";

export const adminOverviewQueryKey = [
  "admin-overview",
] as const;

export function useAdminOverview() {
  return useQuery({
    queryKey: adminOverviewQueryKey,
    queryFn: getAdminOverview,
    staleTime: 30_000,
  });
}
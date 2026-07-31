import { useQuery } from "@tanstack/react-query";
import { getAdminServices } from "../api/admin-services.api";

export const adminServicesQueryKey = [
  "admin-services",
] as const;

export function useAdminServices() {
  return useQuery({
    queryKey: adminServicesQueryKey,
    queryFn: getAdminServices,
    staleTime: 30_000,
  });
}
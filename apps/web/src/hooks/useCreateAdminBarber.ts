import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createAdminBarber } from "../api/admin-barbers.api";
import { adminOverviewQueryKey } from "./useAdminOverview";
import { adminBarbersQueryKey } from "./useAdminBarbers";
import { adminBarberUsersQueryKey } from "./useAdminBarberUsers";

export function useCreateAdminBarber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminBarber,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminBarbersQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminBarberUsersQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminOverviewQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: ["barbers"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["availability"],
        }),
      ]);
    },
  });
}

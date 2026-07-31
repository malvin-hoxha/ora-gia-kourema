import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createAdminService } from "../api/admin-services.api";
import { adminOverviewQueryKey } from "./useAdminOverview";
import { adminServicesQueryKey } from "./useAdminServices";

export function useCreateAdminService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminService,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminServicesQueryKey,
        }),

        queryClient.invalidateQueries({
          queryKey: adminOverviewQueryKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["services"],
        }),

        queryClient.invalidateQueries({
          queryKey: ["barbers"],
        }),
      ]);
    },
  });
}
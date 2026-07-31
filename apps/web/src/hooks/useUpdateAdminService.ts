import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { updateAdminService } from "../api/admin-services.api";
import { adminOverviewQueryKey } from "./useAdminOverview";
import { adminServicesQueryKey } from "./useAdminServices";

export function useUpdateAdminService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminService,

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

        queryClient.invalidateQueries({
          queryKey: ["availability"],
        }),
      ]);
    },
  });
}
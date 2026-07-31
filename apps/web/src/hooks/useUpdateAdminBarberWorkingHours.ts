import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  updateAdminBarberWorkingHours,
} from "../api/admin-barbers.api";

export function useUpdateAdminBarberWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn:
      updateAdminBarberWorkingHours,

    onSuccess: async (
      _data,
      variables,
    ) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "admin-barber-working-hours",
            variables.barberId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "admin-barber-details",
            variables.barberId,
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "admin-barbers",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "barbers",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "availability",
          ],
        }),
      ]);
    },
  });
}
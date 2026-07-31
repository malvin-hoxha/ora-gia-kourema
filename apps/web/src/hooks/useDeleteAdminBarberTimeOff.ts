import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteAdminBarberTimeOff,
} from "../api/admin-barbers.api";

export function useDeleteAdminBarberTimeOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn:
      deleteAdminBarberTimeOff,

    onSuccess: async (
      _data,
      variables,
    ) => {
      await Promise.all([
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
            "availability",
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: [
            "staff-time-off",
          ],
        }),
      ]);
    },
  });
}
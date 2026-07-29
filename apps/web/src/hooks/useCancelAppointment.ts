import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { cancelAppointment } from "../api/appointments.api";
import { myAppointmentsQueryKey } from "./useMyAppointments";

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelAppointment,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: myAppointmentsQueryKey,
      });

      await queryClient.invalidateQueries({
        queryKey: ["availability"],
      });
    },
  });
}
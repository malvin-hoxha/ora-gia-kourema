import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  updateStaffAppointmentStatus,
} from "../api/staff.api";
import {
  myAppointmentsQueryKey,
} from "./useMyAppointments";
import {
  staffAppointmentsQueryKeys,
} from "./useStaffAppointments";

export function useUpdateStaffAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaffAppointmentStatus,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            staffAppointmentsQueryKeys.all,
        }),

        queryClient.invalidateQueries({
          queryKey: myAppointmentsQueryKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["availability"],
        }),
      ]);
    },
  });
}
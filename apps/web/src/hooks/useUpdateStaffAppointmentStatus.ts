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
  const queryClient = useQueryClient(); //cache object like ["my-appointments"], ["availability", "barber-1", "service-2", "2026-08-10"] 

  return useMutation({
    mutationFn: updateStaffAppointmentStatus, //PATCH request

    onSuccess: async () => {
      await Promise.all([ //promise.all is used to wait for all the promises to resolve
        queryClient.invalidateQueries({
          queryKey:
            staffAppointmentsQueryKeys.all, // set ["staff-appointments"] as old, so refetch needed
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
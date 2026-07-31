import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  updateAdminAppointmentStatus,
} from "../api/admin.api";
import {
  adminAppointmentsQueryKeys,
} from "./useAdminAppointments";
import {
  adminOverviewQueryKey,
} from "./useAdminOverview";
import {
  myAppointmentsQueryKey,
} from "./useMyAppointments";
import {
  staffAppointmentsQueryKeys,
} from "./useStaffAppointments";

export function useUpdateAdminAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn:
      updateAdminAppointmentStatus,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            adminAppointmentsQueryKeys.all,
        }),

        queryClient.invalidateQueries({
          queryKey:
            adminOverviewQueryKey,
        }),

        queryClient.invalidateQueries({
          queryKey:
            staffAppointmentsQueryKeys.all,
        }),

        queryClient.invalidateQueries({
          queryKey:
            myAppointmentsQueryKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["availability"],
        }),
      ]);
    },
  });
}
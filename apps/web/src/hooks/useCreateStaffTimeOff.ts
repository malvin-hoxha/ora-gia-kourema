import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createStaffTimeOff } from "../api/staff.api";
import { myAppointmentsQueryKey } from "./useMyAppointments";
import { staffAppointmentsQueryKeys } from "./useStaffAppointments";
import { staffTimeOffQueryKey } from "./useStaffTimeOff";

export function useCreateStaffTimeOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaffTimeOff,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: staffTimeOffQueryKey,
        }),

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
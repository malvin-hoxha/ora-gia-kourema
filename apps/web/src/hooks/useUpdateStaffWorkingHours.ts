import { useMutation, useQueryClient, } from "@tanstack/react-query";
import { updateStaffWorkingHours } from "../api/staff.api";
import { staffWorkingHoursQueryKey } from "./useStaffWorkingHours";

export function useUpdateStaffWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaffWorkingHours,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: staffWorkingHoursQueryKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["availability"],
        }),
      ]);
    },
  });
}
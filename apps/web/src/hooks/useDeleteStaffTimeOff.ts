import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteStaffTimeOff } from "../api/staff.api";
import { staffTimeOffQueryKey } from "./useStaffTimeOff";

export function useDeleteStaffTimeOff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStaffTimeOff,

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: staffTimeOffQueryKey,
        }),

        queryClient.invalidateQueries({
          queryKey: ["availability"],
        }),
      ]);
    },
  });
}
import { useQuery } from "@tanstack/react-query";
import { getStaffTimeOff } from "../api/staff.api";

export const staffTimeOffQueryKey = [
  "staff-time-off",
] as const;

export function useStaffTimeOff() {
  return useQuery({
    queryKey: staffTimeOffQueryKey,
    queryFn: getStaffTimeOff,
    staleTime: 30_000,
  });
}
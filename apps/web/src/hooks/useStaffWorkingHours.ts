import { useQuery } from "@tanstack/react-query";
import { getStaffWorkingHours } from "../api/staff.api";

export const staffWorkingHoursQueryKey = [
  "staff-working-hours",
] as const;

export function useStaffWorkingHours() {
  return useQuery({
    queryKey: staffWorkingHoursQueryKey,
    queryFn: getStaffWorkingHours,
    staleTime: 60_000,
  });
}
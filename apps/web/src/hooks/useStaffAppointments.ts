import { useQuery } from "@tanstack/react-query";
import {
  getStaffAppointments,
  type StaffAppointmentsFilters,
} from "../api/staff.api";

export const staffAppointmentsQueryKeys = {
  all: ["staff-appointments"] as const,

  list: (
    filters: StaffAppointmentsFilters,
  ) =>
    [
      ...staffAppointmentsQueryKeys.all,
      filters,
    ] as const,
};

export function useStaffAppointments(
  filters: StaffAppointmentsFilters,
) {
  return useQuery({
    queryKey:
      staffAppointmentsQueryKeys.list(filters),

    queryFn: () =>
      getStaffAppointments(filters),

    staleTime: 15_000,
  });
}
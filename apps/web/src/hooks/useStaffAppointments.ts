import { useQuery } from "@tanstack/react-query";
import {
  getStaffAppointments,
  type StaffAppointmentsFilters,
} from "../api/staff.api";

export const staffAppointmentsQueryKeys = {
  all: ["staff-appointments"] as const,

  list: ( filters: StaffAppointmentsFilters, ) =>
    [
      ...staffAppointmentsQueryKeys.all,
      filters,
    ] as const,
};

/* 
[
  "staff-appointments",
  {
    date: "2026-08-11",
    status: "CONFIRMED",
  },
]
*/

export function useStaffAppointments( filters: StaffAppointmentsFilters, ) {
  return useQuery({
    queryKey: staffAppointmentsQueryKeys.list(filters),

    queryFn: () =>
      getStaffAppointments(filters),

    staleTime: 15_000,
  });
}
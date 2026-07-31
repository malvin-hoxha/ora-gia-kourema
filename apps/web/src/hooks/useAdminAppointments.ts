import { useQuery } from "@tanstack/react-query";
import {
  getAdminAppointments,
  type AdminAppointmentFilters,
} from "../api/admin.api";

export const adminAppointmentsQueryKeys = {
  all: ["admin-appointments"] as const,

  list: (
    filters: AdminAppointmentFilters,
  ) =>
    [
      ...adminAppointmentsQueryKeys.all,
      filters,
    ] as const,
};

export function useAdminAppointments(
  filters: AdminAppointmentFilters,
) {
  return useQuery({
    queryKey:
      adminAppointmentsQueryKeys.list(
        filters,
      ),

    queryFn: () =>
      getAdminAppointments(filters),

    staleTime: 15_000,
  });
}
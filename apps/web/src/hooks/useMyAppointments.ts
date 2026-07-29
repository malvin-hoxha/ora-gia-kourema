import { useQuery } from "@tanstack/react-query";
import { getMyAppointments } from "../api/appointments.api";

export const myAppointmentsQueryKey = [
  "my-appointments",
] as const;

export function useMyAppointments() {
  return useQuery({
    queryKey: myAppointmentsQueryKey,
    queryFn: getMyAppointments,
    staleTime: 30_000,
  });
}
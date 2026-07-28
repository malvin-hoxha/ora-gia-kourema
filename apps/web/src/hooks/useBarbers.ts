import { useQuery } from "@tanstack/react-query";
import { getBarbers } from "../api/barbers.api";

export function useBarbers() {
  return useQuery({
    queryKey: ["barbers"],
    queryFn: getBarbers,
    staleTime: 5 * 60 * 1000,
  });
}
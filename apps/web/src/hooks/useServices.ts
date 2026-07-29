import { useQuery } from "@tanstack/react-query";
import { getServices } from "../api/services.api";

export function useServices() {
  //does not request directly, it gives TanStack Query the instructions on how to do it
  return useQuery({  
    queryKey: ["services"], //data named services on cache
    queryFn: getServices, //fetch from this function to load data when needed
    staleTime: 5 * 60 * 1000,   //consider the data fresh for 5 minutes
  });
}
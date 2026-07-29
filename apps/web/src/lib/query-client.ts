import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, //refetch every 30sec
      retry: 1, // retry 1 more time before throwing error
      refetchOnWindowFocus: false, // do not refetch on tabs
    },
    mutations: { // POST PUT DELETE
      retry: false, // avoid duplication on requests
    },
  },
});
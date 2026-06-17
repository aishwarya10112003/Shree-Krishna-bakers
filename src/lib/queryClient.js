import { QueryClient } from "@tanstack/react-query";

/**
 * One shared React Query client. It caches server data, dedupes in-flight
 * requests, retries once on failure, and serves cached data instantly while
 * refetching in the background — replacing all the hand-rolled
 * useState(loading)/useEffect(fetch) boilerplate across the app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data considered fresh for 30s (no refetch storms)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

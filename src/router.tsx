import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isOffline } from "./lib/offline";

export const getRouter = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: {
    staleTime: () => isOffline() ? Infinity : 0,
    networkMode: "always", retry: (count) => !isOffline() && count < 2,
  } } });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

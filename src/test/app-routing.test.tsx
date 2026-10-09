import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

function makeRouter() {
  return createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
  });
}

// These tests only match routes; they do not run auth loaders or contact Supabase.
describe("App routing", () => {
  it("matches the home page instead of falling back to not found", () => {
    const router = makeRouter();
    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each([
    ["/dashboard", "/dashboard"],
    ["/modules", "/modules"],
    ["/lessons", "/lessons"],
    ["/notebook", "/notebook"],
    ["/doubts", "/doubts"],
    ["/reviews", "/reviews"],
    ["/journal", "/journal"],
    ["/settings", "/settings"],
    ["/auth", "/auth"],
    ["/reset-password", "/reset-password"],
  ])("resolves %s to its registered page", (url, expectedRouteId) => {
    const router = makeRouter();
    const matches = router.matchRoutes(url);

    expect(matches.map((match) => match.routeId)).toContain(expectedRouteId);
    expect(matches.at(-1)?.routeId).toBe(expectedRouteId);
  });

  it("resolves an individual lesson URL", () => {
    const router = makeRouter();
    const matches = router.matchRoutes("/lesson/test-lesson-id");

    expect(matches.at(-1)?.routeId).toBe("/lesson/$lessonId");
  });
});

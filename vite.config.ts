// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [VitePWA({
    strategies: "generateSW", filename: "sw.js", outDir: "dist/client",
    injectRegister: null, registerType: "autoUpdate", manifest: false,
    devOptions: { enabled: false },
    workbox: {
      globDirectory: "dist/client",
      globPatterns: ["**/*.{js,css,woff2,png,ico}"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      // A separate shell cache key must not intercept normal /dashboard navigations.
      additionalManifestEntries: [{ url: "/dashboard?offline-shell=1", revision: String(Date.now()) }],
      navigateFallback: null,
      cleanupOutdatedCaches: true, skipWaiting: true, clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin && !url.pathname.startsWith("/~oauth") && !url.pathname.startsWith("/api/"),
          handler: "NetworkFirst",
          options: { cacheName: "tradestudy-pages-v1", networkTimeoutSeconds: 3, precacheFallback: { fallbackURL: "/dashboard?offline-shell=1" }, expiration: { maxEntries: 40 }, cacheableResponse: { statuses: [200] } },
        },
        {
          urlPattern: ({ url }) => url.origin === self.location.origin && /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css|woff2)$/.test(url.pathname),
          handler: "CacheFirst",
          options: { cacheName: "tradestudy-assets-v1", expiration: { maxEntries: 150 }, cacheableResponse: { statuses: [200] } },
        },
      ],
    },
  })],
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

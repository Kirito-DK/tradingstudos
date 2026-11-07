export function refuseOfflineWorker(prod: boolean, hostname: string, framed: boolean, disabled: boolean) {
  const host = hostname.toLowerCase();
  const domains = ["lovable.app", "gpt-eng.com", "gptengineer.run"];
  const label = host.split(".")[0];
  return !prod || framed || disabled ||
    domains.some((d) => host.endsWith(`.${d}`) && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) || /^project--.+-dev$/.test(label))) ||
    ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some((d) => host === d || host.endsWith(`.${d}`));
}

export async function registerOfflineWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (refuseOfflineWorker(import.meta.env.PROD, window.location.hostname.toLowerCase(), window.self !== window.top, new URLSearchParams(window.location.search).get("sw") === "off")) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter((r) => [r.active, r.waiting, r.installing].some((w) => w && new URL(w.scriptURL).pathname === "/sw.js")).map((r) => r.unregister()));
    return;
  }
  await navigator.serviceWorker.register("/sw.js");
}
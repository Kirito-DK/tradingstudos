import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { isOffline, offlineUser, prepareOfflineCache } from "@/lib/offline";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    if (isOffline()) {
      const user = await offlineUser();
      if (!user) throw redirect({ to: "/auth" });
      await prepareOfflineCache(user, context.queryClient);
      if (!["/dashboard", "/notebook", "/reviews", "/lessons", "/lessons/"].includes(location.pathname) && !location.pathname.startsWith("/lessons/")) throw redirect({ to: "/lessons" });
      return { user };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    await prepareOfflineCache(data.user, context.queryClient);
    return { user: data.user };
  },
  component: AppShell,
});

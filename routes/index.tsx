import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isOffline, offlineUser } from "@/lib/offline";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "TradeStudy — Estudos do mercado financeiro" },
      { name: "description", content: "Organize módulos, aulas, anotações e revisões do seu curso de trading." },
      { property: "og:title", content: "TradeStudy — Estudos do mercado financeiro" },
      { property: "og:description", content: "Organize módulos, aulas, anotações e revisões do seu curso de trading." },
    ],
  }),
  beforeLoad: async () => {
    if (isOffline()) throw redirect({ to: await offlineUser() ? "/dashboard" : "/auth" });
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/dashboard" : "/auth" });
  },
  component: () => null,
});

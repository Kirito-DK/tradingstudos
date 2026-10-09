import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "TradeStudy — Estudos do mercado financeiro" },
      { name: "description", content: "Organize módulos, aulas, anotações e revisões do seu curso de trading." },
      { property: "og:title", content: "TradeStudy — Estudos do mercado financeiro" },
      { property: "og:description", content: "Organize módulos, aulas, anotações e revisões do seu curso de trading." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/dashboard" : "/auth" });
  },
  component: () => null,
});

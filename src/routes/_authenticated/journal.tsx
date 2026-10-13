import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Diário de gráficos — TradeStudy" }] }),
  component: () => <ComingSoon title="Diário de gráficos" stage="Etapa 3" />,
});

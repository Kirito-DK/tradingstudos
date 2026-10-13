import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common";

export const Route = createFileRoute("/_authenticated/doubts")({
  head: () => ({ meta: [{ title: "Minhas dúvidas — TradeStudy" }] }),
  component: () => <ComingSoon title="Minhas dúvidas" stage="Etapa 2" />,
});

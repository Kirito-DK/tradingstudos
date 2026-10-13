import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({ meta: [{ title: "Revisões — TradeStudy" }] }),
  component: () => <ComingSoon title="Revisões" stage="Etapa 2" />,
});

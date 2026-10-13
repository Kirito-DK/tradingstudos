import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common";

export const Route = createFileRoute("/_authenticated/notebook")({
  head: () => ({ meta: [{ title: "Caderno de estudos — TradeStudy" }] }),
  component: () => <ComingSoon title="Caderno de estudos" stage="Etapa 2" />,
});

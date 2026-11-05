import { pageHead } from "@/lib/page-head";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allLessonsQuery, lessonDoubtsQuery, notesQuery, type Lesson } from "@/lib/data";
import { REVIEW_STATUS_LABEL, reviewBucket, type ReviewBucket } from "@/lib/review";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/common";
import { ReviewScheduler } from "@/components/ReviewScheduler";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => pageHead("Revisões — TradeStudy", "Acompanhe e conclua suas revisões de aulas no TradeStudy."),
  component: ReviewsPage,
});

const TABS: { v: ReviewBucket; label: string }[] = [
  { v: "overdue", label: "Vencidas" },
  { v: "today", label: "Para hoje" },
  { v: "upcoming", label: "Próximas" },
  { v: "done", label: "Concluídas" },
];

function ReviewsPage() {
  const lq = useQuery(allLessonsQuery());
  const logs = useQuery({
    queryKey: ["reviewLogs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("review_logs").select("*, lessons(title)").order("reviewed_at", { ascending: false }).limit(30);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const [tab, setTab] = useState<ReviewBucket>("overdue");
  const [open, setOpen] = useState<string | null>(null);

  if (lq.isLoading) return <LoadingBlock />;
  if (lq.error) return <ErrorBlock error={lq.error} />;
  const all = lq.data ?? [];
  const counts = Object.fromEntries(TABS.map((t) => [t.v, all.filter((l) => reviewBucket(l) === t.v).length]));
  const list = all.filter((l) => reviewBucket(l) === tab).sort((a, b) => (a.next_review_at ?? "").localeCompare(b.next_review_at ?? ""));

  return (
    <>
      <PageHeader title="Revisões" subtitle="Reveja o que estudou no momento certo." />
      <Tabs value={tab} onValueChange={(v) => { setTab(v as ReviewBucket); setOpen(null); }} className="mb-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:inline-flex sm:w-auto">
          {TABS.map((t) => <TabsTrigger className="min-h-11 sm:min-h-0" key={t.v} value={t.v}>{t.label} <span className="ml-1 font-mono text-xs">{counts[t.v]}</span></TabsTrigger>)}
        </TabsList>
      </Tabs>
      {list.length === 0 ? (
        <EmptyState icon={<RotateCcw className="h-8 w-8" />} title="Nada por aqui" text="Agende revisões na página de cada aula." />
      ) : (
        <div className="grid gap-3">
          {list.map((l) => (
            <div key={l.id} className="panel min-w-0 break-words p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:justify-between">
                <div className="min-w-0">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.review_status ? REVIEW_STATUS_LABEL[l.review_status] : ""}
                    {l.next_review_at && ` · ${new Date(l.next_review_at + "T12:00").toLocaleDateString("pt-BR")}`}
                    {l.review_note && ` · ${l.review_note}`}
                  </div>
                </div>
                <Button size="sm" variant={open === l.id ? "secondary" : "default"} onClick={() => setOpen(open === l.id ? null : l.id)}>
                  {open === l.id ? "Fechar" : "Revisar"}
                </Button>
              </div>
              {open === l.id && <ReviewBody lesson={l} />}
            </div>
          ))}
        </div>
      )}
      <h2 className="mb-3 mt-8 font-medium">Histórico de revisões concluídas</h2>
      {(logs.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma revisão concluída ainda.</p> : (
        <ul className="panel divide-y divide-border">
          {(logs.data ?? []).map((r) => (
            <li key={r.id} className="flex justify-between gap-2 p-3 text-sm">
              <span className="truncate">{(r.lessons as { title: string } | null)?.title}</span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{new Date(r.reviewed_at).toLocaleDateString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Block({ title, text, tone }: { title: string; text: string | null | undefined; tone?: string }) {
  if (!text) return null;
  return (
    <div>
      <div className={`text-xs font-medium ${tone ?? "text-muted-foreground"}`}>{title}</div>
      <p className="whitespace-pre-line text-sm">{text}</p>
    </div>
  );
}

function ReviewBody({ lesson }: { lesson: Lesson }) {
  const n = useQuery(notesQuery(lesson.id));
  const d = useQuery(lessonDoubtsQuery(lesson.id));
  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      {n.isLoading ? <LoadingBlock /> : (
        <div className="space-y-3">
          <Block title="Resumo" text={n.data?.summary} />
          <Block title="Anotações" text={n.data?.free_notes} />
          <Block title="Aplicação prática" text={n.data?.practical} />
          <Block title="Dúvidas" text={n.data?.doubts_text} tone="text-warning" />
          {(d.data ?? []).length > 0 && (
            <ul className="space-y-1 text-sm">
              {(d.data ?? []).map((x) => <li key={x.id}>• {x.question} <span className="text-xs text-muted-foreground">({x.status === "resolved" ? "resolvida" : "aberta"})</span></li>)}
            </ul>
          )}
          {!n.data && <p className="text-sm text-muted-foreground">Sem anotações salvas.</p>}
        </div>
      )}
      <Link to="/lessons/$lessonId" params={{ lessonId: lesson.id }} className="text-sm text-primary hover:underline">Abrir aula →</Link>
      <ReviewScheduler key={lesson.updated_at} lesson={lesson} />
    </div>
  );
}

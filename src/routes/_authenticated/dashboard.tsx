import { pageHead } from "@/lib/page-head";
import { useOffline } from "@/hooks/use-offline";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers, Plus } from "lucide-react";
import { allLessonsQuery, modulesQuery, openDoubtsCountQuery, recentNotesQuery } from "@/lib/data";
import { progressPercent } from "@/lib/progress";
import { addDaysISO, reviewBucket, toISODate } from "@/lib/review";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, ProgressBar } from "@/components/common";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageHead("Dashboard — TradeStudy", "Acompanhe seu progresso e continue seus estudos no TradeStudy."),
  component: Dashboard,
});

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "success" | "warning" | "primary" }) {
  const c = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "primary" ? "text-primary" : "";
  return (
    <div className="panel p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-semibold ${c}`}>{value}</div>
    </div>
  );
}

function Dashboard() {
  const offline = useOffline();
  const mods = useQuery(modulesQuery());
  const lq = useQuery(allLessonsQuery());
  const doubts = useQuery(openDoubtsCountQuery());
  const notes = useQuery(recentNotesQuery());
  const activity = useQuery({
    enabled: !offline,
    queryKey: ["activity"],
    queryFn: async () => {
      const since = addDaysISO(-27);
      const [n, r] = await Promise.all([
        supabase.from("lesson_notes").select("updated_at").gte("updated_at", since),
        supabase.from("review_logs").select("reviewed_at").gte("reviewed_at", since),
      ]);
      const days = new Map<string, number>();
      for (const x of n.data ?? []) { const k = toISODate(new Date(x.updated_at)); days.set(k, (days.get(k) ?? 0) + 1); }
      for (const x of r.data ?? []) { const k = toISODate(new Date(x.reviewed_at)); days.set(k, (days.get(k) ?? 0) + 1); }
      return days;
    },
  });

  if (mods.isLoading || lq.isLoading) return <LoadingBlock />;
  if (mods.error || lq.error) return <ErrorBlock error={mods.error ?? lq.error} />;
  const lessons = lq.data ?? [];
  if ((mods.data ?? []).length === 0)
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState icon={<Layers className="h-8 w-8" />} title="Comece criando seu primeiro módulo" text="Organize o curso em módulos e aulas para acompanhar seu progresso."
          action={<Button asChild><Link to="/modules"><Plus className="mr-1 h-4 w-4" />Criar módulo</Link></Button>} />
      </>
    );

  const done = lessons.filter((l) => l.status === "completed").length;
  const pct = progressPercent(done, lessons.length);
  const pendingReviews = lessons.filter((l) => ["overdue", "today"].includes(reviewBucket(l)));
  const review = pendingReviews.length;
  const last = [...lessons].filter((l) => l.last_accessed_at).sort((a, b) => b.last_accessed_at!.localeCompare(a.last_accessed_at!))[0];
  const modPos = new Map((mods.data ?? []).map((m, i) => [m.id, i]));
  const nextPending = [...lessons].filter((l) => l.status !== "completed")
    .sort((a, b) => (modPos.get(a.module_id)! - modPos.get(b.module_id)!) || a.position - b.position)[0];
  const cont = last && last.status !== "completed" ? last : nextPending ?? last;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral dos seus estudos." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Módulos" value={mods.data!.length} />
        <Stat label="Aulas cadastradas" value={lessons.length} />
        <Stat label="Concluídas" value={done} tone="success" />
        <Stat label="Pendentes" value={lessons.length - done} />
        <Stat label="Conclusão" value={`${pct}%`} tone="success" />
        <Stat label="Dúvidas abertas" value={doubts.data ?? "–"} tone="warning" />
        <Stat label="Revisões pendentes" value={review} tone="warning" />
        <Stat label="Em andamento" value={lessons.filter((l) => l.status === "in_progress").length} tone="primary" />
      </div>
      <div className="panel mt-4 flex items-center gap-4 p-4">
        <span className="text-sm text-muted-foreground">Progresso geral</span>
        <ProgressBar value={pct} />
        <span className="font-mono text-sm text-success">{pct}%</span>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="mb-3 font-medium">Continuar estudando</h2>
          {cont ? (
            <div className="flex items-center justify-between gap-3">
              <span className="truncate">{cont.title}</span>
              <Button asChild size="sm"><Link to="/lessons/$lessonId" params={{ lessonId: cont.id }}>Continuar</Link></Button>
            </div>
          ) : <p className="text-sm text-muted-foreground">Cadastre aulas para começar.</p>}
        </div>
        <div className="panel p-5">
          <h2 className="mb-3 font-medium">Últimas anotações</h2>
          {(notes.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma anotação ainda.</p> : (
            <ul className="space-y-2">
              {notes.data!.map((n) => (
                <li key={n.id}>
                  <Link to="/lessons/$lessonId" params={{ lessonId: n.lesson_id }} className="block truncate text-sm hover:text-primary">
                    <span className="font-medium">{(n.lessons as { title: string } | null)?.title}</span>
                    <span className="text-muted-foreground"> — {(n.summary || n.free_notes).slice(0, 80) || "(vazio)"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="panel p-5">
          <h2 className="mb-3 font-medium">Revisões pendentes</h2>
          {pendingReviews.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma revisão para hoje.</p> : (
            <ul className="space-y-2">
              {pendingReviews.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link to="/lessons/$lessonId" params={{ lessonId: l.id }} className="truncate hover:text-primary">{l.title}</Link>
                  <span className={`font-mono text-xs ${reviewBucket(l) === "overdue" ? "text-destructive" : "text-warning"}`}>{reviewBucket(l) === "overdue" ? "vencida" : "hoje"}</span>
                </li>
              ))}
              <li><Link to="/reviews" className="text-xs text-primary hover:underline">Ver todas →</Link></li>
            </ul>
          )}
        </div>
        <div className="panel p-5">
          <h2 className="mb-3 font-medium">Consistência (últimos 28 dias)</h2>
          <div className="grid grid-cols-14 gap-1" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
            {Array.from({ length: 28 }, (_, i) => addDaysISO(i - 27)).map((d) => {
              const c = activity.data?.get(d) ?? 0;
              return <div key={d} title={`${new Date(d + "T12:00").toLocaleDateString("pt-BR")}: ${c} atividade(s)`} className={`aspect-square rounded-sm ${c === 0 ? "bg-muted" : c < 3 ? "bg-success/40" : "bg-success"}`} />;
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Dias com anotações salvas ou revisões concluídas.</p>
        </div>
      </div>
    </>
  );
}

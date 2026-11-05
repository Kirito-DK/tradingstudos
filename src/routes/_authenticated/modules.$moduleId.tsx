import { pageHead } from "@/lib/page-head";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Pencil, PlayCircle, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allLessonsQuery, modulesQuery, type Lesson } from "@/lib/data";
import { progressPercent } from "@/lib/progress";
import { moveItem } from "@/lib/reorder";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, ProgressBar, StatusBadge } from "@/components/common";
import { LessonDialog } from "@/components/forms";
import { ConfirmDelete } from "@/components/ConfirmDelete";

export const Route = createFileRoute("/_authenticated/modules/$moduleId")({
  head: () => pageHead("Módulo — TradeStudy", "Consulte as aulas e o progresso deste módulo no TradeStudy."),
  component: ModulePage,
});

function ModulePage() {
  const { moduleId } = Route.useParams();
  const qc = useQueryClient();
  const mods = useQuery(modulesQuery());
  const lq = useQuery(allLessonsQuery());
  const [formOpen, setFormOpen] = useState(false);
  const [edit, setEdit] = useState<Lesson | null>(null);
  const [del, setDel] = useState<Lesson | null>(null);
  const [busy, setBusy] = useState(false);

  if (mods.isLoading || lq.isLoading) return <LoadingBlock />;
  if (mods.error || lq.error) return <ErrorBlock error={mods.error ?? lq.error} />;
  const mod = mods.data?.find((m) => m.id === moduleId);
  if (!mod) return <EmptyState title="Módulo não encontrado" action={<Link to="/modules" className="text-primary">Voltar</Link>} />;
  const lessons = (lq.data ?? []).filter((l) => l.module_id === moduleId);
  const done = lessons.filter((l) => l.status === "completed").length;
  const pct = progressPercent(done, lessons.length);
  const refresh = () => qc.invalidateQueries({ queryKey: ["lessons"] });

  async function run(fn: () => Promise<{ error: unknown }>, ok: string) {
    if (busy) return;
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) toast.error("Operação não concluída. Tente novamente.");
    else { toast.success(ok); refresh(); }
  }

  return (
    <>
      <Link to="/modules" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Meus módulos
      </Link>
      <PageHeader
        title={mod.title}
        subtitle={mod.description ?? undefined}
        actions={<Button onClick={() => { setEdit(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" />Nova aula</Button>}
      />
      <div className="panel mb-6 flex items-center gap-4 p-4">
        <ProgressBar value={pct} />
        <span className="whitespace-nowrap font-mono text-sm text-success">{done}/{lessons.length} · {pct}%</span>
      </div>
      {lessons.length === 0 ? (
        <EmptyState icon={<PlayCircle className="h-8 w-8" />} title="Nenhuma aula neste módulo" text="Adicione aulas com ou sem vídeo do YouTube." action={<Button onClick={() => setFormOpen(true)}><Plus className="mr-1 h-4 w-4" />Adicionar aula</Button>} />
      ) : (
        <div className="grid gap-2">
          {lessons.map((l, i) => (
            <div key={l.id} className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              <Link to="/lessons/$lessonId" params={{ lessonId: l.id }} className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium hover:text-primary">{l.title}</span>
                  <StatusBadge status={l.status} />
                  {l.duration_minutes != null && <span className="font-mono text-xs text-muted-foreground">{l.duration_minutes} min</span>}
                </div>
              </Link>
              <div className="flex flex-wrap gap-1">
                {l.status !== "completed" && (
                  <Button variant="ghost" size="icon" disabled={busy} aria-label="Marcar como concluída"
                    onClick={() => run(async () => supabase.from("lessons").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", l.id), "Aula concluída.")}>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" disabled={busy || i === 0} aria-label="Subir"
                  onClick={async () => { setBusy(true); try { await moveItem("lessons", lessons.map((x) => x.id), i, -1); refresh(); } catch { toast.error("Erro ao reordenar."); } setBusy(false); }}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={busy || i === lessons.length - 1} aria-label="Descer"
                  onClick={async () => { setBusy(true); try { await moveItem("lessons", lessons.map((x) => x.id), i, 1); refresh(); } catch { toast.error("Erro ao reordenar."); } setBusy(false); }}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={busy} aria-label="Duplicar"
                  onClick={() => run(async () => supabase.from("lessons").insert({
                    module_id: l.module_id, title: `${l.title} (cópia)`.slice(0, 200), description: l.description,
                    youtube_url: l.youtube_url, quick_notes: l.quick_notes, duration_minutes: l.duration_minutes, position: lessons.length,
                  }), "Aula duplicada.")}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => { setEdit(l); setFormOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => setDel(l)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <LessonDialog open={formOpen} onOpenChange={setFormOpen} lesson={edit} moduleId={moduleId} nextPosition={lessons.length} />
      <ConfirmDelete
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title={`Excluir "${del?.title ?? ""}"?`}
        description="As anotações, dúvidas e revisões desta aula também serão excluídas permanentemente."
        onConfirm={async () => {
          const { error } = await supabase.from("lessons").delete().eq("id", del!.id);
          if (error) { toast.error("Não foi possível excluir."); return; }
          toast.success("Aula excluída.");
          refresh();
        }}
      />
    </>
  );
}

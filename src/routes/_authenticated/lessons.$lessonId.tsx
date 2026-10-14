import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, ExternalLink, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allLessonsQuery, lessonDoubtsQuery, lessonQuery, modulesQuery, notesQuery } from "@/lib/data";
import { parseYouTubeId, youTubeEmbedUrl, youTubeWatchUrl } from "@/lib/youtube";
import { useAutosaveNotes, type NoteFields, type SaveState } from "@/hooks/use-autosave-notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/common";
import { LessonDialog } from "@/components/forms";

export const Route = createFileRoute("/_authenticated/lessons/$lessonId")({
  head: () => ({ meta: [{ title: "Aula — TradeStudy" }] }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  return <LessonView key={lessonId} lessonId={lessonId} />;
}

function LessonView({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient();
  const lesson = useQuery(lessonQuery(lessonId));
  const all = useQuery(allLessonsQuery());
  const mods = useQuery(modulesQuery());
  const notes = useQuery(notesQuery(lessonId));
  const { fields, update, save, state } = useAutosaveNotes(lessonId, notes.data, notes.isSuccess);
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.from("lessons").update({ last_accessed_at: new Date().toISOString() }).eq("id", lessonId);
  }, [lessonId]);

  if (lesson.isLoading) return <LoadingBlock />;
  if (lesson.error) return <ErrorBlock error={lesson.error} />;
  const l = lesson.data;
  if (!l) return <EmptyState title="Aula não encontrada" action={<Link to="/lessons" className="text-primary">Ver aulas</Link>} />;

  const mod = mods.data?.find((m) => m.id === l.module_id);
  const siblings = (all.data ?? []).filter((x) => x.module_id === l.module_id);
  const idx = siblings.findIndex((x) => x.id === l.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;
  const videoId = parseYouTubeId(l.youtube_url);

  async function setStatus(status: string) {
    setBusy(true);
    const { error } = await supabase.from("lessons").update({
      status, completed_at: status === "completed" ? new Date().toISOString() : null,
    }).eq("id", lessonId);
    setBusy(false);
    if (error) { toast.error("Não foi possível alterar o status."); return; }
    toast.success(status === "completed" ? "Aula concluída!" : "Status atualizado.");
    qc.invalidateQueries({ queryKey: ["lesson", lessonId] });
    qc.invalidateQueries({ queryKey: ["lessons"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/modules/$moduleId" params={{ moduleId: l.module_id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {mod?.title ?? "Módulo"}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!prev} asChild={!!prev}>
            {prev ? <Link to="/lessons/$lessonId" params={{ lessonId: prev.id }}><ChevronLeft className="h-4 w-4" />Anterior</Link> : <span className="inline-flex items-center gap-1"><ChevronLeft className="h-4 w-4" />Anterior</span>}
          </Button>
          <Button variant="outline" size="sm" disabled={!next} asChild={!!next}>
            {next ? <Link to="/lessons/$lessonId" params={{ lessonId: next.id }}>Próxima<ChevronRight className="h-4 w-4" /></Link> : <span className="inline-flex items-center gap-1">Próxima<ChevronRight className="h-4 w-4" /></span>}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">Aula {idx + 1} de {siblings.length}</p>
          <h1 className="text-2xl font-semibold">{l.title}</h1>
          {l.description && <p className="mt-1 text-sm text-muted-foreground">{l.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={l.status} onValueChange={setStatus} disabled={busy}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Não iniciada</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>
          {l.status !== "completed" && (
            <Button variant="outline" disabled={busy} onClick={() => setStatus("completed")} className="border-success/50 text-success">
              <CheckCircle2 className="mr-1 h-4 w-4" />Concluir
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Editar aula"><Pencil className="h-4 w-4" /></Button>
        </div>
      </div>

      {l.youtube_url ? (
        videoId ? (
          <div className="space-y-2">
            <div className="panel aspect-video overflow-hidden">
              <iframe
                className="h-full w-full"
                src={youTubeEmbedUrl(videoId)}
                title={l.title}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                allowFullScreen
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Se o vídeo não carregar, ele pode não permitir incorporação.</span>
              <a href={youTubeWatchUrl(videoId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                Abrir no YouTube <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="panel flex items-center gap-2 border-warning/50 p-4 text-sm text-warning">
            <AlertTriangle className="h-4 w-4" /> O link cadastrado não é um vídeo válido do YouTube. Edite a aula para corrigir.
          </div>
        )
      ) : null}

      {l.quick_notes && (
        <div className="panel p-4 text-sm"><span className="text-muted-foreground">Observações rápidas: </span>{l.quick_notes}</div>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Caderno da aula</h2>
          <div className="flex items-center gap-3">
            <SaveIndicator state={state} onRetry={save} />
            <Button size="sm" onClick={async () => { if (await save()) toast.success("Anotações salvas."); else toast.error("Não foi possível salvar."); }} disabled={state === "saving" || notes.isLoading}>
              <Save className="mr-1 h-4 w-4" />Salvar anotações
            </Button>
          </div>
        </div>
        {notes.isLoading ? <LoadingBlock /> : notes.error ? <ErrorBlock error={notes.error} /> : (
          <div className="grid gap-4 lg:grid-cols-2">
            <NoteArea k="free_notes" label="A. Anotações livres" hint="Explicações, fórmulas, conceitos e observações importantes." fields={fields} update={update} rows={10} wide />
            <NoteArea k="summary" label="B. Resumo do aprendizado" hint="O que eu aprendi nesta aula?" fields={fields} update={update} />
            <NoteArea k="practical" label="D. Aplicação prática" hint="Como aplicar? Em que situação de mercado? O que observar no gráfico? Qual erro evitar?" fields={fields} update={update} />
            <div className="lg:col-span-2">
              <NoteArea k="doubts_text" label="C. Dúvidas pendentes" hint="Perguntas, pontos que não entendi, assuntos para pesquisar." fields={fields} update={update} rows={4} accent="warning" />
              <DoubtsList lessonId={lessonId} />
            </div>
          </div>
        )}
      </section>

      <LessonDialog open={editOpen} onOpenChange={setEditOpen} lesson={l} moduleId={l.module_id} nextPosition={siblings.length} />
    </div>
  );
}

function SaveIndicator({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === "saving") return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Salvando...</span>;
  if (state === "saved") return <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" />Salvo</span>;
  if (state === "dirty") return <span className="text-xs text-muted-foreground">Alterações não salvas</span>;
  if (state === "error") return (
    <span className="text-xs text-destructive">Não foi possível salvar. <button className="underline" onClick={onRetry}>Tentar novamente</button></span>
  );
  return null;
}

function NoteArea({ k, label, hint, fields, update, rows = 6, wide, accent }: {
  k: keyof NoteFields; label: string; hint: string; fields: NoteFields; update: (k: keyof NoteFields, v: string) => void; rows?: number; wide?: boolean; accent?: "warning";
}) {
  return (
    <div className={`panel space-y-2 p-4 ${wide ? "lg:col-span-2" : ""} ${accent === "warning" ? "border-warning/40" : ""}`}>
      <label htmlFor={k} className={`text-sm font-medium ${accent === "warning" ? "text-warning" : ""}`}>{label}</label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <Textarea id={k} value={fields[k]} onChange={(e) => update(k, e.target.value)} rows={rows} className="resize-y bg-background leading-relaxed" />
    </div>
  );
}

const DOUBT_STATUS: Record<string, string> = { pending: "Pendente", researching: "Em pesquisa", resolved: "Resolvida" };

function DoubtsList({ lessonId }: { lessonId: string }) {
  const qc = useQueryClient();
  const dq = useQuery(lessonDoubtsQuery(lessonId));
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["doubts"] });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q || busy) return;
    setBusy(true);
    const { error } = await supabase.from("doubts").insert({ lesson_id: lessonId, question: q.slice(0, 2000) });
    setBusy(false);
    if (error) { toast.error("Não foi possível registrar a dúvida."); return; }
    setText("");
    toast.success("Dúvida registrada.");
    refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <form onSubmit={add} className="flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Transformar em dúvida individual..." />
        <Button type="submit" variant="outline" disabled={busy || !text.trim()}><Plus className="mr-1 h-4 w-4" />Registrar</Button>
      </form>
      {(dq.data ?? []).map((d) => (
        <div key={d.id} className="panel flex flex-wrap items-center gap-2 p-3 text-sm">
          <span className="min-w-0 flex-1">{d.question}</span>
          <Select value={d.status} onValueChange={async (v) => {
            const { error } = await supabase.from("doubts").update({ status: v, resolved_at: v === "resolved" ? new Date().toISOString() : null }).eq("id", d.id);
            if (error) toast.error("Erro ao atualizar."); else refresh();
          }}>
            <SelectTrigger className="h-8 w-36"><SelectValue>{DOUBT_STATUS[d.status]}</SelectValue></SelectTrigger>
            <SelectContent>
              {Object.entries(DOUBT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Excluir dúvida" onClick={async () => {
            if (!confirm("Excluir esta dúvida?")) return;
            const { error } = await supabase.from("doubts").delete().eq("id", d.id);
            if (error) toast.error("Erro ao excluir."); else refresh();
          }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
    </div>
  );
}

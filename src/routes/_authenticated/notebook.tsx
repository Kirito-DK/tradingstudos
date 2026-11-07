import { offlineRead, isOffline } from "@/lib/offline";
import { useOffline } from "@/hooks/use-offline";
import { pageHead } from "@/lib/page-head";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HelpCircle, NotebookPen, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allLessonsQuery, modulesQuery } from "@/lib/data";
import { addDaysISO } from "@/lib/review";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/common";

export const Route = createFileRoute("/_authenticated/notebook")({
  head: () => pageHead("Caderno de estudos — TradeStudy", "Consulte suas anotações, resumos e aplicações práticas no TradeStudy."),
  component: NotebookPage,
});

function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

const clean = (s: string) => s.replace(/[%,()]/g, " ").trim();

function NotebookPage() {
  const offline = useOffline();
  const qc = useQueryClient();
  const mods = useQuery(modulesQuery());
  const lessons = useQuery(allLessonsQuery());
  const [q, setQ] = useState("");
  const [mod, setMod] = useState("all");
  const [lesson, setLesson] = useState("all");
  const [period, setPeriod] = useState("all");
  const [onlyImportant, setOnlyImportant] = useState(false);
  const [onlyDoubts, setOnlyDoubts] = useState(false);
  const dq = useDebounced(q);

  const notes = useQuery({
    queryKey: ["notes", "search", dq, mod, lesson, period, onlyImportant, onlyDoubts],
    queryFn: async () => offlineRead(["notes", "search", dq, mod, lesson, period, onlyImportant, onlyDoubts], async () => {
      let query = supabase.from("lesson_notes").select("*, lessons!inner(id, title, module_id)").order("updated_at", { ascending: false }).limit(100);
      const term = clean(dq);
      if (term) query = query.or(["free_notes", "summary", "doubts_text", "practical"].map((c) => `${c}.ilike.%${term}%`).join(","));
      if (mod !== "all") query = query.eq("lessons.module_id", mod);
      if (lesson !== "all") query = query.eq("lesson_id", lesson);
      if (period !== "all") query = query.gte("updated_at", addDaysISO(-Number(period)));
      if (onlyImportant) query = query.eq("important", true);
      if (onlyDoubts) query = query.neq("doubts_text", "");
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    }),
  });

  const modName = new Map((mods.data ?? []).map((m) => [m.id, m.title]));
  const lessonOpts = (lessons.data ?? []).filter((l) => mod === "all" || l.module_id === mod);

  async function toggleImportant(id: string, v: boolean) {
    if (isOffline()) return;
    const { error } = await supabase.from("lesson_notes").update({ important: v }).eq("id", id);
    if (error) toast.error("Erro ao atualizar.");
    else qc.invalidateQueries({ queryKey: ["notes"] });
  }

  return (
    <>
      <PageHeader title="Caderno de estudos" subtitle="Todas as suas anotações em um só lugar." />
      <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <Input placeholder="Buscar nas anotações, resumos, dúvidas e aplicações..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={mod} onValueChange={(v) => { setMod(v); setLesson("all"); }}>
          <SelectTrigger className="xl:w-48"><SelectValue placeholder="Módulo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os módulos</SelectItem>
            {(mods.data ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={lesson} onValueChange={setLesson}>
          <SelectTrigger className="xl:w-48"><SelectValue placeholder="Aula" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as aulas</SelectItem>
            {lessonOpts.map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="xl:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer data</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={onlyImportant ? "default" : "outline"} onClick={() => setOnlyImportant((v) => !v)}><Star className="mr-1 h-4 w-4" />Importantes</Button>
        <Button size="sm" variant={onlyDoubts ? "default" : "outline"} onClick={() => setOnlyDoubts((v) => !v)}><HelpCircle className="mr-1 h-4 w-4" />Com dúvidas</Button>
      </div>
      {notes.isLoading ? <LoadingBlock /> : notes.error ? <ErrorBlock error={notes.error} /> : (notes.data ?? []).length === 0 ? (
        <EmptyState icon={<NotebookPen className="h-8 w-8" />} title="Nenhuma anotação encontrada" text="Escreva anotações na página de cada aula para vê-las aqui." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(notes.data ?? []).map((n) => {
            const l = n.lessons as { id: string; title: string; module_id: string };
            return (
              <div key={n.id} className="panel min-w-0 flex flex-col gap-2 break-words p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{modName.get(l.module_id)} · {new Date(n.updated_at).toLocaleString("pt-BR")}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" disabled={offline} onClick={() => toggleImportant(n.id, !n.important)} aria-label={n.important ? "Remover marca de importante" : "Marcar como importante"} aria-pressed={n.important}>
                    <Star className={`h-4 w-4 ${n.important ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </Button>
                </div>
                {n.summary && <p className="line-clamp-3 text-sm"><span className="text-muted-foreground">Resumo: </span>{n.summary}</p>}
                {n.free_notes && <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{n.free_notes}</p>}
                {n.practical && <p className="line-clamp-2 text-sm"><span className="text-muted-foreground">Prática: </span>{n.practical}</p>}
                {n.doubts_text && <p className="line-clamp-2 text-sm text-warning">Dúvidas: {n.doubts_text}</p>}
                <Link to="/lessons/$lessonId" params={{ lessonId: l.id }} className="mt-auto text-sm text-primary hover:underline">{offline ? "Consultar →" : "Abrir e editar →"}</Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

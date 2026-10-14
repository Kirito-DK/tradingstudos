import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { HelpCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { modulesQuery, type Doubt } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/common";
import { ConfirmDelete } from "@/components/ConfirmDelete";

export const Route = createFileRoute("/_authenticated/doubts")({
  head: () => ({ meta: [{ title: "Minhas dúvidas — TradeStudy" }] }),
  component: DoubtsPage,
});

const LABEL: Record<string, string> = { pending: "Pendente", researching: "Em pesquisa", resolved: "Resolvida" };
const TONE: Record<string, string> = {
  pending: "border-warning/40 bg-warning/10 text-warning",
  researching: "border-primary/40 bg-primary/10 text-primary",
  resolved: "border-success/40 bg-success/10 text-success",
};

type Row = Doubt & { lessons: { id: string; title: string; module_id: string } | null };

function DoubtsPage() {
  const qc = useQueryClient();
  const mods = useQuery(modulesQuery());
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("open");
  const [sort, setSort] = useState("new");
  const [del, setDel] = useState<Row | null>(null);

  const dq = useQuery({
    queryKey: ["doubts", "all", q, status, sort],
    queryFn: async () => {
      let query = supabase.from("doubts").select("*, lessons(id, title, module_id)").order("created_at", { ascending: sort === "old" }).limit(200);
      const term = q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`question.ilike.%${term}%,answer.ilike.%${term}%`);
      if (status === "open") query = query.neq("status", "resolved");
      else if (status !== "all") query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data as Row[];
    },
  });
  const modName = new Map((mods.data ?? []).map((m) => [m.id, m.title]));

  return (
    <>
      <PageHeader title="Minhas dúvidas" subtitle="Acompanhe o que ainda precisa ser pesquisado." />
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto_auto]">
        <Input placeholder="Buscar dúvidas..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Abertas</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="researching">Em pesquisa</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
            <SelectItem value="all">Todas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Mais recentes</SelectItem>
            <SelectItem value="old">Mais antigas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {dq.isLoading ? <LoadingBlock /> : dq.error ? <ErrorBlock error={dq.error} /> : (dq.data ?? []).length === 0 ? (
        <EmptyState icon={<HelpCircle className="h-8 w-8" />} title="Nenhuma dúvida aqui" text="Registre dúvidas na página de cada aula." />
      ) : (
        <div className="grid gap-3">
          {dq.data!.map((d) => <DoubtCard key={d.id + d.updated_at} d={d} modName={modName.get(d.lessons?.module_id ?? "")} onDelete={() => setDel(d)} />)}
        </div>
      )}
      <ConfirmDelete open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Excluir dúvida?" description="A dúvida e a resposta registrada serão removidas."
        onConfirm={async () => {
          const { error } = await supabase.from("doubts").delete().eq("id", del!.id);
          if (error) { toast.error("Erro ao excluir."); return; }
          qc.invalidateQueries({ queryKey: ["doubts"] });
        }} />
    </>
  );
}

function DoubtCard({ d, modName, onDelete }: { d: Row; modName?: string | undefined; onDelete: () => void }) {
  const qc = useQueryClient();
  const [answer, setAnswer] = useState(d.answer ?? "");
  const [st, setSt] = useState(d.status);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("doubts").update({
      status: st, answer: answer.trim() || null,
      resolved_at: st === "resolved" ? (d.resolved_at ?? new Date().toISOString()) : null,
    }).eq("id", d.id);
    setBusy(false);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Dúvida atualizada.");
    qc.invalidateQueries({ queryKey: ["doubts"] });
  }
  const dirty = answer !== (d.answer ?? "") || st !== d.status;

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{d.question}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {d.lessons ? <Link to="/lessons/$lessonId" params={{ lessonId: d.lessons.id }} className="text-primary hover:underline">{d.lessons.title}</Link> : "Sem aula"}
            {modName && ` · ${modName}`} · criada em {new Date(d.created_at).toLocaleDateString("pt-BR")}
            {d.resolved_at && ` · resolvida em ${new Date(d.resolved_at).toLocaleDateString("pt-BR")}`}
          </p>
        </div>
        <Badge variant="outline" className={TONE[d.status]}>{LABEL[d.status]}</Badge>
      </div>
      <Textarea rows={2} placeholder="Resposta ou explicação encontrada..." value={answer} onChange={(e) => setAnswer(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={st} onValueChange={setSt}>
          <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" disabled={busy || !dirty} onClick={save}>{busy ? "Salvando..." : "Salvar"}</Button>
        <Button size="icon" variant="ghost" className="ml-auto" onClick={onDelete} aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>
    </div>
  );
}

import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CandlestickChart, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { allLessonsQuery, modulesQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/common";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { toISODate } from "@/lib/review";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Diário de gráficos — TradeStudy" }] }),
  component: JournalPage,
});

type Entry = Tables<"chart_entries">;
const RISK: Record<string, string> = { risk_on: "Risk-on", risk_off: "Risk-off", neutral: "Neutro" };

function useSignedUrl(path: string | null) {
  return useQuery({
    queryKey: ["signed", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("charts").createSignedUrl(path!, 3600);
      if (error) throw new Error(error.message);
      return data.signedUrl;
    },
  });
}

function JournalPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [asset, setAsset] = useState("all");
  const [edit, setEdit] = useState<Entry | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<Entry | null>(null);

  const eq = useQuery({
    queryKey: ["journal", q],
    queryFn: async () => {
      let query = supabase.from("chart_entries").select("*").order("entry_date", { ascending: false }).limit(200);
      const t = q.replace(/[%,()]/g, " ").trim();
      if (t) query = query.or(["title", "asset", "concept", "observation", "conclusion", "market_context", "hypothesis"].map((c) => `${c}.ilike.%${t}%`).join(","));
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const assets = [...new Set((eq.data ?? []).map((e) => e.asset).filter(Boolean))] as string[];
  const list = (eq.data ?? []).filter((e) => asset === "all" || e.asset === asset);

  return (
    <>
      <PageHeader title="Diário de gráficos" subtitle="Registre exemplos práticos e hipóteses de mercado — ferramenta de aprendizado, não de recomendação."
        actions={<Button onClick={() => { setEdit(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" />Novo registro</Button>} />
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input placeholder="Buscar registros..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os ativos</SelectItem>
            {assets.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {eq.isLoading ? <LoadingBlock /> : eq.error ? <ErrorBlock error={eq.error} /> : list.length === 0 ? (
        <EmptyState icon={<CandlestickChart className="h-8 w-8" />} title="Nenhum registro" text="Registre o que observou nos gráficos e relacione com suas aulas."
          action={<Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />Criar registro</Button>} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((e) => <EntryCard key={e.id} e={e} onEdit={() => { setEdit(e); setOpen(true); }} onDelete={() => setDel(e)} />)}
        </div>
      )}
      <EntryDialog open={open} onOpenChange={setOpen} entry={edit} />
      <ConfirmDelete open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Excluir registro?" description="O registro e a imagem anexada serão excluídos permanentemente."
        onConfirm={async () => {
          if (del!.image_path) await supabase.storage.from("charts").remove([del!.image_path]);
          const { error } = await supabase.from("chart_entries").delete().eq("id", del!.id);
          if (error) { toast.error("Erro ao excluir."); return; }
          toast.success("Registro excluído.");
          qc.invalidateQueries({ queryKey: ["journal"] });
        }} />
    </>
  );
}

function EntryCard({ e, onEdit, onDelete }: { e: Entry; onEdit: () => void; onDelete: () => void }) {
  const img = useSignedUrl(e.image_path);
  return (
    <div className="panel flex flex-col overflow-hidden">
      {e.image_path && (img.data ? <a href={img.data} target="_blank" rel="noopener noreferrer"><img src={img.data} alt={e.title} className="aspect-video w-full object-cover" /></a> : <div className="aspect-video animate-pulse bg-muted" />)}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium">{e.title}</div>
            <div className="font-mono text-xs text-muted-foreground">{new Date(e.entry_date + "T12:00").toLocaleDateString("pt-BR")}{e.asset && ` · ${e.asset}`}{e.timeframe && ` · ${e.timeframe}`}</div>
          </div>
          <div className="flex">
            <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        </div>
        {e.concept && <p className="text-sm"><span className="text-muted-foreground">Conceito: </span>{e.concept}</p>}
        {e.observation && <p className="line-clamp-3 text-sm text-muted-foreground">{e.observation}</p>}
        {e.hypothesis && <p className="text-sm"><span className="text-muted-foreground">Hipótese: </span>{e.hypothesis}</p>}
        {e.outcome && <p className="text-sm"><span className="text-muted-foreground">Depois: </span>{e.outcome}</p>}
        {e.conclusion && <p className="text-sm"><span className="text-success">Aprendizado: </span>{e.conclusion}</p>}
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {e.risk_regime && <Badge variant="outline">{RISK[e.risk_regime]}</Badge>}
          {e.tags.map((t) => <Badge key={t} variant="secondary">#{t}</Badge>)}
        </div>
      </div>
    </div>
  );
}

const TEXT_FIELDS = [
  ["market_context", "Contexto de mercado"], ["observation", "Descrição do que observei"],
  ["day_high_low", "Máxima e mínima do dia"], ["poc", "POC"], ["adjustment", "Ajuste"],
  ["support_resistance", "Suporte e resistência"], ["attention_zones", "Regiões de atenção"],
  ["macro_context", "Contexto macroeconômico"], ["hypothesis", "Hipótese de compra ou venda"],
  ["outcome", "O que aconteceu depois da análise"], ["conclusion", "Conclusão e aprendizado (avalie critérios e limitações)"],
] as const;

type Form = Record<string, string>;

function EntryDialog({ open, onOpenChange, entry }: { open: boolean; onOpenChange: (o: boolean) => void; entry: Entry | null }) {
  const qc = useQueryClient();
  const { user } = useRouteContext({ from: "/_authenticated" });
  const mods = useQuery(modulesQuery());
  const lessons = useQuery(allLessonsQuery());
  const [f, setF] = useState<Form>({});
  const [file, setFile] = useState<File | null>(null);
  const [removeImg, setRemoveImg] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const e = entry as unknown as Record<string, unknown> | null;
    const base: Form = { entry_date: toISODate(new Date()) };
    if (e) for (const [k, v] of Object.entries(e)) base[k] = v == null ? "" : Array.isArray(v) ? v.join(", ") : String(v);
    setF(base); setFile(null); setRemoveImg(false);
  }, [open, entry]);

  const set = (k: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: ev.target.value }));
  const v = (k: string) => f[k] ?? "";

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    if (busy) return;
    if (!v("title").trim()) { toast.error("Informe o título."); return; }
    if (file && (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)) { toast.error("Envie uma imagem de até 10 MB."); return; }
    setBusy(true);
    let image_path = entry?.image_path ?? null;
    if (file) {
      const ext = (file.name.split(".").pop() ?? "png").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "png";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("charts").upload(path, file, { contentType: file.type });
      if (up.error) { setBusy(false); toast.error("Falha ao enviar a imagem."); return; }
      if (image_path) await supabase.storage.from("charts").remove([image_path]);
      image_path = path;
    } else if (removeImg && image_path) {
      await supabase.storage.from("charts").remove([image_path]);
      image_path = null;
    }
    const opt = (k: string) => v(k).trim() || null;
    const payload = {
      title: v("title").trim().slice(0, 200), entry_date: v("entry_date") || toISODate(new Date()),
      asset: opt("asset"), timeframe: opt("timeframe"), concept: opt("concept"),
      lesson_id: v("lesson_id") || null, module_id: v("module_id") || null,
      risk_regime: v("risk_regime") || null, image_path,
      tags: v("tags").split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean).slice(0, 20),
      ...Object.fromEntries(TEXT_FIELDS.map(([k]) => [k, opt(k)])),
    };
    const { error } = entry
      ? await supabase.from("chart_entries").update(payload).eq("id", entry.id)
      : await supabase.from("chart_entries").insert(payload);
    setBusy(false);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success(entry ? "Registro atualizado." : "Registro criado.");
    qc.invalidateQueries({ queryKey: ["journal"] });
    onOpenChange(false);
  }

  const none = "__none";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <form onSubmit={save} className="space-y-4">
          <DialogHeader><DialogTitle>{entry ? "Editar registro" : "Novo registro"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2"><Label>Título *</Label><Input value={v("title")} onChange={set("title")} maxLength={200} /></div>
            <div className="space-y-1"><Label>Data</Label><Input type="date" value={v("entry_date")} onChange={set("entry_date")} /></div>
            <div className="space-y-1"><Label>Ativo / mercado</Label><Input value={v("asset")} onChange={set("asset")} placeholder="WIN, WDO..." /></div>
            <div className="space-y-1"><Label>Timeframe</Label><Input value={v("timeframe")} onChange={set("timeframe")} placeholder="5 min, 60 min, diário..." /></div>
            <div className="space-y-1"><Label>Conceito estudado</Label><Input value={v("concept")} onChange={set("concept")} /></div>
            <div className="space-y-1">
              <Label>Módulo relacionado</Label>
              <Select value={v("module_id") || none} onValueChange={(x) => setF((p) => ({ ...p, module_id: x === none ? "" : x }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={none}>Nenhum</SelectItem>{(mods.data ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Aula relacionada</Label>
              <Select value={v("lesson_id") || none} onValueChange={(x) => setF((p) => ({ ...p, lesson_id: x === none ? "" : x }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={none}>Nenhuma</SelectItem>{(lessons.data ?? []).filter((l) => !v("module_id") || l.module_id === v("module_id")).map((l) => <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cenário</Label>
              <Select value={v("risk_regime") || none} onValueChange={(x) => setF((p) => ({ ...p, risk_regime: x === none ? "" : x }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={none}>Não informado</SelectItem>{Object.entries(RISK).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Tags (separadas por vírgula)</Label><Input value={v("tags")} onChange={set("tags")} /></div>
          </div>
          {TEXT_FIELDS.map(([k, label]) => (
            <div key={k} className="space-y-1"><Label>{label}</Label><Textarea rows={2} value={v(k)} onChange={set(k)} /></div>
          ))}
          <div className="space-y-1">
            <Label>Captura do gráfico (privada)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {entry?.image_path && !file && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={removeImg} onChange={(e) => setRemoveImg(e.target.checked)} /> Remover imagem atual
              </label>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

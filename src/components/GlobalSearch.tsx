import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Hit = { id: string; label: string; sub?: string; go: () => void };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const navigate = useNavigate();

  useEffect(() => { const t = setTimeout(() => setDq(q), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const term = dq.replace(/[%,()]/g, " ").trim();
  const res = useQuery({
    queryKey: ["globalSearch", term],
    enabled: open && term.length >= 2,
    queryFn: async () => {
      const like = `%${term}%`;
      const [m, l, n, d, j] = await Promise.all([
        supabase.from("modules").select("id,title").ilike("title", like).limit(5),
        supabase.from("lessons").select("id,title").ilike("title", like).limit(8),
        supabase.from("lesson_notes").select("lesson_id,summary,free_notes,practical,lessons(title)")
          .or(["free_notes", "summary", "doubts_text", "practical"].map((c) => `${c}.ilike.${like}`).join(",")).limit(8),
        supabase.from("doubts").select("id,question,lesson_id").or(`question.ilike.${like},answer.ilike.${like}`).limit(8),
        supabase.from("chart_entries").select("id,title,asset").or(["title", "concept", "observation", "conclusion", "hypothesis"].map((c) => `${c}.ilike.${like}`).join(",")).limit(8),
      ]);
      const close = () => setOpen(false);
      const groups: { name: string; hits: Hit[] }[] = [
        { name: "Módulos", hits: (m.data ?? []).map((x) => ({ id: x.id, label: x.title, go: () => { close(); navigate({ to: "/modules/$moduleId", params: { moduleId: x.id } }); } })) },
        { name: "Aulas", hits: (l.data ?? []).map((x) => ({ id: x.id, label: x.title, go: () => { close(); navigate({ to: "/lessons/$lessonId", params: { lessonId: x.id } }); } })) },
        { name: "Anotações, resumos e aplicações", hits: (n.data ?? []).map((x) => ({ id: x.lesson_id, label: (x.lessons as { title: string } | null)?.title ?? "Aula", sub: (x.summary || x.free_notes || x.practical).slice(0, 90), go: () => { close(); navigate({ to: "/lessons/$lessonId", params: { lessonId: x.lesson_id } }); } })) },
        { name: "Dúvidas", hits: (d.data ?? []).map((x) => ({ id: x.id, label: x.question, go: () => { close(); if (x.lesson_id) navigate({ to: "/lessons/$lessonId", params: { lessonId: x.lesson_id } }); else navigate({ to: "/doubts" }); } })) },
        { name: "Diário de gráficos", hits: (j.data ?? []).map((x) => ({ id: x.id, label: x.title, sub: x.asset ?? undefined, go: () => { close(); navigate({ to: "/journal" }); } })) },
      ];
      return groups.filter((g) => g.hits.length);
    },
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2 text-muted-foreground">
        <Search className="h-4 w-4" /><span className="hidden lg:inline">Buscar</span><kbd className="hidden font-mono text-[10px] lg:inline">Ctrl K</kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="sr-only">Busca global</DialogTitle>
          <Input autoFocus placeholder="Buscar módulos, aulas, anotações, dúvidas, diário..." value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="max-h-[60vh] space-y-4 overflow-y-auto">
            {term.length < 2 ? <p className="text-sm text-muted-foreground">Digite ao menos 2 caracteres.</p>
              : res.isLoading ? <p className="text-sm text-muted-foreground">Buscando...</p>
              : (res.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum resultado.</p>
              : res.data!.map((g) => (
                <div key={g.name}>
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.name}</div>
                  {g.hits.map((h, i) => (
                    <button key={h.id + i} onClick={h.go} className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent">
                      <div className="truncate">{h.label}</div>
                      {h.sub && <div className="truncate text-xs text-muted-foreground">{h.sub}</div>}
                    </button>
                  ))}
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

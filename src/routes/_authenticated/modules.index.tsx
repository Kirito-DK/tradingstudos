import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { allLessonsQuery, modulesQuery, type Module } from "@/lib/data";
import { progressPercent } from "@/lib/progress";
import { moveItem } from "@/lib/reorder";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, ProgressBar } from "@/components/common";
import { ModuleDialog } from "@/components/forms";
import { ConfirmDelete } from "@/components/ConfirmDelete";

export const Route = createFileRoute("/_authenticated/modules/")({
  head: () => ({ meta: [{ title: "Meus módulos — TradeStudy" }] }),
  component: ModulesPage,
});

function ModulesPage() {
  const qc = useQueryClient();
  const mods = useQuery(modulesQuery());
  const lessons = useQuery(allLessonsQuery());
  const [edit, setEdit] = useState<Module | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [del, setDel] = useState<Module | null>(null);
  const [moving, setMoving] = useState(false);

  const list = mods.data ?? [];
  const ids = list.map((m) => m.id);

  async function move(i: number, dir: -1 | 1) {
    setMoving(true);
    try {
      await moveItem("modules", ids, i, dir);
      await qc.invalidateQueries({ queryKey: ["modules"] });
    } catch {
      toast.error("Não foi possível reordenar.");
    } finally {
      setMoving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Meus módulos"
        subtitle="Organize o curso em módulos e aulas."
        actions={<Button onClick={() => { setEdit(null); setFormOpen(true); }}><Plus className="mr-1 h-4 w-4" />Novo módulo</Button>}
      />
      {mods.isLoading ? (
        <LoadingBlock />
      ) : mods.error ? (
        <ErrorBlock error={mods.error} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8" />}
          title="Nenhum módulo ainda"
          text="Crie o primeiro módulo do seu curso para começar a cadastrar aulas."
          action={<Button onClick={() => setFormOpen(true)}><Plus className="mr-1 h-4 w-4" />Criar primeiro módulo</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {list.map((m, i) => {
            const ls = (lessons.data ?? []).filter((l) => l.module_id === m.id);
            const done = ls.filter((l) => l.status === "completed").length;
            const pct = progressPercent(done, ls.length);
            return (
              <div key={m.id} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <Link to="/modules/$moduleId" params={{ moduleId: m.id }} className="min-w-0 flex-1">
                  <h2 className="truncate font-medium hover:text-primary">{m.title}</h2>
                  {m.description && <p className="truncate text-sm text-muted-foreground">{m.description}</p>}
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={pct} className="max-w-xs" />
                    <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{done}/{ls.length} · {pct}%</span>
                  </div>
                </Link>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={moving || i === 0} onClick={() => move(i, -1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" disabled={moving || i === list.length - 1} onClick={() => move(i, 1)} aria-label="Descer"><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEdit(m); setFormOpen(true); }} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDel(m)} aria-label="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ModuleDialog open={formOpen} onOpenChange={setFormOpen} module={edit} nextPosition={list.length} />
      <ConfirmDelete
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title={`Excluir "${del?.title ?? ""}"?`}
        description="Todas as aulas deste módulo, com suas anotações, dúvidas e revisões, também serão excluídas permanentemente. Esta ação não pode ser desfeita."
        onConfirm={async () => {
          const { error } = await supabase.from("modules").delete().eq("id", del!.id);
          if (error) { toast.error("Não foi possível excluir."); return; }
          toast.success("Módulo excluído.");
          qc.invalidateQueries({ queryKey: ["modules"] });
          qc.invalidateQueries({ queryKey: ["lessons"] });
        }}
      />
    </>
  );
}

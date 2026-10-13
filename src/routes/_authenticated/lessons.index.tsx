import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { allLessonsQuery, modulesQuery } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorBlock, LoadingBlock, PageHeader, StatusBadge } from "@/components/common";

export const Route = createFileRoute("/_authenticated/lessons/")({
  head: () => ({ meta: [{ title: "Todas as aulas — TradeStudy" }] }),
  component: LessonsPage,
});

function LessonsPage() {
  const mods = useQuery(modulesQuery());
  const lq = useQuery(allLessonsQuery());
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  if (mods.isLoading || lq.isLoading) return <LoadingBlock />;
  if (mods.error || lq.error) return <ErrorBlock error={mods.error ?? lq.error} />;
  const modName = new Map((mods.data ?? []).map((m) => [m.id, m.title]));
  const modPos = new Map((mods.data ?? []).map((m, i) => [m.id, i]));
  const list = (lq.data ?? [])
    .filter((l) => (status === "all" || l.status === status) && l.title.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (modPos.get(a.module_id)! - modPos.get(b.module_id)!) || a.position - b.position);

  return (
    <>
      <PageHeader title="Todas as aulas" subtitle={`${lq.data?.length ?? 0} aulas cadastradas`} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Buscar aula..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="not_started">Não iniciadas</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<PlayCircle className="h-8 w-8" />} title="Nenhuma aula encontrada" text="Cadastre aulas dentro de um módulo." action={<Link to="/modules" className="text-primary">Ir para módulos</Link>} />
      ) : (
        <div className="grid gap-2">
          {list.map((l) => (
            <Link key={l.id} to="/lessons/$lessonId" params={{ lessonId: l.id }} className="panel flex flex-wrap items-center gap-3 p-3 hover:border-primary/50">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{l.title}</div>
                <div className="truncate text-xs text-muted-foreground">{modName.get(l.module_id)}</div>
              </div>
              <StatusBadge status={l.status} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lesson, Module } from "@/lib/data";
import { parseYouTubeId } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ModuleDialog({
  open,
  onOpenChange,
  module,
  nextPosition,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  module?: Module | null;
  nextPosition: number;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(module?.title ?? "");
      setDescription(module?.description ?? "");
    }
  }, [open, module]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const t = title.trim();
    if (!t) return toast.error("Informe o título do módulo.");
    setBusy(true);
    const payload = { title: t, description: description.trim() || null };
    const { error } = module
      ? await supabase.from("modules").update(payload).eq("id", module.id)
      : await supabase.from("modules").insert({ ...payload, position: nextPosition });
    setBusy(false);
    if (error) return toast.error("Não foi possível salvar o módulo.");
    toast.success(module ? "Módulo atualizado." : "Módulo criado.");
    qc.invalidateQueries({ queryKey: ["modules"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{module ? "Editar módulo" : "Novo módulo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="mt">Título *</Label>
            <Input id="mt" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Análise técnica" autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="md">Descrição</Label>
            <Textarea id="md" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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

export function LessonDialog({
  open,
  onOpenChange,
  lesson,
  moduleId,
  nextPosition,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lesson?: Lesson | null;
  moduleId: string;
  nextPosition: number;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", description: "", youtube_url: "", quick_notes: "", duration: "", status: "not_started" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open)
      setF({
        title: lesson?.title ?? "",
        description: lesson?.description ?? "",
        youtube_url: lesson?.youtube_url ?? "",
        quick_notes: lesson?.quick_notes ?? "",
        duration: lesson?.duration_minutes?.toString() ?? "",
        status: lesson?.status ?? "not_started",
      });
  }, [open, lesson]);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const title = f.title.trim();
    if (!title) return toast.error("Informe o título da aula.");
    const url = f.youtube_url.trim();
    if (url && !parseYouTubeId(url)) return toast.error("Link do YouTube inválido.");
    const duration = f.duration.trim() ? Number(f.duration) : null;
    if (duration !== null && (!Number.isInteger(duration) || duration < 0))
      return toast.error("Duração deve ser um número inteiro de minutos.");
    setBusy(true);
    const payload = {
      title,
      description: f.description.trim() || null,
      youtube_url: url || null,
      quick_notes: f.quick_notes.trim() || null,
      duration_minutes: duration,
      status: f.status,
      completed_at: f.status === "completed" ? (lesson?.completed_at ?? new Date().toISOString()) : null,
    };
    const { error } = lesson
      ? await supabase.from("lessons").update(payload).eq("id", lesson.id)
      : await supabase.from("lessons").insert({ ...payload, module_id: moduleId, position: nextPosition });
    setBusy(false);
    if (error) return toast.error("Não foi possível salvar a aula.");
    toast.success(lesson ? "Aula atualizada." : "Aula criada.");
    qc.invalidateQueries({ queryKey: ["lessons"] });
    if (lesson) qc.invalidateQueries({ queryKey: ["lesson", lesson.id] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{lesson ? "Editar aula" : "Nova aula"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="lt">Título *</Label>
            <Input id="lt" value={f.title} maxLength={200} onChange={set("title")} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lu">Link do YouTube (opcional)</Label>
            <Input id="lu" value={f.youtube_url} onChange={set("youtube_url")} placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ld">Descrição</Label>
            <Textarea id="ld" value={f.description} onChange={set("description")} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lq">Observações rápidas</Label>
            <Textarea id="lq" value={f.quick_notes} onChange={set("quick_notes")} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ldu">Duração (min)</Label>
              <Input id="ldu" inputMode="numeric" value={f.duration} onChange={set("duration")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={(v) => setF((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Não iniciada</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

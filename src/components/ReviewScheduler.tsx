import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Lesson } from "@/lib/data";
import { QUICK_REVIEWS, REVIEW_STATUS_LABEL, addDaysISO } from "@/lib/review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Schedule / complete a review for a lesson. Never completes automatically. */
export function ReviewScheduler({ lesson, onDone }: { lesson: Lesson; onDone?: () => void }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(lesson.next_review_at ?? "");
  const [note, setNote] = useState(lesson.review_note ?? "");
  const [status, setStatus] = useState(lesson.review_status ?? "pending");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["lessons"] });
    qc.invalidateQueries({ queryKey: ["lesson", lesson.id] });
    qc.invalidateQueries({ queryKey: ["reviewLogs"] });
  };

  async function schedule(d: string) {
    if (busy) return;
    setBusy(true);
    const st = status === "reviewed" ? "pending" : status;
    const { error } = await supabase.from("lessons").update({
      next_review_at: d || null, review_note: note.trim() || null, review_status: st, needs_review: true,
    }).eq("id", lesson.id);
    setBusy(false);
    if (error) { toast.error("Não foi possível agendar."); return; }
    setDate(d); setStatus(st);
    toast.success(d ? `Revisão agendada para ${new Date(d + "T12:00").toLocaleDateString("pt-BR")}.` : "Revisão marcada.");
    refresh();
  }

  async function complete() {
    if (busy) return;
    setBusy(true);
    const now = new Date().toISOString();
    const log = await supabase.from("review_logs").insert({ lesson_id: lesson.id, note: note.trim() || null });
    const upd = log.error ? log : await supabase.from("lessons").update({
      review_status: "reviewed", last_reviewed_at: now, next_review_at: null, needs_review: false,
    }).eq("id", lesson.id);
    setBusy(false);
    if (upd.error) { toast.error("Não foi possível concluir a revisão."); return; }
    setStatus("reviewed"); setDate("");
    toast.success("Revisão concluída. Agende a próxima se quiser.");
    refresh();
    onDone?.();
  }

  async function clear() {
    setBusy(true);
    const { error } = await supabase.from("lessons").update({ review_status: null, next_review_at: null, needs_review: false, review_note: null }).eq("id", lesson.id);
    setBusy(false);
    if (error) { toast.error("Erro ao remover."); return; }
    setStatus("pending"); setDate(""); setNote("");
    refresh();
  }

  return (
    <div className="space-y-3 border-t border-warning/30 pt-4">
      <div className="grid gap-2 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-warning">Revisão</h3>
        <span className="text-xs text-muted-foreground">
          {lesson.review_status ? REVIEW_STATUS_LABEL[lesson.review_status] : "Sem revisão agendada"}
          {lesson.next_review_at && ` · ${new Date(lesson.next_review_at + "T12:00").toLocaleDateString("pt-BR")}`}
          {lesson.last_reviewed_at && ` · última: ${new Date(lesson.last_reviewed_at).toLocaleDateString("pt-BR")}`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {QUICK_REVIEWS.map((q) => (
          <Button key={q.days} size="sm" variant="outline" disabled={busy} onClick={() => schedule(addDaysISO(q.days))}>{q.label}</Button>
        ))}
        <Input type="date" className="min-w-0 sm:w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button size="sm" variant="outline" disabled={busy || !date} onClick={() => schedule(date)}>Agendar data</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Textarea rows={2} placeholder="O que preciso relembrar?" value={note} onChange={(e) => setNote(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="later">Revisar depois</SelectItem>
            <SelectItem value="pending">Revisão pendente</SelectItem>
            <SelectItem value="reviewed">Revisada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 sm:flex sm:flex-wrap">
        <Button size="sm" variant="outline" disabled={busy} onClick={() => schedule(date)}>Salvar revisão</Button>
        <Button size="sm" disabled={busy} onClick={complete} className="bg-success text-success-foreground hover:bg-success/90">Concluir revisão</Button>
        {lesson.review_status && <Button size="sm" variant="ghost" disabled={busy} onClick={clear}>Remover</Button>}
      </div>
    </div>
  );
}

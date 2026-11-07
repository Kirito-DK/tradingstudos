export type LessonStatus = "not_started" | "in_progress" | "completed";

export const STATUS_LABEL: Record<LessonStatus, string> = {
  not_started: "Não iniciada",
  in_progress: "Em andamento",
  completed: "Concluída",
};

/** Percent of completed lessons, 0 when there are no lessons (no division by zero). */
export function progressPercent(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

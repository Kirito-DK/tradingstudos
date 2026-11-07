/** Local YYYY-MM-DD for a date. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date `days` days after `from` (default today), as YYYY-MM-DD. */
export function addDaysISO(days: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export const QUICK_REVIEWS = [
  { label: "Amanhã", days: 1 },
  { label: "Em 3 dias", days: 3 },
  { label: "Em 7 dias", days: 7 },
  { label: "Em 30 dias", days: 30 },
] as const;

export type ReviewBucket = "overdue" | "today" | "upcoming" | "done" | "none";

export function reviewBucket(
  l: { next_review_at: string | null; review_status: string | null },
  today: string = toISODate(new Date()),
): ReviewBucket {
  if (l.review_status === "reviewed" && !l.next_review_at) return "done";
  if (!l.next_review_at) return l.review_status ? "upcoming" : "none";
  if (l.next_review_at < today) return "overdue";
  if (l.next_review_at === today) return "today";
  return "upcoming";
}

export const REVIEW_STATUS_LABEL: Record<string, string> = {
  later: "Revisar depois",
  pending: "Revisão pendente",
  reviewed: "Revisada",
};

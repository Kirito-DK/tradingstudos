import { supabase } from "@/integrations/supabase/client";

const TABLES = ["modules", "lessons", "lesson_notes", "doubts", "review_logs", "chart_entries"] as const;

async function fetchAll() {
  const out: Record<string, unknown[]> = {};
  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) throw new Error(error.message);
    out[t] = data ?? [];
  }
  return out;
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = v == null ? "" : Array.isArray(v) ? v.join("; ") : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

const stamp = () => new Date().toISOString().slice(0, 10);

export async function exportJSON() {
  const data = await fetchAll();
  download(`tradestudy-${stamp()}.json`, JSON.stringify({ exported_at: new Date().toISOString(), ...data }, null, 2), "application/json");
}

export async function exportCSV(table: (typeof TABLES)[number]) {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw new Error(error.message);
  download(`tradestudy-${table}-${stamp()}.csv`, "\uFEFF" + toCSV((data ?? []) as Record<string, unknown>[]), "text/csv;charset=utf-8");
}

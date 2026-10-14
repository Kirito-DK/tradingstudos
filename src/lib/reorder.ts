import { supabase } from "@/integrations/supabase/client";

/** Moves item at index by dir (-1 up, +1 down) and rewrites sequential positions. */
export async function moveItem(table: "modules" | "lessons", ids: string[], index: number, dir: -1 | 1) {
  const target = index + dir;
  if (target < 0 || target >= ids.length) return;
  const next = [...ids];
  const a = next[index]!;
  next[index] = next[target]!;
  next[target] = a;
  const results = await Promise.all(
    next.map((id, position) => supabase.from(table).update({ position }).eq("id", id)),
  );
  const err = results.find((r) => r.error);
  if (err?.error) throw new Error(err.error.message);
}

import { get, set, del } from "idb-keyval";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";

const OWNER = "ts-offline-owner-v1";
const key = (id: string) => `ts-offline-data-v1-${id}`;
type Entry = { queryKey: QueryKey; data: unknown; updatedAt: number };
type Snapshot = { user: User; entries: Entry[] };
let owner: User | null = null;
let entries: Entry[] = [];
let stop: (() => void) | undefined;
let writing = Promise.resolve();
const allowed = new Set(["modules", "lessons", "lesson", "notes", "doubts", "reviewLogs"]);
export const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

export function cachedValue(list: Entry[], queryKey: QueryKey): { found: boolean; data?: unknown } {
  const exact = list.find((e) => JSON.stringify(e.queryKey) === JSON.stringify(queryKey));
  if (exact) return { found: true, data: exact.data };
  if (queryKey[0] === "lesson") {
    const all = list.find((e) => e.queryKey[0] === "lessons")?.data;
    const row = Array.isArray(all) ? all.find((l) => l.id === queryKey[1]) : undefined;
    if (row) return { found: true, data: row };
  }
  if (queryKey[0] === "notes" && queryKey.length === 2 && queryKey[1] !== "recent") {
    for (const e of list) {
      const rows = Array.isArray(e.data) ? e.data : [e.data];
      const row = e.queryKey[0] === "notes" ? rows.find((n) => n?.lesson_id === queryKey[1]) : undefined;
      if (row) return { found: true, data: row };
    }
  }
  return { found: false };
}

export async function offlineRead<T>(queryKey: QueryKey, fetcher: () => Promise<T>): Promise<T> {
  if (!isOffline()) return fetcher();
  const result = cachedValue(entries, queryKey);
  if (!result.found) throw new Error("Conteúdo ainda não disponível offline. Abra esta aula ou seção com internet primeiro.");
  return result.data as T;
}

export async function offlineUser(): Promise<User | null> {
  try {
    const id = await get<string>(OWNER);
    if (!id) return null;
    const snapshot = await get<Snapshot>(key(id));
    return snapshot?.user ?? null;
  } catch { return null; }
}

export async function prepareOfflineCache(user: User, qc: QueryClient) {
  if (owner?.id === user.id) return;
  stop?.();
  if (owner && owner.id !== user.id) await clearOfflineCache(qc);
  owner = user;
  const snapshot = await get<Snapshot>(key(user.id)).catch(() => undefined);
  entries = snapshot?.entries ?? [];
  for (const entry of entries) qc.setQueryData(entry.queryKey, entry.data, { updatedAt: entry.updatedAt });
  const persist = () => {
    if (!owner) return;
    const savedOwner = owner;
    entries = qc.getQueryCache().getAll()
      .filter((q) => allowed.has(String(q.queryKey[0])) && q.state.status === "success")
      .map((q) => ({ queryKey: q.queryKey, data: q.state.data, updatedAt: q.state.dataUpdatedAt }));
    const saved = { user: savedOwner, entries: [...entries] };
    writing = writing.then(async () => { await set(key(savedOwner.id), saved); await set(OWNER, savedOwner.id); }).catch(() => undefined);
  };
  stop = qc.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "success") persist();
  });
  persist();
}

export async function clearOfflineCache(qc: QueryClient) {
  stop?.(); stop = undefined;
  const id = owner?.id ?? await get<string>(OWNER).catch(() => undefined);
  owner = null; entries = [];
  await qc.cancelQueries(); qc.clear();
  await writing;
  if (id) await del(key(id));
  await del(OWNER);
  for (const k of Object.keys(localStorage)) if (k.startsWith("ts-draft-")) localStorage.removeItem(k);
}
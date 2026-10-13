import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LessonNotes } from "@/lib/data";

export type NoteFields = { free_notes: string; summary: string; doubts_text: string; practical: string };
export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const EMPTY: NoteFields = { free_notes: "", summary: "", doubts_text: "", practical: "" };
const draftKey = (id: string) => `ts-draft-${id}`;

/**
 * Notes autosave: the database is the source of truth. A local draft is kept only while
 * changes are unsaved (backup for connection failures) and is used on load only if newer.
 */
export function useAutosaveNotes(lessonId: string, server: LessonNotes | null | undefined, loaded: boolean) {
  const [fields, setFields] = useState<NoteFields>(EMPTY);
  const [state, setState] = useState<SaveState>("idle");
  const latest = useRef(fields);
  const version = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const init = useRef(false);

  useEffect(() => {
    if (!loaded || init.current) return;
    init.current = true;
    const base: NoteFields = server
      ? { free_notes: server.free_notes, summary: server.summary, doubts_text: server.doubts_text, practical: server.practical }
      : EMPTY;
    let next = base;
    try {
      const raw = localStorage.getItem(draftKey(lessonId));
      if (raw) {
        const d = JSON.parse(raw) as { at: number; fields: NoteFields };
        const serverAt = server ? new Date(server.updated_at).getTime() : 0;
        if (d.at > serverAt) next = d.fields;
        else localStorage.removeItem(draftKey(lessonId));
      }
    } catch { /* ignore */ }
    latest.current = next;
    setFields(next);
    if (next !== base) setState("dirty");
  }, [loaded, server, lessonId]);

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const v = version.current;
    setState("saving");
    const { error } = await supabase
      .from("lesson_notes")
      .upsert({ lesson_id: lessonId, ...latest.current }, { onConflict: "lesson_id" });
    if (error) { setState("error"); return false; }
    if (v === version.current) {
      localStorage.removeItem(draftKey(lessonId));
      setState("saved");
    } else {
      setState("dirty");
    }
    return true;
  }, [lessonId]);

  const update = useCallback((k: keyof NoteFields, value: string) => {
    version.current++;
    latest.current = { ...latest.current, [k]: value };
    setFields(latest.current);
    setState("dirty");
    try { localStorage.setItem(draftKey(lessonId), JSON.stringify({ at: Date.now(), fields: latest.current })); } catch { /* ignore */ }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { void save(); }, 1200);
  }, [lessonId, save]);

  useEffect(() => {
    const unsaved = state === "dirty" || state === "saving" || state === "error";
    if (!unsaved) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [state]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { fields, update, save, state };
}

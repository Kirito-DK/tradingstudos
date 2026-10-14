import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Module = Tables<"modules">;
export type Lesson = Tables<"lessons">;
export type LessonNotes = Tables<"lesson_notes">;
export type Doubt = Tables<"doubts">;

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const modulesQuery = () =>
  queryOptions({
    queryKey: ["modules"],
    queryFn: async () =>
      check(await supabase.from("modules").select("*").order("position").order("created_at")),
  });

export const allLessonsQuery = () =>
  queryOptions({
    queryKey: ["lessons"],
    queryFn: async () =>
      check(await supabase.from("lessons").select("*").order("position").order("created_at")),
  });

export const lessonQuery = (id: string) =>
  queryOptions({
    queryKey: ["lesson", id],
    queryFn: async (): Promise<Lesson | null> => check(await supabase.from("lessons").select("*").eq("id", id).maybeSingle()),
  });

export const notesQuery = (lessonId: string) =>
  queryOptions({
    queryKey: ["notes", lessonId],
    queryFn: async (): Promise<LessonNotes | null> =>
      check(await supabase.from("lesson_notes").select("*").eq("lesson_id", lessonId).maybeSingle()),
    staleTime: 0,
  });

export const lessonDoubtsQuery = (lessonId: string) =>
  queryOptions({
    queryKey: ["doubts", lessonId],
    queryFn: async () =>
      check(
        await supabase.from("doubts").select("*").eq("lesson_id", lessonId).order("created_at"),
      ),
  });

export const recentNotesQuery = () =>
  queryOptions({
    queryKey: ["notes", "recent"],
    queryFn: async () =>
      check(
        await supabase
          .from("lesson_notes")
          .select("*, lessons(title)")
          .order("updated_at", { ascending: false })
          .limit(5),
      ),
  });

export const openDoubtsCountQuery = () =>
  queryOptions({
    queryKey: ["doubts", "openCount"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("doubts")
        .select("id", { count: "exact", head: true })
        .neq("status", "resolved");
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });

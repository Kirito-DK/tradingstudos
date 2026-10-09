// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { LessonPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({ component: LessonPage });

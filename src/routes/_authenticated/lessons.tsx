// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { LessonsPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/lessons")({ component: LessonsPage });

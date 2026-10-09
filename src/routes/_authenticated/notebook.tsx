// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { NotebookPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/notebook")({ component: NotebookPage });

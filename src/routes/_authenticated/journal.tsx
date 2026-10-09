// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { JournalPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/journal")({ component: JournalPage });

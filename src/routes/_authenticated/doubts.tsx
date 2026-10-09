// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { DoubtsPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/doubts")({ component: DoubtsPage });

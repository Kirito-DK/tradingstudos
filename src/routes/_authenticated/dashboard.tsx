// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

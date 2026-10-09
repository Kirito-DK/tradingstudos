// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { ModulesPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/modules")({ component: ModulesPage });

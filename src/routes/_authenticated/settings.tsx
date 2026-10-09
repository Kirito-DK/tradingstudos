// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

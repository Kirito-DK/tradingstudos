// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { ReviewsPage } from "@/components/StudyPages";
export const Route = createFileRoute("/_authenticated/reviews")({ component: ReviewsPage });

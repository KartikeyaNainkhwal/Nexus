"use client";

import { DashboardError } from "@/components/shared/dashboard-error";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} title="Failed to load projects" />;
}

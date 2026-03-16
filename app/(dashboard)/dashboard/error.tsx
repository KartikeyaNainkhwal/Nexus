"use client";

import { DashboardError } from "@/components/shared/dashboard-error";

export default function DashboardPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} title="Dashboard error" />;
}

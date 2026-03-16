import {
  Skeleton,
  SkeletonCard,
} from "@/components/shared/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div
          className="rounded-xl border border-white/[0.06] p-6 lg:col-span-3 space-y-4"
          style={{ background: "rgba(15,15,26,0.5)" }}
        >
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-[220px] w-full rounded-lg" />
        </div>
        <div
          className="rounded-xl border border-white/[0.06] p-6 lg:col-span-2 flex flex-col items-center justify-center"
          style={{ background: "rgba(15,15,26,0.5)" }}
        >
          <Skeleton className="h-4 w-24 self-start mb-4" />
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
          <div className="flex gap-4 mt-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-14" />
            ))}
          </div>
        </div>
      </div>

      {/* Project progress row */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="min-w-[260px] rounded-xl border border-white/[0.06] p-5 space-y-3"
              style={{ background: "rgba(15,15,26,0.5)" }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-6 w-6 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity + My tasks row */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div
          className="rounded-xl border border-white/[0.06] p-6 lg:col-span-3 space-y-4"
          style={{ background: "rgba(15,15,26,0.5)" }}
        >
          <Skeleton className="h-4 w-28" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-4 w-20" />
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-white/[0.06] px-4 py-3"
              style={{ background: "rgba(15,15,26,0.5)" }}
            >
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

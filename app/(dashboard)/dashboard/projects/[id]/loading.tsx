import { Skeleton } from "@/components/shared/skeleton";

export default function ProjectDetailLoading() {
  return (
    <>
      {/* Back link */}
      <Skeleton className="mb-4 h-4 w-32" />

      {/* Header */}
      <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-8 w-8 rounded-full border-2 border-bg-base"
              />
            ))}
          </div>
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <Skeleton className="h-7 w-7 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-2.5 w-14" />
            </div>
          </div>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, col) => (
          <div
            key={col}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02]"
          >
            {/* Col header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>

            {/* Cards */}
            <div className="space-y-2 p-3">
              {[...Array(col === 0 ? 3 : col === 1 ? 2 : 1)].map((_, j) => (
                <div
                  key={j}
                  className="rounded-lg border border-white/[0.06] p-3 space-y-2"
                  style={{
                    borderLeftWidth: "3px",
                    borderLeftColor: "rgba(255,255,255,0.06)",
                  }}
                >
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <div className="flex items-center gap-2 pt-1">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="ml-auto h-4 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

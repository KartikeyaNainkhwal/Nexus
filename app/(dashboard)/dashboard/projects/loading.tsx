import {
  Skeleton,
  SkeletonPageHeader,
} from "@/components/shared/skeleton";

export default function ProjectsLoading() {
  return (
    <>
      <SkeletonPageHeader />

      {/* Filter bar skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-9 w-56 rounded-lg" />
      </div>

      {/* Project grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-white/[0.06]"
            style={{ background: "rgba(15,15,26,0.5)" }}
          >
            {/* Accent bar */}
            <Skeleton className="h-1 w-full rounded-none" />

            <div className="p-5 space-y-4">
              {/* Emoji + name + desc */}
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>

              {/* Tasks + avatars */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20" />
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, j) => (
                    <Skeleton
                      key={j}
                      className="h-6 w-6 rounded-full border-2 border-bg-base"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

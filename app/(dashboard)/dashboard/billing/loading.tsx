import {
  Skeleton,
  SkeletonPageHeader,
} from "@/components/shared/skeleton";

export default function BillingLoading() {
  return (
    <>
      <SkeletonPageHeader />

      {/* Current plan card */}
      <div
        className="rounded-xl border border-white/[0.06] p-6 mb-6 space-y-4"
        style={{ background: "rgba(15,15,26,0.5)" }}
      >
        <Skeleton className="h-5 w-28" />
        <div className="flex items-end gap-1">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-64" />
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>

      {/* Pricing cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] p-6 space-y-4"
            style={{ background: "rgba(15,15,26,0.5)" }}
          >
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-24" />
            <div className="space-y-2 pt-2">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </>
  );
}

import {
  Skeleton,
  SkeletonPageHeader,
} from "@/components/shared/skeleton";

export default function MembersLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <div className="rounded-xl border border-white/[0.06] overflow-hidden" style={{ background: "rgba(15,15,26,0.5)" }}>
        {/* Header */}
        <div className="flex gap-4 border-b border-white/[0.06] px-6 py-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        {/* Rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] px-6 py-4 last:border-b-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </>
  );
}

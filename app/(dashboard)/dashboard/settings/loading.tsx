import {
  Skeleton,
  SkeletonPageHeader,
} from "@/components/shared/skeleton";

export default function SettingsLoading() {
  return (
    <>
      <SkeletonPageHeader />

      {/* Settings sections */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] p-6 mb-6 space-y-5"
          style={{ background: "rgba(15,15,26,0.5)" }}
        >
          <Skeleton className="h-5 w-32" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}

import {
  SkeletonPageHeader,
  SkeletonTable,
} from "@/components/shared/skeleton";

export default function TasksLoading() {
  return (
    <>
      <SkeletonPageHeader />
      <SkeletonTable rows={8} />
    </>
  );
}

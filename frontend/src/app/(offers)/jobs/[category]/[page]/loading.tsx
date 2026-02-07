import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for the job feed only (posts list). Layout/sidebars stay visible. */
function JobPostSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b px-4 py-4 space-y-2">
        <Skeleton className="h-5 w-3/4 max-w-sm rounded-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <div className="flex flex-wrap gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <div className="pt-2">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export default function OffersLoading() {
  return (
    <div className="min-w-0 lg:w-3/5 pt-4 lg:pt-14 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <JobPostSkeleton key={i} />
      ))}
    </div>
  );
}

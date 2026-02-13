/**
 * Skeleton for "Moje" section pages (title + list of job-like cards).
 */
import { Skeleton } from '@/components/ui/skeleton';

function JobCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b px-4 py-4 space-y-2">
        <Skeleton className="h-5 w-3/4 max-w-sm rounded-md" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
      </div>
      <div className="px-4 py-4 space-y-3">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <div className="pt-2">
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function MyPageSkeleton() {
  return (
    <div className="w-full">
      <Skeleton className="h-8 w-48 rounded-md mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

function DetailRowSkeleton() {
  return (
    <div className="flex gap-3 items-start">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>
    </div>
  );
}

export default function JobDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-6">
        {/* Main content - col-span-4 */}
        <div className="lg:col-span-4 space-y-6">
          {/* Title block */}
          <div className="space-y-4">
            <div>
              <Skeleton className="h-10 w-3/4 rounded-md" />
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>

          {/* Meta rows (visible on mobile as block lg:hidden; on desktop sidebar below) */}
          <section className="block lg:hidden space-y-6 border-t pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <DetailRowSkeleton key={i} />
            ))}
          </section>

          {/* Skills row */}
          <section>
            <div className="flex gap-3 items-start">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-16 rounded-md mb-2" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-16 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <div className="flex gap-3 items-start mb-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </div>
            </div>
          </section>

          {/* Applications */}
          <section className="border-t pt-6 space-y-4">
            <div className="flex gap-3 items-start">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-40 rounded-md mb-3" />
                <ul className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <li key={i}>
                      <div className="rounded-lg border p-4 flex flex-wrap items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-28 rounded-md" />
                          <Skeleton className="h-3 w-36 rounded-md" />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar - col-span-2, hidden on mobile */}
        <aside className="hidden lg:block lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <DetailRowSkeleton key={i} />
          ))}
        </aside>
      </div>

      {/* Prev/next */}
      <section className="mt-10 border-t pt-6">
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg border bg-muted/30 p-4 space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-5 w-full rounded-md" />
          </div>
          <div className="flex-1 rounded-lg border bg-muted/30 p-4 space-y-2">
            <Skeleton className="h-4 w-16 rounded-md ml-auto" />
            <Skeleton className="h-5 w-full rounded-md" />
          </div>
        </div>
      </section>
    </div>
  );
}

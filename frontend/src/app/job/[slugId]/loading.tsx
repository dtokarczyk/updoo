import { Skeleton } from '@/components/ui/skeleton';

export default function ListingDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-4 sm:px-6 sm:py-5 space-y-3">
          <Skeleton className="h-6 w-2/3 rounded-md" />
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
        </div>
        <div className="px-4 py-6 sm:px-6 sm:py-7 space-y-7">
          <section className="space-y-3">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <Skeleton className="h-3 w-24 rounded-md" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-16 rounded-full" />
              ))}
            </div>
          </section>

          <section className="border-t pt-6 space-y-3">
            <Skeleton className="h-3 w-32 rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </section>
        </div>
      </div>
    </div>
  );
}

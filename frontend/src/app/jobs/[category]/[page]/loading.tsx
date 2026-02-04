import { Skeleton } from "@/components/ui/skeleton";

export default function OffersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
        {/* Sidebar skeleton */}
        <aside className="z-10 shrink-0 lg:sticky lg:top-14 lg:self-start lg:w-1/5">
          <div className="hidden lg:flex items-center justify-between pb-4">
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-5 flex-1 rounded-md" />
              </div>
            ))}
          </div>
        </aside>

        {/* Listings header + list skeleton */}
        <section className="min-w-0 lg:w-3/5 pt-0 lg:pt-14 space-y-6">
          {/* Hero image skeleton (for homepage) */}
          <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-xl overflow-hidden">
            <Skeleton className="h-full w-full rounded-xl" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border bg-card shadow-sm"
              >
                <div className="border-b px-4 py-4">
                  <Skeleton className="h-5 w-48 rounded-md" />
                  <div className="mt-2 flex gap-3">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                </div>
                <div className="px-4 py-4 space-y-3">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Skeleton className="h-10 rounded-md" />
                    <Skeleton className="h-10 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 3 }).map((__, j) => (
                      <Skeleton key={j} className="h-7 w-16 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-10 w-32 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right sidebar promo skeleton (only on desktop, when not logged in) */}
        <aside className="sticky top-0 z-10 hidden shrink-0 lg:top-14 lg:block lg:self-start lg:w-1/5">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-3">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <div className="pt-2 space-y-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


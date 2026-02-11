'use client';

import { useState } from 'react';
import { JobPost } from '@/app/components/JobPost';
import type { Job } from '@/lib/api';

export function MyFavoritesList({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobPost
          key={job.id}
          job={job}
          showFavorite
          onFavoriteToggle={(jobId) =>
            setJobs((prev) => prev.filter((j) => j.id !== jobId))
          }
          headerAction={
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {job.category.name}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {job.language === 'ENGLISH' ? 'English' : 'Polish'}
              </span>
            </div>
          }
        />
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getFavoritesJobs, getToken, type Job } from "@/lib/api";
import { JobPost } from "@/app/components/JobPost";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    getFavoritesJobs()
      .then(setJobs)
      .catch(() => setError("Nie udało się załadować ulubionych"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadFavorites();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center text-muted-foreground">
        Ładowanie ulubionych...
      </div>
    );
  }


  if (jobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed">
          Nie masz jeszcze zapisanych ogłoszeń. Kliknij gwiazdkę przy ofercie, aby dodać ją do ulubionych.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Ulubione ogłoszenia</h1>
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
                  {job.language === "ENGLISH" ? "English" : "Polish"}
                </span>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

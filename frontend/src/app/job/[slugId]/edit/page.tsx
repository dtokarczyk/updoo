"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getStoredUser,
  getJob,
  updateJob,
  type Job,
} from "@/lib/api";
import { jobPath, parseJobSlugId } from "@/lib/job-url";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/hooks/useTranslations";
import { JobForm } from "@/app/components/JobForm";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslations();
  const slugId = typeof params?.slugId === "string" ? params.slugId : "";
  const id = parseJobSlugId(slugId);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    const isAdmin = user.accountType === "ADMIN";
    if (!isAdmin && user.accountType !== "CLIENT") {
      router.replace("/");
      return;
    }
    if (!id) {
      setLoading(false);
      setError("Brak ID ogłoszenia");
      return;
    }
    getJob(id)
      .then((listing) => {
        if (!isAdmin && listing.authorId !== user.id) {
          setError("Możesz edytować tylko swoje ogłoszenia");
          setLoading(false);
          return;
        }
        setJob(listing);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nie udało się załadować ogłoszenia"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (data: Parameters<typeof updateJob>[1]) => {
    if (!id || !job) return;
    const updated = await updateJob(id, data);
    router.push(jobPath(updated));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <main className="max-w-4xl mx-auto text-center text-muted-foreground">
          {t("common.loading")}
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <main className="max-w-4xl mx-auto text-center text-red-600 dark:text-red-400">
          {error || "Nie udało się załadować ogłoszenia"}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <main className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{t("jobs.editJob")}</CardTitle>
            <CardDescription>
              {t("jobs.editJobDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobForm mode="edit" initialData={job} onSubmit={handleSubmit} loading={loading} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

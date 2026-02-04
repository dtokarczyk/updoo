"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createJob, getStoredUser, saveDraftJob, getDraftJob, clearDraftJob } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/hooks/useTranslations";
import { JobForm } from "@/app/components/JobForm";
import type { CreateJobPayload } from "@/lib/api";

export default function NewListingPage() {
  const router = useRouter();
  const { t } = useTranslations();

  useEffect(() => {
    const user = getStoredUser();
    // Only redirect if user is logged in but not a CLIENT
    if (user && user.accountType !== "CLIENT") {
      router.replace("/");
      return;
    }
  }, [router]);

  const handleSubmit = async (data: CreateJobPayload) => {
    const user = getStoredUser();

    // If user is not logged in, save to localStorage and redirect to login
    if (!user || user.accountType !== "CLIENT") {
      saveDraftJob(data);
      router.push("/login?returnUrl=/job/new&hasDraft=true");
      return;
    }

    // User is logged in, create the job
    await createJob(data);
    // Clear draft after successful creation
    clearDraftJob();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <main className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{t("jobs.newJobForm.title")}</CardTitle>
            <CardDescription>
              {t("jobs.newJobForm.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobForm mode="create" onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

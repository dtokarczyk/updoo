"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createJob, getStoredUser } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslations } from "@/hooks/useTranslations";
import { JobForm } from "@/app/components/JobForm";

export default function NewListingPage() {
  const router = useRouter();
  const { t } = useTranslations();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.accountType !== "CLIENT") {
      router.replace("/");
      return;
    }
  }, [router]);

  const handleSubmit = async (data: Parameters<typeof createJob>[0]) => {
    await createJob(data);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
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

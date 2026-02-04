"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getStoredUser,
  updateProfile,
  updateStoredUser,
  needsOnboarding,
  type AccountType,
} from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";

const STEP_NAME = 1;
const STEP_ACCOUNT_TYPE = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [step, setStep] = useState(STEP_NAME);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const user = typeof window !== "undefined" ? getStoredUser() : null;

  useEffect(() => {
    if (user === null) {
      router.replace("/login");
      return;
    }
    if (!needsOnboarding(user)) {
      router.replace("/");
      return;
    }
    if (user.name != null) {
      setName(user.name);
      setStep(STEP_ACCOUNT_TYPE);
    }
    if (user.surname != null) {
      setSurname(user.surname);
    }
    if (user.accountType != null) {
      setAccountType(user.accountType);
    }
  }, [user?.id, user?.name, user?.surname, user?.accountType, router]);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: updated } = await updateProfile({
        name: name.trim() || undefined,
        surname: surname.trim() || undefined,
      });
      updateStoredUser(updated);
      setStep(STEP_ACCOUNT_TYPE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("onboarding.saveFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user: updated } = await updateProfile({
        accountType: accountType || undefined,
      });
      updateStoredUser(updated);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("onboarding.saveFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  if (user === null) {
    return null;
  }

  if (!needsOnboarding(user) && user.name != null && user.accountType != null) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        {step === STEP_NAME && (
          <>
            <CardHeader>
              <CardTitle>{t("onboarding.whatShouldWeCallYou")}</CardTitle>
              <CardDescription>
                {t("onboarding.enterNameSurname")}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleNameSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("auth.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="given-name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">{t("auth.surname")}</Label>
                  <Input
                    id="surname"
                    type="text"
                    placeholder={t("auth.surname")}
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    autoComplete="family-name"
                    disabled={loading}
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("onboarding.saving") : t("common.continue")}
                </Button>
              </CardFooter>
            </form>
          </>
        )}

        {step === STEP_ACCOUNT_TYPE && (
          <>
            <CardHeader>
              <CardTitle>{t("onboarding.chooseAccountType")}</CardTitle>
              <CardDescription>
                {t("onboarding.chooseAccountTypeDesc")}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAccountTypeSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="accountType">
                    {t("onboarding.chooseAccountType")}
                  </Label>
                  <select
                    id="accountType"
                    value={accountType}
                    onChange={(e) =>
                      setAccountType((e.target.value || "") as AccountType | "")
                    }
                    disabled={loading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      — {t("common.select") ?? "Select"} —
                    </option>
                    <option value="CLIENT">{t("onboarding.client")}</option>
                    <option value="FREELANCER">
                      {t("onboarding.freelancer")}
                    </option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                  onClick={() => setStep(STEP_NAME)}
                >
                  {t("common.back")}
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? t("onboarding.saving") : t("common.continue")}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

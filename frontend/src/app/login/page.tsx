"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { login as apiLogin, setAuth, needsOnboarding, getDraftJob } from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [showDraftAfterLoginModal, setShowDraftAfterLoginModal] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const draft = getDraftJob();
    if (draft) {
      setHasDraft(true);
      // Show modal when there's a draft in localStorage
      setShowDraftModal(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setAuth(data);

      // Check if user is CLIENT and has draft - show modal to continue editing
      const draft = getDraftJob();
      if (data.user.accountType === "CLIENT" && draft) {
        setLoading(false);
        setShowDraftAfterLoginModal(true);
        return;
      }

      // Check for returnUrl parameter
      const returnUrl = searchParams.get("returnUrl");
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push(needsOnboarding(data.user) ? "/onboarding" : "/");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex justify-center p-4 pt-12">
        <div className="w-full max-w-md space-y-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-3xl">{t("auth.login")}</CardTitle>
              <CardDescription>{t("auth.enterEmailPassword")}</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                    disabled={loading}
                    className="h-12 text-base px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-12 text-base px-4"
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-6 flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("auth.signingIn") : t("auth.logIn")}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mt-2 space-y-4">
              <h2 className="text-xl font-semibold">{t("auth.dontHaveAccount")}</h2>
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link href="/register">{t("auth.register")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal informing about draft job before login */}
      <Dialog open={showDraftModal} onOpenChange={setShowDraftModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("jobs.draftModal.beforeLoginTitle")}</DialogTitle>
            <DialogDescription>
              {t("jobs.draftModal.beforeLoginDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowDraftModal(false)}
              className="w-full sm:w-auto"
            >
              {t("common.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal after login asking if user wants to continue editing */}
      <Dialog open={showDraftAfterLoginModal} onOpenChange={setShowDraftAfterLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("jobs.draftModal.afterLoginTitle")}</DialogTitle>
            <DialogDescription>
              {t("jobs.draftModal.afterLoginDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDraftAfterLoginModal(false);
                const returnUrl = searchParams.get("returnUrl");
                if (returnUrl) {
                  router.push(returnUrl);
                } else {
                  router.push("/");
                }
                router.refresh();
              }}
              className="w-full sm:w-auto"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setShowDraftAfterLoginModal(false);
                router.push("/job/new");
                router.refresh();
              }}
              className="w-full sm:w-auto"
            >
              {t("jobs.draftModal.continueEditing")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center p-4 pt-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

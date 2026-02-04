"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { register as apiRegister, setAuth } from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("auth.passwordsMustMatch"));
      return;
    }
    if (!termsAccepted) {
      setError(t("auth.mustAcceptTerms"));
      return;
    }
    setLoading(true);
    try {
      const data = await apiRegister(email, password, confirmPassword, termsAccepted);
      setAuth(data);
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("auth.registrationFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center p-4 pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">{t("auth.register")}</CardTitle>
          <CardDescription>{t("auth.enterDetails")}</CardDescription>
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
                disabled={loading}
                className="h-12 text-base px-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.passwordMinLengthPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={loading}
                className="h-12 text-base px-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {t("auth.confirmPassword")}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder={t("auth.passwordMinLengthPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={loading}
                className="h-12 text-base px-4"
              />
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) =>
                  setTermsAccepted(Boolean(checked))
                }
                disabled={loading}
              />
              <Label htmlFor="terms" className="text-sm font-normal">
                {t("auth.termsLabel")}
              </Label>
            </div>
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.registering") : t("auth.register")}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("auth.logIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

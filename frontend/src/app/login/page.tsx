"use client";

import { useState } from "react";
import Link from "next/link";
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
import { login as apiLogin, setAuth, needsOnboarding } from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setAuth(data);
      router.push(needsOnboarding(data.user) ? "/onboarding" : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center p-4 pt-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.login")}</CardTitle>
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
                disabled={loading}
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
              />
            </div>
          </CardContent>
          <CardFooter className="mt-6 flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.signingIn") : t("auth.logIn")}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.dontHaveAccount")}{" "}
              <Link
                href="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t("auth.register")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

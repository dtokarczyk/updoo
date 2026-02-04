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
  getToken,
  clearAuth,
  type UserLanguage,
} from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";

export default function ProfileEditPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<UserLanguage>("POLISH");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const user = getStoredUser();
    if (user) {
      setName(user.name ?? "");
      setSurname(user.surname ?? "");
      setEmail(user.email ?? "");
      setLanguage(user.language ?? "POLISH");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
  }, [mounted, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {
        name: name.trim() || undefined,
        surname: surname.trim() || undefined,
        email: email.trim() || undefined,
        language,
      };
      if (password.trim()) payload.password = password.trim();
      const { user: updated } = await updateProfile(payload);
      updateStoredUser(updated);
      setPassword("");
      setSuccess(true);

      if (password.trim()) {
        clearAuth();
        router.push("/login");
        router.refresh();
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.saveFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("profile.editProfile")}</CardTitle>
          <CardDescription>
            {t("profile.editProfileDesc")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400 rounded-md bg-green-500/10 px-3 py-2">
                {t("profile.profileSaved")}
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
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t("profile.language")}</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as UserLanguage)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none disabled:opacity-50 md:text-sm"
                disabled={loading}
              >
                <option value="POLISH">{t("listings.polish")}</option>
                <option value="ENGLISH">{t("listings.english")}</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {t("profile.languageDesc")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("profile.newPassword")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("profile.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {t("profile.passwordMinLength")}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.saving") : t("common.save")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

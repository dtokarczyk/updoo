"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";

export function AuthPromoSidebar() {
  const { t } = useTranslations();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {t("auth.promoTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("auth.promoDescription")}
      </p>
      <div className="mt-4 space-y-2">
        <Button asChild className="w-full">
          <Link href="/register">{t("auth.signUp")}</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccountText")}
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">{t("auth.signIn")}</Link>
        </Button>
      </div>
    </div>
  );
}


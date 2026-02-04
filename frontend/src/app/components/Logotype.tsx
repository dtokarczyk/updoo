"use client";

import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";

type LogotypeProps = {
  className?: string;
};

export function Logotype({ className }: LogotypeProps) {
  const { t } = useTranslations();

  // Renders Updoo logo with a single localized tagline.
  return (
    <Link
      href="/"
      className={`flex flex-col text-xl font-semibold text-foreground focus:outline-none ${className ?? ""}`}
    >
      <span className="font-black text-3xl tracking-tighter">Updoo</span>
      <span className="mt-0.5 text-xs text-muted-foreground">
        {t("branding.logotypeTagline")}
      </span>
    </Link>
  );
}


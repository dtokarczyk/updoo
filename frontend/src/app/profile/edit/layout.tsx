import type { Metadata } from "next";
import { getLocaleFromRequest } from "@/lib/i18n";
import { getMetadataConfig } from "@/lib/metadata-config";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).profileEdit;
  return {
    title: meta.title,
    description: meta.description,
    robots: "noindex, nofollow",
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default function ProfileEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

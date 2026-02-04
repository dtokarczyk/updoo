"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function parsePage(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const router = useRouter();

  useEffect(() => {
    searchParams.then((params) => {
      const slug = params.category || "all";
      const page = parsePage(params.page);
      const target = `/offers/${encodeURIComponent(slug)}/${page}`;
      router.replace(target);
    });
  }, [router, searchParams]);

  return null;
}

import { redirect } from "next/navigation";

function parsePage(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const slug = params?.category || "all";
  const page = parsePage(params?.page);
  const target = `/jobs/${encodeURIComponent(slug)}/${page}`;
  redirect(target);
}

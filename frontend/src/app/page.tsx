import { redirect } from "next/navigation";

function parsePage(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function Home({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const slug = searchParams?.category || "all";
  const page = parsePage(searchParams?.page);
  const target = `/offers/${encodeURIComponent(slug)}/${page}`;
  redirect(target);
}

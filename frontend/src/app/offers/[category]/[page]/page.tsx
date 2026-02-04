import { sortCategoriesByOrder, type Category } from "@/lib/api";
import { OffersPageClient } from "./OffersPageClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Cache the page (and categories) for 60 seconds.
export const revalidate = 60;

async function getCategoriesServer(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/listings/categories`, {
    // Revalidate categories periodically so they do not have to be
    // fetched on every client render.
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = (await res.json()) as Category[];
  return sortCategoriesByOrder(data);
}

export default async function OffersPage() {
  const categories = await getCategoriesServer();
  return <OffersPageClient categories={categories} />;
}



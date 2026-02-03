"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCategories,
  createListing,
  getStoredUser,
  type Category,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NewListingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.accountType !== "CLIENT") {
      router.replace("/");
      return;
    }
    getCategories()
      .then(setCategories)
      .catch(() => setError("Nie udało się załadować kategorii"));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !description.trim() || !categoryId) {
      setError("Wypełnij wszystkie pola");
      return;
    }
    setSubmitting(true);
    try {
      await createListing(title.trim(), description.trim(), categoryId);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas dodawania");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
      <main className="max-w-xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Powrót na stronę główną
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nowe ogłoszenie</CardTitle>
            <CardDescription>
              Wypełnij tytuł, opis i wybierz kategorię.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">Tytuł</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Szukam korepetytora z matematyki"
                  maxLength={200}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Opis</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opisz szczegóły ogłoszenia..."
                  maxLength={5000}
                  rows={6}
                  disabled={submitting}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "placeholder:text-muted-foreground disabled:opacity-50 md:text-sm"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategoria</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={submitting || categories.length === 0}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
                    "disabled:opacity-50 md:text-sm"
                  )}
                >
                  <option value="">
                    {categories.length === 0
                      ? "Ładowanie..."
                      : "Wybierz kategorię"}
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Dodawanie..." : "Dodaj ogłoszenie"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

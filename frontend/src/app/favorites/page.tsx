"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getFavoritesListings, getToken, type Listing } from "@/lib/api";
import { ListingPost } from "@/app/components/ListingPost";
import { Button } from "@/components/ui/button";

export default function FavoritesPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    getFavoritesListings()
      .then(setListings)
      .catch(() => setError("Nie udało się załadować ulubionych"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    loadFavorites();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center text-muted-foreground">
        Ładowanie ulubionych...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do listy
            </Link>
          </Button>
        </div>
        <p className="text-center text-destructive">{error}</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Powrót do listy
            </Link>
          </Button>
        </div>
        <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed">
          Nie masz jeszcze zapisanych ogłoszeń. Kliknij gwiazdkę przy ofercie, aby dodać ją do ulubionych.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Powrót do listy
          </Link>
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Ulubione ogłoszenia</h1>
      <div className="space-y-4">
        {listings.map((listing) => (
          <ListingPost
            key={listing.id}
            listing={listing}
            showFavorite
            onFavoriteToggle={(listingId) =>
              setListings((prev) => prev.filter((l) => l.id !== listingId))
            }
            headerAction={
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {listing.category.name}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {listing.language === "ENGLISH" ? "English" : "Polish"}
                </span>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

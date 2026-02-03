"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken, getStoredUser, clearAuth } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface HomeNavProps {
  /** When true, only show "Nowe ogłoszenie" link (for section header) */
  showCreateOnly?: boolean;
}

export function HomeNav({ showCreateOnly }: HomeNavProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [canCreateListing, setCanCreateListing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    setIsLoggedIn(!!token);
    const user = getStoredUser();
    setCanCreateListing(!!token && user?.accountType === "CLIENT");
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
    router.refresh();
  };

  if (!mounted) {
    if (showCreateOnly) return null;
    return (
      <div className="flex items-center gap-2">
        <Link href="/register">
          <Button variant="ghost" size="sm">
            Rejestracja
          </Button>
        </Link>
        <Link href="/login">
          <Button size="sm">Logowanie</Button>
        </Link>
      </div>
    );
  }

  if (showCreateOnly) {
    if (!canCreateListing) return null;
    return (
      <Link href="/listings/new">
        <Button variant="outline" size="sm">
          Nowe ogłoszenie
        </Button>
      </Link>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/register">
          <Button variant="ghost" size="sm">
            Rejestracja
          </Button>
        </Link>
        <Link href="/login">
          <Button size="sm">Logowanie</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {canCreateListing && (
        <Link href="/listings/new">
          <Button variant="outline" size="sm">
            Nowe ogłoszenie
          </Button>
        </Link>
      )}
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Wyloguj
      </Button>
    </div>
  );
}

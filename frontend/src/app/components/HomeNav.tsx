"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getToken,
  getStoredUser,
  clearAuth,
  type AuthUser,
  type AccountType,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function accountTypeLabel(type: AccountType | null): string {
  if (!type) return "";
  const labels: Record<AccountType, string> = {
    CLIENT: "Klient",
    FREELANCER: "Freelancer",
    ADMIN: "Admin",
  };
  return labels[type];
}

function initials(user: AuthUser): string {
  const n = user.name?.trim();
  const s = user.surname?.trim();
  if (n && s) return (n[0] + s[0]).toUpperCase();
  if (n) return n.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return "?";
}

/** Full display name: "Name Surname" or fallback to email / "Profil". */
function displayName(user: AuthUser): string {
  const n = user.name?.trim();
  const s = user.surname?.trim();
  if (n && s) return `${n} ${s}`;
  if (n) return n;
  if (s) return s;
  return user.email || "Profil";
}

interface HomeNavProps {
  /** When true, only show "Nowe ogłoszenie" link (for section header) */
  showCreateOnly?: boolean;
}

export function HomeNav({ showCreateOnly }: HomeNavProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [canCreateListing, setCanCreateListing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    const u = getStoredUser();
    setUser(u);
    setIsLoggedIn(!!token);
    setCanCreateListing(!!token && u?.accountType === "CLIENT");
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    clearAuth();
    setUser(null);
    setIsLoggedIn(false);
    setCanCreateListing(false);
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

  // Header: profile button with dropdown (no "Nowe ogłoszenie" here)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5",
          "hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500"
        )}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-300 text-sm font-medium text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200"
          aria-hidden
        >
          {user ? initials(user) : "?"}
        </span>
        <span className="flex flex-col items-start text-left">
          <span className="text-sm font-medium text-foreground leading-tight">
            {user ? displayName(user) : "Profil"}
          </span>
          <span className="text-xs text-muted-foreground leading-tight">
            {user ? accountTypeLabel(user.accountType) : ""}
          </span>
        </span>
      </button>
      {dropdownOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="menu"
        >
          <Link
            href="/profile/edit"
            role="menuitem"
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => setDropdownOpen(false)}
          >
            Edytuj profil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Wyloguj
          </button>
        </div>
      )}
    </div>
  );
}

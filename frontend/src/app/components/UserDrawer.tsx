"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { getUserApplications, getUserJobs, getToken, getStoredUser, clearAuth, type AuthUser, type UserApplication, type Job } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "@/hooks/useTranslations";
import { UserDropdown, displayName } from "@/app/components/HomeNav";
import type { Locale } from "@/lib/i18n";
import {
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { UserSidebar } from "./UserSidebar";

interface UserDrawerContentProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
  onClose: () => void;
}

export function UserDrawerContent({ initialLocale, onClose }: UserDrawerContentProps) {
  const router = useRouter();
  const { t, locale } = useTranslations();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pathname = usePathname();

  // Initialize auth state on mount
  useEffect(() => {
    setMounted(true);
    const token = getToken();
    const u = getStoredUser();
    setUser(u);
    setIsLoggedIn(!!token);
  }, []);

  // Refresh auth state when pathname changes (e.g., after login redirect)
  useEffect(() => {
    if (!mounted) return;
    const token = getToken();
    const u = getStoredUser();
    setUser(u);
    setIsLoggedIn(!!token);
  }, [pathname, mounted]);

  useEffect(() => {
    if (!mounted || !isLoggedIn || !user) {
      setLoading(false);
      return;
    }

    const accountType = user.accountType;

    if (accountType === "FREELANCER") {
      getUserApplications()
        .then((data) => {
          setApplications(data);
        })
        .catch((err) => {
          console.error("Failed to load applications:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (accountType === "CLIENT") {
      getUserJobs()
        .then((data) => {
          setJobs(data);
        })
        .catch((err) => {
          console.error("Failed to load jobs:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [mounted, isLoggedIn, user]);

  const dropdownRef = useRef<HTMLDivElement>(null);

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
    onClose();
    router.push("/");
    router.refresh();
  };

  if (!mounted || !isLoggedIn) {
    return null;
  }

  const dateFnsLocale = locale === "en" ? enUS : pl;

  function formatPostedAgo(iso: string): string {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: dateFnsLocale });
  }

  return (
    <DrawerContent className="h-full max-w-sm">
      <DrawerHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <DrawerTitle>{user ? displayName(user, t) : t("profile.editProfile")}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </div>
      </DrawerHeader>

      <div className="p-4">

        <UserSidebar initialLocale={initialLocale} />
      </div>
    </DrawerContent>
  );
}

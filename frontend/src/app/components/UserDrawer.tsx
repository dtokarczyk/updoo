"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    const u = getStoredUser();
    setUser(u);
    setIsLoggedIn(!!token);
  }, []);

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

      <div className="flex-1 overflow-y-auto p-4">
        {/* User section with dropdown and theme toggle */}
        <div className="mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="relative flex-1" ref={dropdownRef}>
              <UserDropdown
                user={user}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                dropdownRef={dropdownRef}
                handleLogout={handleLogout}
                locale={locale}
                t={t}
                fullWidth
              />
            </div>
            <ThemeToggle className="h-[44px] w-[44px] px-0" />
          </div>
        </div>

        {/* Recent applications (for freelancer) or jobs (for client) */}
        {user?.accountType && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {user.accountType === "FREELANCER"
                ? t("jobs.recentApplications")
                : t("jobs.myJobs")}
            </h3>
            {loading ? (
              <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
            ) : user.accountType === "FREELANCER" ? (
              applications.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {t("jobs.noApplications")}
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/job/${app.job.id}`}
                      className="block p-3 rounded-lg border transition-colors"
                      onClick={() => onClose()}
                    >
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                        {app.job.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatPostedAgo(app.createdAt)}
                      </p>
                      {app.job.category && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {app.job.category.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )
            ) : user.accountType === "CLIENT" ? (
              jobs.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {t("jobs.noJobs")}
                </div>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/job/${job.id}`}
                      className="block p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                      onClick={() => onClose()}
                    >
                      <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                        {job.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatPostedAgo(job.createdAt)}
                      </p>
                      {job.category && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {job.category.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )
            ) : null}
          </div>
        )}
      </div>
    </DrawerContent>
  );
}

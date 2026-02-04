"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { getUserApplications, getUserJobs, getToken, getStoredUser, clearAuth, type AuthUser, type UserApplication, type Job } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "@/hooks/useTranslations";
import { UserDropdown } from "@/app/components/HomeNav";
import type { Locale } from "@/lib/i18n";

interface UserSidebarProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
}

export function UserSidebar({ initialLocale }: UserSidebarProps) {
  const router = useRouter();
  const { t, locale } = useTranslations();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <aside className="sticky top-0 z-10 hidden shrink-0 lg:top-14 lg:block lg:self-start lg:w-1/5">
      {/* User section with dropdown and theme toggle */}
      <div className="mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
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
                    className="block p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                      {app.job.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatPostedAgo(app.createdAt)}
                    </p>
                    {app.job.category && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
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
                    className="block p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                      {job.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatPostedAgo(job.createdAt)}
                    </p>
                    {job.category && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-muted-foreground">
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
    </aside>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logotype } from "@/app/components/Logotype";
import { HomeNav, UserDropdown, initials } from "@/app/components/HomeNav";
import { getToken, getStoredUser, clearAuth, type AuthUser } from "@/lib/api";
import { useTranslations } from "@/hooks/useTranslations";
import type { Locale } from "@/lib/i18n";
import { UserDrawerContent } from "@/app/components/UserDrawer";
import { AuthDrawerContent } from "@/app/components/AuthDrawer";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";

export function AppHeader({ initialLocale }: { initialLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
  const isListings = pathname.startsWith("/jobs/");
  const showBack = !isListings && !isHome;
  const topBarVisible = !isListings && !isHome;

  const { t, locale } = useTranslations();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authDrawerOpen, setAuthDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    const u = getStoredUser();
    setUser(u);
    setIsLoggedIn(!!token);
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
    router.push("/");
    router.refresh();
  };


  return (
    <header className={`border-b border-border ${!topBarVisible ? "lg:hidden" : ""}`}>
      <div
        className={`relative mx-auto flex max-w-6xl flex-row items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4`}
      >
        <div className="flex items-center gap-2">
          {showBack && (
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="Powrót do listy"
              onClick={() => {
                // Try to go back in history to preserve scroll position.
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  // Fallback to default offers list when history is not available.
                  router.push("/jobs/all/1");
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        <Logotype className="absolute left-1/2 -translate-x-1/2 shrink-0 items-center" initialLocale={initialLocale} />

        <div className="flex items-center gap-2">
          <HomeNav />
          {mounted && (
            <>
              {isLoggedIn ? (
                <>
                  {/* Mobile: Drawer for logged in users */}
                  <div className="lg:hidden">
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
                      <DrawerTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-lg"
                          className="rounded-full"
                          aria-label="Open user menu"
                        >
                          <span className="flex shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground h-8 w-8">
                            {user ? initials(user) : "?"}
                          </span>
                        </Button>
                      </DrawerTrigger>
                      <UserDrawerContent
                        initialLocale={initialLocale}
                        onClose={() => setDrawerOpen(false)}
                      />
                    </Drawer>
                  </div>

                  {/* Desktop: Dropdown for logged in users */}
                  <div className="hidden lg:block relative" ref={dropdownRef}>
                    <UserDropdown
                      user={user}
                      dropdownOpen={dropdownOpen}
                      setDropdownOpen={setDropdownOpen}
                      dropdownRef={dropdownRef}
                      handleLogout={handleLogout}
                      locale={locale}
                      t={t}
                      iconOnly
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Mobile: Drawer for not logged in users */}
                  <div className="lg:hidden">
                    <Drawer open={authDrawerOpen} onOpenChange={setAuthDrawerOpen} direction="right">
                      <DrawerTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon-lg"
                          aria-label="Open login menu"
                        >
                          <User className="h-5 w-5" />
                        </Button>
                      </DrawerTrigger>
                      <AuthDrawerContent
                        initialLocale={initialLocale}
                        onClose={() => setAuthDrawerOpen(false)}
                      />
                    </Drawer>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

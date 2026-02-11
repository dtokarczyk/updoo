'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PanelLeftOpen, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import { ProfileSidebar } from './ProfileSidebar';

const PROFILE_EDIT_SEGMENTS = [
  '/profile/basic',
  '/profile/skills',
  '/profile/business-profile',
  '/profile/company',
  '/profile/password',
  '/profile/notifications',
];

export function ProfileLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMenuPage = pathname === '/profile' || pathname === '/profile/';
  const showSidebar =
    !isMenuPage && PROFILE_EDIT_SEGMENTS.some((seg) => pathname === seg);

  return (
    <div className="flex min-h-full w-full flex-col md:flex-row md:gap-6">
      {showSidebar && (
        <>
          {/* Desktop sidebar */}
          <div className="hidden md:block shrink-0">
            <ProfileSidebar />
          </div>
          {/* Mobile: menu button + drawer from left */}
          <Drawer
            open={mobileMenuOpen}
            onOpenChange={setMobileMenuOpen}
            direction="left"
          >
            <div className="md:hidden mb-3 flex items-center gap-2">
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  aria-label={t('profile.editProfile')}
                >
                  <PanelLeftOpen className="h-5 w-5" />
                </Button>
              </DrawerTrigger>
              <span className="text-sm text-muted-foreground">
                {t('profile.editProfile')}
              </span>
            </div>
            <DrawerContent className="h-full max-h-none">
              <DrawerHeader className="border-b">
                <div className="flex items-center justify-between">
                  <DrawerTitle>{t('profile.editProfile')}</DrawerTitle>
                    <DrawerClose asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('common.close')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </DrawerClose>
                </div>
              </DrawerHeader>
              <div className="overflow-y-auto p-4">
                <ProfileSidebar onNavigate={() => setMobileMenuOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}
      <main className="flex min-w-0 flex-1 flex-col justify-center">
        {children}
      </main>
    </div>
  );
}

'use client';

import {
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserSidebar } from './UserSidebar';
import { useTranslations } from '@/hooks/useTranslations';
import type { Locale } from '@/lib/i18n';

interface UserDrawerContentProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
  onClose: () => void;
}

export function UserDrawerContent(props: UserDrawerContentProps) {
  const { initialLocale } = props;
  const { t } = useTranslations();
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return null;
  }

  return (
    <DrawerContent className="h-full max-w-sm overflow-y-auto">
      <DrawerHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <DrawerTitle>{t('profile.editProfile')}</DrawerTitle>
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

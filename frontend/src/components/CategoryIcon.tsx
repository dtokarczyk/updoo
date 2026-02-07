'use client';

import {
  Briefcase,
  Code,
  Folder,
  LayoutGrid,
  Megaphone,
  Palette,
  PenLine,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CategoryIconConfig = {
  icon: LucideIcon;
  bgClass: string;
};

const ICONS: Record<string, CategoryIconConfig> = {
  wszystkie: { icon: LayoutGrid, bgClass: 'bg-muted-foreground' },
  all: { icon: LayoutGrid, bgClass: 'bg-muted-foreground' },

  programowanie: { icon: Code, bgClass: 'bg-sky-500' },
  programming: { icon: Code, bgClass: 'bg-sky-500' },

  design: { icon: Palette, bgClass: 'bg-purple-500' },

  marketing: { icon: Megaphone, bgClass: 'bg-amber-500' },

  pisanie: { icon: PenLine, bgClass: 'bg-emerald-500' },
  writing: { icon: PenLine, bgClass: 'bg-emerald-500' },

  'prace biurowe': { icon: Briefcase, bgClass: 'bg-pink-500' },
  'office work': { icon: Briefcase, bgClass: 'bg-pink-500' },

  inne: { icon: Folder, bgClass: 'bg-gray-500' },
  other: { icon: Folder, bgClass: 'bg-gray-500' },
};

export function CategoryIcon({
  categoryName,
  className,
}: {
  categoryName: string;
  className?: string;
}) {
  const name = categoryName.trim().toLowerCase();
  const config = ICONS[name];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md p-1.5',
        config.bgClass,
        className,
      )}
      aria-hidden
    >
      <Icon className="h-5 w-5 text-white" />
    </span>
  );
}

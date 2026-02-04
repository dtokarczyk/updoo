"use client";

import {
  Briefcase,
  Code,
  Folder,
  LayoutGrid,
  Megaphone,
  Palette,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryIconConfig = {
  icon: LucideIcon;
  bgClass: string;
};

const ICONS: Record<string, CategoryIconConfig> = {
  // All listings
  wszystkie: { icon: LayoutGrid, bgClass: "bg-zinc-500" },
  all: { icon: LayoutGrid, bgClass: "bg-zinc-500" },

  // Programming
  programowanie: { icon: Code, bgClass: "bg-sky-500" },
  programming: { icon: Code, bgClass: "bg-sky-500" },

  // Design
  design: { icon: Palette, bgClass: "bg-purple-500" },

  // Marketing
  marketing: { icon: Megaphone, bgClass: "bg-amber-500" },

  // Writing
  pisanie: { icon: PenLine, bgClass: "bg-emerald-500" },
  writing: { icon: PenLine, bgClass: "bg-emerald-500" },

  // Office work
  "prace biurowe": { icon: Briefcase, bgClass: "bg-slate-500" },
  "office work": { icon: Briefcase, bgClass: "bg-slate-500" },

  // Other
  inne: { icon: Folder, bgClass: "bg-gray-500" },
  other: { icon: Folder, bgClass: "bg-gray-500" },
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
        "inline-flex items-center justify-center rounded-md p-1.5",
        config.bgClass,
        className
      )}
      aria-hidden
    >
      <Icon className="h-5 w-5 text-white" />
    </span>
  );
}

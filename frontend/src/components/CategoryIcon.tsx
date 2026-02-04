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

export function CategoryIcon({
  categoryName,
  className,
}: {
  categoryName: string;
  className?: string;
}) {
  const name = categoryName.trim().toLowerCase();
  let Icon: LucideIcon | null = null;
  if (name === "wszystkie") {
    Icon = LayoutGrid;
  } else if (name === "design") {
    Icon = Palette;
  } else if (name === "inne") {
    Icon = Folder;
  } else if (name === "marketing") {
    Icon = Megaphone;
  } else if (name === "pisanie") {
    Icon = PenLine;
  } else if (name === "prace biurowe") {
    Icon = Briefcase;
  } else if (name === "programowanie") {
    Icon = Code;
  }

  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}

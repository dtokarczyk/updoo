"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  size?: "default" | "sm" | "icon" | "icon-sm";
}

export function ThemeToggle({ className, size = "icon-sm" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={toggleTheme}
      className={cn("shrink-0", className)}
      aria-label={theme === "light" ? "Włącz ciemny motyw" : "Włącz jasny motyw"}
      title={theme === "light" ? "Ciemny motyw" : "Jasny motyw"}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" aria-hidden />
      ) : (
        <Sun className="h-4 w-4" aria-hidden />
      )}
    </Button>
  );
}

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface SelectBoxProps {
  value: string
  label: string
  description?: string
  selected: boolean
  onSelect: () => void
  disabled?: boolean
  className?: string
}

export function SelectBox({
  value,
  label,
  description,
  selected,
  onSelect,
  disabled = false,
  className,
}: SelectBoxProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative w-full rounded-lg border-2 p-4 text-left transition-all",
        "hover:border-ring hover:bg-input/50",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50 bg-transparent dark:bg-input/30",
        selected
          ? "border-primary"
          : "border-input",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={cn("font-semibold text-base", description && "mb-1")}>{label}</div>
          {description && (
            <div className="text-sm text-muted-foreground">{description}</div>
          )}
        </div>
        {selected && (
          <div className="shrink-0">
            <div className="rounded-full bg-primary p-1">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
    </button>
  )
}

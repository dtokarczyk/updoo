'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface LocationOption {
  id: string;
  name: string;
  slug?: string;
}

interface LocationSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  locations: LocationOption[];
  disabled?: boolean;
  placeholder?: string;
  emptyLabel?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
}

export function LocationSearchSelect({
  value,
  onChange,
  locations,
  disabled = false,
  placeholder = 'Szukaj miasta...',
  emptyLabel = 'Nie wybrano',
  id,
  className,
  inputClassName,
}: LocationSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedLocation = locations.find((loc) => loc.id === value);
  const displayValue =
    open || !value ? searchQuery : (selectedLocation?.name ?? '');

  const filtered = React.useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase().trim();
    return locations.filter((loc) => loc.name.toLowerCase().includes(q));
  }, [locations, searchQuery]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (disabled) return;
    setOpen(true);
    setSearchQuery(selectedLocation?.name ?? '');
  };

  const handleSelect = (locationId: string) => {
    onChange(locationId);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          value={displayValue}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={value ? undefined : placeholder}
          className={cn('pr-9', inputClassName)}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
          onClick={() => (open ? setOpen(false) : inputRef.current?.focus())}
          disabled={disabled}
          aria-label={open ? 'Zamknij listę' : 'Otwórz listę'}
        >
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          />
        </button>
      </div>
      {open && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-input bg-popover text-popover-foreground shadow-md"
          role="listbox"
        >
          {!value ? null : (
            <li role="option" aria-selected={false}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={handleClear}
              >
                {emptyLabel}
              </button>
            </li>
          )}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Brak wyników
            </li>
          ) : (
            filtered.map((loc) => (
              <li key={loc.id} role="option" aria-selected={value === loc.id}>
                <button
                  type="button"
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                    value === loc.id && 'bg-accent',
                  )}
                  onClick={() => handleSelect(loc.id)}
                >
                  {loc.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';

type LogotypeProps = {
  className?: string;
  tagline: string;
};

export function Logotype({ className, tagline }: LogotypeProps) {
  return (
    <Link
      href="/"
      className={`flex flex-col text-xl font-semibold text-foreground focus:outline-none ${className ?? ''}`}
    >
      <span className="font-black text-3xl" style={{ letterSpacing: '-0.05em' }}>Hoplo</span>
      <span className="mt-0.5 text-xs text-muted-foreground hidden md:block">
        {tagline}
      </span>
    </Link>
  );
}

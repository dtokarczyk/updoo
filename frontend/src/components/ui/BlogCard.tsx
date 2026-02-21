import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BlogCardProps {
  title: string;
  subtitle: string;
  date: string;
  readingTime?: string;
  mainImage: ReactNode | null;
  slug: string;
  variant?: 'hero' | 'sidebar' | 'grid';
  className?: string;
}

export function BlogCard({
  title,
  subtitle,
  date,
  readingTime,
  mainImage,
  slug,
  variant = 'grid',
  className = '',
}: BlogCardProps) {
  const baseClasses =
    'bg-card border overflow-hidden border-border rounded-xl duration-300 h-full flex flex-col';
  const heroClasses =
    'bg-card border overflow-hidden border-border rounded-2xl duration-300 h-full flex flex-col';

  const getCardClasses = () => {
    switch (variant) {
      case 'hero':
        return heroClasses;
      case 'sidebar':
      case 'grid':
      default:
        return baseClasses;
    }
  };

  const getImageClasses = () => 'h-1/2 overflow-hidden';

  const getContentClasses = () => {
    switch (variant) {
      case 'hero':
        return 'md:p-8 p-4 flex flex-col flex-grow';
      case 'sidebar':
        return 'md:p-6 p-4 flex flex-col flex-grow';
      case 'grid':
      default:
        return 'md:p-6 p-4 flex flex-col';
    }
  };

  const getTitleClasses = () => {
    switch (variant) {
      case 'hero':
        return 'md:text-5xl text-3xl leading-tight font-black mb-4 transition-colors';
      case 'sidebar':
        return 'font-bold mb-2 line-clamp-3';
      case 'grid':
      default:
        return 'font-bold mb-3 transition-colors line-clamp-3';
    }
  };

  const getSubtitleClasses = () => {
    switch (variant) {
      case 'hero':
        return 'text-muted-foreground leading-relaxed';
      case 'sidebar':
        return 'text-muted-foreground text-sm line-clamp-3';
      case 'grid':
      default:
        return 'text-muted-foreground text-sm line-clamp-3';
    }
  };

  const getDateClasses = () => {
    switch (variant) {
      case 'hero':
        return 'text-muted-foreground text-sm';
      case 'sidebar':
        return 'text-muted-foreground text-xs';
      case 'grid':
      default:
        return 'text-muted-foreground text-xs';
    }
  };

  return (
    <Link href={`/blog/${slug}`} className={cn('group block', className)}>
      <div className={getCardClasses()}>
        {mainImage && (
          <div className={getImageClasses()}>
            {mainImage}
          </div>
        )}
        <div className={getContentClasses()}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className={getDateClasses()}>{date}</span>
              {readingTime && variant !== 'sidebar' && (
                <span className={getDateClasses()}>{readingTime}</span>
              )}
            </div>
          </div>
          <h3 className={getTitleClasses()}>{title}</h3>
          <p className={getSubtitleClasses()}>{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

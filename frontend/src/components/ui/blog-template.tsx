import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  ChevronRight,
  Home,
  User,
} from 'lucide-react';
import type { Heading } from '@/lib/contentful/contentful-helpers';
import { BlogStickySidebar } from '@/components/ui/BlogStickySidebar';
import { BlogSignUpCta } from '@/components/ui/BlogSignUpCta';

const BLOG_AUTHOR_NAME = 'Hoplo';

interface BlogTemplateProps {
  title: string;
  lead?: string;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: string;
  mainImage?: ReactNode;
  metaDescription?: string;
  children: ReactNode;
  headings?: Heading[];
  /** Optional translated labels (from page using getTranslations) */
  breadcrumbHome?: string;
  breadcrumbBlog?: string;
  tocLabel?: string;
}

export function BlogTemplate({
  title,
  lead,
  publishedAt,
  updatedAt,
  readingTimeMinutes,
  mainImage,
  metaDescription,
  children,
  headings,
  breadcrumbHome = 'Strona główna',
  breadcrumbBlog = 'Blog',
  tocLabel = 'Spis treści',
}: BlogTemplateProps) {
  const showUpdatedAt = publishedAt !== updatedAt;

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-8">
      <div className="w-full">
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="hover:text-primary flex items-center gap-1"
              >
                <Home className="size-4" aria-hidden />
                <span className="hidden md:inline">{breadcrumbHome}</span>
              </Link>
            </li>
            <li>
              <ChevronRight className="size-3 shrink-0" aria-hidden />
            </li>
            <li>
              <Link href="/blog" className="hover:text-primary">
                {breadcrumbBlog}
              </Link>
            </li>
            <li>
              <ChevronRight className="size-3 shrink-0" aria-hidden />
            </li>
            <li className="text-foreground font-medium" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          <article className="flex-1 min-w-0">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-8">
              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                  {title}
                </h1>
                {lead && (
                  <p className="text-xl text-muted-foreground mb-4">
                    {lead}
                  </p>
                )}
                {metaDescription && !lead && (
                  <p className="text-lg text-muted-foreground">
                    {metaDescription}
                  </p>
                )}
              </header>

              {mainImage ? (
                <section className="mb-8 rounded-2xl overflow-hidden">
                  {mainImage}
                </section>
              ) : null}

              <section className="flex flex-col md:flex-row md:items-center md:justify-between text-base text-muted-foreground mb-6 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="size-5 shrink-0" aria-hidden />
                      <time dateTime={publishedAt}>{publishedAt}</time>
                    </div>
                  )}
                  {showUpdatedAt && (
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline">•</span>
                      <span className="text-sm">
                        Aktualizacja: {updatedAt}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">•</span>
                    <User className="size-5 shrink-0" aria-hidden />
                    <address className="not-italic" rel="author">
                      {BLOG_AUTHOR_NAME}
                    </address>
                  </div>
                  {readingTimeMinutes && (
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline">•</span>
                      <Clock className="size-5 shrink-0" aria-hidden />
                      <span>{readingTimeMinutes}</span>
                    </div>
                  )}
                </div>
              </section>

              {headings && headings.length > 0 && (
                <section className="mb-8 p-6 bg-muted/50 border border-border rounded-xl">
                  <h2 className="text-xl font-bold mb-4 text-foreground">
                    {tocLabel}
                  </h2>
                  <nav aria-label="Spis treści">
                    <ul className="space-y-2">
                      {headings.map((heading, index) => (
                        <li
                          key={`${heading.id}-${index}`}
                          className={
                            heading.level === 1
                              ? 'ml-0 font-semibold'
                              : heading.level === 2
                                ? 'ml-4'
                                : 'ml-8 text-sm'
                          }
                        >
                          <a
                            href={`#${heading.id}`}
                            className="text-muted-foreground hover:text-primary transition-colors"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </section>
              )}

              <section className="prose prose-lg max-w-none prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6 prose-li:my-2 prose-a:text-primary prose-a:underline dark:prose-invert">
                {children}
              </section>

              <BlogSignUpCta />
            </div>
          </article>

          <BlogStickySidebar />
        </div>
      </div>
    </div>
  );
}

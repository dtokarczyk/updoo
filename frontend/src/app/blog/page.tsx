import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchAllHoploBlogPosts } from '@/lib/contentful/contentful-config';
import {
  extractPlainText,
  formatDateToPolish,
  calculateReadingTime,
  createMainImageComponent,
} from '@/lib/contentful/contentful-helpers';
import { BlogCard } from '@/components/ui/BlogCard';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getTranslations } from '@/lib/translations';
import { getDefaultOpenGraph } from '@/lib/metadata-config';
import { PROJECT_NAME } from '@/constants';

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';
  const title = `Blog - ${PROJECT_NAME}`;
  const description =
    'Odkryj najnowsze artykuły i poradniki. Wiedza o zleceniach i freelancingu.';

  return {
    title,
    description,
    openGraph: {
      ...getDefaultOpenGraph(baseUrl, '/blog'),
      title,
      description,
      siteName: PROJECT_NAME,
    },
    alternates: {
      canonical: `${baseUrl}/blog`,
    },
  };
}

const contentfulLocale = (locale: 'pl' | 'en') =>
  locale === 'en' ? 'en' : 'pl-PL';

export default async function BlogListPage() {
  const locale = await getLocaleFromRequest();
  const localeForContentful = contentfulLocale(locale);
  const t = getTranslations(locale);

  try {
    const entries = await fetchAllHoploBlogPosts(localeForContentful);

    if (!entries || entries.length === 0) {
      return (
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{t.blog.title}</h1>
            <p className="text-muted-foreground">{t.blog.empty}</p>
          </div>
        </main>
      );
    }

    const blogPosts = entries.map((entry) => ({
      title: entry.fields.title,
      subtitle:
        extractPlainText(entry.fields.body).slice(0, 160) ||
        entry.fields.metaDescription?.slice(0, 160) ||
        '',
      date: formatDateToPolish(entry.sys.createdAt),
      readingTime: calculateReadingTime(entry.fields.body),
      mainImage: createMainImageComponent(entry.fields.mainImage),
      slug: entry.fields.slug,
    }));

    const heroPost = blogPosts[0];
    const otherPosts = blogPosts.slice(1);

    return (
      <main className="container max-w-7xl mx-auto px-2 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <BlogCard
              title={heroPost.title}
              subtitle={heroPost.subtitle}
              date={heroPost.date}
              readingTime={heroPost.readingTime}
              mainImage={heroPost.mainImage}
              slug={heroPost.slug}
              variant="hero"
              className="h-full"
            />
          </div>

          <div className="space-y-6 flex flex-col">
            {otherPosts.slice(0, 2).map((post) => (
              <BlogCard
                key={post.slug}
                title={post.title}
                subtitle={post.subtitle}
                date={post.date}
                mainImage={post.mainImage}
                slug={post.slug}
                variant="sidebar"
              />
            ))}
          </div>
        </div>

        {otherPosts.slice(2).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-8">{t.blog.otherPosts}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {otherPosts.slice(2).map((post) => (
                <BlogCard
                  key={post.slug}
                  title={post.title}
                  subtitle={post.subtitle}
                  date={post.date}
                  readingTime={post.readingTime}
                  mainImage={post.mainImage}
                  slug={post.slug}
                  variant="grid"
                />
              ))}
            </div>
          </div>
        )}
      </main>
    );
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{t.blog.title}</h1>
          <p className="text-muted-foreground">{t.blog.error}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Wróć na stronę główną
          </Link>
        </div>
      </main>
    );
  }
}

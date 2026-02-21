import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';
import { fetchHoploBlogPost } from '@/lib/contentful/contentful-config';
import {
  extractPlainText,
  formatDateToPolish,
  calculateReadingTime,
  createMainImageComponent,
  renderBodyContent,
  extractHeadings,
} from '@/lib/contentful/contentful-helpers';
import type { BlogPostProps, BlogPostData } from '@/lib/contentful/contentful-types';
import { BlogTemplate } from '@/components/ui/blog-template';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getTranslations } from '@/lib/translations';

function extractTextFromNode(node: {
  content?: Array<{
    nodeType?: string;
    value?: string;
    content?: unknown[];
  }>;
}): string {
  if (!node?.content) return '';
  const extractText = (n: { nodeType?: string; value?: string; content?: unknown[] }): string => {
    if (n.nodeType === 'text' && n.value) return n.value;
    if (n.content && Array.isArray(n.content)) {
      return n.content
        .map((child: unknown) =>
          extractText(child as { nodeType?: string; value?: string; content?: unknown[] }),
        )
        .join('');
    }
    return '';
  };
  return node.content
    .map((child: unknown) =>
      extractText(child as { nodeType?: string; value?: string; content?: unknown[] }),
    )
    .join('');
}

const renderOptions = {
  renderNode: {
    [BLOCKS.EMBEDDED_ASSET]: (node: {
      data: {
        target: {
          fields: {
            title: string;
            file: {
              url: string;
              details: { image: { width: number; height: number } };
            };
          };
        };
      };
    }) => {
      const { title, file } = node.data.target.fields;
      const { url, details } = file;
      const { width, height } = details.image;
      return (
        <div className="my-8">
          <Image
            src={`https:${url}`}
            alt={title}
            width={width}
            height={height}
            className="rounded-lg mx-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>
      );
    },
    [BLOCKS.PARAGRAPH]: (_node: unknown, children: React.ReactNode) => (
      <p className="mb-4 leading-relaxed">{children}</p>
    ),
    [BLOCKS.HEADING_1]: (
      node: { content?: Array<{ nodeType?: string; value?: string; content?: unknown[] }> },
      children: React.ReactNode,
    ) => {
      const text = extractTextFromNode(node);
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return (
        <h1 id={id} className="text-3xl font-bold mb-6 mt-8 scroll-mt-24">
          {children}
        </h1>
      );
    },
    [BLOCKS.HEADING_2]: (
      node: { content?: Array<{ nodeType?: string; value?: string; content?: unknown[] }> },
      children: React.ReactNode,
    ) => {
      const text = extractTextFromNode(node);
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return (
        <h2 id={id} className="text-2xl font-bold mb-4 mt-6 scroll-mt-24">
          {children}
        </h2>
      );
    },
    [BLOCKS.HEADING_3]: (
      node: { content?: Array<{ nodeType?: string; value?: string; content?: unknown[] }> },
      children: React.ReactNode,
    ) => {
      const text = extractTextFromNode(node);
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      return (
        <h3 id={id} className="text-xl font-bold mb-3 mt-4 scroll-mt-24">
          {children}
        </h3>
      );
    },
    [BLOCKS.UL_LIST]: (_node: unknown, children: React.ReactNode) => (
      <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (_node: unknown, children: React.ReactNode) => (
      <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (_node: unknown, children: React.ReactNode) => (
      <li>{children}</li>
    ),
    [BLOCKS.HR]: () => <hr className="my-8 border-t border-border" />,
    [INLINES.HYPERLINK]: (
      node: { data: { uri: string } },
      children: React.ReactNode,
    ) => (
      <a
        href={node.data.uri}
        className="text-primary underline hover:text-primary/80 transition-colors"
        target={node.data.uri.startsWith('http') ? '_blank' : undefined}
        rel={node.data.uri.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
  },
};

const contentfulLocale = (locale: 'pl' | 'en') =>
  locale === 'en' ? 'en' : 'pl-PL';

export async function generateMetadata({
  params,
}: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocaleFromRequest();
  const localeForContentful = contentfulLocale(locale);

  try {
    const entry = await fetchHoploBlogPost(slug, localeForContentful);

    if (!entry) {
      return {
        title: 'Blog post not found',
        description: 'The requested blog post could not be found.',
      };
    }

    const title = entry.fields.metaTitle ?? entry.fields.title;
    const description =
      entry.fields.metaDescription ?? extractPlainText(entry.fields.body).slice(0, 160);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';
    const url = `${baseUrl}/blog/${slug}`;

    const mainImageUrl =
      entry.fields.mainImage?.fields?.file?.url &&
      `https:${entry.fields.mainImage.fields.file.url}`;

    return {
      title,
      description,
      authors: [{ name: 'Hoplo' }],
      other: {
        'article:published_time': entry.sys.createdAt,
        'article:modified_time': entry.sys.updatedAt,
        canonical: url,
      },
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: entry.sys.createdAt,
        modifiedTime: entry.sys.updatedAt,
        url,
        siteName: 'Hoplo',
        images: mainImageUrl
          ? [
              {
                url: mainImageUrl,
                width: entry.fields.mainImage?.fields?.file?.details?.image?.width ?? 1200,
                height: entry.fields.mainImage?.fields?.file?.details?.image?.height ?? 600,
                alt: entry.fields.mainImage?.fields?.title ?? title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: mainImageUrl ? [mainImageUrl] : undefined,
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog post not found',
      description: 'The requested blog post could not be found.',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const locale = await getLocaleFromRequest();
  const localeForContentful = contentfulLocale(locale);
  const translations = getTranslations(locale);

  try {
    const entry = await fetchHoploBlogPost(slug, localeForContentful);

    if (!entry) {
      notFound();
    }

    const headings = extractHeadings(entry.fields.body);
    const blogPostData: BlogPostData = {
      title: entry.fields.title,
      lead: entry.fields.lead,
      publishedAt: formatDateToPolish(entry.sys.createdAt),
      updatedAt: formatDateToPolish(entry.sys.updatedAt),
      readingTimeMinutes: calculateReadingTime(entry.fields.body),
      mainImage: createMainImageComponent(entry.fields.mainImage),
      bodyContent: renderBodyContent(entry.fields.body, renderOptions),
      metaTitle: entry.fields.metaTitle,
      metaDescription: entry.fields.metaDescription,
      headings,
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';
    const mainImageUrl =
      entry.fields.mainImage?.fields?.file?.url &&
      `https:${entry.fields.mainImage.fields.file.url}`;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blogPostData.title,
      description: blogPostData.metaDescription ?? extractPlainText(entry.fields.body).slice(0, 160),
      author: {
        '@type': 'Organization',
        name: 'Hoplo',
        url: baseUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Hoplo',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
      },
      datePublished: entry.sys.createdAt,
      dateModified: entry.sys.updatedAt,
      image: mainImageUrl ?? undefined,
      url: `${baseUrl}/blog/${slug}`,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/blog/${slug}`,
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <BlogTemplate
          title={blogPostData.title}
          lead={blogPostData.lead}
          publishedAt={blogPostData.publishedAt}
          updatedAt={blogPostData.updatedAt}
          readingTimeMinutes={blogPostData.readingTimeMinutes}
          mainImage={blogPostData.mainImage}
          metaDescription={blogPostData.metaDescription}
          headings={blogPostData.headings}
          breadcrumbHome={translations.blog.home}
          breadcrumbBlog={translations.blog.title}
          tocLabel={translations.blog.toc}
        >
          {blogPostData.bodyContent}
        </BlogTemplate>
      </>
    );
  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }
}

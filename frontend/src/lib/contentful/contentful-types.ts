import type { ReactNode } from 'react';
import type { ContentfulAsset, ContentfulRichText, ContentfulHoploBlog } from './schemas';
import type { Heading } from '@/lib/contentful/contentful-helpers';

export interface BlogPostProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export interface BlogPostData {
  title: string;
  lead?: string;
  publishedAt: string;
  updatedAt: string;
  readingTimeMinutes: string;
  mainImage: ReactNode | null;
  bodyContent: ReactNode;
  metaTitle?: string;
  metaDescription?: string;
  headings?: Heading[];
}

export type { ContentfulAsset, ContentfulRichText, ContentfulHoploBlog };

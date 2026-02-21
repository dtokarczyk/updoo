import React, { JSX, ReactNode } from 'react';
import Image from 'next/image';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import {
  contentfulRichTextSchema,
  contentfulAssetSchema,
} from '@/lib/contentful/schemas';
import type { ContentfulRichText, ContentfulAsset } from '@/lib/contentful/schemas';

/**
 * Extracts plain text from Contentful rich text or string content with Zod validation
 */
export function extractPlainText(
  content: ContentfulRichText | string | null | undefined,
): string {
  if (!content) return '';
  if (typeof content === 'string') return content;

  try {
    const validatedContent = contentfulRichTextSchema.parse(content);
    const extractText = (node: ContentfulRichText): string => {
      if (node.nodeType === 'text') return node.value ?? '';
      if (node.content && Array.isArray(node.content)) {
        return node.content
          .map((childNode: unknown) =>
            extractText(childNode as ContentfulRichText),
          )
          .join('');
      }
      return '';
    };
    return extractText(validatedContent);
  } catch (error) {
    console.error('Error validating rich text content:', error);
    return '';
  }
}

/**
 * Formats date to Polish locale
 */
export function formatDateToPolish(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculates reading time in minutes from body content (200 words per minute)
 */
export function calculateReadingTime(
  content: ContentfulRichText | null | undefined,
): string {
  if (!content) return '0 min czytania';

  try {
    const validatedContent = contentfulRichTextSchema.parse(content);
    const extractTextContent = (node: ContentfulRichText | string): string => {
      if (typeof node === 'string') return node;
      if (node && typeof node === 'object') {
        if (node.nodeType === 'text') return node.value ?? '';
        if (node.content && Array.isArray(node.content)) {
          return node.content
            .map((childNode: unknown) =>
              extractTextContent(childNode as ContentfulRichText),
            )
            .join('');
        }
      }
      return '';
    };
    const textContent = extractTextContent(validatedContent);
    const wordCount = textContent
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    return `${readingTimeMinutes} min czytania`;
  } catch (error) {
    console.error('Error validating content for reading time:', error);
    return '0 min czytania';
  }
}

/**
 * Creates main image component from Contentful asset with Zod validation
 */
export function createMainImageComponent(
  mainImageField: ContentfulAsset | null | undefined,
): JSX.Element | null {
  if (!mainImageField) return null;

  try {
    const validatedAsset = contentfulAssetSchema.parse(mainImageField);
    if (!validatedAsset.fields?.file?.url) return null;

    const { file, title } = validatedAsset.fields;
    const { url, details } = file;
    const width = details?.image?.width ?? 1200;
    const height = details?.image?.height ?? 600;
    const alt = title ?? 'Main image';

    return (
      <div className="w-full">
        <Image
          src={`https:${url}`}
          alt={alt}
          width={width}
          height={height}
          className="rounded-2xl object-cover w-full h-auto max-h-[480px]"
          style={{
            objectFit: 'cover',
            width: '100%',
            height: 'auto',
            maxHeight: 480,
          }}
          priority
        />
      </div>
    );
  } catch (error) {
    console.error('Error validating asset for image component:', error);
    return null;
  }
}

export interface Heading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

/**
 * Extracts headings from Contentful rich text for table of contents
 */
export function extractHeadings(
  body: ContentfulRichText | null | undefined,
): Heading[] {
  if (!body) return [];

  try {
    const validatedBody = contentfulRichTextSchema.parse(body);
    const headings: Heading[] = [];

    const extractFromNode = (node: ContentfulRichText): void => {
      if (!node || typeof node !== 'object') return;

      if (
        node.nodeType === 'heading-1' ||
        node.nodeType === 'heading-2' ||
        node.nodeType === 'heading-3'
      ) {
        const level =
          node.nodeType === 'heading-1'
            ? 1
            : node.nodeType === 'heading-2'
              ? 2
              : 3;
        const extractText = (n: ContentfulRichText): string => {
          if (n.nodeType === 'text') return n.value ?? '';
          if (n.content && Array.isArray(n.content)) {
            return n.content
              .map((childNode: unknown) =>
                extractText(childNode as ContentfulRichText),
              )
              .join('');
          }
          return '';
        };
        const text = extractText(node);
        if (text.trim()) {
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          headings.push({ id, text, level });
        }
      }

      if (node.content && Array.isArray(node.content)) {
        node.content.forEach((childNode: unknown) => {
          extractFromNode(childNode as ContentfulRichText);
        });
      }
    };

    extractFromNode(validatedBody);
    return headings;
  } catch (error) {
    console.error('Error extracting headings:', error);
    return [];
  }
}

/**
 * Renders body content from Contentful rich text with Zod validation
 */
export function renderBodyContent(
  body: unknown,
  renderOptions: unknown,
): ReactNode {
  if (!body) return <p>No content</p>;

  try {
    const validatedBody = contentfulRichTextSchema.parse(body);
    return documentToReactComponents(
      validatedBody as Parameters<typeof documentToReactComponents>[0],
      renderOptions as Parameters<typeof documentToReactComponents>[1],
    );
  } catch (error) {
    console.error('Error validating body content:', error);
    return <p>Invalid content structure</p>;
  }
}

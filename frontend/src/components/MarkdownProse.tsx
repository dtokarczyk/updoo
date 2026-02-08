'use client';

import ReactMarkdown from 'react-markdown';

/**
 * Prose styling aligned with Shadcn design tokens (foreground, muted-foreground, primary, border).
 * Use with @tailwindcss/typography plugin.
 */
const proseClass =
  'prose prose-neutral dark:prose-invert max-w-none ' +
  'prose-headings:text-foreground prose-headings:font-semibold ' +
  'prose-p:text-foreground prose-p:leading-7 ' +
  'prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-li:marker:text-muted-foreground ' +
  'prose-strong:text-foreground prose-strong:font-semibold ' +
  'prose-a:text-primary prose-a:underline hover:prose-a:opacity-90 ' +
  'prose-hr:border-border ' +
  'prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground ' +
  'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none';

export function MarkdownProse({ children }: { children: string }) {
  return (
    <article className={proseClass}>
      <ReactMarkdown>{children}</ReactMarkdown>
    </article>
  );
}

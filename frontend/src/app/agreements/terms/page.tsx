'use client';

import { useEffect, useState } from 'react';
import { MarkdownProse } from '@/components/MarkdownProse';
import { getTermsContent } from '@/lib/api';

export default function TermsDocumentPage() {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTermsContent()
      .then(setContent)
      .catch(() => setError('Nie udało się załadować regulaminu.'));
  }, []);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-muted-foreground">Ładowanie…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 pb-12">
      <MarkdownProse>{content}</MarkdownProse>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MarkdownProse } from '@/components/MarkdownProse';
import { getTermsContent } from '@/lib/api';

export default function TermsDocumentPage() {
  const params = useParams();
  const version = params.version as string;
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!version) return;
    getTermsContent(version)
      .then(setContent)
      .catch(() => setError('Nie udało się załadować regulaminu.'));
  }, [version]);

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

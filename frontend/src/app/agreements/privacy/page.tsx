'use client';

import { useEffect, useState } from 'react';
import { MarkdownProse } from '@/components/MarkdownProse';
import { getPrivacyPolicyContent } from '@/lib/api';

export default function PrivacyDocumentPage() {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPrivacyPolicyContent()
      .then(setContent)
      .catch(() => setError('Nie udało się załadować polityki prywatności.'));
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
      <MarkdownProse>{content || 'Brak treści.'}</MarkdownProse>
    </div>
  );
}

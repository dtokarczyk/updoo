'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
};

export function ApiQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient(defaultQueryClientOptions),
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type HealthResponse = {
  status: string;
  timestamp: string;
};

export function ApiStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError("Backend unreachable"));
  }, []);

  if (error) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        API: {error}. Uruchom backend: <code className="rounded bg-amber-200/50 px-1 dark:bg-amber-900/50">cd backend && npm run start:dev</code>
      </p>
    );
  }

  if (!health) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">Sprawdzanie połączenia z API…</p>
    );
  }

  return (
    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
      API: {health.status} (backend działa)
    </p>
  );
}

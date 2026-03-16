"use client";

import { useState, useCallback } from "react";

interface UseFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
}

interface UseFetchReturn<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  execute: (url: string, options?: UseFetchOptions) => Promise<T | null>;
}

export function useFetch<T = unknown>(): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (url: string, options?: UseFetchOptions): Promise<T | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(url, {
          method: options?.method ?? "GET",
          headers: {
            "Content-Type": "application/json",
            ...options?.headers,
          },
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed (${res.status})`);
        }

        const json = (await res.json()) as T;
        setData(json);
        return json;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { data, error, isLoading, execute };
}

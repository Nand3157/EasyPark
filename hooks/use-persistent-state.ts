"use client";

import * as React from "react";

type Validator<T> = (value: unknown) => value is T;

/**
 * useState persisted to localStorage. Reads lazily on mount, writes on change.
 * Corrupt/unexpected entries fall back to the initial value; storage failures
 * (private mode, quota) are silently ignored so the app keeps working.
 */
export function usePersistentState<T>(
  key: string,
  initial: T | (() => T),
  isValid?: Validator<T>
) {
  const resolveInitial = (): T => {
    const fallback = typeof initial === "function" ? (initial as () => T)() : initial;
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed: unknown = JSON.parse(raw);
      if (isValid && !isValid(parsed)) return fallback;
      return parsed as T;
    } catch {
      // Corrupt entry — fall through to the default.
      return fallback;
    }
  };

  const [value, setValue] = React.useState<T>(resolveInitial);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage unavailable — app works without persistence.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export const isTheme = (v: unknown): v is "dark" | "light" => v === "dark" || v === "light";

export const isNumberArray = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((item) => typeof item === "number");

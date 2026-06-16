import { useEffect, useMemo, useState } from "react";
import {
  analyzePassword,
  analyzePasswordAsync,
  checkPwnedPassword,
  generateSecurePassword,
  type AnalyzePasswordOptions,
  type GeneratePasswordOptions,
  type PasswordStrengthResult,
} from "@pwd-meter/core";

export type UsePasswordStrengthOptions = AnalyzePasswordOptions & {
  debounceMs?: number;
};

export function usePasswordStrength(password: string, options: UsePasswordStrengthOptions = {}): PasswordStrengthResult {
  const { checkPwned = false, debounceMs = 400, hibp } = options;
  const base = useMemo(() => analyzePassword(password), [password]);
  const [result, setResult] = useState<PasswordStrengthResult>(base);

  useEffect(() => {
    if (!checkPwned || !password) {
      setResult(base);
      return;
    }

    let cancelled = false;
    setResult({ ...base, pwnedCheckPending: true });

    const timer = window.setTimeout(async () => {
      const next = await analyzePasswordAsync(password, { checkPwned: true, hibp });
      if (!cancelled) {
        setResult(next);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [password, base, checkPwned, debounceMs, hibp]);

  return result;
}

export function usePasswordGenerator(defaultOptions?: GeneratePasswordOptions) {
  return useMemo(
    () => ({
      generate: (options?: GeneratePasswordOptions) => generateSecurePassword({ ...defaultOptions, ...options }),
    }),
    [defaultOptions],
  );
}

export { analyzePassword, analyzePasswordAsync, checkPwnedPassword, generateSecurePassword };
export type {
  AnalyzePasswordOptions,
  GeneratePasswordOptions,
  HibpOptions,
  PasswordStrengthResult,
  PwnedPasswordResult,
  StrengthLabel,
} from "@pwd-meter/core";

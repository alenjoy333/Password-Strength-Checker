import { computed, ref, unref, watch, type ComputedRef, type MaybeRef, type Ref } from "vue";
import {
  analyzePassword,
  analyzePasswordAsync,
  generateSecurePassword,
  type AnalyzePasswordOptions,
  type GeneratePasswordOptions,
  type PasswordStrengthResult,
} from "@pwd-meter/core";

export type UsePasswordStrengthOptions = AnalyzePasswordOptions & {
  debounceMs?: number;
};

export function usePasswordStrength(
  password: ComputedRef<string> | (() => string),
  options: MaybeRef<UsePasswordStrengthOptions> = {},
): Ref<PasswordStrengthResult> {
  const value = computed(() => (typeof password === "function" ? password() : password.value));
  const resolvedOptions = computed(() => {
    const optionValue = unref(options);
    return {
      checkPwned: optionValue.checkPwned ?? false,
      debounceMs: optionValue.debounceMs ?? 400,
      hibp: optionValue.hibp,
    };
  });

  const result = ref<PasswordStrengthResult>(analyzePassword(value.value));
  let requestId = 0;

  watch(
    [value, resolvedOptions],
    ([next, opts], _previous, onCleanup) => {
      result.value = analyzePassword(next);

      if (!opts.checkPwned || !next) {
        return;
      }

      result.value = { ...result.value, pwnedCheckPending: true };
      const id = ++requestId;
      const timer = window.setTimeout(async () => {
        if (id !== requestId) {
          return;
        }

        const nextResult = await analyzePasswordAsync(next, { checkPwned: true, hibp: opts.hibp });
        if (id !== requestId) {
          return;
        }

        result.value = nextResult;
      }, opts.debounceMs);

      onCleanup(() => {
        window.clearTimeout(timer);
        requestId += 1;
      });
    },
    { immediate: true },
  );

  return result;
}

export function usePasswordGenerator(defaultOptions?: GeneratePasswordOptions) {
  return {
    generate: (options?: GeneratePasswordOptions) => generateSecurePassword({ ...defaultOptions, ...options }),
  };
}

export { analyzePassword, analyzePasswordAsync, generateSecurePassword } from "@pwd-meter/core";
export { checkPwnedPassword } from "@pwd-meter/core";
export type {
  AnalyzePasswordOptions,
  GeneratePasswordOptions,
  HibpOptions,
  PasswordStrengthResult,
  PwnedPasswordResult,
  StrengthLabel,
} from "@pwd-meter/core";

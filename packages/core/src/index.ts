import zxcvbn from "zxcvbn";
import { checkPwnedPassword, type HibpOptions, type PwnedPasswordResult } from "./hibp";

export type StrengthLabel = "empty" | "weak" | "fair" | "good" | "strong" | "very-strong" | "pwned";

export type PasswordStrengthResult = {
  password: string;
  score: 0 | 1 | 2 | 3 | 4;
  label: StrengthLabel;
  crackTimeDisplay: string;
  isPwned: boolean;
  pwnedCount?: number;
  pwnedCheckPending?: boolean;
  feedback: {
    warning?: string;
    suggestions: string[];
  };
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    symbol: boolean;
  };
};

export type AnalyzePasswordOptions = {
  checkPwned?: boolean;
  hibp?: HibpOptions;
};

export type GeneratePasswordOptions = {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  minScore?: 0 | 1 | 2 | 3 | 4;
  maxAttempts?: number;
};

const LABELS: Record<0 | 1 | 2 | 3 | 4, Exclude<StrengthLabel, "empty" | "pwned">> = {
  0: "weak",
  1: "fair",
  2: "good",
  3: "strong",
  4: "very-strong",
};

const DEFAULT_CHARSET = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}",
};

const PWNED_FEEDBACK = {
  warning: "This password has appeared in a known data breach.",
  suggestions: [
    "Choose a unique password that has not been exposed online.",
    "Use a passphrase or the password generator for a safer option.",
  ],
};

export function getPasswordChecks(password: string) {
  return {
    length: password.length >= 12,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^\w\s]/.test(password),
  };
}

function buildZxcvbnResult(password: string): PasswordStrengthResult {
  const result = zxcvbn(password);

  return {
    password,
    score: result.score,
    label: LABELS[result.score],
    crackTimeDisplay: String(result.crack_times_display.offline_slow_hashing_1e4_per_second),
    isPwned: false,
    feedback: {
      warning: result.feedback.warning ?? undefined,
      suggestions: result.feedback.suggestions,
    },
    checks: getPasswordChecks(password),
  };
}

function buildPwnedResult(password: string, pwned: PwnedPasswordResult): PasswordStrengthResult {
  return {
    password,
    score: 0,
    label: "pwned",
    crackTimeDisplay: "instant",
    isPwned: true,
    pwnedCount: pwned.count,
    feedback: {
      warning: PWNED_FEEDBACK.warning,
      suggestions: PWNED_FEEDBACK.suggestions,
    },
    checks: getPasswordChecks(password),
  };
}

export function analyzePassword(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      password,
      score: 0,
      label: "empty",
      crackTimeDisplay: "instant",
      isPwned: false,
      feedback: { suggestions: [] },
      checks: getPasswordChecks(""),
    };
  }

  return buildZxcvbnResult(password);
}

export async function analyzePasswordAsync(
  password: string,
  options: AnalyzePasswordOptions = {},
): Promise<PasswordStrengthResult> {
  const base = analyzePassword(password);
  if (!password || !options.checkPwned) {
    return base;
  }

  try {
    const pwned = await checkPwnedPassword(password, options.hibp);
    if (pwned.isPwned) {
      return buildPwnedResult(password, pwned);
    }
    return base;
  } catch {
    return {
      ...base,
      feedback: {
        ...base.feedback,
        warning: base.feedback.warning || "Could not verify breach status. Check your connection.",
      },
    };
  }
}

function randomIndex(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function pick(charset: string): string {
  return charset.charAt(randomIndex(charset.length));
}

function shuffle(value: string): string {
  const chars = value.split("");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function generateSecurePassword(options: GeneratePasswordOptions = {}): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    minScore = 3,
    maxAttempts = 25,
  } = options;

  if (length < 8) {
    throw new Error("Password length must be at least 8 characters.");
  }

  const pools = [
    includeLowercase ? DEFAULT_CHARSET.lowercase : "",
    includeUppercase ? DEFAULT_CHARSET.uppercase : "",
    includeNumbers ? DEFAULT_CHARSET.numbers : "",
    includeSymbols ? DEFAULT_CHARSET.symbols : "",
  ].filter(Boolean);

  if (!pools.length) {
    throw new Error("At least one character set must be enabled.");
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let password = pools.map((pool) => pick(pool)).join("");

    while (password.length < length) {
      password += pick(pools.join(""));
    }

    password = shuffle(password.slice(0, length));
    const analysis = analyzePassword(password);

    if (analysis.score >= minScore) {
      return password;
    }
  }

  throw new Error("Could not generate a password that meets the requested strength.");
}

export function getStrengthColor(label: StrengthLabel): string {
  switch (label) {
    case "pwned":
    case "weak":
      return "#dc2626";
    case "fair":
      return "#ea580c";
    case "good":
      return "#ca8a04";
    case "strong":
      return "#16a34a";
    case "very-strong":
      return "#059669";
    default:
      return "#94a3b8";
  }
}

export function getStrengthMessage(result: PasswordStrengthResult): string {
  if (result.pwnedCheckPending) {
    return "Checking breach database…";
  }

  switch (result.label) {
    case "empty":
      return "Enter a password to check strength.";
    case "pwned":
      return result.pwnedCount
        ? `Found in ${result.pwnedCount.toLocaleString()} breaches — choose another password.`
        : "Found in a data breach — choose another password.";
    case "weak":
      return "Weak password.";
    case "fair":
      return "Fair, but could be stronger.";
    case "good":
      return "Good password.";
    case "strong":
      return "Strong password.";
    case "very-strong":
      return "Very strong password.";
  }
}

export { checkPwnedPassword, type HibpOptions, type PwnedPasswordResult };

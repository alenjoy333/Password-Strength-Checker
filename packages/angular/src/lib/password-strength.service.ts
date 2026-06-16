import { Injectable } from "@angular/core";
import {
  analyzePassword,
  analyzePasswordAsync,
  checkPwnedPassword,
  generateSecurePassword,
  type AnalyzePasswordOptions,
  type GeneratePasswordOptions,
  type PasswordStrengthResult,
} from "@pwd-meter/core";

@Injectable({ providedIn: "root" })
export class PasswordStrengthService {
  analyze(password: string): PasswordStrengthResult {
    return analyzePassword(password);
  }

  analyzeAsync(password: string, options?: AnalyzePasswordOptions): Promise<PasswordStrengthResult> {
    return analyzePasswordAsync(password, options);
  }

  checkPwned(password: string, options?: AnalyzePasswordOptions["hibp"]) {
    return checkPwnedPassword(password, options);
  }

  generate(options?: GeneratePasswordOptions): string {
    return generateSecurePassword(options);
  }
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

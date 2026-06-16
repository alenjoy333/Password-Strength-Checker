import {
  generateSecurePassword,
  getStrengthColor,
  getStrengthMessage,
  type GeneratePasswordOptions,
  type PasswordStrengthResult,
} from "@pwd-meter/core";
import { useState } from "react";
import { usePasswordStrength, type UsePasswordStrengthOptions } from "./usePasswordStrength";

export type PasswordStrengthMeterProps = {
  password: string;
  result?: PasswordStrengthResult;
  showSuggestions?: boolean;
  showChecks?: boolean;
  checkPwned?: boolean;
  hibpOptions?: UsePasswordStrengthOptions["hibp"];
  className?: string;
};

export function PasswordStrengthMeter({
  password,
  result: externalResult,
  showSuggestions = true,
  showChecks = false,
  checkPwned = false,
  hibpOptions,
  className = "",
}: PasswordStrengthMeterProps) {
  const ownsAnalysis = externalResult === undefined;
  const internalResult = usePasswordStrength(ownsAnalysis ? password : "", {
    checkPwned: ownsAnalysis ? checkPwned : false,
    hibp: ownsAnalysis ? hibpOptions : undefined,
  });
  const result = externalResult ?? internalResult;
  const width = password ? `${((result.score + 1) / 5) * 100}%` : "0%";
  const color = getStrengthColor(result.label);

  return (
    <div className={`ps-meter ${className}`.trim()} aria-live="polite">
      <div className="ps-meter__track" aria-hidden="true">
        <div className="ps-meter__bar" style={{ width, backgroundColor: color }} />
      </div>
      <p className="ps-meter__message">{getStrengthMessage(result)}</p>
      {result.crackTimeDisplay && password && !result.isPwned && !result.pwnedCheckPending && (
        <p className="ps-meter__meta">Estimated crack time: {result.crackTimeDisplay}</p>
      )}
      {showChecks && password && (
        <ul className="ps-meter__checks">
          <li data-pass={result.checks.length}>At least 12 characters</li>
          <li data-pass={result.checks.lowercase}>Lowercase letter</li>
          <li data-pass={result.checks.uppercase}>Uppercase letter</li>
          <li data-pass={result.checks.number}>Number</li>
          <li data-pass={result.checks.symbol}>Symbol</li>
        </ul>
      )}
      {showSuggestions && (result.feedback.warning || result.feedback.suggestions.length > 0) && (
        <div className="ps-meter__feedback">
          {result.feedback.warning && <p className="ps-meter__warning">{result.feedback.warning}</p>}
          {result.feedback.suggestions.length > 0 && (
            <ul>
              {result.feedback.suggestions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export type PasswordInputProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  showMeter?: boolean;
  showGenerate?: boolean;
  checkPwned?: boolean;
  hibpOptions?: UsePasswordStrengthOptions["hibp"];
  generateOptions?: GeneratePasswordOptions;
  className?: string;
  inputClassName?: string;
};

export function PasswordInput({
  value,
  defaultValue = "",
  onChange,
  placeholder = "Enter password",
  showMeter = true,
  showGenerate = true,
  checkPwned = false,
  hibpOptions,
  generateOptions,
  className = "",
  inputClassName = "",
}: PasswordInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  const setValue = (next: string) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  };

  const result = usePasswordStrength(currentValue, { checkPwned, hibp: hibpOptions });

  return (
    <div className={`ps-input ${className}`.trim()}>
      <div className="ps-input__row">
        <input
          type="password"
          className={`ps-input__field ${inputClassName}`.trim()}
          value={currentValue}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          aria-describedby="password-strength-message"
        />
        {showGenerate && (
          <button
            type="button"
            className="ps-input__generate"
            onClick={() => setValue(generateSecurePassword(generateOptions))}
          >
            Generate
          </button>
        )}
      </div>
      {showMeter && (
        <PasswordStrengthMeter password={currentValue} result={result} />
      )}
      <span id="password-strength-message" className="ps-sr-only">
        {getStrengthMessage(result)}
      </span>
    </div>
  );
}

export { usePasswordStrength, usePasswordGenerator } from "./usePasswordStrength";
export type { PasswordStrengthResult } from "./usePasswordStrength";

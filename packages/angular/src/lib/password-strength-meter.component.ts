import { CommonModule } from "@angular/common";
import { Component, Input, OnChanges, OnDestroy } from "@angular/core";
import {
  analyzePassword,
  getStrengthColor,
  getStrengthMessage,
  type HibpOptions,
  type PasswordStrengthResult,
} from "@pwd-meter/core";
import { PasswordStrengthService } from "./password-strength.service";

@Component({
  selector: "ps-password-strength-meter",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ps-meter" aria-live="polite">
      <div class="ps-meter__track" aria-hidden="true">
        <div class="ps-meter__bar" [style.width.%]="barWidth" [style.backgroundColor]="barColor"></div>
      </div>
      <p class="ps-meter__message">{{ message }}</p>
      <p *ngIf="password && !displayResult.isPwned && !displayResult.pwnedCheckPending" class="ps-meter__meta">
        Estimated crack time: {{ displayResult.crackTimeDisplay }}
      </p>
      <ul *ngIf="showChecks && password" class="ps-meter__checks">
        <li [attr.data-pass]="displayResult.checks.length">At least 12 characters</li>
        <li [attr.data-pass]="displayResult.checks.lowercase">Lowercase letter</li>
        <li [attr.data-pass]="displayResult.checks.uppercase">Uppercase letter</li>
        <li [attr.data-pass]="displayResult.checks.number">Number</li>
        <li [attr.data-pass]="displayResult.checks.symbol">Symbol</li>
      </ul>
      <div
        *ngIf="showSuggestions && (displayResult.feedback.warning || displayResult.feedback.suggestions.length)"
        class="ps-meter__feedback"
      >
        <p *ngIf="displayResult.feedback.warning" class="ps-meter__warning">{{ displayResult.feedback.warning }}</p>
        <ul>
          <li *ngFor="let item of displayResult.feedback.suggestions">{{ item }}</li>
        </ul>
      </div>
    </div>
  `,
})
export class PasswordStrengthMeterComponent implements OnChanges, OnDestroy {
  @Input() password = "";
  @Input() analysis?: PasswordStrengthResult;
  @Input() showSuggestions = true;
  @Input() showChecks = false;
  @Input() checkPwned = false;
  @Input() hibpOptions?: HibpOptions;

  internalResult: PasswordStrengthResult = analyzePassword("");
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private requestId = 0;
  private readonly debounceMs = 400;

  constructor(private readonly passwordStrength: PasswordStrengthService) {}

  ngOnChanges(): void {
    if (this.analysis !== undefined) {
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.requestId += 1;
    this.internalResult = this.passwordStrength.analyze(this.password);

    if (!this.checkPwned || !this.password) {
      return;
    }

    this.internalResult = { ...this.internalResult, pwnedCheckPending: true };
    const id = this.requestId;
    this.debounceTimer = setTimeout(async () => {
      if (id !== this.requestId) {
        return;
      }

      const next = await this.passwordStrength.analyzeAsync(this.password, {
        checkPwned: true,
        hibp: this.hibpOptions,
      });

      if (id !== this.requestId) {
        return;
      }

      this.internalResult = next;
    }, this.debounceMs);
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.requestId += 1;
  }

  get displayResult(): PasswordStrengthResult {
    return this.analysis ?? this.internalResult;
  }

  get barWidth(): number {
    return this.password ? ((this.displayResult.score + 1) / 5) * 100 : 0;
  }

  get barColor(): string {
    return getStrengthColor(this.displayResult.label);
  }

  get message(): string {
    return getStrengthMessage(this.displayResult);
  }
}

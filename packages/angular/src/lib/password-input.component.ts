import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { analyzePassword, getStrengthMessage, type GeneratePasswordOptions, type HibpOptions, type PasswordStrengthResult } from "@pwd-meter/core";
import { PasswordStrengthMeterComponent } from "./password-strength-meter.component";
import { PasswordStrengthService } from "./password-strength.service";

@Component({
  selector: "ps-password-input",
  standalone: true,
  imports: [CommonModule, FormsModule, PasswordStrengthMeterComponent],
  template: `
    <div class="ps-input">
      <div class="ps-input__row">
        <input
          class="ps-input__field"
          type="password"
          [placeholder]="placeholder"
          [(ngModel)]="value"
          (ngModelChange)="onValueChange($event)"
          aria-describedby="password-strength-message"
        />
        <button *ngIf="showGenerate" type="button" class="ps-input__generate" (click)="generate()">Generate</button>
      </div>
      <ps-password-strength-meter
        *ngIf="showMeter"
        [password]="value"
        [analysis]="result"
      ></ps-password-strength-meter>
      <span id="password-strength-message" class="ps-sr-only">{{ strengthMessage }}</span>
    </div>
  `,
})
export class PasswordInputComponent implements OnChanges, OnDestroy {
  @Input() value = "";
  @Input() placeholder = "Enter password";
  @Input() showMeter = true;
  @Input() showGenerate = true;
  @Input() checkPwned = false;
  @Input() hibpOptions?: HibpOptions;
  @Input() generateOptions?: GeneratePasswordOptions;
  @Output() valueChange = new EventEmitter<string>();

  result: PasswordStrengthResult = analyzePassword("");
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private requestId = 0;
  private readonly debounceMs = 400;

  constructor(private readonly passwordStrength: PasswordStrengthService) {}

  ngOnChanges(): void {
    this.scheduleAnalysis();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.requestId += 1;
  }

  get strengthMessage(): string {
    return getStrengthMessage(this.result);
  }

  onValueChange(next: string) {
    this.value = next;
    this.valueChange.emit(next);
    this.scheduleAnalysis();
  }

  generate() {
    const next = this.passwordStrength.generate(this.generateOptions);
    this.onValueChange(next);
  }

  private scheduleAnalysis(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.requestId += 1;
    this.result = this.passwordStrength.analyze(this.value);

    if (!this.checkPwned || !this.value) {
      return;
    }

    this.result = { ...this.result, pwnedCheckPending: true };
    const id = this.requestId;
    this.debounceTimer = setTimeout(async () => {
      if (id !== this.requestId) {
        return;
      }

      const next = await this.passwordStrength.analyzeAsync(this.value, {
        checkPwned: true,
        hibp: this.hibpOptions,
      });

      if (id !== this.requestId) {
        return;
      }

      this.result = next;
    }, this.debounceMs);
  }
}

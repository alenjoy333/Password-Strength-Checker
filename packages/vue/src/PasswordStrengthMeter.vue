<script setup lang="ts">
import { computed } from "vue";
import {
  getStrengthColor,
  getStrengthMessage,
  type HibpOptions,
  type PasswordStrengthResult,
} from "@pwd-meter/core";
import { usePasswordStrength } from "./usePasswordStrength";

const props = withDefaults(
  defineProps<{
    password: string;
    result?: PasswordStrengthResult;
    showSuggestions?: boolean;
    showChecks?: boolean;
    checkPwned?: boolean;
    hibpOptions?: HibpOptions;
  }>(),
  {
    showSuggestions: true,
    showChecks: false,
    checkPwned: false,
  },
);

const ownsAnalysis = computed(() => props.result === undefined);
const strengthOptions = computed(() => ({
  checkPwned: ownsAnalysis.value ? props.checkPwned : false,
  hibp: ownsAnalysis.value ? props.hibpOptions : undefined,
}));

const internalResult = usePasswordStrength(
  () => (ownsAnalysis.value ? props.password : ""),
  strengthOptions,
);
const displayResult = computed(() => props.result ?? internalResult.value);
const width = computed(() => (props.password ? `${((displayResult.value.score + 1) / 5) * 100}%` : "0%"));
const color = computed(() => getStrengthColor(displayResult.value.label));
</script>

<template>
  <div class="ps-meter" aria-live="polite">
    <div class="ps-meter__track" aria-hidden="true">
      <div class="ps-meter__bar" :style="{ width, backgroundColor: color }" />
    </div>
    <p class="ps-meter__message">{{ getStrengthMessage(displayResult) }}</p>
    <p v-if="password && !displayResult.isPwned && !displayResult.pwnedCheckPending" class="ps-meter__meta">
      Estimated crack time: {{ displayResult.crackTimeDisplay }}
    </p>
    <ul v-if="showChecks && password" class="ps-meter__checks">
      <li :data-pass="displayResult.checks.length">At least 12 characters</li>
      <li :data-pass="displayResult.checks.lowercase">Lowercase letter</li>
      <li :data-pass="displayResult.checks.uppercase">Uppercase letter</li>
      <li :data-pass="displayResult.checks.number">Number</li>
      <li :data-pass="displayResult.checks.symbol">Symbol</li>
    </ul>
    <div
      v-if="showSuggestions && (displayResult.feedback.warning || displayResult.feedback.suggestions.length)"
      class="ps-meter__feedback"
    >
      <p v-if="displayResult.feedback.warning" class="ps-meter__warning">{{ displayResult.feedback.warning }}</p>
      <ul>
        <li v-for="item in displayResult.feedback.suggestions" :key="item">{{ item }}</li>
      </ul>
    </div>
  </div>
</template>

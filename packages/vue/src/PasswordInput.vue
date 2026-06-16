<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { generateSecurePassword, getStrengthMessage, type GeneratePasswordOptions, type HibpOptions } from "@pwd-meter/core";
import PasswordStrengthMeter from "./PasswordStrengthMeter.vue";
import { usePasswordStrength } from "./usePasswordStrength";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    showMeter?: boolean;
    showGenerate?: boolean;
    checkPwned?: boolean;
    hibpOptions?: HibpOptions;
    generateOptions?: GeneratePasswordOptions;
  }>(),
  {
    modelValue: "",
    placeholder: "Enter password",
    showMeter: true,
    showGenerate: true,
    checkPwned: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const value = ref(props.modelValue);
watch(
  () => props.modelValue,
  (next) => {
    value.value = next;
  },
);

const strengthOptions = computed(() => ({
  checkPwned: props.checkPwned,
  hibp: props.hibpOptions,
}));

const result = usePasswordStrength(() => value.value, strengthOptions);

function updateValue(next: string) {
  value.value = next;
  emit("update:modelValue", next);
}
</script>

<template>
  <div class="ps-input">
    <div class="ps-input__row">
      <input
        class="ps-input__field"
        type="password"
        :value="value"
        :placeholder="placeholder"
        aria-describedby="password-strength-message"
        @input="updateValue(($event.target as HTMLInputElement).value)"
      />
      <button v-if="showGenerate" type="button" class="ps-input__generate" @click="updateValue(generateSecurePassword(generateOptions))">
        Generate
      </button>
    </div>
    <PasswordStrengthMeter v-if="showMeter" :password="value" :result="result" />
    <span id="password-strength-message" class="ps-sr-only">{{ getStrengthMessage(result) }}</span>
  </div>
</template>

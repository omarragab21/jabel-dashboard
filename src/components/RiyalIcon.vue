<template>
  <!-- The single currency label of the dashboard: «د.أ» (JOD in English). Every amount renders it through this component. -->
  <span class="riyal-icon">{{ CURRENCY_LABEL }}</span>
</template>

<script setup>
import { useCurrencyLabel } from '../composables/useCurrencyLabel';
const { cur: CURRENCY_LABEL } = useCurrencyLabel();
</script>

<style scoped>
.riyal-icon {
  display: inline-block;
  flex: 0 0 auto;
  margin-inline-start: 0.3em;
  font-size: 0.85em;
  font-weight: 600;
  white-space: nowrap;
  direction: rtl;
}
</style>

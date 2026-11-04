<template>
  <span class="amount-with-currency">{{ formatted }}<RiyalIcon /></span>
</template>

<script setup>
import { computed } from 'vue';
import RiyalIcon from './RiyalIcon.vue';

const props = defineProps({
  value: { type: [Number, String], default: 0 },
});

const formatted = computed(() => (Number(props.value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }));
</script>

<style scoped>
.amount-with-currency {
  display: inline-flex;
  align-items: center;
  direction: ltr;
  white-space: nowrap;
}

</style>

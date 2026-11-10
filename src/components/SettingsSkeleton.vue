<template>
  <div class="settings-skeleton" role="status" aria-busy="true" :aria-label="label">
    <span class="sk-shimmer sk-heading"></span>
    <span class="sk-shimmer sk-sub"></span>
    <div class="sk-grid">
      <div v-for="n in rows" :key="n" class="sk-field">
        <span class="sk-shimmer sk-label"></span>
        <span class="sk-shimmer sk-input" :class="{ 'sk-tall': n % 5 === 0 }"></span>
      </div>
    </div>
    <span class="sk-shimmer sk-button"></span>
  </div>
</template>

<script setup>
import { useAdminText } from '../composables/useAdminText';

// Shown while a Site setup page loads its data, instead of an empty or half-filled form.
defineProps({ rows: { type: Number, default: 6 } });
const { tx } = useAdminText();
const label = tx('جاري التحميل', 'Loading');
</script>

<style scoped>
.settings-skeleton { --sk-base: #eef0f3; --sk-glint: #f8f9fb; display: flex; flex-direction: column; gap: 1rem; }
:global(.dark) .settings-skeleton { --sk-base: #1e293b; --sk-glint: #2b3a50; }
.sk-shimmer {
  display: block;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--sk-base) 25%, var(--sk-glint) 50%, var(--sk-base) 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.3s ease-in-out infinite;
}
[dir='rtl'] .sk-shimmer { animation-direction: reverse; }
@keyframes sk-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .sk-shimmer { animation: none; } }
.sk-heading { width: 220px; height: 22px; }
.sk-sub { width: 340px; max-width: 80%; height: 13px; margin-bottom: 0.6rem; }
.sk-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.4rem 1.5rem; }
.sk-field { display: flex; flex-direction: column; gap: 0.5rem; }
.sk-label { width: 120px; height: 12px; }
.sk-input { width: 100%; height: 44px; border-radius: 10px; }
.sk-tall { height: 96px; }
.sk-button { width: 150px; height: 42px; margin-top: 0.6rem; border-radius: 10px; }
@media (max-width: 720px) { .sk-grid { grid-template-columns: 1fr; } }
</style>

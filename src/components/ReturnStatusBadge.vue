<template>
  <span class="return-status-badge" :class="[status, size]">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <template v-if="status === 'pending'">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </template>
      <template v-else-if="status === 'approved'">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </template>
      <template v-else-if="status === 'refunded'">
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </template>
      <template v-else-if="status === 'rejected'">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </template>
      <template v-else>
        <circle cx="12" cy="12" r="10" />
      </template>
    </svg>
    <span>{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { useAdminText } from '../composables/useAdminText';

const props = defineProps({
  status: { type: String, default: 'pending' },
  size: { type: String, default: 'sm' },
});

const { tx } = useAdminText();

const LABELS = {
  pending: ['قيد المراجعة', 'Pending review'],
  approved: ['تمت الموافقة', 'Approved'],
  rejected: ['مرفوض', 'Rejected'],
  refunded: ['تم الاسترجاع', 'Refunded'],
};

const label = computed(() => (LABELS[props.status] ? tx(...LABELS[props.status]) : props.status));
</script>

<style scoped>
.return-status-badge {
  --badge-bg: #f3f4f6;
  --badge-color: #660033;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  background: var(--badge-bg);
  color: var(--badge-color);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
}

.return-status-badge.md {
  gap: 6px;
  padding: 0.3rem 0.8rem;
  font-size: 0.75rem;
}

.return-status-badge.md svg {
  width: 14px;
  height: 14px;
}

.return-status-badge.pending { --badge-bg: #fffbeb; --badge-color: #d97706; }
.return-status-badge.approved { --badge-bg: #eff6ff; --badge-color: #3b82f6; }
.return-status-badge.refunded { --badge-bg: #ecfdf5; --badge-color: #059669; }
.return-status-badge.rejected { --badge-bg: #fef2f2; --badge-color: #dc2626; }
</style>

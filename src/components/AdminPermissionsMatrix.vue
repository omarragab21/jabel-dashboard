<script setup>
import { computed } from 'vue';
import { useAdminText } from '../composables/useAdminText';
import {
  PERMISSION_GROUPS, PERMISSION_MODULES, ACTION_LABELS, ROLE_DESCRIPTIONS, roleLabel,
  hasPermission, togglePermission, toggleModule, toggleGroup, moduleState, countModules, allPermissions, normalizePermissions,
} from '../domain/admins/permissions';

// The "إدارة الصلاحيات" tab: every dashboard module as a card with a checkbox, and under it one checkbox per action
// (read / create / update / delete). `modelValue` is { module: [actions] }, see domain/admins/permissions.js.
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  role: { type: String, default: 'custom' },
  // super_admin always has everything, so the boxes are shown ticked and locked.
  locked: { type: Boolean, default: false },
  showError: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'reset']);

const { tx, locale } = useAdminText();
const label = (pair) => pair[locale.value === 'ar' ? 0 : 1];

const current = computed(() => (props.locked ? allPermissions() : normalizePermissions(props.modelValue)));
const selectedCount = computed(() => countModules(current.value));
const totalCount = PERMISSION_MODULES.length;

const update = (next) => { if (!props.locked) emit('update:modelValue', next); };
const onAction = (key, action, event) => update(togglePermission(current.value, key, action, event.target.checked));
const onModule = (key, event) => update(toggleModule(current.value, key, event.target.checked));
const onGroup = (groupKey, event) => update(toggleGroup(current.value, groupKey, event.target.checked));
const selectAll = () => update(allPermissions());
const clearAll = () => update({});

const groupState = (group) => {
  const states = group.modules.map((module) => moduleState(current.value, module.key));
  if (states.every((state) => state === 'all')) return 'all';
  if (states.every((state) => state === 'none')) return 'none';
  return 'some';
};
const setIndeterminate = (el, state) => { if (el) el.indeterminate = state === 'some'; };
</script>

<template>
  <div class="perm-matrix" data-testid="permissions-matrix">
    <div class="perm-summary">
      <div>
        <strong>{{ roleLabel(role, locale) }}</strong>
        <span class="perm-desc">{{ label(ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.custom) }}</span>
      </div>
      <span class="perm-count" data-testid="perm-count">{{ tx(`${selectedCount} من ${totalCount} قسم`, `${selectedCount} of ${totalCount} modules`) }}</span>
    </div>

    <p v-if="locked" class="perm-note" data-testid="perm-locked-note">{{ tx('الأدمن لديه صلاحيات كاملة على كل الأقسام ولا يمكن تقييدها.', 'The Admin role has full access to every module and cannot be restricted.') }}</p>

    <div v-else class="perm-toolbar">
      <button type="button" class="perm-link" data-testid="perm-select-all" @click="selectAll">{{ tx('تحديد الكل', 'Select all') }}</button>
      <button type="button" class="perm-link" data-testid="perm-clear-all" @click="clearAll">{{ tx('إلغاء الكل', 'Clear all') }}</button>
      <button type="button" class="perm-link" data-testid="perm-reset" @click="emit('reset')">{{ tx('إعادة صلاحيات الدور الافتراضية', 'Reset to the role defaults') }}</button>
    </div>

    <p v-if="showError && !locked && !selectedCount" class="perm-error" data-testid="err-permissions">{{ tx('اختر قسماً واحداً على الأقل', 'Choose at least one module') }}</p>

    <section v-for="group in PERMISSION_GROUPS" :key="group.key" class="perm-group" :data-group="group.key">
      <label class="perm-group-head">
        <input
          type="checkbox"
          :checked="groupState(group) === 'all'"
          :disabled="locked"
          :ref="(el) => setIndeterminate(el, groupState(group))"
          :data-testid="`perm-group-${group.key}`"
          @change="onGroup(group.key, $event)"
        />
        <span>{{ label(group.label) }}</span>
      </label>

      <div class="perm-cards">
        <div v-for="module in group.modules" :key="module.key" :class="['perm-card', { on: moduleState(current, module.key) !== 'none' }]" :data-module="module.key">
          <label class="perm-card-head">
            <input
              type="checkbox"
              :checked="moduleState(current, module.key) === 'all'"
              :disabled="locked"
              :ref="(el) => setIndeterminate(el, moduleState(current, module.key))"
              :data-testid="`perm-module-${module.key}`"
              @change="onModule(module.key, $event)"
            />
            <span>{{ label(module.label) }}</span>
          </label>
          <div class="perm-actions">
            <label v-for="action in module.actions" :key="action" class="perm-action">
              <input
                type="checkbox"
                :checked="hasPermission(current, module.key, action)"
                :disabled="locked"
                :data-testid="`perm-${module.key}-${action}`"
                @change="onAction(module.key, action, $event)"
              />
              <span>{{ label(ACTION_LABELS[action]) }}</span>
            </label>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.perm-matrix { display: flex; flex-direction: column; gap: 0.9rem; }
.perm-summary { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem 0.9rem; background: #f6e9ef; border-radius: 10px; color: #660033; }
.perm-summary strong { display: block; font-size: 0.9rem; font-weight: 800; }
.perm-desc { display: block; font-size: 0.76rem; color: #7a3a58; margin-top: 0.1rem; }
.perm-count { font-size: 0.78rem; font-weight: 800; white-space: nowrap; background: #fff; padding: 0.25rem 0.7rem; border-radius: 999px; }
.perm-note { margin: 0; padding: 0.7rem 0.9rem; background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; border-radius: 10px; font-size: 0.8rem; font-weight: 600; }
.perm-toolbar { display: flex; flex-wrap: wrap; gap: 0.4rem 1.1rem; }
.perm-link { background: none; border: none; padding: 0; color: #660033; font-family: inherit; font-weight: 700; font-size: 0.78rem; cursor: pointer; text-decoration: underline; }
.perm-error { margin: 0; color: #dc2626; font-size: 0.78rem; font-weight: 700; }

.perm-group { border: 1px solid #e5e7eb; border-radius: 12px; padding: 0.8rem; }
.perm-group-head { display: flex; align-items: center; gap: 0.55rem; font-weight: 800; font-size: 0.88rem; color: #111827; cursor: pointer; margin-bottom: 0.7rem; }
.perm-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
.perm-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.6rem 0.7rem; background: #fafafa; transition: border-color 0.15s, background 0.15s; }
.perm-card.on { border-color: #d9a6bd; background: #fff; }
.perm-card-head { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; font-weight: 700; color: #111827; cursor: pointer; }
.perm-actions { display: flex; flex-wrap: wrap; gap: 0.35rem 0.9rem; margin-top: 0.5rem; padding-inline-start: 1.5rem; }
.perm-action { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.76rem; color: #4b5563; cursor: pointer; }
.perm-matrix input[type='checkbox'] { width: 16px; height: 16px; accent-color: #660033; cursor: pointer; margin: 0; flex-shrink: 0; }
.perm-matrix input[type='checkbox']:disabled { cursor: not-allowed; }

@media (max-width: 640px) {
  .perm-cards { grid-template-columns: 1fr; }
}
</style>

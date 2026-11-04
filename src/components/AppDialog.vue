<template>
  <Teleport to="body">
    <Transition name="app-dialog">
      <div
        v-if="dialogState.open"
        class="app-dialog-overlay"
        @click.self="dismiss"
        @keydown.esc.stop="dismiss"
      >
        <div
          ref="panel"
          class="app-dialog"
          :dir="dir"
          :role="dialogState.mode === 'confirm' ? 'alertdialog' : 'dialog'"
          aria-modal="true"
          :aria-labelledby="dialogState.title ? 'app-dialog-title' : undefined"
          aria-describedby="app-dialog-message"
        >
          <div class="app-dialog-icon" :class="`is-${dialogState.type}`" aria-hidden="true">
            <svg v-if="dialogState.type === 'success'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <svg v-else-if="dialogState.type === 'error'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            <svg v-else-if="dialogState.type === 'warning'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
            <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </div>

          <h3 v-if="dialogState.title" id="app-dialog-title" class="app-dialog-title">{{ dialogState.title }}</h3>
          <p id="app-dialog-message" class="app-dialog-message">{{ dialogState.message }}</p>

          <div class="app-dialog-actions" :class="{ single: dialogState.mode === 'alert' }">
            <button ref="confirmBtn" type="button" class="app-dialog-btn primary" :class="{ danger: dialogState.type === 'error' && dialogState.mode === 'confirm' }" @click="closeDialog(true)">
              {{ dialogState.confirmText || (isAr ? (dialogState.mode === 'confirm' ? 'تأكيد' : 'حسناً') : (dialogState.mode === 'confirm' ? 'Confirm' : 'OK')) }}
            </button>
            <button v-if="dialogState.mode === 'confirm'" type="button" class="app-dialog-btn secondary" @click="closeDialog(false)">
              {{ dialogState.cancelText || (isAr ? 'إلغاء' : 'Cancel') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { dialogState, closeDialog } from '../composables/useDialog';

const confirmBtn = ref(null);
const panel = ref(null);

// Follow the language of the text being shown, not the page, so an Arabic
// message never gets an LTR frame and vice versa.
const isAr = computed(() => /[؀-ۿ]/.test(`${dialogState.title} ${dialogState.message}`));
const dir = computed(() => (isAr.value ? 'rtl' : 'ltr'));

const dismiss = () => closeDialog(false);

watch(() => dialogState.open, async (open) => {
  if (!open) return;
  await nextTick();
  confirmBtn.value?.focus();
  panel.value?.addEventListener('keydown', trapTab);
});

const trapTab = (event) => {
  if (event.key !== 'Tab') return;
  const buttons = [...panel.value.querySelectorAll('button')];
  if (!buttons.length) return;
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
};
</script>

<style scoped>
.app-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.app-dialog {
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  padding: 32px 28px 24px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
}

.app-dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  background: #f1f5f9;
  color: #660033;
}
.app-dialog-icon.is-success { background: #ecfdf5; color: #10b981; }
.app-dialog-icon.is-error { background: #fef2f2; color: #e53333; }
.app-dialog-icon.is-warning { background: #fffbeb; color: #d97706; }

.app-dialog-title {
  margin: 0;
  font-size: 18px;
  line-height: 27px;
  font-weight: 700;
  color: #660033;
}

.app-dialog-message {
  margin: 0;
  font-size: 15px;
  line-height: 24px;
  font-weight: 400;
  color: #64748b;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.app-dialog-actions {
  width: 100%;
  margin-top: 12px;
  display: flex;
  flex-direction: row;
  gap: 12px;
}
.app-dialog-actions.single { justify-content: center; }

.app-dialog-btn {
  flex: 1 1 0;
  min-width: 0;
  height: 48px;
  padding: 12px 20px;
  box-sizing: border-box;
  border-radius: 6px;
  font-family: inherit;
  font-size: 16px;
  line-height: 24px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.2s ease, background 0.2s ease, transform 0.1s ease;
}
.app-dialog-btn:focus-visible { outline: 2px solid #660033; outline-offset: 2px; }
.app-dialog-btn:active { transform: translateY(1px); }

.app-dialog-btn.primary { background: #660033; color: #ffffff; border: none; }
.app-dialog-btn.primary:hover { opacity: 0.9; }
.app-dialog-btn.primary.danger { background: #e53333; }
.app-dialog-btn.secondary { background: #ffffff; color: #660033; border: 1.5px solid #660033; }
.app-dialog-btn.secondary:hover { background: #f8fafc; }

.app-dialog-actions:not(.single) .primary { order: 1; }
.app-dialog-actions:not(.single) .secondary { order: 2; }
.app-dialog-actions.single .app-dialog-btn { flex: 0 1 200px; }

.app-dialog-enter-active, .app-dialog-leave-active { transition: opacity 0.18s ease; }
.app-dialog-enter-active .app-dialog, .app-dialog-leave-active .app-dialog { transition: transform 0.18s ease; }
.app-dialog-enter-from, .app-dialog-leave-to { opacity: 0; }
.app-dialog-enter-from .app-dialog, .app-dialog-leave-to .app-dialog { transform: translateY(8px) scale(0.98); }

@media (max-width: 480px) {
  .app-dialog { padding: 28px 20px 20px; }
  .app-dialog-actions:not(.single) { flex-direction: column; }
  .app-dialog-actions.single .app-dialog-btn { flex: 1 1 auto; }
}

@media (prefers-reduced-motion: reduce) {
  .app-dialog-enter-active, .app-dialog-leave-active,
  .app-dialog-enter-active .app-dialog, .app-dialog-leave-active .app-dialog { transition: none; }
}
</style>

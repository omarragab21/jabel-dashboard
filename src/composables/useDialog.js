import { localizeMessage } from '../utils/uiMessages';
import { reactive } from 'vue';

// Promise-based replacement for window.alert / window.confirm, rendered by <AppDialog />.
// Only one dialog is shown at a time; later calls wait in a queue.
export const dialogState = reactive({
  open: false,
  mode: 'alert',
  type: 'info',
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
});

const queue = [];
let resolveCurrent = null;
let closing = false;

const show = (options) => new Promise((resolve) => {
  queue.push({ options, resolve });
  if (!dialogState.open && !closing) next();
});

const next = () => {
  const item = queue.shift();
  if (!item) return;
  resolveCurrent = item.resolve;
  const { title, message, confirmText, cancelText } = item.options;
  Object.assign(dialogState, {
    mode: 'alert', type: 'info', title: '', message: '', confirmText: '', cancelText: '',
  }, item.options, {
    // English mode: known Arabic sentences are shown in English.
    title: localizeMessage(title), message: localizeMessage(message),
    confirmText: localizeMessage(confirmText), cancelText: localizeMessage(cancelText),
    open: true,
  });
};

export const closeDialog = (result = false) => {
  const resolve = resolveCurrent;
  resolveCurrent = null;
  dialogState.open = false;
  closing = true;
  if (resolve) resolve(result);
  // Let the leave transition finish before the next queued dialog appears.
  setTimeout(() => {
    closing = false;
    next();
  }, 180);
};

export const useDialog = () => ({
  alert: (message, options = {}) => show({ ...options, mode: 'alert', message }),
  confirm: (message, options = {}) => show({ ...options, mode: 'confirm', type: options.type || 'warning', message }),
});

// v-lang-only="'ar'" keeps a text input Arabic-only (Latin letters are dropped as the admin types or pastes);
// v-lang-only="'en'" keeps it English-only (Arabic letters are dropped). Digits and punctuation stay allowed.
const LATIN = /[A-Za-z]/g;
const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC]/g;

const clean = (value, lang) => String(value).replace(lang === 'ar' ? LATIN : ARABIC, '');

const handlers = new WeakMap();

export const vLangOnly = {
  mounted(el, binding) {
    const input = el.matches('input, textarea') ? el : el.querySelector('input, textarea');
    if (!input) return;
    const handler = () => {
      if (input.composing) return; // wait for IME composition to finish
      const next = clean(input.value, binding.value);
      if (next === input.value) return;
      const caret = input.selectionStart;
      const removed = input.value.length - next.length;
      input.value = next;
      if (caret != null) input.setSelectionRange(Math.max(0, caret - removed), Math.max(0, caret - removed));
      input.dispatchEvent(new Event('input', { bubbles: true })); // let v-model pick up the cleaned value
    };
    handlers.set(el, { input, handler });
    input.addEventListener('input', handler);
  },
  unmounted(el) {
    const entry = handlers.get(el);
    if (entry) entry.input.removeEventListener('input', entry.handler);
    handlers.delete(el);
  },
};

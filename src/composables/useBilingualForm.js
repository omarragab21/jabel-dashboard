import { inject, provide, reactive } from 'vue';

// Links a form to the <BilingualField> widgets inside it, without passing props to each one.
//   reveal(): every required field missing a language switches to that language and shakes,
//             and the first one scrolls into view (call it when saving is refused).
//   reset():  every field goes back to the dashboard language (call it when the form opens).
const BILINGUAL_FORM = Symbol('bilingual-form');

export function provideBilingualForm() {
  const state = reactive({ revealTick: 0, resetTick: 0 });
  provide(BILINGUAL_FORM, state);
  return {
    reveal: () => { state.revealTick += 1; },
    reset: () => { state.resetTick += 1; },
  };
}

export const injectBilingualForm = () => inject(BILINGUAL_FORM, null);

<template>
  <!-- An add / edit form shown as a page of its own inside the dashboard (the side menu stays), not a dialog.
       Same look as the product editor. -->
  <section class="editor-page" :data-testid="testid">
    <header class="editor-top">
      <button type="button" class="editor-back" data-testid="editor-back" @click="$emit('back')">
        <svg class="editor-back-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        {{ backLabel }}
      </button>
      <div class="editor-titles">
        <h3 class="editor-title">{{ title }}</h3>
        <p v-if="subtitle" class="editor-sub">{{ subtitle }}</p>
      </div>
    </header>
    <div class="editor-card">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  backLabel: { type: String, required: true },
  testid: { type: String, default: 'editor-page' },
});
defineEmits(['back']);
</script>

<style scoped>
.editor-page { display: flex; flex-direction: column; gap: 1.25rem; }
.editor-top { display: flex; align-items: center; gap: 1.1rem; flex-wrap: wrap; }
.editor-back { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 0.95rem; border: 1px solid var(--border-color, #e5e7eb); border-radius: 10px; background: var(--bg-card, #fff); color: var(--text-main, #374151); font-family: inherit; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.15s; }
.editor-back:hover { border-color: #660033; color: #660033; }
.editor-back-ico { flex: 0 0 auto; }
/* Only the back arrow turns round in English (the page's <html dir>); nothing else is mirrored. */
:root[dir='ltr'] .editor-back-ico { transform: scaleX(-1); }
.editor-titles { min-width: 0; }
.editor-title { margin: 0; font-size: 1.3rem; font-weight: 800; color: var(--text-main, #111827); }
.editor-sub { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--text-muted, #9ca3af); }
.editor-card { background: var(--bg-card, #fff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 18px; padding: 1.5rem; min-width: 0; width: 100%; box-sizing: border-box; }
@media (max-width: 640px) {
  .editor-card { padding: 1rem; }
}
</style>

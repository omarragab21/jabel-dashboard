const SENSITIVE_KEY_RE = /token|password|secret|authorization|card|cvv|iban/i;

const redactData = (input) => {
  if (!input || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map(redactData);
  return Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, SENSITIVE_KEY_RE.test(k) ? '[redacted]' : redactData(v)])
  );
};

export const logPayment = (tag, message, data = null) => {
  if (!import.meta.env?.DEV) return;
  const formattedTag = `[PayTabs ${tag}]`;
  const safeData = data !== null ? redactData(data) : null;

  if (safeData !== null) {
    console.log(formattedTag, message, safeData);
  } else {
    console.log(formattedTag, message);
  }

  // Forward to Vite dev server terminal endpoint if running in browser during development
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      fetch('/__terminal_log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: formattedTag,
          message,
          data: safeData,
          timestamp: new Date().toLocaleTimeString(),
        }),
      }).catch(() => {});
    } catch (_) {
      // Ignore errors when dev server endpoint is offline
    }
  }
};

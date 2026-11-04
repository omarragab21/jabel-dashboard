// The public notification sent to customers when a discount code is added (shown on the site's bell,
// toast and notification list, in the customer's language). The link carries the code and its dates, so
// the site can open a "copy the code" dialog; website/src/domain/notifications/couponLink.js reads it back.

// Isolated so Arabic text does not reorder the digits of a date or code.
const iso = (value) => `\u2066${value}\u2069`;
const day = (value) => String(value || '').slice(0, 10);

const discountText = (type, value, lang) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  const shown = amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (type === 'fixed') return lang === 'ar' ? `${shown} د.أ` : `${shown} JOD`;
  return `${shown}%`;
};

/** `payload` is what the dashboard sends to the API (see toDiscountPayload). Returns null without a code. */
export const couponAnnouncement = (payload = {}) => {
  const code = String(payload.code || '').trim();
  if (!code) return null;
  const from = day(payload.start_date);
  const to = day(payload.end_date);
  const off = { ar: discountText(payload.type, payload.value, 'ar'), en: discountText(payload.type, payload.value, 'en') };

  const params = new URLSearchParams({ coupon: code });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (off.en) { params.set('type', payload.type === 'fixed' ? 'fixed' : 'percentage'); params.set('value', String(Number(payload.value))); }

  const period = {
    ar: from && to ? `من ${iso(from)} إلى ${iso(to)}` : (from ? `ابتداءً من ${iso(from)}` : (to ? `حتى ${iso(to)}` : '')),
    en: from && to ? `from ${from} to ${to}` : (from ? `starting ${from}` : (to ? `until ${to}` : '')),
  };
  const join = (parts) => parts.filter(Boolean).join(' — ');

  return {
    type: 'offer',
    title: { ar: 'كود خصم جديد', en: 'New discount code' },
    body: {
      ar: join([`استخدم الكود ${iso(code)}`, off.ar && `خصم ${off.ar}`, period.ar]),
      en: join([`Use code ${code}`, off.en && `${off.en} off`, period.en]),
    },
    link: `/?${params.toString()}`,
    adminLink: '/admin/discounts',
  };
};

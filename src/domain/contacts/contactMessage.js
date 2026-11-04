// Customer messages (رسائل العملاء) from the website contact form.
//   GET    /v1/contacts               → { id, name, email, phone, type, message, seen: 0|1, created_at }
//   PATCH  /v1/contacts/{id}/seen     → marks it read and returns it; there is no route to mark it unread
//   DELETE /v1/contacts/{id}
// The list ignores search and seen filters, so both run on the loaded rows.

export const isSeen = (raw = {}) => raw.seen === true || raw.seen === 1 || raw.seen === '1' || raw.status === 'read';

export const toContactMessage = (raw = {}) => ({
  ...raw,
  subject: raw.subject || raw.type || '',
  status: isSeen(raw) ? 'read' : 'unread',
});

// Older messages carry an English code; the website form now sends the Arabic label itself.
const TYPE_LABELS = {
  inquiry: ['استفسار', 'Inquiry'],
  complaint: ['شكوى', 'Complaint'],
  suggestion: ['اقتراح', 'Suggestion'],
  support: ['دعم فني', 'Support'],
  maintenance: ['طلب صيانة', 'Maintenance'],
  other: ['أخرى', 'Other'],
};

export const contactTypeLabel = (type, lang = 'ar') => {
  const pair = TYPE_LABELS[String(type || '').trim().toLowerCase()];
  return pair ? pair[lang === 'ar' ? 0 : 1] : String(type || '');
};

const normalize = (value) => String(value ?? '').toLowerCase().trim();

export const filterContacts = (messages = [], { search = '', status = '' } = {}) => {
  const query = normalize(search);
  return messages.filter((message) => {
    if (status && message.status !== status) return false;
    if (!query) return true;
    return [message.name, message.email, message.phone, message.subject, message.message]
      .some((field) => normalize(field).includes(query));
  });
};

// Newest first; unread rows are not moved so the table does not jump when one is read.
export const sortContacts = (messages = []) => [...messages]
  .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || Number(b.id) - Number(a.id));

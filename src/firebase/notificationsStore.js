// Notification feed stored in Firestore (collection "notifications").
//
// The dashboard writes a document when something public happens (new product, new offer) and every open
// page listens to the collection in real time, so the same list shows up in the dashboard and on the site.
// Documents hold public information only (names and links), never customer or order data.
// Rules: /firestore.rules. Read state is kept per device (there is no Firebase sign-in to attach it to).
import { addDoc, collection, connectFirestoreEmulator, getFirestore, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from './webPush.js';

export const NOTIFICATIONS_COLLECTION = 'notifications';
const FEED_SIZE = 30;

let database = null;
export const firestore = () => {
  if (database) return database;
  const app = firebaseApp();
  if (!app) return null;
  database = getFirestore(app);
  // Local testing against the Firestore emulator: VITE_FIRESTORE_EMULATOR=localhost:8080
  const emulator = import.meta.env.VITE_FIRESTORE_EMULATOR;
  if (emulator) {
    const [host, port] = String(emulator).split(':');
    connectFirestoreEmulator(database, host, Number(port) || 8080);
  }
  return database;
};

const text = (value) => (typeof value === 'string' ? value.trim() : '');

/** One Firestore document -> the shape the UI shows, in the given language ('ar' | 'en'). */
export const toNotification = (snapshot, lang = 'ar') => {
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  const pick = (name) => text(data[`${name}_${lang}`]) || text(data[`${name}_ar`]) || text(data[`${name}_en`]);
  const created = data.createdAt?.toMillis?.();
  return {
    id: snapshot.id,
    title: pick('title'),
    body: pick('body'),
    link: text(data.link),
    adminLink: text(data.adminLink),
    type: text(data.type),
    at: Number.isFinite(created) ? created : Date.now(),
  };
};

/**
 * Listens to the latest notifications. `onChange(list, fresh)` gets the whole list (newest first) and the
 * notifications that arrived after the first load, so the first load never pops up old items.
 * Returns an unsubscribe function; does nothing when Firebase is not configured.
 */
export const subscribeNotifications = (onChange, { lang = 'ar', onError } = {}) => {
  const db = firestore();
  if (!db) return () => {};
  let first = true;
  return onSnapshot(
    query(collection(db, NOTIFICATIONS_COLLECTION), orderBy('createdAt', 'desc'), limit(FEED_SIZE)),
    (snapshot) => {
      const list = snapshot.docs.map((doc) => toNotification(doc, lang));
      const fresh = first ? [] : snapshot.docChanges().filter((change) => change.type === 'added' && !change.doc.metadata.hasPendingWrites).map((change) => toNotification(change.doc, lang));
      first = false;
      onChange(list, fresh);
    },
    (error) => onError?.(error),
  );
};

const READ_KEY = 'notifications_read';
export const readIds = () => {
  try {
    const list = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
    return new Set(Array.isArray(list) ? list : []);
  } catch {
    return new Set();
  }
};
export const markRead = (ids) => {
  try {
    const next = new Set([...readIds(), ...ids]);
    localStorage.setItem(READ_KEY, JSON.stringify([...next].slice(-200)));
  } catch { /* storage unavailable */ }
};

const clip = (value, max) => text(value).slice(0, max);

/**
 * Dashboard only: adds a public notification for everyone using the site and the dashboard.
 * `title` / `body` are { ar, en }. Best effort: a failure here must never break the action that caused it.
 */
export const publishNotification = async ({ type, title, body = {}, link = '/', adminLink = '/admin/dashboard' }) => {
  try {
    const db = firestore();
    if (!db) return false;
    const doc = {
      type: clip(type, 20),
      title_ar: clip(title.ar || title.en, 120),
      title_en: clip(title.en || title.ar, 120),
      body_ar: clip(body.ar || body.en, 300),
      body_en: clip(body.en || body.ar, 300),
      link: clip(link, 200),
      adminLink: clip(adminLink, 200),
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), doc);
    return true;
  } catch (error) {
    console.warn('Could not publish the notification', error?.code || error?.message);
    return false;
  }
};

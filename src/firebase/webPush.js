// Firebase Cloud Messaging (web push) for the browser.
//
// The configuration comes from VITE_FIREBASE_* variables (.env.local locally, the hosting environment in
// production) and is never written in the source. These values are public by design: the browser needs them
// to subscribe, so anyone can read them from the built page. What protects the project is restricting the
// API key to the site's domains in Google Cloud and keeping the server key (service account) off the client.
//
// /firebase-messaging-sw.js shows the notifications. It runs in its own scope so it never fights with the
// site's caching worker (/sw.js) and it needs no keys: FCM delivers { notification, data, fcmOptions }.
import { getApps, initializeApp } from 'firebase/app';
import { getMessaging, getToken, deleteToken, isSupported } from 'firebase/messaging';
import { PUSH_SW_SCOPE, PUSH_SW_URL } from './pushConstants.js';

export { PUSH_SW_SCOPE, PUSH_SW_URL };

const TOKEN_KEY = 'push_token';

const env = import.meta.env;
export const firebaseConfig = Object.freeze({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
});
const vapidKey = env.VITE_FIREBASE_VAPID_KEY;

export const isPushConfigured = () => Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId && vapidKey,
);

export const firebaseApp = () => (isPushConfigured() ? getApps()[0] || initializeApp(firebaseConfig) : null);

/** 'unconfigured' | 'unsupported' | 'default' | 'granted' | 'denied' */
export const pushStatus = async () => {
  if (!isPushConfigured()) return 'unconfigured';
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  try {
    if (!(await isSupported())) return 'unsupported';
  } catch {
    return 'unsupported';
  }
  return Notification.permission;
};

const activeWorker = (registration) => new Promise((resolve) => {
  if (registration.active) return resolve(registration);
  const worker = registration.installing || registration.waiting;
  if (!worker) return resolve(registration);
  worker.addEventListener('statechange', () => { if (worker.state === 'activated') resolve(registration); });
});

const pushRegistration = async () => activeWorker(await navigator.serviceWorker.register(PUSH_SW_URL, { scope: PUSH_SW_SCOPE }));

const readToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } };
const saveToken = (token) => { try { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ } };
export const savedPushToken = readToken;

/**
 * Asks for permission (call it from a click) and returns this browser's FCM token.
 * { status, token } — token is '' unless status is 'granted'.
 */
export const enablePush = async () => {
  const before = await pushStatus();
  if (before === 'unconfigured' || before === 'unsupported' || before === 'denied') return { status: before, token: '' };
  const permission = before === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return { status: permission, token: '' };
  const registration = await pushRegistration();
  const token = await getToken(getMessaging(firebaseApp()), { vapidKey, serviceWorkerRegistration: registration });
  saveToken(token);
  return { status: 'granted', token };
};

/** Refreshes the token silently when permission was already given (tokens can rotate). */
export const refreshPushToken = async () => ((await pushStatus()) === 'granted' ? enablePush() : { status: await pushStatus(), token: '' });

export const disablePush = async () => {
  try {
    if (isPushConfigured()) await deleteToken(getMessaging(firebaseApp()));
  } catch { /* already gone */ }
  saveToken('');
};

/** Same-origin path only, so a push can never send the user to another site. */
export const safePushLink = (link, fallback = '/') => {
  try {
    const url = new URL(String(link || fallback), window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Shows a system notification from this browser (no push server involved) when permission was given.
 * Used for events the page itself notices, such as a new order. Returns false when it cannot.
 */
export const showLocalNotification = async ({ title, body = '', link = '/', tag }) => {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
    const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_SCOPE);
    if (!registration) return false;
    await registration.showNotification(title, { body, icon: '/favicon.png', badge: '/favicon.png', dir: 'auto', tag, data: { link: safePushLink(link) } });
    return true;
  } catch {
    return false;
  }
};

/**
 * Messages from the push worker: { type: 'push-message', title, body, link, data } while a page is open,
 * and { type: 'push-open', link } when a notification is clicked. Returns an unsubscribe function.
 */
export const onPushEvent = (handler) => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => {};
  const listener = (event) => {
    const message = event.data;
    if (message && (message.type === 'push-message' || message.type === 'push-open')) handler(message);
  };
  navigator.serviceWorker.addEventListener('message', listener);
  return () => navigator.serviceWorker.removeEventListener('message', listener);
};

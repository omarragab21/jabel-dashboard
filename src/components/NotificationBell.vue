<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminText } from '../composables/useAdminText';
import tijaraAdminApi from '../infrastructure/api/tijaraAdminApi';
import { SEEN_KEY, findNewOrders, toOrderAlert } from '../domain/orders/orderAlerts';
import { armNotificationSound, playNotificationSound } from '../utils/notificationSound';

// The header bell: turns on web push for this browser and lists the notifications.
// Public notifications (new product, new offer) come live from Firestore; new-order alerts are found by polling.
// Firebase is loaded only when the layout mounts, never in the login bundle.
const INBOX_KEY = 'admin_push_inbox';
const INBOX_MAX = 20;

const { tx, locale } = useAdminText();
const POLL_MS = 30000;
const router = useRouter();

const open = ref(false);
const status = ref('');
const busy = ref(false);
const failed = ref(false);
const inbox = ref([]);
const feed = ref([]);
const feedRead = ref(new Set());
let push = null;
let feedStore = null;
let stopListening = () => {};
let stopFeed = () => {};

const readInbox = () => {
  try {
    const list = JSON.parse(localStorage.getItem(INBOX_KEY) || '[]');
    return Array.isArray(list) ? list.slice(0, INBOX_MAX) : [];
  } catch {
    return [];
  }
};
const writeInbox = () => {
  try { localStorage.setItem(INBOX_KEY, JSON.stringify(inbox.value)); } catch { /* storage unavailable */ }
};
inbox.value = readInbox();

// One list: Firestore notifications (link = the dashboard page) and local order alerts, newest first.
const items = computed(() => [
  ...feed.value.map((item) => ({ ...item, link: item.adminLink, read: feedRead.value.has(item.id) })),
  ...inbox.value,
].sort((a, b) => b.at - a.at));

const unread = computed(() => items.value.filter((item) => !item.read).length);

const toggle = () => {
  open.value = !open.value;
  if (open.value && unread.value) {
    inbox.value = inbox.value.map((item) => ({ ...item, read: true }));
    writeInbox();
    if (feedStore) {
      feedStore.markRead(feed.value.map((item) => item.id));
      feedRead.value = feedStore.readIds();
    }
  }
};

const enable = async () => {
  busy.value = true;
  failed.value = false;
  try {
    const result = await push.enablePush();
    status.value = result.status;
  } catch {
    failed.value = true;
  } finally {
    busy.value = false;
  }
};

const go = (link) => {
  if (!push || !link) return;
  open.value = false;
  router.push(push.safePushLink(link, '/admin/dashboard')).catch(() => {});
};

const clearInbox = () => {
  inbox.value = [];
  writeInbox();
};

const timeText = (at) => {
  const date = new Date(at);
  return Number.isNaN(date.getTime()) ? '' : `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`;
};

const addAlert = (alert) => {
  const at = Date.now();
  inbox.value = [{ id: `${alert.key}-${at}`, title: alert.title, body: alert.body, link: alert.link, at, read: open.value }, ...inbox.value].slice(0, INBOX_MAX);
  writeInbox();
};

let polling = false;
// New orders show up in the bell (and as a system notification when allowed) within 30 seconds.
const checkOrders = async () => {
  if (polling) return;
  polling = true;
  try {
    const response = await tijaraAdminApi.listOrders({ page: 1 });
    const orders = Array.isArray(response.data?.data) ? response.data.data : [];
    let seen = null;
    try { seen = localStorage.getItem(SEEN_KEY); } catch { /* storage unavailable */ }
    const { baseline, fresh } = findNewOrders(orders, seen);
    try { localStorage.setItem(SEEN_KEY, String(baseline)); } catch { /* storage unavailable */ }
    if (!fresh.length) return;
    playNotificationSound();
    fresh.forEach((order) => {
      const alert = toOrderAlert(order, locale.value);
      addAlert(alert);
      push?.showLocalNotification({ title: alert.title, body: alert.body, link: alert.link, tag: alert.key });
    });
    window.dispatchEvent(new CustomEvent('admin-orders-new', { detail: { count: fresh.length } }));
  } catch { /* the next check tries again */ } finally {
    polling = false;
  }
};
let pollTimer;
const onVisible = () => { if (document.visibilityState === 'visible') checkOrders(); };

const onKey = (event) => { if (event.key === 'Escape') open.value = false; };

onMounted(async () => {
  armNotificationSound();
  window.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisible);
  try {
    push = await import('../firebase/webPush.js');
    status.value = await push.pushStatus();
    if (status.value === 'granted') {
      push.refreshPushToken().catch(() => {});
    }
    stopListening = push.onPushEvent((message) => {
      if (message.type === 'push-open') go(message.link);
      else playNotificationSound();
    });
  } catch {
    status.value = 'unsupported';
  }
  try {
    feedStore = await import('../firebase/notificationsStore');
    feedRead.value = feedStore.readIds();
    stopFeed = feedStore.subscribeNotifications((list, fresh) => {
      feed.value = list;
      if (fresh.length) playNotificationSound();
      // A tab in the background gets a system notification for what just arrived.
      if (document.visibilityState === 'hidden') fresh.forEach((item) => push?.showLocalNotification({ title: item.title, body: item.body, link: item.adminLink, tag: item.id }));
    }, { lang: locale.value });
  } catch { /* the bell still works without the live feed */ }
  checkOrders();
  pollTimer = setInterval(() => { if (document.visibilityState === 'visible') checkOrders(); }, POLL_MS);
});
onUnmounted(() => {
  stopListening();
  stopFeed();
  clearInterval(pollTimer);
  window.removeEventListener('keydown', onKey);
  document.removeEventListener('visibilitychange', onVisible);
});
</script>

<template>
  <div class="bell-wrap" data-testid="notification-bell">
    <button
      type="button" class="notification-btn" :aria-expanded="open"
      :title="tx('الإشعارات', 'Notifications')" :aria-label="tx('الإشعارات', 'Notifications')"
      data-testid="bell-button" @click="toggle"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      <span v-if="unread" class="notification-count" data-testid="bell-unread">{{ unread > 9 ? '9+' : unread }}</span>
    </button>

    <div v-if="open" class="bell-backdrop" @click="open = false"></div>
    <div v-if="open" class="bell-panel" role="dialog" :aria-label="tx('الإشعارات', 'Notifications')" data-testid="bell-panel">
      <div class="panel-head">
        <strong>{{ tx('الإشعارات', 'Notifications') }}</strong>
        <button v-if="inbox.length" type="button" class="text-btn" @click="clearInbox">{{ tx('مسح الكل', 'Clear all') }}</button>
      </div>

      <div class="push-state" :class="status" data-testid="push-state" :data-status="status">
        <template v-if="status === 'granted'">
          <span class="dot on"></span>
          <span>{{ tx('الإشعارات مفعّلة على هذا المتصفح', 'Notifications are on for this browser') }}</span>
        </template>
        <template v-else-if="status === 'default'">
          <span>{{ tx('فعّل الإشعارات لتصلك المستجدات حتى عند إغلاق الصفحة.', 'Turn on notifications to hear about new activity even when this page is closed.') }}</span>
          <button type="button" class="enable-btn" :disabled="busy" data-testid="push-enable" @click="enable">
            {{ busy ? tx('جارٍ التفعيل...', 'Turning on...') : tx('تفعيل الإشعارات', 'Turn on notifications') }}
          </button>
        </template>
        <span v-else-if="status === 'denied'">{{ tx('الإشعارات محظورة في المتصفح. اسمح بها من رمز القفل بجوار عنوان الصفحة.', 'Notifications are blocked. Allow them from the lock next to the address bar.') }}</span>
        <span v-else-if="status === 'unconfigured'">{{ tx('إعدادات Firebase غير مكتملة في بيئة التشغيل.', 'Firebase settings are missing in this environment.') }}</span>
        <span v-else-if="status === 'unsupported'">{{ tx('هذا المتصفح لا يدعم الإشعارات.', 'This browser does not support notifications.') }}</span>
        <span v-else>{{ tx('جارٍ التحقق...', 'Checking...') }}</span>
        <span v-if="failed" class="error">{{ tx('تعذّر التفعيل، يُرجى المحاولة مرة أخرى.', 'Could not turn them on, please try again.') }}</span>
      </div>

      <ul v-if="items.length" class="inbox" data-testid="bell-inbox">
        <li v-for="item in items" :key="item.id" :class="{ link: item.link, unread: !item.read }" data-testid="bell-item" @click="go(item.link)">
          <strong>{{ item.title }}</strong>
          <span v-if="item.body">{{ item.body }}</span>
          <small dir="ltr">{{ timeText(item.at) }}</small>
        </li>
      </ul>
      <p v-else class="empty">{{ tx('لا توجد إشعارات حتى الآن', 'No notifications yet') }}</p>

    </div>
  </div>
</template>

<style scoped>
.bell-wrap { position: relative; }
.notification-btn { background: none; border: none; color: #6b7280; cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 50%; transition: all 0.2s; margin-inline-end: 0.5rem; }
.notification-btn:hover { background: var(--bg-main); color: var(--text-main); }
.notification-count { position: absolute; top: 3px; inset-inline-end: 2px; min-width: 17px; height: 17px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; background: #dc2626; color: #fff; font-size: 0.62rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 2px solid var(--bg-topbar, #fff); }
.bell-backdrop { position: fixed; inset: 0; z-index: 1400; }
.bell-panel { position: absolute; top: calc(100% + 8px); inset-inline-end: 0; z-index: 1401; width: 340px; max-width: calc(100vw - 24px); background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,0.14); overflow: hidden; font-family: 'IBM Plex Sans Arabic', sans-serif; color: #111827; }
.panel-head { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; }
.text-btn { background: none; border: none; color: #660033; font-family: inherit; font-weight: 700; font-size: 0.76rem; cursor: pointer; }
.push-state { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #fafafa; border-bottom: 1px solid #f0f0f0; font-size: 0.78rem; color: #4b5563; }
.push-state.denied, .push-state.unconfigured { color: #b45309; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.on { background: #16a34a; }
.enable-btn { background: #660033; color: #fff; border: none; border-radius: 8px; padding: 0.45rem 0.9rem; font-family: inherit; font-weight: 700; font-size: 0.78rem; cursor: pointer; }
.enable-btn:disabled { opacity: 0.6; cursor: wait; }
.error { color: #dc2626; font-weight: 600; width: 100%; }
.inbox { list-style: none; margin: 0; padding: 0; max-height: 320px; overflow-y: auto; }
.inbox li { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.7rem 1rem; border-bottom: 1px solid #f3f4f6; font-size: 0.8rem; }
.inbox li.link { cursor: pointer; }
.inbox li.unread strong::before { content: ''; display: inline-block; width: 7px; height: 7px; margin-inline-end: 6px; border-radius: 50%; background: #dc2626; }
.inbox li.link:hover { background: #fafafa; }
.inbox li span { color: #4b5563; }
.inbox li small { color: #9ca3af; font-size: 0.7rem; }
.empty { margin: 0; padding: 1.4rem 1rem; text-align: center; color: #9ca3af; font-size: 0.8rem; }
</style>

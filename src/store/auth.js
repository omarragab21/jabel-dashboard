/**
 * Auth Store - Customer Authentication
 * 
 * Simple, clean, reactive state for customer sessions.
 * Token is stored under 'c_token' to avoid conflicts with admin token.
 */
import { reactive, computed } from 'vue';
import api from '../config/axios';
import { cartState } from './cart';
import { clearCustomerToken, getCustomerToken, setCustomerToken } from '../utils/customerSession.js';

const TOKEN_KEY = 'c_token';

// ─── State ────────────────────────────────────────────────────────────────────
export const authState = reactive({
  token: getCustomerToken(),
  user: null,
  loading: false,
});

// ─── Computed ─────────────────────────────────────────────────────────────────
export const isLoggedIn = computed(() => !!authState.token);
export const currentUser = computed(() => authState.user);

// ─── Actions ──────────────────────────────────────────────────────────────────
export const authActions = {
  /**
   * Run on app mount to restore user from existing token
   */
  async init() {
    if (!authState.token) return;
    try {
      const res = await api.get('/v1/user');
      const rawData = res.data;
      // Aggressive extraction: check all possible wrappers used by Laravel Resources
      const finalUser = rawData.data || rawData.customer || rawData.user || rawData;
      authState.user = finalUser;
      cartState.syncWithToken();
    } catch (err) {
      // Token invalid or expired → clear it silently
      if (err.response?.status === 401) {
        this._clearSession();
      }
    }
  },

  /**
   * Login with email & password
   */
  async login(credentials, options = {}) {
    authState.loading = true;
    try {
      const res = await api.post('/v1/admin/login', credentials);
      this._setSession(res.data.token, res.data.user || res.data.admin, options.remember ?? true);
      return res.data;
    } finally {
      authState.loading = false;
    }
  },

  /**
   * Register a new customer
   */
  async register(data) {
    authState.loading = true;
    try {
      const res = await api.post('/v1/register', data);
      this._setSession(res.data.token, res.data.user || res.data.admin || res.data.customer);
      return res.data;
    } finally {
      authState.loading = false;
    }
  },

  /**
   * Logout the current customer
   */
  async logout() {
    try {
      await api.post('/v1/logout');
    } catch (_) {
      // Even if the server call fails, clear locally
    }
    this._clearSession();
    window.location.href = '/';
  },

  // ─── Private Helpers ────────────────────────────────────────────────────────
  _setSession(token, user, remember = true) {
    authState.token = token;
    authState.user = user;
    setCustomerToken(token, remember);
    // Preserve any guest cart/wishlist by moving it to the new token key
    cartState.migrateToToken(token);
    cartState.syncWithToken();
  },

  _clearSession() {
    // Clear the authenticated user's data before removing the token, otherwise
    // cartState would resolve the guest storage keys and leave user data behind.
    cartState.clear();
    authState.token = null;
    authState.user = null;
    clearCustomerToken();
  },
};

import api from '../config/axios';

export const authService = {
  /**
   * Admin login
   */
  async login(credentials) {
    const response = await api.post('/v1/admin/login', credentials);
    return response.data;
  },

  /**
   * Customer registration
   */
  async register(userData) {
    const response = await api.post('/v1/register', userData);
    return response.data;
  },

  /**
   * Customer logout
   */
  async logout() {
    const response = await api.post('/v1/logout');
    return response.data;
  },

  /**
   * Fetch current authenticated customer profile & wallet balance
   */
  async getUserProfile() {
    const response = await api.get('/frontend/user');
    return response.data?.data || response.data;
  },

  /**
   * Update customer profile info
   */
  async updateProfile(profileData) {
    const response = await api.put('/frontend/profile', profileData);
    return response.data;
  },

  /**
   * Change customer password
   */
  async changePassword(passwordData) {
    const response = await api.post('/frontend/change-password', passwordData);
    return response.data;
  },

  /**
   * Fetch wallet balance & transactions
   */
  async getWallet() {
    const response = await api.get('/frontend/wallet');
    return response.data?.data || response.data;
  },

  /**
   * Customer addresses
   */
  async getAddresses() {
    const response = await api.get('/frontend/addresses');
    return response.data?.data || response.data;
  },

  async addAddress(addressData) {
    const response = await api.post('/frontend/addresses', addressData);
    return response.data?.data || response.data;
  },

  async deleteAddress(addressId) {
    const response = await api.delete(`/frontend/addresses/${addressId}`);
    return response.data;
  },
};

export default authService;

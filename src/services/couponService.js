import api from '../config/axios';

export const couponService = {
  async validate(code, amount) {
    const normalizedCode = String(code ?? '').trim();
    const response = await api.post('/frontend/coupons/validate', {
      code: normalizedCode,
      amount,
      subtotal: amount,
    });
    return response.data;
  },
};

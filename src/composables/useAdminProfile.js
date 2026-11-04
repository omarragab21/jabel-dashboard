import { ref, readonly } from 'vue';

// The signed-in admin, kept in sync between the header menu and the profile page.
// The login response is stored under `admin`; the profile API refreshes it.
const read = () => {
  try { return JSON.parse(localStorage.getItem('admin') || '{}') || {}; } catch { return {}; }
};

const profile = ref(read());

export const useAdminProfile = () => {
  const apply = (data = {}) => {
    const next = {
      ...profile.value,
      id: data.id ?? profile.value.id,
      name: data.name ?? profile.value.name,
      email: data.email ?? profile.value.email,
      phone_number: data.phone ?? data.phone_number ?? profile.value.phone_number,
      image_url: data.avatar ?? data.image_url ?? profile.value.image_url,
      role: data.role ?? profile.value.role,
      created_at: data.createdAt ?? data.created_at ?? profile.value.created_at,
    };
    profile.value = next;
    try { localStorage.setItem('admin', JSON.stringify(next)); } catch { /* storage unavailable */ }
  };
  const reload = () => { profile.value = read(); };
  return { profile: readonly(profile), apply, reload };
};

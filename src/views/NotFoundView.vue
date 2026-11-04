<template>
  <main class="min-h-screen grid place-items-center bg-white px-6 text-center" dir="rtl">
    <section>
      <p class="text-sm font-semibold text-gray-500">404</p>
      <h1 class="mt-3 text-2xl font-bold text-gray-900">الصفحة غير موجودة</h1>
      <p class="mt-2 text-gray-600">المسار المطلوب غير موجود داخل لوحة التحكم.</p>
      <router-link to="/admin/dashboard" class="mt-6 inline-flex rounded-lg bg-gray-900 px-5 py-3 text-white">
        العودة للوحة التحكم
      </router-link>
    </section>
  </main>
</template>

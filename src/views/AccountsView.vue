<script setup>
import { useAdminText } from '../composables/useAdminText';

const developerName = "Antigravity Dev Team";
const { tx } = useAdminText();
</script>

<template>
  <div class="accounts-page flex-center">
    <div class="maintenance-card fade-in">
       <!-- Icon Container -->
       <div class="illustration-box">
          <div class="gear-wrapper">
             <svg class="gear gear-1" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#660033" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
             <svg class="gear gear-2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
       </div>

       <!-- Text -->
       <div class="content">
          <h1>{{ tx('التقارير المالية', 'Financial Reports') }}</h1>
          <div class="status-badge">{{ tx('قيد التطوير', 'Under development') }}</div>
          <p>{{ tx('هذا القسم يخضع حالياً لعمليات تحسين تقنية لضمان أفضل تجربة لإدارة الحسابات والبيانات المالية. سنكون جاهزين قريباً!', 'This section is being improved to provide a better experience for managing accounts and financial data. We will be ready soon!') }}</p>
       </div>

       <!-- Progress Bar -->
       <div class="progress-container">
          <div class="progress-bar">
             <div class="progress-fill"></div>
          </div>
          <div class="progress-text">{{ tx('جاري العمل... 75%', 'In progress... 75%') }}</div>
       </div>

       <!-- Features Hint -->
       <div class="features-list">
          <div class="f-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> {{ tx('تقارير الأرباح', 'Profit reports') }}</div>
          <div class="f-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> {{ tx('سجل السحوبات', 'Withdrawal history') }}</div>
          <div class="f-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> {{ tx('الرسوم البيانية', 'Charts') }}</div>
       </div>
    </div>
  </div>
</template>

<style scoped>
.accounts-page {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  direction: inherit;
  padding: 20px;
}

.maintenance-card {
  background: white;
  padding: 50px 30px;
  border-radius: 30px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.05);
  text-align: center;
  max-width: 500px;
  width: 100%;
  border: 1px solid #f3f4f6;
  position: relative;
  overflow: hidden;
}

.illustration-box {
  margin-bottom: 30px;
  display: flex;
  justify-content: center;
}

.gear-wrapper {
  position: relative;
  width: 100px;
  height: 80px;
}

.gear {
  position: absolute;
  animation: rotate 8s linear infinite;
}

.gear-1 {
  top: 0;
  right: 15px;
}

.gear-2 {
  bottom: 0px;
  left: 15px;
  animation-direction: reverse;
  animation-duration: 6s;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.content h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #111827;
  margin: 0 0 10px;
}

.status-badge {
  display: inline-block;
  background: #f3f4f6;
  color: #660033;
  padding: 6px 20px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 20px;
  border: 1px solid #e5e7eb;
}

.content p {
  color: #6b7280;
  line-height: 1.8;
  font-size: 1rem;
  margin-bottom: 30px;
}

.progress-container {
  margin-bottom: 40px;
}

.progress-bar {
  background: #f3f4f6;
  height: 10px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  background: linear-gradient(90deg, #660033, #404040);
  height: 100%;
  width: 75%;
  border-radius: 10px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.progress-text {
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 700;
}

.features-list {
  display: flex;
  justify-content: center;
  gap: 15px;
  border-top: 1px solid #f3f4f6;
  padding-top: 25px;
}

.f-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 600;
}

.f-item svg {
  color: #10b981;
}

.fade-in {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

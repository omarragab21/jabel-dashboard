<script setup>
import { ref } from 'vue';
import gaLogo from '../assets/integrations/googleanalytics.svg';
import fbLogo from '../assets/integrations/facebook.svg';
import ttLogo from '../assets/integrations/tiktok.svg';
import adminCatalogService from '../application/adminCatalogService';
import { generateMetaCSV, generateGoogleXML, generateJSONFeed, downloadFile } from '../utils/dataFeedExporter';
import { useAdminText } from '../composables/useAdminText';

const { tx } = useAdminText();

// The three integrations shown on the page, each with its brand colours and a full description.
const ITEMS = [
  {
    key: 'google_analytics', name: 'Google Analytics', logo: gaLogo, tint: '#fff4e0',
    desc: ['تتبع وتحليل زيارات الموقع وسلوك المستخدمين', 'Track site visits and user behaviour'],
    long: [
      'يساعدك Google Analytics على فهم ما يحدث داخل متجرك بالأرقام: كم زائرًا دخل الموقع، ومن أي مصدر جاء (بحث، إعلانات، شبكات اجتماعية)، وأي الصفحات والمنتجات حظيت باهتمامهم، وأين تركوا عملية الشراء. بهذه البيانات تعرف أي الحملات تجلب عملاء فعليين، وأي المنتجات تستحق دعمًا أكبر، وأين تحتاج تجربة الشراء إلى تحسين.',
      'Google Analytics shows what happens in your store in numbers: how many visitors arrive, where they come from, which pages and products interest them and where they leave the checkout. Use it to see which campaigns bring real customers and where the buying experience needs work.',
    ],
    feeds: ['google_xml'],
  },
  {
    key: 'facebook_pixel', name: 'Facebook Pixel', logo: fbLogo, tint: '#e8f1ff',
    desc: ['تتبع التحويلات وإنشاء جماهير مخصصة للإعلانات على فيسبوك', 'Track conversions and build custom audiences for Facebook ads'],
    long: [
      'يتتبع Facebook Pixel سلوك زوار متجرك بعد وصولهم من إعلانات فيسبوك وإنستغرام: مشاهدة المنتج، الإضافة إلى السلة، وإتمام الطلب. تستفيد من ذلك في قياس عائد كل إعلان، وإعادة استهداف من زاروا المتجر ولم يشتروا، وبناء جماهير مشابهة لعملائك الحاليين. ملف الكتالوج المرفق يرفع منتجاتك إلى فيسبوك لعرضها في الإعلانات الديناميكية.',
      'Facebook Pixel follows what visitors do after arriving from Facebook and Instagram ads: product views, add to cart and completed orders. Use it to measure each ad, retarget visitors who did not buy and build look-alike audiences. The catalog file uploads your products for dynamic ads.',
    ],
    feeds: ['meta_csv'],
  },
  {
    key: 'tiktok_pixel', name: 'TikTok Pixel', logo: ttLogo, tint: '#eef0f3',
    desc: ['تتبع أحداث التحويل وتحسين حملات تيك توك الإعلانية', 'Track conversion events and optimise TikTok ad campaigns'],
    long: [
      'يسجّل TikTok Pixel الأحداث المهمة في متجرك القادمة من إعلانات تيك توك، مثل مشاهدة المنتجات والإضافة إلى السلة والشراء، فيتعلم التطبيق من يشتري فعلًا ويعرض إعلاناتك على أشخاص أقرب لقرار الشراء. تستطيع بذلك خفض تكلفة كل عملية بيع وتقييم أداء كل حملة بدقة. ملف المنتجات المرفق يُستخدم لربط الكتالوج بالحملات.',
      'TikTok Pixel records the key events that come from TikTok ads, such as product views, add to cart and purchase, so the platform learns who really buys and shows your ads to people closer to ordering. It lowers the cost per sale and shows how each campaign performs. The product file connects your catalog to campaigns.',
    ],
    feeds: ['json'],
  },
];

const label = (value) => (Array.isArray(value) ? tx(value[0], value[1]) : value);

const allItems = ITEMS;
const totalCount = ITEMS.length;

// Product files for each integration, built from the live product list.
const FEED_FILES = {
  meta_csv: { label: ['تحميل ملف Meta CSV', 'Download Meta CSV'], file: 'meta-facebook-catalog-feed.csv', mime: 'text/csv;charset=utf-8;', build: generateMetaCSV },
  google_xml: { label: ['تحميل ملف Google XML', 'Download Google XML'], file: 'google-merchant-catalog-feed.xml', mime: 'application/xml;charset=utf-8;', build: generateGoogleXML },
  json: { label: ['تحميل ملف JSON', 'Download JSON'], file: 'products-catalog-feed.json', mime: 'application/json;charset=utf-8;', build: generateJSONFeed },
};

const downloading = ref('');
const downloadError = ref('');

const downloadFeed = async (feedKey) => {
  const feed = FEED_FILES[feedKey];
  downloading.value = feedKey;
  downloadError.value = '';
  try {
    const products = await adminCatalogService.listAllProducts({ include_inactive: 1, show_all: 1 });
    const origin = window.location.origin;
    const storeUrl = origin && origin !== 'null' && !/localhost|127\.0\.0\.1/.test(origin) ? origin : 'https://mastergas.sa';
    downloadFile(feed.build(products, storeUrl, 'SAR'), feed.file, feed.mime);
  } catch {
    downloadError.value = tx('تعذر تحميل المنتجات لإنشاء الملف.', 'Could not load the products to build the file.');
  } finally {
    downloading.value = '';
  }
};

</script>

<template>
  <div class="integrations-page">
    <div class="page-header">
      <h2 class="page-title">{{ tx('التكاملات', 'Integrations') }}</h2>
      <p class="page-subtitle">{{ tx('ربط المتجر مع الخدمات والأنظمة الخارجية', 'Connect the store with external services and systems') }}</p>
    </div>

    <p v-if="downloadError" class="notice-error" role="alert">{{ downloadError }}</p>

    <div class="stats-row">
      <div class="stat-box"><span class="stat-number">{{ totalCount }}</span><span class="stat-title">{{ tx('إجمالي التكاملات', 'Total integrations') }}</span></div>
    </div>

    <div class="integration-list">
      <article v-for="(item, index) in allItems" :key="item.key" class="integration" :class="{ flipped: index % 2 === 1 }">
        <div class="integration-text">
          <h3 class="integration-name">{{ label(item.name) }}</h3>
          <p class="integration-tagline">{{ label(item.desc) }}</p>
          <p class="integration-body">{{ label(item.long) }}</p>
          <button
            v-for="feedKey in item.feeds"
            :key="feedKey"
            type="button"
            class="card-btn primary"
            :disabled="downloading === feedKey"
            @click="downloadFeed(feedKey)"
          >
            {{ downloading === feedKey ? tx('جاري التحميل...', 'Downloading...') : label(FEED_FILES[feedKey].label) }}
          </button>
        </div>
        <div class="integration-visual" :style="{ background: item.tint }">
          <img class="integration-logo" :src="item.logo" :alt="label(item.name)" />
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.integrations-page { display: flex; flex-direction: column; gap: 24px; width: 100%; min-width: 0; }
.stats-row { display: grid; grid-template-columns: minmax(0, 260px); gap: 16px; }
.stat-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; display: flex; flex-direction: column; gap: 4px; }
.stat-number { font-size: 26px; font-weight: 700; color: #1e293b; }
.stat-title { font-size: 13px; color: #64748b; }
.group-title { font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 12px; }
.group-count { color: #94a3b8; font-weight: 500; }
/* Image on the right, text on the left; every other card is mirrored. */
.integration-list { display: flex; flex-direction: column; gap: 24px; }
.integration { direction: ltr; display: flex; align-items: stretch; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; min-height: 280px; }
.integration.flipped { flex-direction: row-reverse; }
.integration-text { flex: 1 1 55%; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 12px; padding: 32px 36px; direction: rtl; text-align: start; }
.integration-name { margin: 0; font-size: 22px; font-weight: 700; color: #1e293b; }
.integration-tagline { margin: 0; font-size: 15px; font-weight: 600; color: #660033; }
.integration-body { margin: 0 0 8px; font-size: 15px; line-height: 2; color: #475569; }
.integration-logo { width: 38%; max-width: 180px; height: auto; }
.integration-visual { flex: 1 1 45%; display: flex; align-items: center; justify-content: center; min-height: 220px; }
@media (max-width: 800px) { .integration, .integration.flipped { flex-direction: column-reverse; } .integration-visual { min-height: 160px; } .integration-logo { width: 90px; } .integration-text { padding: 24px; } }
.card-btn { height: 38px; padding: 0 18px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; color: #1e293b; font-weight: 600; cursor: pointer; font-family: inherit; }
.card-btn.primary { background: #660033; border-color: #660033; color: #fff; }
.card-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.notice-error { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 10px; padding: 12px 16px; font-size: 14px; margin: 0; }
.link-btn { background: none; border: 0; color: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; font-family: inherit; }
.loading-state { color: #64748b; text-align: center; padding: 12px; }
.overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 1000; }
.dialog { background: #fff; border-radius: 14px; width: 100%; max-width: 480px; max-height: 90vh; overflow: auto; }
.dialog-head { display: flex; justify-content: space-between; gap: 12px; padding: 20px 24px 12px; }
.dialog-head h3 { margin: 4px 0; font-size: 18px; color: #1e293b; }
.dialog-head p { margin: 0; font-size: 13px; color: #64748b; }
.dialog-kicker { font-size: 12px; color: #94a3b8; }
.close-btn { background: none; border: 0; font-size: 26px; line-height: 1; color: #64748b; cursor: pointer; align-self: flex-start; }
.dialog-body { padding: 8px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: #334155; }
.field input { height: 42px; border: 1px solid #d1d5db; border-radius: 8px; padding: 0 12px; font-size: 14px; font-family: inherit; }
.field input:focus { outline: 2px solid #66003355; border-color: #660033; }
.dialog-foot { display: flex; justify-content: flex-start; gap: 10px; margin-top: 6px; }
</style>

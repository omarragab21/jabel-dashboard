<script setup>
import { ABOUT_PAGE_GROUPS, aboutPageDefaults } from '../domain/aboutPageContent';
import { normalizePreviewUrl, useSitePreview } from '../composables/useSitePreview';
import { localizeMessage } from '../utils/uiMessages';
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import api from '../config/axios';
import settingsService from '../services/settingsService';
import { safeObjectUrl, sanitizeAssetUrl } from '../utils/adminSecurity';
import { useAdminText } from '../composables/useAdminText';
import ImageCropModal from '../components/ImageCropModal.vue';
import SettingsSkeleton from '../components/SettingsSkeleton.vue';
import ImageCropButton from '../components/ImageCropButton.vue';
import { useImageCrop } from '../composables/useImageCrop';
import { useDialog } from '../composables/useDialog';
// The colours the website ships with (website/src/style.css: --color-brand-primary and --color-surface-dark-elevated).
import { DEFAULT_TAB_TITLES, PRODUCT_TABS_KEY, normalizeTab, parseProductTabs, resolveProductTabs } from '../domain/productTabs';
import { SOCIAL_KEYS, normalizeSocialLink } from '../domain/socialLinks';
import { NEWS_BAR_KEY, newNewsId, normalizeNewsItem, parseNewsItems, seedNewsItems } from '../domain/newsBar';
import { HOME_SECTIONS_KEY, SECTION_LIMITS, newSectionId, normalizeHomeSection, parseHomeSections, seedHomeSections, sectionProblem } from '../domain/homeSections';

// Only what the colour picker shows while no colour is chosen (nothing is saved from it).
const BRAND_DEFAULTS = Object.freeze({ primary_color: '#000000', secondary_color: '#111827' });

const { t } = useI18n();
const route = useRoute();
const { tx } = useAdminText();
const { setPreviewUrl } = useSitePreview();
const { cropModal, closeCrop, finishCrop, prepareImage, recropImage } = useImageCrop();
const dialog = useDialog();

// Each settings page (sidebar > Settings) edits one group of settings; the route says which one.
const section = computed(() => route.meta.settingsSection || 'general');
const sectionMeta = computed(() => ({
    general: { title: tx('بيانات الموقع', 'Site info'), subtitle: tx('اسم الموقع ووصفه', 'Site name and description') },
    homepage: { title: tx('الصفحة الرئيسية', 'Homepage'), subtitle: tx('الأقسام المميزة وعناوين أقسام الصفحة الرئيسية', 'Featured categories and homepage section titles') },
    producttabs: { title: tx('تفاصيل المنتج', 'Product details'), subtitle: tx('تبويبات صفحة المنتج بالموقع: أسماؤها وترتيبها وبياناتها', 'Website product page tabs: their names, order and data') },
    commerce: { title: tx('الأسعار والشحن', 'Pricing & shipping'), subtitle: tx('حد الشحن المجاني وتكلفة الشحن ونسبة الضريبة', 'Free shipping threshold, shipping cost and tax rate') },
    contact: { title: tx('التواصل والبريد', 'Contact & email'), subtitle: tx('البريد الرئيسي وبريد الدعم ومواقع التواصل', 'Main and support email, and social links') },
    location: { title: tx('العنوان وساعات العمل', 'Address & working hours'), subtitle: tx('عنوان المتجر ومواعيد العمل', 'Store address and opening hours') },
    newsbar: { title: tx('شريط الأخبار', 'News bar'), subtitle: tx('الأخبار التي تظهر في الشريط الأزرق تحت قائمة الموقع، بالعربي والإنجليزي', 'The news shown in the blue bar under the website menu, in Arabic and English') },
    branding: { title: tx('الهوية البصرية', 'Visual identity'), subtitle: tx('الشعارات وأيقونة المتصفح والألوان الأساسية', 'Logos, browser icon and brand colours') },
    about: { title: tx('من نحن', 'About us'), subtitle: tx('محتوى صفحة «من نحن» في الموقع', 'Content of the website About page') },
    preview: { title: tx('معاينة الموقع', 'Site preview'), subtitle: tx('رابط الموقع الحقيقي الذي يفتحه زر «معاينة الموقع» أعلى لوحة التحكم', 'The live website link opened by the «Preview site» button at the top of the dashboard') },
}[section.value]));
// True from the first paint: every Site setup page shows a shimmer until the API answers.
const loading = ref(true);
const isSaving = ref(false);
const settings = ref({
    // Nothing here is made up: every field starts empty and is filled only from the settings API.
    site_name: '',
    // Shown in the browser tab: the Arabic name on the Arabic site, the English name on the English site.
    site_name_ar: '',
    site_name_en: '',
    // Shown in the website footer, in the language being shown.
    site_description_ar: '',
    site_description_en: '',
    free_delivery_threshold: '',
    shipping_cost: '',
    tax_rate: '',
    default_shipping_cost: null,
    vat_percentage: null,
    site_contact_phone: '',
    social_links: {},
    enable_city_shipping: '0',
    use_city_specific_rates: '0',
    default_city_shipping_rate: '0',
    support_phone: '',
    support_email: '',
    email: '',
    address_ar: '',
    address_en: '',
    working_hours_ar: '',
    working_hours_en: '',
    friday_hours_ar: '',
    friday_hours_en: '',
    logo: null,
    favicon: null,
    footer_logo: null,
    // Brand colours applied on the website (empty = the website's built-in colours). Stored in the site settings API.
    primary_color: '',
    secondary_color: '',
    // Social links start empty: no made-up link is ever filled in or saved. An empty field hides the icon.
    whatsapp: '',
    facebook: '',
    instagram: '',
    x_twitter: '',
    linkedin: '',
    youtube: '',
    snapchat: '',
    tiktok: '',
    home_product_sections: null,
    product_tabs: null,
    home_category_1: null,
    home_category_2: null,
    home_section_category_title_ar: '',
    home_section_category_title_en: '',
    home_section_offers_title_ar: '',
    home_section_offers_title_en: '',
    about_title_ar: '',
    about_title_en: '',
    about_content_ar: '',
    about_content_en: '',
    about_section_2_title_ar: '',
    about_section_2_title_en: '',
    about_section_2_content_ar: '',
    about_section_2_content_en: '',
    about_section_3_title_ar: '',
    about_section_3_title_en: '',
    about_section_3_content_ar: '',
    about_section_3_content_en: '',
    ...aboutPageDefaults(),
    site_preview_url: '',
    about_hero_image: null,
    about_image_1: null,
    about_image_2: null,
    about_image_3: null,
});

const categories = ref([]);
const logoPreview = ref(null);

const isCityShippingEnabled = computed(() =>
    settings.value.enable_city_shipping === '1' ||
    settings.value.enable_city_shipping === true ||
    settings.value.enable_city_shipping === 1
);
const isCitySpecificRates = computed(() =>
    settings.value.use_city_specific_rates === '1' ||
    settings.value.use_city_specific_rates === true ||
    settings.value.use_city_specific_rates === 1
);
const faviconPreview = ref(null);
const footerLogoPreview = ref(null);
const aboutImagePreviews = ref({});
const aboutHeroField = { key: 'about_hero_image', label: 'Hero image' };
// The About Us page shows three stacked sections, each with an image, a title and a description.
// Section 1 keeps the original about_title / about_content keys so existing content stays in place.
const aboutSections = [
    {
        number: 1,
        image: 'about_image_1',
        titleAr: 'about_title_ar',
        titleEn: 'about_title_en',
        contentAr: 'about_content_ar',
        contentEn: 'about_content_en',
        placeholders: {
            titleAr: 'عن Mastergas',
            titleEn: 'About Mastergas',
            contentAr: 'تأسست Mastergas لتكون رائدة في تقديم أحدث تقنيات أجهزة ومطابخ الطهي الإيطالية الفاخرة...',
            contentEn: 'Mastergas was founded to lead in providing cutting-edge luxury Italian culinary appliances...',
        },
    },
    {
        number: 2,
        image: 'about_image_2',
        titleAr: 'about_section_2_title_ar',
        titleEn: 'about_section_2_title_en',
        contentAr: 'about_section_2_content_ar',
        contentEn: 'about_section_2_content_en',
        placeholders: {
            titleAr: 'الحرفية الإيطالية والتكنولوجيا المعاصرة',
            titleEn: 'Italian Craftsmanship & Contemporary Technology',
            contentAr: 'نتميز بأننا نجمع بين عراقة الحرفية اليدوية والتكنولوجيا الصناعية المتقدمة...',
            contentEn: 'We uniquely blend traditional artisanal heritage with cutting-edge industrial technology...',
        },
    },
    {
        number: 3,
        image: 'about_image_3',
        titleAr: 'about_section_3_title_ar',
        titleEn: 'about_section_3_title_en',
        contentAr: 'about_section_3_content_ar',
        contentEn: 'about_section_3_content_en',
        placeholders: {
            titleAr: 'مصمم لثقافتنا واحتياجاتنا المحلية',
            titleEn: 'Designed for Our Local Culture & Needs',
            contentAr: 'صُممت أجهزة ماستر غاز لتلبي متطلبات الطهي العربي والسعودي...',
            contentEn: 'Mastergas appliances are purposefully engineered for Arabian and Saudi culinary requirements...',
        },
    },
];

const resolveSettingAsset = (value) => {
    if (!value || typeof value !== 'string') return '';
    const normalized = value.trim();
    if (!normalized || normalized === '[]') return '';
    if (/^(https?:|blob:|data:|\/(?![/\\]))/i.test(normalized)) {
        return sanitizeAssetUrl(normalized, '');
    }
    if (/^[/\\]{2}/.test(normalized) || /^(?:javascript|vbscript|file):/i.test(normalized)) {
        return '';
    }
    const storagePath = normalized.replace(/^\/?storage\//i, '');
    const apiOrigin = String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');
    return sanitizeAssetUrl(`${apiOrigin}/storage/${storagePath}`, '');
};

// Fetch Data
const fetchSettings = async () => {
    loading.value = true;
    try {
        const response = await settingsService.getAdminSettings();
        const data = Array.isArray(response)
            ? response
            : (Array.isArray(response?.data) ? response.data : []);
        const isIrisAsset = (val) => {
            if (!val) return false;
            const str = String(val).toLowerCase();
            return str.includes('iris') || str.includes('t3jcwn2n2rvkxvcva') || str.includes('dobvpg934hatbpm5') || str.includes('yugdc4mk4vmsf6el');
        };
        data.forEach(s => {
            if (Object.hasOwn(settings.value, s.key)) {
                // Sanitize empty arrays stored as string '[]' or actual empty arrays
                if ((s.value === '' || s.value === null) && typeof settings.value[s.key] === 'string') {
                    // An empty value stays empty (never refilled with a default): the website hides that part.
                    settings.value[s.key] = '';
                } else if (s.value === '[]' || (Array.isArray(s.value) && s.value.length === 0)) {
                    settings.value[s.key] = null;
                } else if (isIrisAsset(s.value)) {
                    // A leftover of the old demo brand is treated as not set.
                    settings.value[s.key] = typeof settings.value[s.key] === 'string' ? '' : null;
                } else {
                    settings.value[s.key] = s.value;
                }
            }
        });

        // Social links: what the website shows is the flat key, else the one inside social_links. The form shows exactly
        // that, so a link cleared and saved stays empty after a reload (nothing is filled back in).
        const socialSetting = data.find((setting) => setting.key === 'social_links');
        const socialLinks = typeof socialSetting?.value === 'string'
            ? (() => { try { return JSON.parse(socialSetting.value); } catch { return {}; } })()
            : socialSetting?.value;
        const nestedLinks = socialLinks && typeof socialLinks === 'object' && !Array.isArray(socialLinks) ? socialLinks : {};
        SOCIAL_KEYS.forEach((key) => {
            const flat = data.find((setting) => setting.key === key)?.value;
            const value = String(flat ?? '').trim() || String(nestedLinks[key] ?? '').trim();
            settings.value[key] = /\.\.\.|…/.test(value) ? '' : value;
        });

        // The public Site API uses these canonical commerce/general keys.
        // Keep the existing dashboard fields readable while persisting both
        // contracts through settingsService.bulkUpdate().
        const defaultShipping = data.find((setting) => setting.key === 'default_shipping_cost')?.value;
        const vatPercentage = data.find((setting) => setting.key === 'vat_percentage')?.value;
        const siteContactPhone = data.find((setting) => setting.key === 'site_contact_phone')?.value;
        if (defaultShipping !== undefined && defaultShipping !== null && defaultShipping !== '') {
            settings.value.shipping_cost = defaultShipping;
        }
        if (vatPercentage !== undefined && vatPercentage !== null && vatPercentage !== '') {
            // The backend stores a percentage (14 = 14%): show it as typed.
            const parsedVat = Number(vatPercentage);
            if (Number.isFinite(parsedVat)) settings.value.tax_rate = parsedVat;
        }
        if (siteContactPhone !== undefined && siteContactPhone !== null && siteContactPhone !== '') {
            settings.value.support_phone = siteContactPhone;
        }
        homeSectionsSaved.value = parseHomeSections(settings.value[HOME_SECTIONS_KEY]);
        resetHomeSections();
        newsItemsSaved.value = parseNewsItems(data.find((setting) => setting.key === NEWS_BAR_KEY)?.value);
        resetNewsItems();
        resetTabs();
    } catch (error) {
        triggerAlert(t('admin.settings.failed'), 'error');
    } finally {
        loading.value = false;
    }
};

const fetchAllCategories = async () => {
    try {
        const response = await api.get('/v1/categories');
        const payload = response.data?.data ?? response.data;
        categories.value = Array.isArray(payload) ? payload : (payload?.data || []);
        // Lists seeded from the older two category fields take the category names as titles.
        if (!homeSectionsSaved.value && !loading.value) resetHomeSections();
    } catch (error) {
        console.error('Failed to fetch categories');
    }
};

onMounted(() => {
    fetchSettings();
    fetchAllCategories();
});

// Actions
// Every settings image goes through the crop modal before it is staged.
// Logos keep their own proportions (and PNG transparency); the favicon is square.
const settingsImageCropOptions = (key) => {
    if (key === 'favicon') {
        return { allowIco: true, defaultRatio: '1:1', fileName: 'favicon', title: tx('قص وضبط أيقونة الموقع (Crop & Resize)', 'Crop & resize favicon') };
    }
    if (key === 'logo' || key === 'footer_logo') {
        return { defaultRatio: 'free', fileName: key, title: tx('قص وضبط الشعار (Crop & Resize)', 'Crop & resize logo') };
    }
    return {
        defaultRatio: key === aboutHeroField.key ? '16:9' : '4:3',
        fileName: key,
        title: tx('قص وضبط صورة صفحة «من نحن» (Crop & Resize)', 'Crop & resize About page image'),
    };
};

const settingsPreviewRefs = { logo: logoPreview, favicon: faviconPreview, footer_logo: footerLogoPreview };

const stageSettingsImage = (key, file) => {
    settings.value[key] = file;
    const previewRef = settingsPreviewRefs[key];
    if (previewRef) previewRef.value = safeObjectUrl(file, previewRef.value);
    else aboutImagePreviews.value[key] = safeObjectUrl(file, aboutImagePreviews.value[key]);
};

const onSettingsImageChange = async (key, e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    const { file, error } = await prepareImage(picked, settingsImageCropOptions(key));
    if (error) {
        triggerAlert(error, 'error');
        return;
    }
    stageSettingsImage(key, file);
};

const onLogoChange = (e) => onSettingsImageChange('logo', e);
const onFaviconChange = (e) => onSettingsImageChange('favicon', e);
const onFooterLogoChange = (e) => onSettingsImageChange('footer_logo', e);
const onAboutImageChange = (key, e) => onSettingsImageChange(key, e);

// The image currently set for a key: a staged File or the saved backend image.
const settingsImageSource = (key) => {
    const value = settings.value[key];
    if (value instanceof File) return value;
    return resolveSettingAsset(value) || null;
};

const recropSettingsImage = async (key) => {
    const { file, error } = await recropImage(settingsImageSource(key), settingsImageCropOptions(key));
    if (error) triggerAlert(error, 'error');
    if (file) stageSettingsImage(key, file);
};

const aboutImagePreview = (key) => aboutImagePreviews.value[key] || resolveSettingAsset(settings.value[key]);

// Mirrors the website (website/src/domain/about/aboutSections.js): a section shows in a language when it has a
// title or a description in that language; with neither it is hidden from the page.
const filled = (value) => typeof value === 'string' && value.trim() !== '';
const aboutSectionStatus = (section) => {
    const ar = filled(settings.value[section.titleAr]) || filled(settings.value[section.contentAr]);
    const en = filled(settings.value[section.titleEn]) || filled(settings.value[section.contentEn]);
    if (ar && en) return { tone: 'shown', label: tx('ظاهر في الموقع', 'Shown on the site') };
    if (ar) return { tone: 'partial', label: tx('ظاهر بالعربي فقط — الإنجليزي فاضي', 'Arabic only — English is empty') };
    if (en) return { tone: 'partial', label: tx('ظاهر بالإنجليزي فقط — العربي فاضي', 'English only — Arabic is empty') };
    return { tone: 'hidden', label: tx('مخفي من الموقع — العنوان والوصف فاضيين', 'Hidden — no title or description') };
};
const aboutSectionHasContent = (section) => [section.titleAr, section.titleEn, section.contentAr, section.contentEn]
    .some((key) => filled(settings.value[key])) || Boolean(settingsImageSource(section.image));

// Clears the section's title, description and image in both languages and saves, so it leaves the site right away.
const deleteAboutSection = async (section) => {
    if (isSaving.value) return;
    const ok = await dialog.confirm(
        `سيتم مسح عنوان ووصف القسم ${section.number} (عربي وإنجليزي) وصورته، وحفظ الإعدادات فوراً، ولن يظهر القسم في صفحة «من نحن».`,
        { type: 'error', title: `حذف القسم ${section.number}؟`, confirmText: 'حذف القسم' },
    );
    if (!ok) return;
    [section.titleAr, section.titleEn, section.contentAr, section.contentEn].forEach((key) => { settings.value[key] = ''; });
    settings.value[section.image] = null;
    delete aboutImagePreviews.value[section.image];
    await saveSettings(tx(`تم حذف القسم ${section.number} من صفحة «من نحن»`, `Section ${section.number} was removed from the About page`));
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const colorPickerValue = (key, fallback) => (HEX_COLOR.test(settings.value[key] || '') ? settings.value[key] : fallback);

// ── Product page tabs ────────────────────────────────────────────────────────
// Each tab has a name (Arabic + English) and the product data it shows. The data itself is filled in
// on each product; here you choose which tabs exist, their order and their names.
// A blank name keeps the default.
const tabsList = ref([]);
const resetTabs = () => {
    tabsList.value = resolveProductTabs(settings.value[PRODUCT_TABS_KEY]).map((tab) => ({ ...tab }));
};

// ── News bar ─────────────────────────────────────────────────────────────────
// The website's news bar shows these items in order; each has an Arabic and an English text.
const newsItemsSaved = ref(null);
const newsItems = ref(seedNewsItems());
const resetNewsItems = () => {
    newsItems.value = newsItemsSaved.value ? newsItemsSaved.value.map((item) => ({ ...item })) : seedNewsItems();
};
const addNewsItem = () => {
    newsItems.value.push(normalizeNewsItem({ id: newNewsId() }));
};
const removeNewsItem = async (index) => {
    const item = newsItems.value[index];
    const ok = await dialog.confirm(
        `سيتم حذف الخبر «${item.text_ar || item.text_en || 'بدون نص'}» من شريط الأخبار بعد الحفظ.`,
        { type: 'error', title: 'حذف الخبر؟', confirmText: 'حذف' },
    );
    if (ok) newsItems.value.splice(index, 1);
};
const moveNewsItem = (index, step) => {
    const target = index + step;
    if (target < 0 || target >= newsItems.value.length) return;
    const list = newsItems.value;
    [list[index], list[target]] = [list[target], list[index]];
};

// ── Homepage product lists ───────────────────────────────────────────────────
// Each list on the website homepage («منتجات مميزة», «وصل حديثاً», or a category's
// products) is one entry of the home_product_sections setting, shown in this order.
const homeSectionsSaved = ref(null);
const homeSections = ref([]);
const resetHomeSections = () => {
    homeSections.value = homeSectionsSaved.value
        ? homeSectionsSaved.value.map((section) => ({ ...section }))
        : seedHomeSections([settings.value.home_category_1, settings.value.home_category_2], categories.value);
};
const categoryLabel = (category) => category?.name_ar || category?.name || category?.name_en || `#${category?.id}`;
const sourceOptions = computed(() => [
    { value: 'featured', label: tx('المنتجات المميزة', 'Featured products') },
    { value: 'new_arrivals', label: tx('وصل حديثاً (الأحدث)', 'New arrivals (newest)') },
    { value: 'category', label: tx('منتجات قسم معيّن', 'Products of a category') },
]);
const addHomeSection = () => {
    homeSections.value.push(normalizeHomeSection({ id: newSectionId(), source: 'category', limit: 4 }));
};
const removeHomeSection = async (index) => {
    const section = homeSections.value[index];
    const ok = await dialog.confirm(
        `سيتم حذف قائمة «${section.title_ar || section.title_en || 'بدون عنوان'}» من الصفحة الرئيسية بعد الحفظ.`,
        { type: 'error', title: 'حذف القائمة؟', confirmText: 'حذف' },
    );
    if (ok) homeSections.value.splice(index, 1);
};
const moveHomeSection = (index, step) => {
    const target = index + step;
    if (target < 0 || target >= homeSections.value.length) return;
    const list = homeSections.value;
    [list[index], list[target]] = [list[target], list[index]];
};
const onSectionCategory = (section) => {
    // A new list takes the category's name as its title until one is typed.
    const category = categories.value.find((item) => String(item.id) === String(section.category_id));
    if (category && !section.title_ar) section.title_ar = category.name_ar || category.name || '';
    if (category && !section.title_en && category.name_en) section.title_en = category.name_en;
};

const saveSettings = async (successMessage = t('admin.settings.success')) => {
    // Never save while the form is still empty and waiting for the API: it would overwrite the real settings.
    if (loading.value) return;
    const badColor = ['primary_color', 'secondary_color'].find((key) => settings.value[key] && !HEX_COLOR.test(String(settings.value[key]).trim()));
    if (badColor) {
        triggerAlert('اللون يجب أن يكون بصيغة #RRGGBB مثل #660033', 'error');
        return;
    }
    if (section.value === 'contact') {
        // Each link is turned into a web address (a WhatsApp number becomes a wa.me link, "site.com/page" gets
        // https://); a text that cannot be a link stops the save instead of being dropped without a word.
        const names = { whatsapp: 'WhatsApp', facebook: 'Facebook', instagram: 'Instagram', x_twitter: 'X / Twitter', linkedin: 'LinkedIn', youtube: 'YouTube', snapchat: 'Snapchat', tiktok: 'TikTok' };
        for (const key of SOCIAL_KEYS) {
            const result = normalizeSocialLink(key, settings.value[key]);
            if (result.error) {
                triggerAlert(tx(`رابط ${names[key]} غير صحيح. اكتب الرابط كاملاً أو اتركه فارغاً لإخفاء الأيقونة.`, `The ${names[key]} link is not valid. Enter the full link, or leave it empty to hide the icon.`), 'error');
                return;
            }
            settings.value[key] = result.value;
        }
    }
    if (section.value === 'newsbar') {
        if (newsItems.value.some((item) => !item.text_ar.trim() && !item.text_en.trim())) {
            triggerAlert(tx('اكتب نص كل خبر (بالعربي أو الإنجليزي) أو احذف الخبر الفارغ.', 'Write the text of every news item (Arabic or English), or delete the empty one.'), 'error');
            return;
        }
    }
    if (section.value === 'homepage') {
        const broken = homeSections.value.findIndex((item) => sectionProblem(item));
        if (broken !== -1) {
            triggerAlert(`اختر القسم الذي تُعرض منتجاته في القائمة رقم ${broken + 1}.`, 'error');
            return;
        }
        if (homeSections.value.some((item) => !item.title_ar && !item.title_en)) {
            triggerAlert('اكتب عنوانًا لكل قائمة (بالعربي أو الإنجليزي).', 'error');
            return;
        }
    }
    const previewRaw = String(settings.value.site_preview_url ?? '').trim();
    if (previewRaw && !normalizePreviewUrl(previewRaw)) {
        triggerAlert(tx('رابط الموقع غير صحيح. اكتبه مثل https://mastergas.com.sa', 'The site link is not valid. Write it like https://mastergas.com.sa'), 'error');
        return;
    }
    settings.value.site_preview_url = normalizePreviewUrl(previewRaw);
    isSaving.value = true;
    try {
        if (section.value === 'producttabs' || parseProductTabs(settings.value[PRODUCT_TABS_KEY])) {
            settings.value[PRODUCT_TABS_KEY] = tabsList.value.map(normalizeTab);
        }
        if (section.value === 'newsbar' || newsItemsSaved.value) {
            settings.value[NEWS_BAR_KEY] = newsItems.value.map(normalizeNewsItem);
        }
        if (section.value === 'homepage' || homeSectionsSaved.value) {
            settings.value[HOME_SECTIONS_KEY] = homeSections.value.map(normalizeHomeSection);
        }
        // The older single site_name stays in step with the new per-language names.
        const siteName = settings.value.site_name_en || settings.value.site_name_ar || settings.value.site_name;
        // primary_color / secondary_color are ordinary site settings, saved with everything else.
        await settingsService.bulkUpdate({ ...settings.value, site_name: siteName });

        setPreviewUrl(settings.value.site_preview_url);
        triggerAlert(successMessage);
        // Refresh to get full URLs
        fetchSettings();
    } catch (error) {
        if (error?.code === 'SETTINGS_ASSET_UPLOAD_UNSUPPORTED') {
            triggerAlert(t('admin.settings.failed'), 'error');
        } else {
            triggerAlert(t('admin.settings.failed'), 'error');
            console.error('Save failed:', error);
        }
    } finally {
        isSaving.value = false;
    }
};

// Alert State
const showAlert = ref(false);
const alertMessage = ref('');
const alertType = ref('success');

const triggerAlert = (message, type = 'success') => {
    alertMessage.value = localizeMessage(message);
    alertType.value = type;
    showAlert.value = true;
    setTimeout(() => showAlert.value = false, 3000);
};
</script>

<template>
  <div class="settings-page p-6">
    <ImageCropModal v-bind="cropModal" @close="closeCrop" @cropped="finishCrop" />
    <!-- Breadcrumbs -->
    <div class="breadcrumb mb-4">
       <span>{{ t('admin.profile.dashboard') }}</span>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
       <span>{{ t('admin.settings.title') }}</span>
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
       <span class="active">{{ sectionMeta.title }}</span>
    </div>

    <!-- Header -->
    <div class="header-section mb-6">
        <div class="page-title-area">
            <div class="title-with-icon">
                <div class="icon-box">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </div>
                <div>
                    <h1>{{ sectionMeta.title }}</h1>
                    <p>{{ sectionMeta.subtitle }}</p>
                </div>
            </div>
        </div>
        <div class="left-actions">
            <button class="save-btn" @click="saveSettings()" :disabled="isSaving || loading">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
               {{ isSaving ? t('admin.settings.saving') : t('admin.settings.save') }}
            </button>
        </div>
    </div>

    <!-- Content Sections -->
    <div class="settings-content shadow-sm" :class="{ 'is-loading': loading }" :aria-busy="loading">
        <SettingsSkeleton v-if="loading" :rows="section === 'about' || section === 'homepage' ? 10 : 6" data-testid="settings-skeleton" />
        <!-- Site settings: name + description -->
        <div v-if="section === 'general'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group">
                    <label>{{ tx('اسم الموقع (عربي)', 'Site name (Arabic)') }} <span class="req">*</span></label>
                    <input type="text" v-model="settings.site_name_ar" placeholder="اسم الموقع بالعربي" data-testid="site-name-ar" />
                    <small class="field-hint">{{ tx('يظهر في تبويب المتصفح عندما يكون الموقع بالعربي.', 'Shown in the browser tab when the site is in Arabic.') }}</small>
                </div>
                <div class="form-group">
                    <label>{{ tx('اسم الموقع (إنجليزي)', 'Site name (English)') }} <span class="req">*</span></label>
                    <input type="text" v-model="settings.site_name_en" placeholder="Site name in English" class="ltr-input" data-testid="site-name-en" />
                    <small class="field-hint">{{ tx('يظهر في تبويب المتصفح عندما يكون الموقع بالإنجليزي.', 'Shown in the browser tab when the site is in English.') }}</small>
                </div>
                <div class="form-group">
                    <label>{{ tx('وصف الموقع (عربي)', 'Site description (Arabic)') }}</label>
                    <textarea v-model="settings.site_description_ar" rows="3" maxlength="300" placeholder="نبذة قصيرة تظهر أسفل الشعار في فوتر الموقع" data-testid="site-description-ar"></textarea>
                </div>
                <div class="form-group">
                    <label>{{ tx('وصف الموقع (إنجليزي)', 'Site description (English)') }}</label>
                    <textarea v-model="settings.site_description_en" rows="3" maxlength="300" placeholder="A short note shown under the logo in the website footer" class="ltr-input" data-testid="site-description-en"></textarea>
                </div>
            </div>
        </div>

        <!-- Site preview link -->
        <div v-if="section === 'preview'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>{{ tx('رابط الموقع', 'Website link') }}</label>
                    <div class="preview-url-field">
                        <span class="preview-url-icon"><svg width="16" height="16" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"/></svg></span>
                        <input type="url" v-model="settings.site_preview_url" placeholder="https://mastergas.com.sa" class="ltr-input" data-testid="site-preview-url" />
                        <a
                            v-if="normalizePreviewUrl(settings.site_preview_url)"
                            class="preview-url-open"
                            :href="normalizePreviewUrl(settings.site_preview_url)"
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="site-preview-open"
                        ><svg width="14" height="14" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/></svg><span>{{ tx('فتح', 'Open') }}</span></a>
                    </div>
                    <small class="field-hint">{{ tx('اكتب رابط الموقع الحقيقي واضغط «حفظ». بعدها زر «معاينة الموقع» أعلى لوحة التحكم يفتح الموقع في تبويب جديد.', 'Enter the live website link and press Save. The «Preview site» button at the top of the dashboard then opens the site in a new tab.') }}</small>
                </div>
            </div>
        </div>

        <!-- Pricing & shipping -->
        <div v-if="section === 'commerce'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group">
                    <label>{{ t('admin.settings.free_delivery') }} ({{ t('admin.dashboard.sar') }}) <span class="req">*</span></label>
                    <input type="text" v-model="settings.free_delivery_threshold" placeholder="0" />
                </div>
                <div class="form-group">
                    <label>{{ t('admin.settings.shipping_cost') }} ({{ t('admin.dashboard.sar') }}) <span class="req">*</span></label>
                    <input type="text" v-model="settings.shipping_cost" placeholder="0" />
                </div>
                <div class="form-group">
                    <label>{{ t('admin.settings.tax_rate') }} (%) <span class="req">*</span></label>
                    <input type="text" v-model="settings.tax_rate" placeholder="0" />
                </div>
            </div>
        </div>

        <!-- Contact: emails, phone and social links -->
        <div v-if="section === 'contact'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group">
                    <label>{{ t('admin.settings.email') }} <span class="req">*</span></label>
                    <input type="email" v-model="settings.email" placeholder="name@example.com" class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>{{ t('admin.settings.support_email') }} <span class="req">*</span></label>
                    <input type="email" v-model="settings.support_email" placeholder="name@example.com" class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>{{ t('admin.settings.support_phone') }} <span class="req">*</span></label>
                    <input type="text" v-model="settings.support_phone" placeholder="+966 5X XXX XXXX" class="ltr-input" />
                </div>
            </div>
            <h3 class="pane-subheading">{{ tx('مواقع التواصل الاجتماعي', 'Social media') }}</h3>
            <div class="form-grid">
                <div class="form-group">
                    <label>{{ t('admin.settings.whatsapp') }}</label>
                    <input type="text" v-model="settings.whatsapp" placeholder="https://wa.me/..." class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>Facebook</label>
                    <input type="text" v-model="settings.facebook" placeholder="https://facebook.com/..." class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>Instagram</label>
                    <input type="text" v-model="settings.instagram" placeholder="https://instagram.com/..." class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>X / Twitter</label>
                    <input type="text" v-model="settings.x_twitter" placeholder="https://x.com/..." class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>LinkedIn</label>
                    <input type="text" v-model="settings.linkedin" placeholder="https://linkedin.com/..." class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>YouTube</label>
                    <input type="text" v-model="settings.youtube" placeholder="https://youtube.com/..." class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>Snapchat</label>
                    <input type="text" v-model="settings.snapchat" placeholder="https://snapchat.com/..." class="ltr-input" />
                </div>
                <div class="form-group">
                    <label>TikTok</label>
                    <input type="text" v-model="settings.tiktok" placeholder="https://tiktok.com/@..." class="ltr-input" />
                </div>
            </div>
        </div>

        <!-- Address & working hours -->
        <div v-if="section === 'location'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>{{ t('admin.settings.address_ar') }} <span class="req">*</span></label>
                    <textarea v-model="settings.address_ar" rows="2" placeholder="المملكة العربية السعودية - الرياض"></textarea>
                </div>
                <div class="form-group full-width">
                    <label>{{ t('admin.settings.address_en') }} <span class="req">*</span></label>
                    <textarea v-model="settings.address_en" rows="2" placeholder="Kingdom of Saudi Arabia - Riyadh" class="ltr-input"></textarea>
                </div>

                <div class="form-group full-width">
                    <small class="field-hint">{{ tx('ساعات العمل وساعات الجمعة تظهر في فوتر الموقع وصفحة «تواصل معنا». اكتب اليوم والوقت معًا مثل: السبت - الخميس: 9:00 ص - 10:00 م', 'Working hours and Friday hours show in the website footer and the Contact page. Write the day and time together, e.g. Saturday - Thursday: 9:00 AM - 10:00 PM') }}</small>
                </div>
                <div class="form-group full-width">
                    <label>{{ t('admin.settings.working_hours_ar') }} <span class="req">*</span></label>
                    <input type="text" v-model="settings.working_hours_ar" placeholder="السبت - الخميس: 9:00 ص - 10:00 م" />
                </div>
                <div class="form-group full-width">
                    <label>{{ t('admin.settings.working_hours_en') }} <span class="req">*</span></label>
                    <input type="text" v-model="settings.working_hours_en" placeholder="Saturday - Thursday: 9:00 AM - 10:00 PM" class="ltr-input" />
                </div>
                <div class="form-group full-width">
                    <label>{{ t('admin.settings.friday_hours_ar') }} <span class="req">*</span></label>
                    <input type="text" v-model="settings.friday_hours_ar" placeholder="الجمعة: 4:00 م - 10:00 م" />
                </div>
                <div class="form-group full-width">
                    <label>{{ t('admin.settings.friday_hours_en') }} <span class="req">*</span></label>
                    <input type="text" v-model="settings.friday_hours_en" placeholder="Friday: 4:00 PM - 10:00 PM" class="ltr-input" />
                </div>

            </div>
        </div>

        <!-- News bar Tab -->
        <div v-if="section === 'newsbar'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group full-width">
                    <div class="info-alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {{ tx('الأخبار تظهر في الشريط الأزرق تحت قائمة الموقع بنفس الترتيب هنا. الزائر يرى النص العربي في الموقع العربي والإنجليزي في الموقع الإنجليزي، وإن نقصت إحدى اللغتين يظهر النص الآخر.', 'News shows in the blue bar under the website menu in this order. Visitors see the Arabic text on the Arabic site and the English text on the English site; if one language is missing the other is shown.') }}
                    </div>
                </div>

                <div class="form-group full-width home-lists" data-testid="news-items">
                    <div v-for="(item, index) in newsItems" :key="item.id" class="home-list-card" :class="{ 'is-off': !item.is_active }" :data-testid="`news-item-${index}`">
                        <div class="home-list-head">
                            <span class="home-list-number">{{ index + 1 }}</span>
                            <strong class="home-list-title">{{ item.text_ar || item.text_en || tx('خبر بدون نص', 'Untitled news item') }}</strong>
                            <label class="home-list-toggle">
                                <input type="checkbox" v-model="item.is_active" />
                                <span>{{ item.is_active ? tx('ظاهر', 'Shown') : tx('مخفي', 'Hidden') }}</span>
                            </label>
                            <div class="home-list-actions">
                                <button type="button" class="icon-btn" :disabled="index === 0" :title="tx('تحريك لأعلى', 'Move up')" @click="moveNewsItem(index, -1)">▲</button>
                                <button type="button" class="icon-btn" :disabled="index === newsItems.length - 1" :title="tx('تحريك لأسفل', 'Move down')" @click="moveNewsItem(index, 1)">▼</button>
                                <button type="button" class="icon-btn danger" :title="tx('حذف الخبر', 'Delete news item')" @click="removeNewsItem(index)">✕</button>
                            </div>
                        </div>
                        <div class="home-list-grid">
                            <div class="form-group full-width">
                                <label>{{ tx('النص (عربي)', 'Text (Arabic)') }}</label>
                                <input type="text" v-model="item.text_ar" placeholder="نصائح صيدلانية موثوقة..." />
                            </div>
                            <div class="form-group full-width">
                                <label>{{ tx('النص (English)', 'Text (English)') }}</label>
                                <input type="text" v-model="item.text_en" placeholder="Trusted pharmacy advice..." class="ltr-input" />
                            </div>
                        </div>
                    </div>
                    <p v-if="!newsItems.length" class="home-lists-empty">{{ tx('لا توجد أخبار: الشريط لن يظهر في الموقع.', 'No news items: the bar will not show on the website.') }}</p>
                    <button type="button" class="add-list-btn" data-testid="news-item-add" @click="addNewsItem">+ {{ tx('إضافة خبر', 'Add a news item') }}</button>
                </div>
            </div>
        </div>

        <!-- Homepage Sections Tab -->
        <div v-if="section === 'homepage'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group full-width">
                    <div class="info-alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {{ tx('قوائم المنتجات في الصفحة الرئيسية تظهر بنفس الترتيب هنا. لكل قائمة عنوان ومصدر للمنتجات، و«عرض الكل» يفتح القسم المختار.', 'Product lists show on the homepage in this order. Each list has a title and a product source; «View all» opens the chosen category.') }}
                    </div>
                </div>

                <div class="form-group full-width home-lists" data-testid="home-lists">
                    <div v-for="(item, index) in homeSections" :key="item.id" class="home-list-card" :class="{ 'is-off': !item.is_active }" :data-testid="`home-list-${index}`">
                        <div class="home-list-head">
                            <span class="home-list-number">{{ index + 1 }}</span>
                            <strong class="home-list-title">{{ item.title_ar || item.title_en || tx('قائمة بدون عنوان', 'Untitled list') }}</strong>
                            <label class="home-list-toggle">
                                <input type="checkbox" v-model="item.is_active" />
                                <span>{{ item.is_active ? tx('ظاهرة', 'Shown') : tx('مخفية', 'Hidden') }}</span>
                            </label>
                            <div class="home-list-actions">
                                <button type="button" class="icon-btn" :disabled="index === 0" :title="tx('تحريك لأعلى', 'Move up')" @click="moveHomeSection(index, -1)">▲</button>
                                <button type="button" class="icon-btn" :disabled="index === homeSections.length - 1" :title="tx('تحريك لأسفل', 'Move down')" @click="moveHomeSection(index, 1)">▼</button>
                                <button type="button" class="icon-btn danger" :title="tx('حذف القائمة', 'Delete list')" @click="removeHomeSection(index)">✕</button>
                            </div>
                        </div>
                        <div class="home-list-grid">
                            <div class="form-group">
                                <label>{{ tx('العنوان (عربي)', 'Title (Arabic)') }}</label>
                                <input type="text" v-model.trim="item.title_ar" placeholder="منتجات مميزة" />
                            </div>
                            <div class="form-group">
                                <label>{{ tx('العنوان (English)', 'Title (English)') }}</label>
                                <input type="text" v-model.trim="item.title_en" placeholder="Featured Products" class="ltr-input" />
                            </div>
                            <div class="form-group">
                                <label>{{ tx('المنتجات المعروضة', 'Products shown') }}</label>
                                <select v-model="item.source" class="custom-select-v2" @change="item.source !== 'category' && (item.category_id = null)">
                                    <option v-for="option in sourceOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                                </select>
                            </div>
                            <div v-if="item.source === 'category'" class="form-group">
                                <label>{{ tx('القسم', 'Category') }} <span class="req">*</span></label>
                                <select v-model="item.category_id" class="custom-select-v2" :class="{ 'has-error': !item.category_id }" @change="onSectionCategory(item)">
                                    <option :value="null">{{ tx('اختر القسم', 'Choose a category') }}</option>
                                    <option v-for="cat in categories" :key="cat.id" :value="String(cat.id)">{{ categoryLabel(cat) }}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>{{ tx('عدد المنتجات', 'Number of products') }}</label>
                                <select v-model.number="item.limit" class="custom-select-v2">
                                    <option v-for="n in SECTION_LIMITS" :key="n" :value="n">{{ n }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <p v-if="!homeSections.length" class="home-lists-empty">{{ tx('لا توجد قوائم منتجات في الصفحة الرئيسية.', 'No product lists on the homepage.') }}</p>
                    <button type="button" class="add-list-btn" data-testid="home-list-add" @click="addHomeSection">+ {{ tx('إضافة قائمة منتجات', 'Add a product list') }}</button>
                </div>

                <div class="form-group full-width" style="grid-column: span 2; border-top: 1px solid #f3f4f6; padding-top: 30px; margin-top: 10px;">
                    <h3 style="font-size: 1.1rem; font-weight: 800; color: #1f2937; margin: 0 0 20px 0;">{{ t('admin.settings.home_titles') }}</h3>
                </div>
                
                <div class="form-group">
                    <label>{{ t('admin.settings.category_title_ar') }}</label>
                    <input type="text" v-model="settings.home_section_category_title_ar" placeholder="تسوّق حسب الفئة" />
                </div>
                <div class="form-group">
                    <label>{{ t('admin.settings.category_title_en') }}</label>
                    <input type="text" v-model="settings.home_section_category_title_en" placeholder="Shop by Category" class="ltr-input" />
                </div>
                
                <div class="form-group">
                    <label>{{ t('admin.settings.offers_title_ar') }}</label>
                    <input type="text" v-model="settings.home_section_offers_title_ar" placeholder="العروض المميزة" />
                </div>
                <div class="form-group">
                    <label>{{ t('admin.settings.offers_title_en') }}</label>
                    <input type="text" v-model="settings.home_section_offers_title_en" placeholder="Featured Offers" class="ltr-input" />
                </div>
            </div>
        </div>
        <!-- Product page tabs -->
        <div v-if="section === 'producttabs'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group full-width">
                    <div class="info-alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {{ tx('غيّر اسم كل تبويب من تبويبات صفحة المنتج بالعربي والإنجليزي. كل تبويب بيعرض بيانات من المنتج نفسه (تملأها في تعديل المنتج)، والتبويب اللي ما فيهوش بيانات ما يظهرش. تبويب «التقييمات» ثابت. الأسماء بتظهر كمان في خانات إضافة المنتج.', 'Rename each product page tab in Arabic and English. Each tab shows data from the product itself (filled in when editing the product); a tab with no data is hidden. «Reviews» is fixed. The names also label the fields in the product form.') }}
                    </div>
                </div>

                <div class="form-group full-width home-lists" data-testid="product-tabs-list">
                    <div v-for="(tab, index) in tabsList" :key="tab.source" class="home-list-card" :data-testid="`product-tab-${index}`">
                        <div class="home-list-head">
                            <span class="home-list-number">{{ index + 1 }}</span>
                            <strong class="home-list-title">{{ tab.title_ar || tab.title_en || DEFAULT_TAB_TITLES[tab.source].ar }}</strong>
                        </div>
                        <div class="home-list-grid">
                            <div class="form-group">
                                <label>{{ tx('الاسم (عربي)', 'Name (Arabic)') }}</label>
                                <input type="text" v-model="tab.title_ar" :placeholder="DEFAULT_TAB_TITLES[tab.source].ar" />
                            </div>
                            <div class="form-group">
                                <label>{{ tx('الاسم (English)', 'Name (English)') }}</label>
                                <input type="text" v-model="tab.title_en" :placeholder="DEFAULT_TAB_TITLES[tab.source].en" class="ltr-input" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Visual identity: logos, favicon, colours -->
        <div v-if="section === 'branding'" class="tab-pane fade-in">
            <div class="form-grid">
                <div class="form-group full-width">
                    <label>{{ t('admin.settings.logo') }} <span class="req">*</span></label>
                    <div class="logo-upload-container">
                        <div class="logo-preview-box">
                            <img v-if="logoPreview" :src="logoPreview" />
                            <img v-else :src="resolveSettingAsset(settings.logo) || '/brand/tijara-logo-full.png'" />
                        </div>
                        <div class="upload-info">
                            <p>{{ t('admin.settings.upload_logo_hint') }}</p>
                            <div class="upload-btn-wrapper">
                                <button class="btn-outline-upload">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    {{ t('admin.settings.choose_logo') }}
                                </button>
                                <input type="file" @change="onLogoChange" accept="image/*" />
                            </div>
                            <ImageCropButton v-if="settingsImageSource('logo')" style="margin-top: 0.5rem;" @crop="recropSettingsImage('logo')" />
                            <span>{{ t('admin.settings.main_logo_note') }}</span>
                        </div>
                    </div>
                </div>

                <div class="form-group full-width">
                    <label>{{ t('admin.settings.footer_logo') }} <span class="req">*</span></label>
                    <div class="logo-upload-container">
                        <div class="logo-preview-box dark">
                            <img v-if="footerLogoPreview" :src="footerLogoPreview" />
                            <img v-else :src="resolveSettingAsset(settings.footer_logo) || '/brand/tijara-logo-full.png'" />
                        </div>
                        <div class="upload-info">
                            <p>{{ t('admin.settings.upload_footer_hint') }}</p>
                            <div class="upload-btn-wrapper">
                                <button class="btn-outline-upload">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    {{ t('admin.settings.choose_footer_logo') }}
                                </button>
                                <input type="file" @change="onFooterLogoChange" accept="image/*" />
                            </div>
                            <ImageCropButton v-if="settingsImageSource('footer_logo')" style="margin-top: 0.5rem;" @crop="recropSettingsImage('footer_logo')" />
                            <span>{{ t('admin.settings.footer_logo_note') }}</span>
                        </div>
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>{{ t('admin.settings.favicon') }} <span class="req">*</span></label>
                    <div class="logo-upload-container">
                        <div class="logo-preview-box small">
                            <img v-if="faviconPreview" :src="faviconPreview" />
                            <img v-else :src="resolveSettingAsset(settings.favicon) || '/brand/tijara-logo.png'" />
                        </div>
                        <div class="upload-info">
                            <p>{{ t('admin.settings.upload_favicon_hint') }}</p>
                            <div class="upload-btn-wrapper">
                                <button class="btn-outline-upload">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    {{ t('admin.settings.choose_favicon') }}
                                </button>
                                <input type="file" @change="onFaviconChange" accept="image/*" />
                            </div>
                            <ImageCropButton v-if="settingsImageSource('favicon')" style="margin-top: 0.5rem;" @crop="recropSettingsImage('favicon')" />
                            <span>{{ t('admin.settings.favicon_note') }}</span>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>{{ tx('اللون الأساسي', 'Primary colour') }}</label>
                    <div class="color-field">
                        <input type="color" :value="colorPickerValue('primary_color', BRAND_DEFAULTS.primary_color)" @input="settings.primary_color = $event.target.value" data-testid="primary-color-picker" />
                        <input type="text" v-model="settings.primary_color" placeholder="#660033" maxlength="7" class="ltr-input" data-testid="primary-color" />
                        <button v-if="settings.primary_color" type="button" class="color-reset" @click="settings.primary_color = ''">{{ tx('الافتراضي', 'Default') }}</button>
                    </div>
                    <small class="field-hint">{{ tx('يُستخدم للأزرار والعناصر الرئيسية في الموقع. الافتراضي #000000.', 'Used for buttons and main elements on the website. Default #000000.') }}</small>
                </div>
                <div class="form-group">
                    <label>{{ tx('اللون الفرعي', 'Secondary colour') }}</label>
                    <div class="color-field">
                        <input type="color" :value="colorPickerValue('secondary_color', BRAND_DEFAULTS.secondary_color)" @input="settings.secondary_color = $event.target.value" data-testid="secondary-color-picker" />
                        <input type="text" v-model="settings.secondary_color" placeholder="#111827" maxlength="7" class="ltr-input" data-testid="secondary-color" />
                        <button v-if="settings.secondary_color" type="button" class="color-reset" @click="settings.secondary_color = ''">{{ tx('الافتراضي', 'Default') }}</button>
                    </div>
                    <small class="field-hint">{{ tx('يُستخدم للعناصر الداعمة والخلفيات الداكنة. الافتراضي #111827.', 'Used for supporting elements and dark backgrounds. Default #111827.') }}</small>
                </div>
            </div>
        </div>

        <!-- About Us Tab -->
        <div v-if="section === 'about'" class="tab-pane fade-in">
            <div class="about-settings-stack">
                <div class="form-group full-width">
                    <div class="info-alert mb-4">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {{ t('admin.settings.about_hint') }}
                    </div>
                </div>
                <section class="about-setting-block about-hero-block">
                    <div class="about-setting-heading">
                        <span class="about-setting-step">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        </span>
                        <div>
                            <h3>{{ tx('صورة الغلاف', 'Cover image') }}</h3>
                            <p>{{ tx('الصورة العريضة التي تظهر أعلى صفحة «من نحن».', 'The wide image shown at the top of the About page.') }}</p>
                        </div>
                    </div>
                    <div class="about-image-card">
                        <div class="about-image-preview-frame">
                            <img v-if="aboutImagePreview(aboutHeroField.key)" :src="aboutImagePreview(aboutHeroField.key)" :alt="aboutHeroField.label" />
                            <span v-else>{{ tx('لا توجد صورة مرفوعة', 'No image uploaded') }}</span>
                        </div>
                        <div class="about-image-card-actions">
                            <div class="upload-btn-wrapper">
                                <button class="btn-outline-upload" type="button">{{ tx('اختيار صورة', 'Choose image') }}</button>
                                <input type="file" @change="onAboutImageChange(aboutHeroField.key, $event)" accept="image/*" />
                            </div>
                            <ImageCropButton v-if="settingsImageSource(aboutHeroField.key)" @crop="recropSettingsImage(aboutHeroField.key)" />
                            <span>JPG / PNG</span>
                        </div>
                    </div>
                </section>

                <section v-for="section in aboutSections" :key="section.number" class="about-setting-block about-section-block">
                    <div class="about-setting-heading">
                        <span class="about-setting-step">0{{ section.number }}</span>
                        <div class="about-setting-heading-text">
                            <h3>{{ tx('القسم', 'Section') }} {{ section.number }}</h3>
                            <p>{{ tx('صورة وعنوان ووصف يظهروا معاً في الصفحة (بالعربي والإنجليزي). لو العنوان والوصف فاضيين القسم مش هيظهر.', 'An image, title and description shown together on the page (Arabic and English). If the title and description are empty the section does not show.') }}</p>
                            <span :class="['about-section-status', aboutSectionStatus(section).tone]" :data-testid="`about-section-status-${section.number}`">{{ aboutSectionStatus(section).label }}</span>
                        </div>
                        <button
                            v-if="aboutSectionHasContent(section)"
                            type="button"
                            class="about-section-delete"
                            :disabled="isSaving"
                            :aria-label="`${tx('حذف القسم', 'Delete section')} ${section.number}`"
                            :title="`${tx('حذف القسم', 'Delete section')} ${section.number}`"
                            :data-testid="`about-section-delete-${section.number}`"
                            @click="deleteAboutSection(section)"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            <span>{{ tx('حذف القسم', 'Delete section') }}</span>
                        </button>
                    </div>

                    <div class="about-image-card">
                        <div class="about-image-card-header">
                            <label>{{ tx('صورة القسم', 'Section image') }} {{ section.number }}</label>
                            
                        </div>
                        <div class="about-image-preview-frame">
                            <img v-if="aboutImagePreview(section.image)" :src="aboutImagePreview(section.image)" :alt="`Section ${section.number}`" />
                            <span v-else>{{ tx('لا توجد صورة مرفوعة', 'No image uploaded') }}</span>
                        </div>
                        <div class="about-image-card-actions">
                            <div class="upload-btn-wrapper">
                                <button class="btn-outline-upload" type="button">{{ tx('اختيار صورة', 'Choose image') }}</button>
                                <input type="file" @change="onAboutImageChange(section.image, $event)" accept="image/*" />
                            </div>
                            <ImageCropButton v-if="settingsImageSource(section.image)" @crop="recropSettingsImage(section.image)" />
                            <span>JPG / PNG</span>
                        </div>
                    </div>

                    <div class="form-grid about-two-columns about-section-fields">
                        <div class="form-group">
                            <label>{{ tx('العنوان (عربي)', 'Title (Arabic)') }}</label>
                            <input type="text" v-model="settings[section.titleAr]" :placeholder="section.placeholders.titleAr" />
                        </div>
                        <div class="form-group">
                            <label>Title (English)</label>
                            <input type="text" v-model="settings[section.titleEn]" :placeholder="section.placeholders.titleEn" class="ltr-input" />
                        </div>
                        <div class="form-group">
                            <label>{{ tx('الوصف (عربي)', 'Description (Arabic)') }}</label>
                            <textarea v-model="settings[section.contentAr]" rows="6" :placeholder="section.placeholders.contentAr"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Description (English)</label>
                            <textarea v-model="settings[section.contentEn]" rows="6" :placeholder="section.placeholders.contentEn" class="ltr-input"></textarea>
                        </div>
                    </div>
                </section>

                <section v-for="group in ABOUT_PAGE_GROUPS" :key="group.id" class="about-setting-block about-section-block" :data-testid="`about-texts-${group.id}`">
                    <div class="about-setting-heading">
                        <span class="about-setting-step">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="14" y2="18"/></svg>
                        </span>
                        <div class="about-setting-heading-text">
                            <h3>{{ tx(group.title[0], group.title[1]) }}</h3>
                            <p>{{ tx('نصوص صفحة «من نحن» بالعربي والإنجليزي. أي خانة تسيبها فاضية وتحفظ، الجزء ده بيتشال من الصفحة في الموقع.', 'About page texts in Arabic and English. Any field you leave empty and save is removed from the page on the website.') }}</p>
                        </div>
                    </div>
                    <div v-for="item in group.fields" :key="item.key" class="form-grid about-two-columns about-section-fields">
                        <div class="form-group">
                            <label>{{ tx(item.label[0], item.label[1]) }} ({{ tx('عربي', 'Arabic') }})</label>
                            <textarea v-if="item.multiline" v-model="settings[`${item.key}_ar`]" rows="3" :data-testid="`${item.key}_ar`"></textarea>
                            <input v-else type="text" v-model="settings[`${item.key}_ar`]" :data-testid="`${item.key}_ar`" />
                        </div>
                        <div class="form-group">
                            <label>{{ item.label[1] }} (English)</label>
                            <textarea v-if="item.multiline" v-model="settings[`${item.key}_en`]" rows="3" class="ltr-input" :data-testid="`${item.key}_en`"></textarea>
                            <input v-else type="text" v-model="settings[`${item.key}_en`]" class="ltr-input" :data-testid="`${item.key}_en`" />
                        </div>
                    </div>
                </section>

            </div>
        </div>
    </div>

    <!-- Alert -->
    <div v-if="showAlert" :class="['alert-toast', alertType, 'show']">
       {{ alertMessage }}
    </div>
  </div>
</template>

<style scoped>
.settings-page { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: inherit; }

/* Breadcrumbs */
.breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #9ca3af; }
.breadcrumb svg { transform: rotate(180deg); color: #d1d5db; }
.breadcrumb .active { color: #660033; font-weight: 700; }

/* Header */
.header-section { display: flex; justify-content: space-between; align-items: center; }
.page-title-area h1 { font-size: 1.4rem; font-weight: 800; color: #1f2937; margin: 0; }
.page-title-area p { color: #6b7280; font-size: 0.85rem; margin: 0; }
.title-with-icon { display: flex; align-items: center; gap: 12px; }
.icon-box { background: #f3f4f6; color: #660033; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }

.save-btn { background: #660033; color: white; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; font-size: 0.9rem; }
.save-btn:hover { background: #4d0026; transform: translateY(-2px); }
.save-btn:disabled { background: #9ca3af; }

/* Tabs */
.tabs-nav { display: flex; gap: 25px; border-bottom: 1px solid #f3f4f6; }
.tab-link { background: none; border: none; padding: 12px 5px; color: #6b7280; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.95rem; position: relative; border-bottom: 2px solid transparent; transition: 0.2s; }
.tab-link.active { color: #660033; border-bottom-color: #660033; }
.tab-link:hover { color: #660033; }

.pane-subheading { margin: 36px 0 20px; padding-top: 28px; border-top: 1px solid #f3f4f6; font-size: 1.05rem; font-weight: 800; color: #1f2937; }
.color-field { display: flex; align-items: center; gap: 10px; }
.color-field input[type=color] { width: 52px; height: 48px; padding: 4px; flex-shrink: 0; cursor: pointer; }
.color-field input[type=text] { flex: 1; min-width: 0; }
.color-reset { border: 1px solid #e5e7eb; background: white; color: #374151; padding: 10px 14px; border-radius: 10px; font-family: inherit; font-weight: 700; font-size: 0.8rem; cursor: pointer; white-space: nowrap; }
.color-reset:hover { background: #f9fafb; }

/* Content */
.settings-content { background: white; border-radius: 20px; padding: 40px; border: 1px solid #f3f4f6; }
.settings-content.is-loading > .tab-pane { display: none; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.form-group.full-width { grid-column: span 2; }

.preview-url-field { display: flex; align-items: center; gap: 10px; }
.preview-url-icon { display: inline-flex; color: #660033; flex-shrink: 0; }
.preview-url-field input { flex: 1; min-width: 0; }
.preview-url-open { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 10px; background: #660033; color: #fff; font-weight: 700; font-size: 0.85rem; text-decoration: none; white-space: nowrap; }
.preview-url-open:hover { background: #4d0026; }
.about-settings-stack { display: flex; flex-direction: column; gap: 22px; }
.about-setting-block { border: 1px solid #e8ebf0; border-radius: 18px; padding: 24px; background: #fff; }
.about-setting-heading { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
.about-setting-step { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 34px; width: 34px; height: 34px; border-radius: 10px; background: #111827; color: #fff; font-size: 0.78rem; font-weight: 800; }
.about-setting-heading h3 { margin: 0; color: #111827; font-size: 1.05rem; font-weight: 800; }
.about-setting-heading p { margin: 4px 0 0; color: #6b7280; font-size: 0.82rem; }
.about-setting-heading-text { flex: 1; min-width: 0; }
.about-section-status { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
.about-section-status.shown { background: #dcfce7; color: #15803d; }
.about-section-status.partial { background: #fef3c7; color: #b45309; }
.about-section-status.hidden { background: #f3f4f6; color: #6b7280; }
.about-section-delete { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; padding: 8px 12px; border: 1px solid #fecaca; border-radius: 10px; background: #fff; color: #dc2626; font-family: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.about-section-delete:hover:not(:disabled) { background: #fef2f2; }
.about-section-delete:disabled { opacity: 0.5; cursor: not-allowed; }
.about-two-columns { gap: 20px; }
.about-section-block textarea { min-height: 140px; resize: vertical; }
.about-section-fields { margin-top: 20px; }
.about-hero-block .about-image-card .about-image-preview-frame { height: 220px; }
.about-image-card { min-width: 0; border: 1px solid #edf0f4; border-radius: 14px; padding: 14px; background: #fafbfc; }
.about-image-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.about-image-card-header label { color: #1f2937; font-size: 0.84rem; font-weight: 800; }
.about-image-card-header span { color: #9ca3af; font-size: 0.7rem; direction: ltr; }
.about-image-preview-frame { height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 10px; background: #eef1f5; color: #9ca3af; font-size: 0.78rem; }
.about-image-preview-frame img { width: 100%; height: 100%; object-fit: cover; display: block; }
.about-image-card-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }
.about-image-card-actions > span { color: #9ca3af; font-size: 0.72rem; direction: ltr; }

.form-group label { display: block; font-weight: 700; font-size: 0.9rem; color: #374151; margin-bottom: 10px; text-align: right; }
.form-group input, .form-group textarea { width: 100%; padding: 14px 18px; border: 1px solid #f3f4f6; border-radius: 12px; outline: none; transition: 0.3s; font-family: inherit; font-size: 0.95rem; background: #fafafa; color: #1f2937; }
.form-group input:focus, .form-group textarea:focus { border-color: #660033; background: white; box-shadow: 0 0 0 4px rgba(0,0,0, 0.05); }

.ltr-input { direction: ltr; text-align: left; }
.req { color: #dc2626; }

/* Toggle Switch */
.toggle-row { display: flex; align-items: center; justify-content: space-between; background: #f9fafb; padding: 16px 20px; border-radius: 14px; border: 1px solid #f3f4f6; gap: 1rem; }
.toggle-info { display: flex; flex-direction: column; gap: 3px; }
.toggle-title { font-weight: 700; font-size: 0.92rem; color: #1f2937; }
.toggle-hint { font-size: 0.78rem; color: #9ca3af; }
.toggle-switch { position: relative; display: inline-block; width: 52px; height: 28px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #e5e7eb; border-radius: 28px; transition: 0.3s; }
.toggle-slider::before { position: absolute; content: ''; height: 22px; width: 22px; right: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2); }
.toggle-switch input:checked + .toggle-slider { background: #660033; }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(-24px); }

/* Logo Upload */
.logo-upload-container { display: flex; align-items: center; gap: 25px; background: #fafafa; padding: 25px; border-radius: 15px; border: 1px dashed #e5e7eb; }
.logo-preview-box { width: 100px; height: 100px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #f3f4f6; overflow: hidden; flex-shrink: 0; }
.logo-preview-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
.logo-preview-box.dark { background: #1f2937; }
.logo-preview-box.small { width: 60px; height: 60px; }
.field-hint { display: block; margin-top: 4px; color: #6b7280; font-size: 0.76rem; line-height: 1.5; }

.upload-info p { margin: 0 0 8px; color: #4b5563; font-size: 0.85rem; font-weight: 600; }
.upload-info span { font-size: 0.75rem; color: #9ca3af; }

.upload-btn-wrapper { position: relative; overflow: hidden; display: inline-block; margin: 10px 0; }
.btn-outline-upload { border: 1px solid #e5e7eb; background: white; color: #374151; padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.upload-btn-wrapper input[type=file] { font-size: 100px; position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; }

/* Custom Select and Alert */
.custom-select-v2 { width: 100%; padding: 14px 18px; border: 1px solid #f3f4f6; border-radius: 12px; outline: none; background: #fafafa; color: #1f2937; font-family: inherit; font-size: 0.95rem; cursor: pointer; }
.custom-select-v2:focus { border-color: #660033; background: white; }

.home-lists { display: flex; flex-direction: column; gap: 16px; }
.home-list-card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; background: #fff; }
.home-list-card.is-off { opacity: 0.6; }
.home-list-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.home-list-number { width: 28px; height: 28px; border-radius: 50%; background: #660033; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
.home-list-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #1f2937; }
.home-list-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #4b5563; cursor: pointer; }
.home-list-actions { display: inline-flex; gap: 6px; }
.icon-btn { width: 32px; height: 32px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; color: #4b5563; cursor: pointer; font-size: 0.75rem; }
.icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.icon-btn.danger { color: #dc2626; border-color: #fecaca; }
.home-list-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.custom-select-v2.has-error { border-color: #fca5a5; }
.home-lists-empty { color: #6b7280; margin: 0; }
.add-list-btn { align-self: flex-start; padding: 12px 20px; border: 1px dashed #660033; border-radius: 12px; background: #fdf2f8; color: #660033; font-family: inherit; font-weight: 700; cursor: pointer; }
:global(.dark) .home-list-card, :global(.dark) .icon-btn { background: #1e293b; border-color: #334155; color: #e2e8f0; }
:global(.dark) .home-list-title { color: #e2e8f0; }
.info-alert { background: #eff6ff; color: #1e40af; padding: 15px; border-radius: 12px; display: flex; align-items: center; gap: 12px; font-size: 0.85rem; font-weight: 600; border: 1px solid #dbeafe; }
.mb-4 { margin-bottom: 1rem; }

/* Alert */

.fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
    .form-grid { grid-template-columns: 1fr; }
    .form-group.full-width { grid-column: span 1; }
    .about-setting-block { padding: 18px; }
    .about-setting-heading { flex-wrap: wrap; }
    .logo-upload-container { flex-direction: column; text-align: center; }
}
</style>

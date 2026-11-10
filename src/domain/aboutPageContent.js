// The fixed texts of the website's About Us page, edited in Settings > About Us.
// Each text is a settings row pair `<key>_ar` / `<key>_en` (same keys as website/src/domain/about/aboutPageContent.js).
// There are no built-in texts: the page shows only what is saved in the settings API.
const field = (key, label, multiline = false) => ({ key, label, multiline });

export const ABOUT_PAGE_GROUPS = [
  {
    id: 'hero',
    title: ['نص الغلاف', 'Cover text'],
    fields: [
      field('about_hero_tagline', ['الشعار الصغير', 'Small tagline']),
      field('about_hero_title', ['العنوان الرئيسي', 'Main title']),
      field('about_hero_subtitle', ['الوصف', 'Description'], true),
    ],
  },
  {
    id: 'tags',
    title: ['عناوين الأقسام الصغيرة', 'Section labels'],
    fields: [
      field('about_section_1_tag', ['تسمية القسم 1', 'Section 1 label']),
      field('about_section_2_tag', ['تسمية القسم 2', 'Section 2 label']),
      field('about_section_3_tag', ['تسمية القسم 3', 'Section 3 label']),
    ],
  },
  {
    id: 'values',
    title: ['قيمنا الراسخة', 'Our core values'],
    fields: [
      field('about_values_title', ['عنوان القسم', 'Section title']),
      field('about_values_subtitle', ['وصف القسم', 'Section description']),
      field('about_value_1_title', ['القيمة 1 — العنوان', 'Value 1 — title']),
      field('about_value_1_desc', ['القيمة 1 — الوصف', 'Value 1 — description'], true),
      field('about_value_2_title', ['القيمة 2 — العنوان', 'Value 2 — title']),
      field('about_value_2_desc', ['القيمة 2 — الوصف', 'Value 2 — description'], true),
      field('about_value_3_title', ['القيمة 3 — العنوان', 'Value 3 — title']),
      field('about_value_3_desc', ['القيمة 3 — الوصف', 'Value 3 — description'], true),
    ],
  },
  {
    id: 'stats',
    title: ['أرقام نفخر بها', 'Numbers we are proud of'],
    fields: [
      field('about_stats_title', ['عنوان القسم', 'Section title']),
      field('about_stats_subtitle', ['وصف القسم', 'Section description']),
      field('about_stat_1_value', ['الرقم 1 — القيمة', 'Number 1 — value']),
      field('about_stat_1_label', ['الرقم 1 — الوصف', 'Number 1 — label']),
      field('about_stat_2_value', ['الرقم 2 — القيمة', 'Number 2 — value']),
      field('about_stat_2_label', ['الرقم 2 — الوصف', 'Number 2 — label']),
      field('about_stat_3_value', ['الرقم 3 — القيمة', 'Number 3 — value']),
      field('about_stat_3_label', ['الرقم 3 — الوصف', 'Number 3 — label']),
    ],
  },
  {
    id: 'cta',
    title: ['دعوة التسوق في آخر الصفحة', 'Closing call to action'],
    fields: [
      field('about_cta_title', ['العنوان', 'Title']),
      field('about_cta_subtitle', ['الوصف', 'Description'], true),
      field('about_cta_button', ['نص الزر', 'Button text']),
    ],
  },
];

/** `{ about_x_ar: '', about_x_en: '' }` for every text: the form starts empty and is filled from the API. */
export const aboutPageDefaults = () => Object.fromEntries(
  ABOUT_PAGE_GROUPS.flatMap((group) => group.fields.flatMap((item) => [[`${item.key}_ar`, ''], [`${item.key}_en`, '']])),
);

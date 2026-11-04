// The fixed texts of the website's About Us page, edited in Settings > About Us.
// Each text is a settings row pair `<key>_ar` / `<key>_en` (same keys and defaults as
// website/src/domain/about/aboutPageContent.js). The defaults are what the page shows until saved.
const field = (key, label, ar, en, multiline = false) => ({ key, label, ar, en, multiline });

export const ABOUT_PAGE_GROUPS = [
  {
    id: 'hero',
    title: ['نص الغلاف', 'Cover text'],
    fields: [
      field('about_hero_tagline', ['الشعار الصغير', 'Small tagline'], 'الجودة والابتكار في الطهي الحديث', 'Quality & Innovation in Modern Cooking'),
      field('about_hero_title', ['العنوان الرئيسي', 'Main title'], 'لماذا Mastergas؟', 'Why Mastergas?'),
      field('about_hero_subtitle', ['الوصف', 'Description'],
        'رحلة شغف بالتميز، نجمع بين عراقة الطهي الإيطالي وجودة لا تضاهى في منزلك',
        'A passionate journey of excellence, combining authentic Italian culinary heritage with unmatched quality in your home.', true),
    ],
  },
  {
    id: 'tags',
    title: ['عناوين الأقسام الصغيرة', 'Section labels'],
    fields: [
      field('about_section_1_tag', ['تسمية القسم 1', 'Section 1 label'], 'عن ماستر غاز', 'About Mastergas'),
      field('about_section_2_tag', ['تسمية القسم 2', 'Section 2 label'], 'ريادة هندسية إيطالية', 'Italian Engineering Leadership'),
      field('about_section_3_tag', ['تسمية القسم 3', 'Section 3 label'], 'التزامنا تجاه البيوت السعودية', 'Our Commitment to Saudi Homes'),
    ],
  },
  {
    id: 'values',
    title: ['قيمنا الراسخة', 'Our core values'],
    fields: [
      field('about_values_title', ['عنوان القسم', 'Section title'], 'قيمنا الراسخة', 'Our Core Values'),
      field('about_values_subtitle', ['وصف القسم', 'Section description'],
        'المبادئ التي تقودنا في كل خطوة نقدمها لعملائنا',
        'The core principles guiding every step of our commitment to our customers'),
      field('about_value_1_title', ['القيمة 1 — العنوان', 'Value 1 — title'], 'جودة بلا مساومة', 'Uncompromising Quality'),
      field('about_value_1_desc', ['القيمة 1 — الوصف', 'Value 1 — description'],
        'نلتزم بأعلى معايير التصنيع الإيطالي مع استخدام أجود خامات الفولاذ المقاوم للصدأ والمكونات فائقة التحمل.',
        'We adhere to the highest Italian manufacturing benchmarks, utilizing premium surgical stainless steel and heavy-duty components.', true),
      field('about_value_2_title', ['القيمة 2 — العنوان', 'Value 2 — title'], 'أمان لكل أسرة', 'Safety for Every Family'),
      field('about_value_2_desc', ['القيمة 2 — الوصف', 'Value 2 — description'],
        'أنظمة أمان ذكية متطورة مع صمامات غلق فوري لضمان الحماية القصوى لك ولعائلتك في جميع الأوقات.',
        'Advanced intelligent safety systems with instant flame failure shutoff valves to ensure absolute peace of mind at all times.', true),
      field('about_value_3_title', ['القيمة 3 — العنوان', 'Value 3 — title'], 'استدامة ومسؤولية', 'Sustainability & Responsibility'),
      field('about_value_3_desc', ['القيمة 3 — الوصف', 'Value 3 — description'],
        'كفاءة بيئية عالية في استهلاك الغاز والطاقة، مع تصميمات تدوم طويلاً لتقليل الهدر وتعزيز الاستدامة.',
        'Eco-conscious energy and gas efficiency with durable longevity designed to minimize waste and promote sustainability.', true),
    ],
  },
  {
    id: 'stats',
    title: ['أرقام نفخر بها', 'Numbers we are proud of'],
    fields: [
      field('about_stats_title', ['عنوان القسم', 'Section title'], 'أرقام تفخر بها جودتنا', 'Numbers Behind Our Quality'),
      field('about_stats_subtitle', ['وصف القسم', 'Section description'],
        'مسيرة حافلة بالإنجازات والريادة في السوق السعودي',
        'A proud track record of distinction and trust in the Saudi market'),
      field('about_stat_1_value', ['الرقم 1 — القيمة', 'Number 1 — value'], '100%', '100%'),
      field('about_stat_1_label', ['الرقم 1 — الوصف', 'Number 1 — label'], 'ضمان شامل معتمد', 'Certified Peace of Mind'),
      field('about_stat_2_value', ['الرقم 2 — القيمة', 'Number 2 — value'], '+10 سنوات', '10+ Years'),
      field('about_stat_2_label', ['الرقم 2 — الوصف', 'Number 2 — label'], 'خبرة التميز والريادة', 'Years of Culinary Excellence'),
      field('about_stat_3_value', ['الرقم 3 — القيمة', 'Number 3 — value'], 'إيطالي', 'Italian'),
      field('about_stat_3_label', ['الرقم 3 — الوصف', 'Number 3 — label'], 'تصميم وهندسة أصلية', 'Authentic Italian Engineering'),
    ],
  },
  {
    id: 'cta',
    title: ['دعوة التسوق في آخر الصفحة', 'Closing call to action'],
    fields: [
      field('about_cta_title', ['العنوان', 'Title'], 'Mastergas — مصممة للحياة الواقعية', 'Mastergas — Engineered for Real Life'),
      field('about_cta_subtitle', ['الوصف', 'Description'],
        'ابدأ الآن في تصفح منتجاتنا واكتشف الحلول الإيطالية التي تناسب ذوق منزلك',
        'Explore our collection now and discover Italian culinary solutions tailored to your home', true),
      field('about_cta_button', ['نص الزر', 'Button text'], 'تسوق الآن', 'Shop Now'),
    ],
  },
];

/** `{ about_x_ar: '…', about_x_en: '…' }` for every text, used as the form's starting values. */
export const aboutPageDefaults = () => Object.fromEntries(
  ABOUT_PAGE_GROUPS.flatMap((group) => group.fields.flatMap((item) => [[`${item.key}_ar`, item.ar], [`${item.key}_en`, item.en]])),
);

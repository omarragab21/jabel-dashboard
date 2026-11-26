// Ready-made attribute templates. Picking one creates all of its attributes and values at once.
//
// A value is written as 'عربي|English', 'عربي|English|#hex' (a colour) or just 'S' when both languages
// use the same text (sizes, capacities, numbers).
// This is plain data: add a template here and it shows up on the templates screen.

const COLORS = [
  'أسود|Black|#000000', 'أبيض|White|#ffffff', 'رمادي|Gray|#808080', 'فضي|Silver|#c0c0c0', 'ذهبي|Gold|#d4af37',
  'أحمر|Red|#dc2626', 'برتقالي|Orange|#f97316', 'أصفر|Yellow|#facc15', 'أخضر|Green|#16a34a', 'أزرق|Blue|#2563eb',
  'سماوي|Sky Blue|#38bdf8', 'كحلي|Navy|#1e3a8a', 'بنفسجي|Purple|#7c3aed', 'وردي|Pink|#ec4899', 'بني|Brown|#7c4a21',
  'بيج|Beige|#d9c3a0', 'عنابي|Burgundy|#800020', 'زيتي|Olive|#6b7a2a',
];
const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const GENDER = ['رجالي|Men', 'نسائي|Women', 'للجنسين|Unisex', 'أولاد|Boys', 'بنات|Girls'];
const CONDITION = ['جديد|New', 'مجدد|Refurbished', 'مستعمل|Used'];
const WARRANTY = ['بدون ضمان|No warranty', '6 شهور|6 months', 'سنة|1 year', 'سنتان|2 years', '3 سنوات|3 years', '5 سنوات|5 years'];

export const ATTRIBUTE_TEMPLATES = [
  {
    id: 'general',
    icon: '🛍️',
    name: ['عام (لأي متجر)', 'General (any store)'],
    description: ['الخصائص المشتركة اللي بتناسب أغلب المتاجر.', 'Common attributes that fit most stores.'],
    attributes: [
      { name: ['اللون', 'Color'], type: 'color', values: COLORS },
      { name: ['المقاس', 'Size'], values: ['صغير|Small', 'وسط|Medium', 'كبير|Large', 'كبير جداً|Extra Large'] },
      { name: ['الخامة', 'Material'], values: ['قطن|Cotton', 'جلد|Leather', 'بلاستيك|Plastic', 'معدن|Metal', 'ستانلس ستيل|Stainless Steel', 'خشب|Wood', 'زجاج|Glass', 'سيراميك|Ceramic', 'قماش|Fabric', 'مطاط|Rubber'] },
      { name: ['الجنس', 'Gender'], values: GENDER },
      { name: ['الحالة', 'Condition'], values: CONDITION },
      { name: ['بلد المنشأ', 'Country of origin'], values: ['الأردن|Jordan', 'السعودية|Saudi Arabia', 'مصر|Egypt', 'الإمارات|UAE', 'تركيا|Turkey', 'الصين|China', 'ألمانيا|Germany', 'إيطاليا|Italy', 'أمريكا|USA', 'اليابان|Japan', 'كوريا الجنوبية|South Korea'] },
      { name: ['الضمان', 'Warranty'], values: WARRANTY },
    ],
  },
  {
    id: 'fashion',
    icon: '👗',
    name: ['ملابس وأحذية', 'Fashion & shoes'],
    description: ['ملابس رجالي وحريمي وأطفال وأحذية وإكسسوارات.', 'Clothing, shoes and accessories.'],
    attributes: [
      { name: ['اللون', 'Color'], type: 'color', values: COLORS },
      { name: ['المقاس', 'Size'], values: LETTER_SIZES },
      { name: ['مقاس الحذاء', 'Shoe size'], values: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
      { name: ['الخامة', 'Fabric'], values: ['قطن|Cotton', 'كتان|Linen', 'صوف|Wool', 'حرير|Silk', 'بوليستر|Polyester', 'جينز|Denim', 'جلد|Leather', 'شمواه|Suede', 'فيسكوز|Viscose', 'نايلون|Nylon'] },
      { name: ['القَصّة', 'Fit'], values: ['ضيق|Slim', 'عادي|Regular', 'واسع|Relaxed', 'أوفر سايز|Oversized'] },
      { name: ['طول الكم', 'Sleeve length'], values: ['بدون كم|Sleeveless', 'قصير|Short', 'ثلاثة أرباع|Three-quarter', 'طويل|Long'] },
      { name: ['الجنس', 'Gender'], values: GENDER },
      { name: ['الفئة العمرية', 'Age group'], values: ['رضّع|Infants', 'أطفال|Kids', 'مراهقين|Teens', 'بالغين|Adults'] },
      { name: ['الموسم', 'Season'], values: ['صيفي|Summer', 'شتوي|Winter', 'ربيعي|Spring', 'خريفي|Autumn', 'كل المواسم|All seasons'] },
    ],
  },
  {
    id: 'electronics',
    icon: '📱',
    name: ['إلكترونيات وموبايلات', 'Electronics & phones'],
    description: ['موبايلات وكمبيوترات وأجهزة ذكية وإكسسواراتها.', 'Phones, computers, smart devices and accessories.'],
    attributes: [
      { name: ['اللون', 'Color'], type: 'color', values: COLORS },
      { name: ['سعة التخزين', 'Storage'], values: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'] },
      { name: ['الرام', 'RAM'], values: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB', '64GB'] },
      { name: ['حجم الشاشة', 'Screen size'], values: ['5.5"', '6.1"', '6.5"', '6.7"', '11"', '13"', '14"', '15.6"', '17"', '24"', '27"', '32"', '43"', '55"', '65"'] },
      { name: ['المعالج', 'Processor'], values: ['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'Apple M-series', 'Snapdragon', 'MediaTek'] },
      { name: ['نوع الاتصال', 'Connectivity'], values: ['Wi-Fi', '4G', '5G', 'Bluetooth', 'سلكي|Wired', 'USB-C', 'HDMI'] },
      { name: ['نظام التشغيل', 'Operating system'], values: ['Android', 'iOS', 'Windows', 'macOS', 'Linux', 'ChromeOS'] },
      { name: ['الحالة', 'Condition'], values: CONDITION },
      { name: ['الضمان', 'Warranty'], values: WARRANTY },
    ],
  },
  {
    id: 'home',
    icon: '🛋️',
    name: ['أثاث ومنزل', 'Furniture & home'],
    description: ['أثاث وديكور وأدوات منزلية ومفروشات.', 'Furniture, decor, home goods and linens.'],
    attributes: [
      { name: ['اللون / التشطيب', 'Color / Finish'], type: 'color', values: COLORS },
      { name: ['الخامة', 'Material'], values: ['خشب طبيعي|Solid Wood', 'MDF', 'معدن|Metal', 'زجاج|Glass', 'قماش|Fabric', 'جلد|Leather', 'جلد صناعي|Faux Leather', 'رخام|Marble', 'راتان|Rattan', 'بلاستيك|Plastic'] },
      { name: ['الحجم', 'Size'], values: ['صغير|Small', 'وسط|Medium', 'كبير|Large', 'كبير جداً|Extra Large'] },
      { name: ['عدد المقاعد', 'Seats'], values: ['1', '2', '3', '4', '5', '6', '8'] },
      { name: ['عدد القطع', 'Pieces'], values: ['قطعة واحدة|1 piece', '2', '3', '4', '5', '6', '8', '12'] },
      { name: ['الغرفة', 'Room'], values: ['غرفة المعيشة|Living room', 'غرفة النوم|Bedroom', 'المطبخ|Kitchen', 'غرفة الطعام|Dining room', 'المكتب|Office', 'الحمّام|Bathroom', 'الحديقة|Outdoor', 'غرفة الأطفال|Kids room'] },
      { name: ['التركيب', 'Assembly'], values: ['مركّب|Assembled', 'يحتاج تركيب|Assembly required'] },
    ],
  },
  {
    id: 'beauty',
    icon: '💄',
    name: ['تجميل وعناية', 'Beauty & care'],
    description: ['مكياج وعناية بالبشرة والشعر وعطور.', 'Makeup, skin and hair care, perfumes.'],
    attributes: [
      { name: ['نوع البشرة', 'Skin type'], values: ['كل أنواع البشرة|All skin types', 'دهنية|Oily', 'جافة|Dry', 'مختلطة|Combination', 'حساسة|Sensitive', 'عادية|Normal'] },
      { name: ['الحجم', 'Size'], values: ['15 مل|15 ml', '30 مل|30 ml', '50 مل|50 ml', '100 مل|100 ml', '150 مل|150 ml', '200 مل|200 ml', '250 مل|250 ml', '500 مل|500 ml', '1 لتر|1 L'] },
      { name: ['درجة اللون', 'Shade'], type: 'color', values: ['فاتح|Fair|#f5d5c0', 'بيج فاتح|Light Beige|#ecc4a3', 'بيج|Beige|#dfb089', 'عسلي|Honey|#c68f61', 'برونزي|Tan|#a8714a', 'قمحي غامق|Deep|#7b4b2f', 'أحمر|Red|#c1121f', 'وردي|Pink|#f06292', 'نيود|Nude|#c9a18a', 'برقوقي|Plum|#6d2e46'] },
      { name: ['الرائحة', 'Scent'], values: ['زهرية|Floral', 'خشبية|Woody', 'شرقية|Oriental', 'منعشة|Fresh', 'حمضية|Citrus', 'فانيلا|Vanilla', 'مسك|Musk', 'عود|Oud', 'بدون رائحة|Unscented'] },
      { name: ['المكوّنات', 'Ingredients'], values: ['عضوي|Organic', 'طبيعي|Natural', 'بدون كحول|Alcohol-free', 'بدون بارابين|Paraben-free', 'نباتي|Vegan', 'بدون عطور|Fragrance-free'] },
      { name: ['مناسب لـ', 'Suitable for'], values: ['الوجه|Face', 'الشعر|Hair', 'الجسم|Body', 'اليدين|Hands', 'الشفاه|Lips', 'العيون|Eyes', 'الأظافر|Nails'] },
      { name: ['الجنس', 'Gender'], values: ['رجالي|Men', 'نسائي|Women', 'للجنسين|Unisex'] },
    ],
  },
  {
    id: 'grocery',
    icon: '🛒',
    name: ['بقالة وأغذية', 'Grocery & food'],
    description: ['مواد غذائية ومشروبات وسناكس.', 'Food, drinks and snacks.'],
    attributes: [
      { name: ['الوزن', 'Weight'], values: ['100 جم|100 g', '250 جم|250 g', '500 جم|500 g', '1 كجم|1 kg', '2 كجم|2 kg', '5 كجم|5 kg', '10 كجم|10 kg'] },
      { name: ['الحجم', 'Volume'], values: ['250 مل|250 ml', '330 مل|330 ml', '500 مل|500 ml', '1 لتر|1 L', '1.5 لتر|1.5 L', '2 لتر|2 L', '5 لتر|5 L'] },
      { name: ['النكهة', 'Flavor'], values: ['سادة|Plain', 'فانيلا|Vanilla', 'شوكولاتة|Chocolate', 'فراولة|Strawberry', 'ليمون|Lemon', 'برتقال|Orange', 'تفاح|Apple', 'مانجو|Mango', 'قهوة|Coffee', 'حار|Spicy'] },
      { name: ['نوع التغليف', 'Packaging'], values: ['كيس|Bag', 'علبة|Box', 'زجاجة|Bottle', 'برطمان|Jar', 'عبوة معدنية|Can', 'كرتونة|Carton', 'حزمة اقتصادية|Bulk pack'] },
      { name: ['احتياجات غذائية', 'Dietary'], values: ['حلال|Halal', 'خالي من الغلوتين|Gluten-free', 'خالي من السكر|Sugar-free', 'قليل الدسم|Low fat', 'نباتي|Vegan', 'عضوي|Organic', 'خالي من اللاكتوز|Lactose-free'] },
      { name: ['طريقة التخزين', 'Storage'], values: ['جاف|Ambient', 'مبرّد|Refrigerated', 'مجمّد|Frozen'] },
      { name: ['بلد المنشأ', 'Country of origin'], values: ['الأردن|Jordan', 'السعودية|Saudi Arabia', 'مصر|Egypt', 'تركيا|Turkey', 'لبنان|Lebanon', 'الهند|India', 'إيطاليا|Italy', 'إسبانيا|Spain'] },
    ],
  },
  {
    id: 'elearning',
    icon: '🎓',
    name: ['تعليم إلكتروني', 'E-learning'],
    description: ['دورات وكورسات ومحتوى تعليمي.', 'Courses and learning content.'],
    attributes: [
      { name: ['المستوى', 'Level'], values: ['مبتدئ|Beginner', 'متوسط|Intermediate', 'متقدم|Advanced', 'كل المستويات|All levels'] },
      { name: ['لغة الدورة', 'Language'], values: ['عربي|Arabic', 'إنجليزي|English', 'ثنائي اللغة|Bilingual'] },
      { name: ['نوع الدورة', 'Format'], values: ['مسجّلة|Self-paced', 'مباشرة|Live', 'مدمجة|Blended', 'حضوري|In-person'] },
      { name: ['المدة', 'Duration'], values: ['أقل من ساعتين|Under 2 hours', '2 – 10 ساعات|2 – 10 hours', '10 – 30 ساعة|10 – 30 hours', 'أكثر من 30 ساعة|30+ hours'] },
      { name: ['الشهادة', 'Certificate'], values: ['بشهادة إتمام|With certificate', 'بدون شهادة|No certificate', 'شهادة معتمدة|Accredited certificate'] },
      { name: ['مدة الوصول', 'Access'], values: ['مدى الحياة|Lifetime', '3 شهور|3 months', '6 شهور|6 months', 'سنة|1 year'] },
      { name: ['المجال', 'Field'], values: ['برمجة|Programming', 'تصميم|Design', 'تسويق|Marketing', 'لغات|Languages', 'إدارة أعمال|Business', 'محاسبة وتمويل|Finance', 'تطوير ذاتي|Self-development', 'علوم|Science', 'صحة ولياقة|Health & fitness'] },
    ],
  },
  {
    id: 'services',
    icon: '🧩',
    name: ['خدمات واشتراكات (SaaS / CRM)', 'Services & subscriptions (SaaS / CRM)'],
    description: ['برامج واشتراكات وباقات خدمات.', 'Software, subscriptions and service plans.'],
    attributes: [
      { name: ['الباقة', 'Plan'], values: ['مجانية|Free', 'أساسية|Basic', 'احترافية|Professional', 'أعمال|Business', 'مؤسسات|Enterprise'] },
      { name: ['فترة الاشتراك', 'Billing period'], values: ['شهري|Monthly', 'ربع سنوي|Quarterly', 'نصف سنوي|Semi-annual', 'سنوي|Annual', 'مرة واحدة|One-time'] },
      { name: ['عدد المستخدمين', 'Users'], values: ['مستخدم واحد|1 user', '5 مستخدمين|5 users', '10 مستخدمين|10 users', '25 مستخدم|25 users', '50 مستخدم|50 users', 'غير محدود|Unlimited'] },
      { name: ['مستوى الدعم', 'Support level'], values: ['عبر البريد|Email', 'دردشة مباشرة|Live chat', 'هاتف|Phone', 'دعم 24/7|24/7 support', 'مدير حساب مخصص|Dedicated manager'] },
      { name: ['طريقة التسليم', 'Delivery'], values: ['سحابي|Cloud', 'على الجهاز|On-premise', 'تطبيق موبايل|Mobile app', 'خدمة ميدانية|On-site'] },
      { name: ['مدة التجربة', 'Trial'], values: ['بدون تجربة|No trial', '7 أيام|7 days', '14 يوم|14 days', '30 يوم|30 days'] },
    ],
  },
  {
    id: 'auto',
    icon: '🚗',
    name: ['قطع غيار سيارات', 'Auto parts'],
    description: ['قطع غيار وإكسسوارات وزيوت للسيارات.', 'Car parts, accessories and oils.'],
    attributes: [
      { name: ['ماركة السيارة', 'Car make'], values: ['تويوتا|Toyota', 'هيونداي|Hyundai', 'كيا|Kia', 'نيسان|Nissan', 'هوندا|Honda', 'مرسيدس|Mercedes-Benz', 'بي إم دبليو|BMW', 'أودي|Audi', 'فولكس فاجن|Volkswagen', 'فورد|Ford', 'شيفروليه|Chevrolet', 'مازدا|Mazda', 'ميتسوبيشي|Mitsubishi', 'سوزوكي|Suzuki', 'لكزس|Lexus', 'بيجو|Peugeot', 'رينو|Renault', 'جيلي|Geely', 'MG'] },
      { name: ['سنة الصنع', 'Model year'], values: ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2000 – 2009', 'قبل 2000|Before 2000'] },
      { name: ['نوع القطعة', 'Part type'], values: ['أصلي|OEM', 'تجاري|Aftermarket', 'مستعمل|Used', 'مجدد|Refurbished'] },
      { name: ['الموضع', 'Position'], values: ['أمامي|Front', 'خلفي|Rear', 'يمين|Right', 'يسار|Left', 'علوي|Upper', 'سفلي|Lower'] },
      { name: ['نوع الوقود', 'Fuel type'], values: ['بنزين|Petrol', 'ديزل|Diesel', 'هجين|Hybrid', 'كهرباء|Electric'] },
      { name: ['لزوجة الزيت', 'Oil viscosity'], values: ['0W-20', '5W-30', '5W-40', '10W-40', '15W-40', '20W-50'] },
      { name: ['الضمان', 'Warranty'], values: WARRANTY },
    ],
  },
  {
    id: 'pharmacy',
    icon: '💊',
    name: ['صيدليات ومنتجات صحية', 'Pharmacy & health'],
    description: ['أدوية ومكملات ومستلزمات طبية. التصنيف فقط، والالتزام بقواعد الصرف مسؤولية الصيدلية.', 'Medicines, supplements and medical supplies. Labels only: dispensing rules are the pharmacy\'s responsibility.'],
    attributes: [
      { name: ['الشكل الدوائي', 'Dosage form'], values: ['أقراص|Tablets', 'كبسولات|Capsules', 'شراب|Syrup', 'حقن|Injection', 'كريم|Cream', 'مرهم|Ointment', 'جل|Gel', 'قطرة|Drops', 'بخاخ|Spray', 'تحاميل|Suppositories', 'أكياس فوّارة|Effervescent sachets', 'أقراص للمص|Lozenges'] },
      { name: ['التركيز / الجرعة', 'Strength'], values: ['5 مجم|5 mg', '10 مجم|10 mg', '25 مجم|25 mg', '50 مجم|50 mg', '100 مجم|100 mg', '250 مجم|250 mg', '500 مجم|500 mg', '1000 مجم|1000 mg'] },
      { name: ['حجم العبوة', 'Pack size'], values: ['10 أقراص|10 tablets', '20 قرص|20 tablets', '30 قرص|30 tablets', '60 قرص|60 tablets', '60 مل|60 ml', '100 مل|100 ml', '120 مل|120 ml', '250 مل|250 ml', '30 جم|30 g', '50 جم|50 g'] },
      { name: ['الفئة العمرية', 'Age group'], values: ['رضّع|Infants', 'أطفال|Children', 'مراهقين|Teens', 'بالغين|Adults', 'كبار السن|Seniors', 'الحوامل والمرضعات|Pregnant & nursing'] },
      { name: ['نوع الصرف', 'Dispensing'], values: ['بدون وصفة|Over the counter', 'بوصفة طبية|Prescription only', 'مكمل غذائي|Supplement', 'مستحضر تجميل|Cosmetic', 'جهاز طبي|Medical device'] },
      { name: ['التصنيف العلاجي', 'Therapeutic category'], values: ['مسكنات وخافضات حرارة|Pain & fever', 'مضادات حيوية|Antibiotics', 'برد وكحة وحساسية|Cold, cough & allergy', 'جهاز هضمي|Digestive', 'سكر وضغط وقلب|Diabetes, pressure & heart', 'فيتامينات ومكملات|Vitamins & supplements', 'عناية بالبشرة والشعر|Skin & hair care', 'أم وطفل|Mother & baby', 'عناية بالفم والأسنان|Oral care', 'إسعافات وجروح|First aid', 'أجهزة ومستلزمات طبية|Medical devices'] },
      { name: ['التخزين', 'Storage'], values: ['درجة حرارة الغرفة|Room temperature', 'مبرّد 2–8°|Refrigerated 2–8°', 'بعيداً عن الضوء|Protect from light'] },
      { name: ['المقاس (للمستلزمات)', 'Size (supplies)'], values: ['S', 'M', 'L', 'XL', 'مقاس واحد|One size'] },
      { name: ['مناسب لـ', 'Suitable for'], values: ['خالي من الغلوتين|Gluten-free', 'مرضى السكر|Diabetic-friendly', 'خالي من السكر|Sugar-free', 'نباتي|Vegan', 'خالي من الكحول|Alcohol-free'] },
    ],
  },
];

/** Split 'عربي|English|#hex' into a value (the same text is used for both languages when only one is given). */
export const parseTemplateValue = (raw) => {
  const [ar, en, color] = String(raw).split('|');
  const arabic = (ar || '').trim();
  return { name_ar: arabic, name_en: (en ?? ar ?? '').trim(), color: (color || '').trim() };
};

export const templateStats = (template) => ({
  attributes: template.attributes.length,
  values: template.attributes.reduce((sum, attribute) => sum + attribute.values.length, 0),
});

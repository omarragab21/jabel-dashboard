// The animations a homepage banner can use to change to the next one. The choice is saved in the site setting
// `banner_animation` (Homepage Banners page) and played by the website. The ids must match the website's list
// (website/src/domain/home/bannerAnimation.js); `cinematic` is the original animation and the default.
// The preview on the page uses the website's own CSS (assets/bannerAnimations.css), so it plays exactly like the site.

export const BANNER_ANIMATION_KEY = 'banner_animation';
export const DEFAULT_BANNER_ANIMATION = 'cinematic';

// [id, [Arabic name, English name], [Arabic hint, English hint]]
const item = (id, ar, en, hintAr, hintEn) => ({ id, label: [ar, en], hint: [hintAr, hintEn] });

export const BANNER_ANIMATION_GROUPS = [
  { id: 'classic', label: ['أساسي', 'Classic'], items: [
    item('cinematic', 'سينمائي', 'Cinematic', 'كشف بمسح جانبي مع تكبير الصورة (الحالي)', 'Side wipe reveal with a camera pull-back (current)'),
    item('fade', 'تلاشي', 'Fade', 'تداخل ناعم بين الصورتين', 'Soft cross-fade between the slides'),
    item('zoom', 'تكبير', 'Zoom', 'الجديدة تكبر والقديمة تصغر', 'The new slide grows in, the old one shrinks'),
    item('none', 'بدون حركة', 'None', 'تغيير فوري', 'The slide just changes'),
  ] },
  { id: 'slide', label: ['انزلاق', 'Slide'], items: [
    item('slide', 'انزلاق جانبي', 'Slide', 'الشرائح تدفع بعضها جانبياً', 'Slides push each other sideways'),
    item('vertical', 'انزلاق رأسي', 'Vertical slide', 'الشرائح تتحرك لأعلى وأسفل', 'Slides move up and down'),
    item('parallax', 'بارالاكس', 'Parallax', 'الصورة تتحرك أبطأ من الشريحة فيظهر عمق', 'The photo moves slower than the slide for depth'),
    item('push-over', 'تغطية', 'Push over', 'الجديدة تنزلق فوق القديمة وهي تغمق', 'The new slide slides over the old one as it dims'),
    item('reveal-under', 'كشف من تحت', 'Reveal under', 'القديمة تنزلق بعيد وتكشف الجديدة تحتها', 'The old slide slides away to reveal the new one'),
    item('slide-diagonal', 'انزلاق قطري', 'Diagonal slide', 'الشرائح تتحرك بالقطر', 'Slides move diagonally'),
    item('stack', 'كروت متراصة', 'Stack', 'الجديدة تنزل من فوق كأنها كارت', 'The new slide drops in from above like a card'),
    item('cover-flow', 'كفر فلو', 'Cover flow', 'الشرائح تميل في عمق ثلاثي الأبعاد', 'Slides tilt in 3D depth'),
  ] },
  { id: '3d', label: ['ثلاثي الأبعاد', '3D'], items: [
    item('flip', 'قلب', 'Flip', 'الشريحة تدور حول محور رأسي', 'The slide turns on a vertical axis'),
    item('flip-vertical', 'قلب أفقي', 'Flip vertical', 'الشريحة تدور حول محور أفقي', 'The slide turns on a horizontal axis'),
    item('cube', 'مكعب', 'Cube', 'مكعب يلف بين الشرائح', 'A cube turns between the slides'),
    item('cube-vertical', 'مكعب رأسي', 'Vertical cube', 'المكعب يلف لأعلى وأسفل', 'The cube turns up and down'),
    item('carousel-3d', 'دوّار 3D', '3D carousel', 'الشرائح على دائرة وتلف', 'Slides sit on a ring and rotate'),
    item('rotate', 'دوران', 'Rotate', 'الشريحة تلف حول مركزها وهي تتلاشى', 'The slide spins around its centre as it fades'),
    item('fold', 'طي', 'Fold', 'الشريحة تنطوي كورقة', 'The slide folds like paper'),
    item('door', 'باب', 'Door', 'الشريحة تنفتح كباب', 'The slide swings open like a door'),
    item('card-swap', 'تبديل كارت', 'Card swap', 'الكارت يطير بعيد والتاني يطلع', 'The card flies off and the next one comes up'),
    item('tilt-shift', 'ميل', 'Tilt', 'ميل خفيف مع تكبير', 'A gentle tilt with a zoom'),
  ] },
  { id: 'reveal', label: ['كشف', 'Reveal'], items: [
    item('wipe', 'مسح', 'Wipe', 'مسح مستقيم من الجانب', 'A straight wipe from the side'),
    item('circle-reveal', 'دائرة', 'Circle reveal', 'دائرة تكبر من الجانب', 'A circle grows from the side'),
    item('diamond', 'معين', 'Diamond', 'معين يكبر ويكشف الصورة', 'A diamond grows and reveals the photo'),
    item('blinds', 'ستاير', 'Blinds', 'شرائح رأسية تنفتح', 'Vertical blinds open'),
    item('split', 'انشقاق أفقي', 'Split', 'الصورة تنفتح من المنتصف لأعلى وأسفل', 'Opens from the middle upwards and downwards'),
    item('curtain', 'ستارة', 'Curtain', 'ستارة مسرح تنفتح من المنتصف', 'A stage curtain opens from the centre'),
    item('diagonal-wipe', 'مسح قطري', 'Diagonal wipe', 'مسح مائل من الركن', 'A slanted wipe from the corner'),
    item('iris', 'عدسة', 'Iris', 'فتحة كعدسة الكاميرا', 'An opening like a camera lens'),
    item('slices', 'شرائح', 'Slices', 'أعمدة تنزل وتكشف الصورة', 'Columns drop down to reveal the photo'),
    item('pixelate', 'مربعات', 'Pixelate', 'الصورة تتكوّن من مربعات', 'The photo builds up from blocks'),
  ] },
  { id: 'effects', label: ['تأثيرات', 'Effects'], items: [
    item('blur', 'ضبابي', 'Blur', 'انتقال عبر ضبابية', 'Dissolves through a blur'),
    item('dip-to-black', 'عبر الأسود', 'Dip to black', 'تغمق للأسود ثم تظهر الجديدة', 'Fades to black, then the new slide appears'),
    item('dip-to-white', 'عبر الأبيض', 'Dip to white', 'تفتح للأبيض ثم تظهر الجديدة', 'Fades to white, then the new slide appears'),
    item('flash', 'وميض', 'Flash', 'وميض أبيض سريع', 'A quick white flash'),
    item('glitch', 'تشويش', 'Glitch', 'تشويش رقمي قصير', 'A short digital glitch'),
    item('vhs', 'شريط قديم', 'VHS', 'خطوط واهتزاز كشريط الفيديو', 'Scan lines and wobble like old tape'),
    item('ripple', 'موجة', 'Ripple', 'موجة ماء من المنتصف', 'A water ripple from the centre'),
    item('grayscale', 'رمادي', 'Grayscale', 'القديمة تتحول رمادي وتتلاشى', 'The old slide turns grey and fades'),
    item('sepia-fade', 'سيبيا', 'Sepia fade', 'تلاشي بلون دافئ', 'A fade through a warm tone'),
    item('zoom-blur', 'تكبير ضبابي', 'Zoom blur', 'تكبير عنيف مع ضبابية حركة', 'A hard zoom with motion blur'),
    item('light-sweep', 'شعاع ضوء', 'Light sweep', 'شعاع ضوء يعدي مع التغيير', 'A beam of light sweeps across as it changes'),
    item('pull-focus', 'ضبط البؤرة', 'Pull focus', 'الجديدة من ضبابية لوضوح', 'The new slide sharpens into focus'),
  ] },
  { id: 'camera', label: ['حركة كاميرا', 'Camera'], items: [
    item('kenburns', 'كاميرا (تصغير)', 'Ken Burns', 'تلاشي بطيء والصورة تصغر ببطء', 'Slow fade while the photo drifts back'),
    item('kenburns-pan', 'كاميرا (تحريك)', 'Ken Burns pan', 'الصورة تتحرك أفقياً ببطء', 'The photo pans slowly sideways'),
    item('kenburns-in', 'كاميرا (تقريب)', 'Ken Burns zoom-in', 'الصورة تقرب ببطء', 'The photo slowly zooms in'),
    item('dolly', 'دولي', 'Dolly', 'الكاميرا تقرب وتدخل الشريحة', 'The camera pushes into the slide'),
  ] },
  { id: 'text', label: ['النص', 'Text'], items: [
    item('text-stagger', 'نص متتابع', 'Text stagger', 'العنوان والوصف والزر يطلعوا بالتتابع', 'Title, text and button rise one after another'),
    item('text-slide', 'نص منزلق', 'Text slide', 'النص ينزلق من الجانب', 'The text slides in from the side'),
    item('text-reveal', 'نص يتكشف', 'Text reveal', 'النص يتكشف كأنه يُكتب', 'The text is revealed as if written'),
    item('text-blur-in', 'نص من ضبابية', 'Text blur-in', 'النص يتضح من ضبابية', 'The text sharpens out of a blur'),
  ] },
  { id: 'combo', label: ['مركّبة', 'Combos'], items: [
    item('premium', 'فاخر', 'Premium', 'مسح مع بارالاكس ونص متتابع', 'A wipe with parallax and staggered text'),
    item('elegant', 'أنيق', 'Elegant', 'عبر الأسود مع تكبير بطيء ونص هادئ', 'Dip to black with a slow zoom and calm text'),
    item('energetic', 'حيوي', 'Energetic', 'أعمدة مع تكبير ونص سريع', 'Columns with a zoom and quick text'),
  ] },
];

export const BANNER_ANIMATIONS = BANNER_ANIMATION_GROUPS.flatMap((group) => group.items.map((entry) => ({ ...entry, group: group.id })));

/** A stored value as an animation id; empty or unknown values mean the default. */
export const resolveBannerAnimation = (value) => {
  const id = String(value ?? '').trim().toLowerCase();
  return BANNER_ANIMATIONS.some((entry) => entry.id === id) ? id : DEFAULT_BANNER_ANIMATION;
};

/** The Vue transition name for an animation and a direction (same naming as the website). */
export const bannerTransitionName = (animation, direction = 'right') => {
  const side = direction === 'left' ? 'left' : 'right';
  return animation === 'cinematic' ? `slide-${side}` : `hero-${animation}-${side}`;
};

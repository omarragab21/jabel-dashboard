// The animations a homepage banner can use to change to the next one. The choice is saved in the site setting
// `banner_animation` (Homepage Banners page) and played by the website. The ids must match the website's list
// (website/src/domain/home/bannerAnimation.js); `cinematic` is the original animation and the default.

export const BANNER_ANIMATION_KEY = 'banner_animation';
export const DEFAULT_BANNER_ANIMATION = 'cinematic';

export const BANNER_ANIMATIONS = [
  { id: 'cinematic', label: ['سينمائي', 'Cinematic'], hint: ['كشف بمسح جانبي مع تكبير الصورة (الحالي)', 'Side wipe reveal with a camera pull-back (current)'] },
  { id: 'fade', label: ['تلاشي', 'Fade'], hint: ['تداخل ناعم بين الصورتين', 'Soft cross-fade between the slides'] },
  { id: 'slide', label: ['انزلاق جانبي', 'Slide'], hint: ['الشرائح تدفع بعضها جانبياً', 'Slides push each other sideways'] },
  { id: 'vertical', label: ['انزلاق رأسي', 'Vertical slide'], hint: ['الشرائح تتحرك لأعلى وأسفل', 'Slides move up and down'] },
  { id: 'zoom', label: ['تكبير', 'Zoom'], hint: ['الشريحة الجديدة تكبر والقديمة تصغر', 'The new slide grows in, the old one shrinks'] },
  { id: 'flip', label: ['قلب', 'Flip'], hint: ['الشريحة تدور حول محور رأسي', 'The slide turns on a vertical axis'] },
  { id: 'blur', label: ['ضبابي', 'Blur'], hint: ['انتقال عبر ضبابية', 'Dissolves through a blur'] },
  { id: 'kenburns', label: ['حركة كاميرا', 'Ken Burns'], hint: ['تلاشي بطيء مع انجراف الصورة', 'Slow fade while the photo drifts'] },
  { id: 'none', label: ['بدون حركة', 'None'], hint: ['تغيير فوري', 'The slide just changes'] },
];

/** A stored value as an animation id; empty or unknown values mean the default. */
export const resolveBannerAnimation = (value) => {
  const id = String(value ?? '').trim().toLowerCase();
  return BANNER_ANIMATIONS.some((item) => item.id === id) ? id : DEFAULT_BANNER_ANIMATION;
};

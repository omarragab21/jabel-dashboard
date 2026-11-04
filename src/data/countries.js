// Comprehensive dataset of world countries with flags, dial codes, Arabic/English names, placeholders and validation rules
export const countries = [
  // Middle East & North Africa (MENA)
  { code: 'JO', dialCode: '+962', flag: '🇯🇴', nameAr: 'الأردن', nameEn: 'Jordan', placeholder: '07 9123 4567', minLength: 9, maxLength: 14 },
  { code: 'SA', dialCode: '+966', flag: '🇸🇦', nameAr: 'السعودية', nameEn: 'Saudi Arabia', placeholder: '05 1234 5678', minLength: 9, maxLength: 14 },
  { code: 'AE', dialCode: '+971', flag: '🇦🇪', nameAr: 'الإمارات', nameEn: 'United Arab Emirates', placeholder: '050 123 4567', minLength: 9, maxLength: 13 },
  { code: 'KW', dialCode: '+965', flag: '🇰🇼', nameAr: 'الكويت', nameEn: 'Kuwait', placeholder: '9123 4567', minLength: 8, maxLength: 13 },
  { code: 'QA', dialCode: '+974', flag: '🇶🇦', nameAr: 'قطر', nameEn: 'Qatar', placeholder: '3312 3456', minLength: 8, maxLength: 12 },
  { code: 'OM', dialCode: '+968', flag: '🇴🇲', nameAr: 'عُمان', nameEn: 'Oman', placeholder: '9123 4567', minLength: 8, maxLength: 12 },
  { code: 'BH', dialCode: '+973', flag: '🇧🇭', nameAr: 'البحرين', nameEn: 'Bahrain', placeholder: '3912 3456', minLength: 8, maxLength: 12 },
  { code: 'EG', dialCode: '+20', flag: '🇪🇬', nameAr: 'مصر', nameEn: 'Egypt', placeholder: '010 1234 5678', minLength: 10, maxLength: 13 },
  { code: 'IQ', dialCode: '+964', flag: '🇮🇶', nameAr: 'العراق', nameEn: 'Iraq', placeholder: '0770 123 4567', minLength: 10, maxLength: 13 },
  { code: 'PS', dialCode: '+970', flag: '🇵🇸', nameAr: 'فلسطين', nameEn: 'Palestine', placeholder: '059 123 4567', minLength: 9, maxLength: 13 },
  { code: 'LB', dialCode: '+961', flag: '🇱🇧', nameAr: 'لبنان', nameEn: 'Lebanon', placeholder: '71 123 456', minLength: 7, maxLength: 12 },
  { code: 'SY', dialCode: '+963', flag: '🇸🇾', nameAr: 'سوريا', nameEn: 'Syria', placeholder: '093 123 4567', minLength: 9, maxLength: 13 },
  { code: 'YE', dialCode: '+967', flag: '🇾🇪', nameAr: 'اليمن', nameEn: 'Yemen', placeholder: '77 123 4567', minLength: 9, maxLength: 13 },
  { code: 'SD', dialCode: '+249', flag: '🇸🇩', nameAr: 'السودان', nameEn: 'Sudan', placeholder: '091 234 5678', minLength: 9, maxLength: 13 },
  { code: 'LY', dialCode: '+218', flag: '🇱🇾', nameAr: 'ليبيا', nameEn: 'Libya', placeholder: '091 123 4567', minLength: 9, maxLength: 13 },
  { code: 'TN', dialCode: '+216', flag: '🇹🇳', nameAr: 'تونس', nameEn: 'Tunisia', placeholder: '91 234 567', minLength: 8, maxLength: 12 },
  { code: 'DZ', dialCode: '+213', flag: '🇩🇿', nameAr: 'الجزائر', nameEn: 'Algeria', placeholder: '0550 12 34 56', minLength: 9, maxLength: 13 },
  { code: 'MA', dialCode: '+212', flag: '🇲🇦', nameAr: 'المغرب', nameEn: 'Morocco', placeholder: '0612 345 678', minLength: 9, maxLength: 13 },
  { code: 'MR', dialCode: '+222', flag: '🇲🇷', nameAr: 'موريتانيا', nameEn: 'Mauritania', placeholder: '45 12 34 56', minLength: 8, maxLength: 12 },
  { code: 'SO', dialCode: '+252', flag: '🇸🇴', nameAr: 'الصومال', nameEn: 'Somalia', placeholder: '61 512 3456', minLength: 8, maxLength: 12 },
  { code: 'DJ', dialCode: '+253', flag: '🇩🇯', nameAr: 'جيبوتي', nameEn: 'Djibouti', placeholder: '77 12 34 56', minLength: 8, maxLength: 12 },
  { code: 'KM', dialCode: '+269', flag: '🇰🇲', nameAr: 'جزر القمر', nameEn: 'Comoros', placeholder: '321 23 45', minLength: 7, maxLength: 12 },

  // Americas & Europe
  { code: 'US', dialCode: '+1', flag: '🇺🇸', nameAr: 'الولايات المتحدة', nameEn: 'United States', placeholder: '202 555 0123', minLength: 10, maxLength: 11 },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦', nameAr: 'كندا', nameEn: 'Canada', placeholder: '416 555 0123', minLength: 10, maxLength: 11 },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', nameAr: 'المملكة المتحدة', nameEn: 'United Kingdom', placeholder: '07911 123456', minLength: 10, maxLength: 11 },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', nameAr: 'ألمانيا', nameEn: 'Germany', placeholder: '0151 23456789', minLength: 10, maxLength: 12 },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', nameAr: 'فرنسا', nameEn: 'France', placeholder: '06 12 34 56 78', minLength: 9, maxLength: 10 },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹', nameAr: 'إيطاليا', nameEn: 'Italy', placeholder: '312 345 6789', minLength: 9, maxLength: 11 },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', nameAr: 'إسبانيا', nameEn: 'Spain', placeholder: '612 34 56 78', minLength: 9, maxLength: 10 },
  { code: 'TR', dialCode: '+90', flag: '🇹🇷', nameAr: 'تركيا', nameEn: 'Turkey', placeholder: '0501 234 5678', minLength: 10, maxLength: 11 },
  { code: 'RU', dialCode: '+7', flag: '🇷🇺', nameAr: 'روسيا', nameEn: 'Russia', placeholder: '912 345 6789', minLength: 10, maxLength: 11 },
  { code: 'NL', dialCode: '+31', flag: '🇳🇱', nameAr: 'هولندا', nameEn: 'Netherlands', placeholder: '06 12345678', minLength: 9, maxLength: 10 },
  { code: 'BE', dialCode: '+32', flag: '🇧🇪', nameAr: 'بلجيكا', nameEn: 'Belgium', placeholder: '0471 23 45 67', minLength: 9, maxLength: 10 },
  { code: 'CH', dialCode: '+41', flag: '🇨🇭', nameAr: 'سويسرا', nameEn: 'Switzerland', placeholder: '078 123 45 67', minLength: 9, maxLength: 10 },
  { code: 'SE', dialCode: '+46', flag: '🇸🇪', nameAr: 'السويد', nameEn: 'Sweden', placeholder: '070 123 45 67', minLength: 9, maxLength: 10 },
  { code: 'NO', dialCode: '+47', flag: '🇳🇴', nameAr: 'النرويج', nameEn: 'Norway', placeholder: '412 34 567', minLength: 8, maxLength: 10 },
  { code: 'DK', dialCode: '+45', flag: '🇩🇰', nameAr: 'الدنمارك', nameEn: 'Denmark', placeholder: '20 12 34 56', minLength: 8, maxLength: 10 },
  { code: 'FI', dialCode: '+358', flag: '🇫🇮', nameAr: 'فنلندا', nameEn: 'Finland', placeholder: '040 1234567', minLength: 8, maxLength: 10 },
  { code: 'AT', dialCode: '+43', flag: '🇦🇹', nameAr: 'النمسا', nameEn: 'Austria', placeholder: '0664 1234567', minLength: 10, maxLength: 12 },
  { code: 'GR', dialCode: '+30', flag: '🇬🇷', nameAr: 'اليونان', nameEn: 'Greece', placeholder: '691 234 5678', minLength: 10, maxLength: 11 },
  { code: 'PT', dialCode: '+351', flag: '🇵🇹', nameAr: 'البرتغال', nameEn: 'Portugal', placeholder: '912 345 678', minLength: 9, maxLength: 10 },
  { code: 'IE', dialCode: '+353', flag: '🇮🇪', nameAr: 'أيرلندا', nameEn: 'Ireland', placeholder: '083 123 4567', minLength: 9, maxLength: 10 },
  { code: 'PL', dialCode: '+48', flag: '🇵🇱', nameAr: 'بولندا', nameEn: 'Poland', placeholder: '512 345 678', minLength: 9, maxLength: 10 },
  { code: 'RO', dialCode: '+40', flag: '🇷🇴', nameAr: 'رومانيا', nameEn: 'Romania', placeholder: '0712 345 678', minLength: 9, maxLength: 10 },
  { code: 'UA', dialCode: '+380', flag: '🇺🇦', nameAr: 'أوكرانيا', nameEn: 'Ukraine', placeholder: '050 123 4567', minLength: 9, maxLength: 10 },

  // Asia & Oceania
  { code: 'IN', dialCode: '+91', flag: '🇮🇳', nameAr: 'الهند', nameEn: 'India', placeholder: '98123 45678', minLength: 10, maxLength: 11 },
  { code: 'PK', dialCode: '+92', flag: '🇵🇰', nameAr: 'باكستان', nameEn: 'Pakistan', placeholder: '0300 1234567', minLength: 10, maxLength: 11 },
  { code: 'BD', dialCode: '+880', flag: '🇧🇩', nameAr: 'بنغلاديش', nameEn: 'Bangladesh', placeholder: '01712 345678', minLength: 10, maxLength: 11 },
  { code: 'CN', dialCode: '+86', flag: '🇨🇳', nameAr: 'الصين', nameEn: 'China', placeholder: '138 1234 5678', minLength: 11, maxLength: 12 },
  { code: 'JP', dialCode: '+81', flag: '🇯🇵', nameAr: 'اليابان', nameEn: 'Japan', placeholder: '090 1234 5678', minLength: 10, maxLength: 11 },
  { code: 'KR', dialCode: '+82', flag: '🇰🇷', nameAr: 'كوريا الجنوبية', nameEn: 'South Korea', placeholder: '010 1234 5678', minLength: 10, maxLength: 11 },
  { code: 'MY', dialCode: '+60', flag: '🇲🇾', nameAr: 'ماليزيا', nameEn: 'Malaysia', placeholder: '012 345 6789', minLength: 9, maxLength: 10 },
  { code: 'SG', dialCode: '+65', flag: '🇸🇬', nameAr: 'سنغافورة', nameEn: 'Singapore', placeholder: '8123 4567', minLength: 8, maxLength: 10 },
  { code: 'ID', dialCode: '+62', flag: '🇮🇩', nameAr: 'إندونيسيا', nameEn: 'Indonesia', placeholder: '0812 3456 789', minLength: 9, maxLength: 12 },
  { code: 'PH', dialCode: '+63', flag: '🇵🇭', nameAr: 'الفلبين', nameEn: 'Philippines', placeholder: '0917 123 4567', minLength: 10, maxLength: 11 },
  { code: 'TH', dialCode: '+66', flag: '🇹🇭', nameAr: 'تايلاند', nameEn: 'Thailand', placeholder: '081 234 5678', minLength: 9, maxLength: 10 },
  { code: 'VN', dialCode: '+84', flag: '🇻🇳', nameAr: 'فيتنام', nameEn: 'Vietnam', placeholder: '091 234 5678', minLength: 9, maxLength: 10 },
  { code: 'AU', dialCode: '+61', flag: '🇦🇺', nameAr: 'أستراليا', nameEn: 'Australia', placeholder: '0412 345 678', minLength: 9, maxLength: 10 },
  { code: 'NZ', dialCode: '+64', flag: '🇳🇿', nameAr: 'نيوزيلندا', nameEn: 'New Zealand', placeholder: '021 123 4567', minLength: 8, maxLength: 10 },

  // South America & Africa & Rest of World
  { code: 'BR', dialCode: '+55', flag: '🇧🇷', nameAr: 'البرازيل', nameEn: 'Brazil', placeholder: '11 91234 5678', minLength: 10, maxLength: 11 },
  { code: 'AR', dialCode: '+54', flag: '🇦🇷', nameAr: 'الأرجنتين', nameEn: 'Argentina', placeholder: '11 1234 5678', minLength: 10, maxLength: 12 },
  { code: 'MX', dialCode: '+52', flag: '🇲🇽', nameAr: 'المكسيك', nameEn: 'Mexico', placeholder: '55 1234 5678', minLength: 10, maxLength: 11 },
  { code: 'ZA', dialCode: '+27', flag: '🇿🇦', nameAr: 'جنوب أفريقيا', nameEn: 'South Africa', placeholder: '083 123 4567', minLength: 9, maxLength: 10 },
  { code: 'NG', dialCode: '+234', flag: '🇳🇬', nameAr: 'نيجيريا', nameEn: 'Nigeria', placeholder: '0802 123 4567', minLength: 10, maxLength: 11 },
  { code: 'KE', dialCode: '+254', flag: '🇰🇪', nameAr: 'كينيا', nameEn: 'Kenya', placeholder: '0712 345 678', minLength: 9, maxLength: 10 }
];

// Helper to find a country by code
export function findCountryByCode(code) {
  if (!code) return countries[0]; // Default to Jordan
  return countries.find(c => c.code.toUpperCase() === code.toUpperCase()) || countries[0];
}

// Validator for phone numbers by country
export function validatePhoneByCountry(phone, countryCode, lang = 'ar') {
  const country = findCountryByCode(countryCode);
  const cleaned = phone ? String(phone).replace(/[\s\-+()]/g, '') : '';
  const isEn = lang === 'en';

  if (!cleaned) {
    return isEn ? 'Phone number is required' : 'رقم الهاتف مطلوب';
  }

  // Remove dialcode if user typed it inside input
  const pureDialCode = country.dialCode.replace('+', '');
  let numberDigits = cleaned;
  if (numberDigits.startsWith(pureDialCode)) {
    numberDigits = numberDigits.slice(pureDialCode.length);
  } else if (numberDigits.startsWith('00' + pureDialCode)) {
    numberDigits = numberDigits.slice(('00' + pureDialCode).length);
  }

  // Specific rules
  if (country.code === 'JO') {
    if (numberDigits.startsWith('07')) {
      if (numberDigits.length !== 10) return isEn ? 'Jordanian local phone number must be 10 digits starting with 07' : 'رقم الهاتف المحلي للأردن يجب أن يكون 10 أرقام ويبدأ بـ 07';
      return null;
    }
    if (numberDigits.startsWith('7')) {
      if (numberDigits.length !== 9) return isEn ? 'Jordanian phone number must be 9 digits starting with 7' : 'رقم الهاتف للأردن يجب أن يكون 9 أرقام ويبدأ بـ 7';
      return null;
    }
    if (!/^\d{9,10}$/.test(numberDigits)) return isEn ? 'Invalid Jordanian phone number (e.g. 0791234567)' : 'رقم الهاتف الأردني غير صالح (مثال: 0791234567)';
    return null;
  }

  if (country.code === 'SA') {
    if (numberDigits.startsWith('05')) {
      if (numberDigits.length !== 10) return isEn ? 'Saudi local phone number must be 10 digits starting with 05' : 'رقم الهاتف المحلي للسعودية يجب أن يكون 10 أرقام ويبدأ بـ 05';
      return null;
    }
    if (numberDigits.startsWith('5')) {
      if (numberDigits.length !== 9) return isEn ? 'Saudi phone number must be 9 digits starting with 5' : 'رقم الهاتف للسعودية يجب أن يكون 9 أرقام ويبدأ بـ 5';
      return null;
    }
    if (!/^\d{9,10}$/.test(numberDigits)) return isEn ? 'Invalid Saudi phone number (e.g. 0512345678)' : 'رقم الهاتف السعودي غير صالح (مثال: 0512345678)';
    return null;
  }

  if (country.code === 'AE') {
    if (numberDigits.startsWith('05')) {
      if (numberDigits.length !== 10) return isEn ? 'UAE phone number must be 10 digits starting with 05' : 'رقم الهاتف في الإمارات يجب أن يكون 10 أرقام ويبدأ بـ 05';
      return null;
    }
    if (numberDigits.startsWith('5')) {
      if (numberDigits.length !== 9) return isEn ? 'UAE phone number must be 9 digits starting with 5' : 'رقم الهاتف في الإمارات يجب أن يكون 9 أرقام ويبدأ بـ 5';
      return null;
    }
    return null;
  }

  if (country.code === 'KW') {
    if (numberDigits.length !== 8) return isEn ? 'Kuwaiti phone number must be 8 digits' : 'رقم الهاتف الكويتي يجب أن يتكون من 8 أرقام';
    return null;
  }

  if (country.code === 'EG') {
    if (numberDigits.startsWith('01')) {
      if (numberDigits.length !== 11) return isEn ? 'Egyptian phone number must be 11 digits starting with 01' : 'رقم الهاتف المصري يجب أن يكون 11 رقماً ويبدأ بـ 01';
      return null;
    }
    if (numberDigits.startsWith('1')) {
      if (numberDigits.length !== 10) return isEn ? 'Egyptian phone number must be 10 digits starting with 1' : 'رقم الهاتف المصري يجب أن يكون 10 أرقام ويبدأ بـ 1';
      return null;
    }
    return null;
  }

  // Universal Validation Rule for all other world countries
  if (!/^\d{7,15}$/.test(numberDigits)) {
    const cName = isEn ? country.nameEn : country.nameAr;
    return isEn ? `Invalid phone number for ${cName} (must be ${country.minLength} to ${country.maxLength} digits)` : `رقم الهاتف غير صالح لـ ${country.nameAr} (يجب أن يتكون من ${country.minLength} إلى ${country.maxLength} أرقام)`;
  }

  return null;
}

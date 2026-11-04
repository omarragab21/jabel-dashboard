const apiBase = (process.env.TIJARA_API_BASE_URL || 'https://backend-jabal.be-kite.com/api').replace(/\/$/, '');
const email = process.env.TIJARA_ADMIN_EMAIL;
const password = process.env.TIJARA_ADMIN_PASSWORD;
const shouldApply = process.argv.includes('--apply');

if (!email || !password) {
  throw new Error('Set TIJARA_ADMIN_EMAIL and TIJARA_ADMIN_PASSWORD before running this script.');
}

// These IDs come from the attributes API. Keeping the dictionary keyed by ID
// prevents a translated Arabic label from being applied to the wrong option.
const englishByOptionId = {
  23: '85 liters',
  24: '65 liters',
  25: '10 liters / minute',
  26: '5 gas burners',
  27: '4 gas burners',
  28: 'Suction power 1200 m³/hour',
  29: 'Grill area 70 × 45 cm',
  30: '89.5 cm',
  31: '135 cm',
  32: '86 cm',
  33: '90 cm',
  34: '58 cm',
  35: '35 cm',
  36: '56 cm',
  37: '51 cm',
  38: '50 cm',
  39: '58 cm',
  40: '18 cm',
  41: 'Royal Black',
  42: 'Silver',
  43: 'Royal Black / Silver',
  44: 'White',
  45: 'Stainless Steel',
  46: '59.5 cm',
  47: '12 cm',
  48: '4.5 cm',
  49: '70-105 cm',
  50: '55 cm',
  51: '5 cm',
  52: '115 cm',
  53: '72 cm',
  55: 'Natural / LPG gas',
  56: 'LPG gas',
  57: '230 W electricity',
  58: 'Full instant safety',
  59: 'Triple integrated protection',
  60: 'Full safety',
  61: 'Certified safety valves',
  62: 'Safe brass valves',
  63: 'ODS system with tilt lock',
  64: '6 functions',
  65: '7 functions',
  66: '4 functions',
  67: 'Automatic when the water tap opens',
  68: 'Electronic ignition integrated into the knob',
  69: 'Electronic self-ignition',
  70: 'Automatic electronic ignition',
  71: 'Self piezo ignition',
  72: 'Digital LED display',
  73: 'No',
  74: 'Digital temperature indicator',
  75: 'Built-in lid thermometer',
  76: '220-240 volts',
  77: 'No electricity required',
  78: 'Battery-powered electronic display',
  79: 'Tempered black glass',
  80: 'Stainless steel and black',
};

const json = (response) => response.json().catch(() => ({}));

const loginResponse = await fetch(`${apiBase}/v1/admin/login`, {
  method: 'POST',
  headers: { accept: 'application/json', 'content-type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const loginBody = await json(loginResponse);
const token = loginBody.token || loginBody.data?.token;
if (!loginResponse.ok || !token) {
  throw new Error(`Admin login failed (${loginResponse.status}).`);
}

const headers = { accept: 'application/json', authorization: `Bearer ${token}` };
const attributesResponse = await fetch(`${apiBase}/v1/attributes`, { headers });
const attributesBody = await json(attributesResponse);
const attributes = attributesBody.data?.data || attributesBody.data || attributesBody.items || attributesBody;
if (!attributesResponse.ok || !Array.isArray(attributes)) {
  throw new Error(`Attributes request failed (${attributesResponse.status}).`);
}

const updates = [];
for (const attribute of attributes) {
  for (const option of attribute.options || attribute.values || []) {
    const nameAr = option.translations?.ar?.name || option.name_ar || option.name || '';
    const currentEnglish = option.translations?.en?.name || option.name_en || '';
    const nextEnglish = englishByOptionId[Number(option.id)];
    if (!nameAr || !nextEnglish || currentEnglish === nextEnglish) continue;
    updates.push({
      attributeId: attribute.id,
      optionId: option.id,
      nameAr,
      currentEnglish,
      nextEnglish,
      valueCode: option.value_code || null,
    });
  }
}

console.log(`${shouldApply ? 'Applying' : 'Planned'} ${updates.length} English option updates.`);

if (!shouldApply) {
  for (const update of updates) console.log(`${update.optionId}: ${update.nameAr} -> ${update.nextEnglish}`);
  console.log('Run again with --apply to persist these values.');
  process.exit(0);
}

for (const update of updates) {
  const response = await fetch(`${apiBase}/v1/attributes/${update.attributeId}/options/${update.optionId}`, {
    method: 'PUT',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({
      name_ar: update.nameAr,
      name_en: update.nextEnglish,
      value_code: update.valueCode,
    }),
  });
  if (!response.ok) {
    const body = await json(response);
    throw new Error(`Option ${update.optionId} failed (${response.status}): ${body.message || 'unknown error'}`);
  }
  console.log(`Updated ${update.optionId}: ${update.nextEnglish}`);
}

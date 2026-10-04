/**
 * Pure, deterministic voice & natural language text parser for Drip.
 * Extracts intent, amount (in paise), label, category, timestamp hints, and confidence.
 */

export interface ParsedVoiceResult {
  intent: 'expense' | 'goal_contribution' | 'income';
  amountPaise: number;
  label: string;
  category: string;
  goalName?: string;
  spentAt?: string;
  confidence: number;
  rawText: string;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  lac: 100000,
  lakhs: 100000,
  lacs: 100000,
  crore: 10000000,
  crores: 10000000,
  cr: 10000000,
  // Basic Hindi number words
  ek: 1,
  do: 2,
  teen: 3,
  chaar: 4,
  paanch: 5,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
  terah: 13,
  chaudah: 14,
  pandrah: 15,
  solah: 16,
  satrah: 17,
  atharah: 18,
  unnees: 19,
  bees: 20,
  tees: 30,
  chalis: 40,
  pachaas: 50,
  pachas: 50,
  saath: 60,
  sattar: 70,
  assi: 80,
  nabbe: 90,
  sau: 100,
  hazaar: 1000,
  hazar: 1000
};

const FILLER_WORDS = new Set([
  'i',
  'paid',
  'pay',
  'for',
  'spent',
  'spend',
  'on',
  'the',
  'a',
  'an',
  'my',
  'rupees',
  'rupee',
  'rs',
  'inr',
  'bucks',
  'to',
  'at',
  'in',
  'got',
  'received',
  'from',
  'add',
  'put',
  'into'
]);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Food & Drinks': [
    'breakfast',
    'lunch',
    'dinner',
    'snacks',
    'snack',
    'chai',
    'coffee',
    'tea',
    'starbucks',
    'mcdonalds',
    'swiggy',
    'zomato',
    'restaurant',
    'cafe',
    'biryani',
    'pizza',
    'burger',
    'dosa',
    'idli',
    'food',
    'samosa',
    'meal',
    'eating',
    'bar',
    'pub',
    'drinks'
  ],
  Transport: [
    'auto',
    'uber',
    'ola',
    'cab',
    'taxi',
    'petrol',
    'diesel',
    'fuel',
    'metro',
    'bus',
    'train',
    'flight',
    'parking',
    'toll',
    'travel',
    'commute',
    'hotel',
    'stay',
    'resort',
    'room',
    'airbnb',
    'lodge',
    'hostel',
    'oyo',
    'makemytrip',
    'agoda'
  ],
  Shopping: [
    'shopping',
    'amazon',
    'flipkart',
    'myntra',
    'clothes',
    'shoes',
    'electronics',
    'mall',
    'store',
    'zara',
    'h&m',
    'dress',
    'laptop',
    'phone',
    'mobile'
  ],
  'Bills & Utilities': [
    'bill',
    'bills',
    'electricity',
    'water',
    'gas',
    'wifi',
    'broadband',
    'mobile',
    'recharge',
    'rent',
    'maintenance',
    'subscription',
    'netflix',
    'spotify',
    'apple',
    'icloud',
    'prime',
    'emi',
    'insurance',
    'loan'
  ],
  Groceries: [
    'groceries',
    'grocery',
    'supermarket',
    'blinkit',
    'zepto',
    'instamart',
    'vegetables',
    'fruits',
    'milk',
    'bread',
    'ration',
    'kirana'
  ],
  Entertainment: [
    'movie',
    'movies',
    'cinema',
    'pvr',
    'theatre',
    'gaming',
    'steam',
    'concert',
    'party',
    'outing',
    'club'
  ],
  'Health & Medical': [
    'health',
    'medical',
    'medicine',
    'pharmacy',
    'doctor',
    'clinic',
    'hospital',
    'apollo',
    '1mg',
    'gym',
    'fitness',
    'test',
    'tests'
  ]
};

/**
 * Parses word numbers (e.g. "two hundred and fifty" -> 250, "ten thousand" -> 10000, "one lakh" -> 100000)
 */
function parseSpokenNumberWords(tokens: string[]): { value: number; usedTokens: Set<number> } | null {
  let total = 0;
  let current = 0;
  const used = new Set<number>();
  let foundAny = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].toLowerCase();

    // Check for "1.5k" or "2k" or "10k"
    const kMatch = t.match(/^(\d+(?:\.\d+)?)\s*k$/);
    if (kMatch) {
      used.add(i);
      return { value: parseFloat(kMatch[1]) * 1000, usedTokens: used };
    }

    if (t === 'and') continue;

    const val = NUMBER_WORDS[t];
    if (val !== undefined) {
      foundAny = true;
      used.add(i);
      if (val === 100 || val === 1000 || val === 100000 || val === 10000000) {
        current = current === 0 ? val : current * val;
        if (val >= 1000) {
          total += current;
          current = 0;
        }
      } else {
        current += val;
      }
    } else if (foundAny) {
      break;
    }
  }

  total += current;
  if (!foundAny) return null;
  return { value: total, usedTokens: used };
}

export function parseVoiceInput(raw: string): ParsedVoiceResult {
  const text = raw.trim();
  if (!text) {
    return {
      intent: 'expense',
      amountPaise: 0,
      label: 'Unknown',
      category: 'General',
      confidence: 0,
      rawText: raw
    };
  }

  // Pre-normalize: remove number formatting commas inside digits (e.g. 10,000 -> 10000, 1,00,000 -> 100000)
  const normalizedText = text
    .replace(/\b(\d+)(?:,(\d+))+\b/g, (m) => m.replace(/,/g, ''))
    .replace(/(\d+),(\d+)/g, '$1$2');

  const lower = normalizedText.toLowerCase();
  let intent: 'expense' | 'goal_contribution' | 'income' = 'expense';
  let goalName: string | undefined;

  // 1. Detect Intent
  if (
    lower.includes('goal') ||
    lower.includes('fund') ||
    lower.includes('save for') ||
    lower.startsWith('add ') && lower.includes(' to ') ||
    lower.startsWith('put ') && lower.includes(' in ')
  ) {
    intent = 'goal_contribution';
    // Extract goal target name
    const goalMatch = lower.match(/(?:to|in|for)\s+([a-z\s]+?)(?:\s+(?:fund|goal))?$/i);
    if (goalMatch) {
      goalName = goalMatch[1].trim();
    }
  } else if (
    lower.includes('got ') ||
    lower.includes('received ') ||
    lower.includes('bonus') ||
    lower.includes('salary') ||
    lower.includes('income') ||
    lower.includes('cashback')
  ) {
    intent = 'income';
  }

  // 2. Extract Amount
  let amountRupees = 0;
  let confidence = 0.5;
  const tokens = lower.split(/\s+/).filter(Boolean);
  let usedTokenIndices = new Set<number>();

  // Pattern A: Multipliers like "10k", "1.5k", "10 thousand", "1 lakh", "2.5 lakh", "1 crore"
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|lacs)\b/i);
  const croreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)\b/i);
  const thousandMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:thousand|hazaar|hazar|k)\b/i);

  if (croreMatch) {
    amountRupees = parseFloat(croreMatch[1]) * 10000000;
    confidence = 0.95;
    tokens.forEach((t, i) => {
      if (t.includes(croreMatch[1]) || /^(crore|crores|cr)$/.test(t)) usedTokenIndices.add(i);
    });
  } else if (lakhMatch) {
    amountRupees = parseFloat(lakhMatch[1]) * 100000;
    confidence = 0.95;
    tokens.forEach((t, i) => {
      if (t.includes(lakhMatch[1]) || /^(lakh|lac|lakhs|lacs)$/.test(t)) usedTokenIndices.add(i);
    });
  } else if (thousandMatch) {
    amountRupees = parseFloat(thousandMatch[1]) * 1000;
    confidence = 0.95;
    tokens.forEach((t, i) => {
      if (t.includes(thousandMatch[1]) || /^(thousand|hazaar|hazar|k)$/.test(t)) usedTokenIndices.add(i);
    });
  } else {
    // Check for standard digits (e.g. "10000", "250", "₹10000")
    const numTokenIdx = tokens.findIndex((t) => /^\d+(?:\.\d+)?$/.test(t.replace(/[₹,rs]/g, '')));
    if (numTokenIdx !== -1) {
      const cleanNum = tokens[numTokenIdx].replace(/[₹,rs]/g, '');
      amountRupees = parseFloat(cleanNum);
      confidence = 0.92;
      usedTokenIndices.add(numTokenIdx);
    } else {
      // Try spoken number words (e.g. "ten thousand", "ninety", "two hundred and fifty")
      const wordRes = parseSpokenNumberWords(tokens);
      if (wordRes && wordRes.value > 0) {
        amountRupees = wordRes.value;
        confidence = 0.88;
        usedTokenIndices = wordRes.usedTokens;
      }
    }
  }

  // 3. Extract Category
  let category = 'General';
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        category = catName;
        confidence = Math.min(confidence + 0.05, 0.98);
        break;
      }
    }
    if (category !== 'General') break;
  }

  // 4. Extract Date / Time hint
  let spentAt: string | undefined;
  if (lower.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    spentAt = d.toISOString();
  } else if (lower.includes('last night')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(21, 0, 0, 0);
    spentAt = d.toISOString();
  } else if (lower.includes('this morning')) {
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    spentAt = d.toISOString();
  }

  // 5. Extract Label from remaining meaningful tokens
  const labelTokens = tokens.filter((t, idx) => {
    if (usedTokenIndices.has(idx)) return false;
    const clean = t.replace(/[^a-z0-9]/g, '');
    return clean && !FILLER_WORDS.has(clean) && !/^\d+$/.test(clean);
  });

  let label = labelTokens.join(' ');
  if (!label) {
    label = category !== 'General' ? category : intent === 'income' ? 'Income' : 'Expense';
  } else {
    // Capitalize first letter of each word or sentence
    label = label.charAt(0).toUpperCase() + label.slice(1);
  }

  if (amountRupees <= 0) {
    confidence = 0.3;
  }

  return {
    intent,
    amountPaise: Math.round(amountRupees * 100),
    label,
    category,
    goalName,
    spentAt,
    confidence: Number(confidence.toFixed(2)),
    rawText: text
  };
}

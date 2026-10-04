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
  bees: 20,
  tees: 30,
  chalis: 40,
  pachaas: 50,
  saath: 60,
  sattar: 70,
  assi: 80,
  nabbe: 90,
  sau: 100,
  hazaar: 1000,
  lakh: 100000
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
    'eating'
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
    'commute'
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
    'dress'
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
    'prime'
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
    'fitness'
  ]
};

/**
 * Parses word numbers (e.g. "two hundred and fifty" -> 250, "one point five k" -> 1500)
 */
function parseSpokenNumberWords(tokens: string[]): { value: number; usedTokens: Set<number> } | null {
  let total = 0;
  let current = 0;
  const used = new Set<number>();
  let foundAny = false;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].toLowerCase();

    // Check for "1.5k" or "2k" or "2.5k"
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
      if (val === 100 || val === 1000 || val === 100000) {
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

  const lower = text.toLowerCase();
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
  const tokens = lower.split(/[\s,]+/);
  let usedTokenIndices = new Set<number>();

  // Pattern A: Digits with optional currency symbol or k (e.g. ₹60, rs 1500, 1.5k, 1,200)
  const regexAmount = /(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand|rupees|rs)?/i;
  const match = lower.match(regexAmount);

  // Check for multiplier "1.5k"
  const multiplierMatch = lower.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (multiplierMatch) {
    amountRupees = parseFloat(multiplierMatch[1]) * 1000;
    confidence = 0.95;
    // Mark token used
    tokens.forEach((t, i) => {
      if (t.includes(multiplierMatch[1]) || t === 'k') usedTokenIndices.add(i);
    });
  } else {
    // Check for standard numbers
    const numTokenIdx = tokens.findIndex((t) => /^\d+(?:,\d+)*(?:\.\d+)?$/.test(t.replace(/[₹,]/g, '')));
    if (numTokenIdx !== -1) {
      const cleanNum = tokens[numTokenIdx].replace(/[₹,]/g, '');
      amountRupees = parseFloat(cleanNum);
      confidence = 0.9;
      usedTokenIndices.add(numTokenIdx);
    } else {
      // Try spoken number words (e.g. "ninety", "two hundred and fifty")
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
    return clean && !FILLER_WORDS.has(clean);
  });

  let label = labelTokens.join(' ');
  if (!label) {
    label = category !== 'General' ? category : intent === 'income' ? 'Income' : 'Expense';
  } else {
    // Capitalize first letter
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

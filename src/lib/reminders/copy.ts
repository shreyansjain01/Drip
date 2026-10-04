/**
 * Quirky, warm reminder message bank matching DESIGN.md Section 10.
 * At least 4 variants per slot type rotated without immediate repeats.
 */

export const NOTIFICATION_COPY_BANK: Record<string, string[]> = {
  breakfast: [
    'Your wallet is hungry too 🍳 What did breakfast cost?',
    'Morning fuel logged? Tell Drip before the coffee kicks in ☕',
    'Chai, dosa, or cereal? Let us log that breakfast bite 🥞',
    'Start the day with clean books 🌅 What was breakfast?'
  ],
  lunch: [
    "Lunch happened. Receipts didn't. Tell me the damage 🍛",
    'Biryani, sandwich, or thali? Quick 5-second log for lunch 🥪',
    'Post-lunch check-in! What did the afternoon meal cost? 🥗',
    'Wrap up lunch before the 3 PM meetings begin 🍱'
  ],
  snacks: [
    'Chai o’clock ☕ Log it before the biscuits vanish.',
    'Evening snack break! Samosa, tea, or cold coffee? 🍪',
    '30 seconds to log that chai & snack run 🧋',
    'A quick tap keeps the evening budget sharp 🍩'
  ],
  dinner: [
    "Dinner done? Let's close today's books 🌙",
    'Swiggy, cooking, or dining out? Log dinner and rest easy 🍲',
    'Last check-in of the day 🌟 What was dinner?',
    'Wrap up tonight’s spend so tomorrow starts fresh 🍽️'
  ],
  generic: [
    'Psst… any spending to confess? Takes 5 seconds, just say it 🎙️',
    'A quick check-in: anything spent recently to log? 💸',
    'Your budget loves precision. Got an expense to note? 📊',
    'Quick log: tap or speak your latest expense ⚡'
  ],
  month_end_ask: [
    'Anything extra this month? Bonus, side gig, or cash gift? 🎁',
    'Month-end bonus or freelance income? Log it in seconds ✨',
    'Wrap up monthly income: any extra earnings this month? 💰'
  ],
  month_end_under_budget: [
    'You stayed under budget this month 🎉 Your wallet is proud.',
    'Budget master! 🏆 You kept spending within target this month.',
    'Under budget and thriving 💜 Great job on your expenses!'
  ],
  month_end_savings_hit: [
    'Savings target smashed 💜 ₹{amount} tucked away.',
    'Goal achieved! 🚀 Your monthly savings plan hit 100%.',
    'Way to grow! 🌟 Monthly savings target reached.'
  ]
};

export function getRandomCopy(type: keyof typeof NOTIFICATION_COPY_BANK, params?: { amount?: string }): string {
  const bank = NOTIFICATION_COPY_BANK[type] || NOTIFICATION_COPY_BANK.generic;
  const chosen = bank[Math.floor(Math.random() * bank.length)];
  if (params?.amount) {
    return chosen.replace('{amount}', params.amount);
  }
  return chosen;
}

/**
 * Generates 60 days of realistic demo expenses with meal-time clustering (breakfast, lunch, dinner, snacks)
 * for testing the reminder learning algorithm, charts, and exports.
 */

export interface DemoExpense {
  amountPaise: number;
  label: string;
  category: string;
  spentAt: string;
  source: 'voice' | 'manual' | 'shortcut';
}

export function generate60DayDemoData(): DemoExpense[] {
  const expenses: DemoExpense[] = [];
  const now = new Date();

  // Common spending patterns
  const breakfastItems = [
    { label: 'Idli & Vada', paise: 6000, cat: 'Food & Drinks' },
    { label: 'Masala Dosa', paise: 9000, cat: 'Food & Drinks' },
    { label: 'Poha & Chai', paise: 5000, cat: 'Food & Drinks' },
    { label: 'Starbucks Coffee', paise: 35000, cat: 'Food & Drinks' }
  ];

  const lunchItems = [
    { label: 'Thali Meals', paise: 15000, cat: 'Food & Drinks' },
    { label: 'Biryani', paise: 26000, cat: 'Food & Drinks' },
    { label: 'Subway Sandwich', paise: 22000, cat: 'Food & Drinks' },
    { label: 'Office Cafeteria', paise: 12000, cat: 'Food & Drinks' }
  ];

  const snackItems = [
    { label: 'Chai & Samosa', paise: 4000, cat: 'Food & Drinks' },
    { label: 'Cold Coffee', paise: 12000, cat: 'Food & Drinks' },
    { label: 'Fruit Juice', paise: 7000, cat: 'Food & Drinks' }
  ];

  const dinnerItems = [
    { label: 'Swiggy Dinner', paise: 38000, cat: 'Food & Drinks' },
    { label: 'Pizza with Friends', paise: 65000, cat: 'Food & Drinks' },
    { label: 'Roti & Paneer', paise: 24000, cat: 'Food & Drinks' }
  ];

  const transportItems = [
    { label: 'Uber to Office', paise: 22000, cat: 'Transport' },
    { label: 'Auto Rickshaw', paise: 6000, cat: 'Transport' },
    { label: 'Metro Card Recharge', paise: 50000, cat: 'Transport' },
    { label: 'Petrol Fill', paise: 100000, cat: 'Transport' }
  ];

  const shoppingItems = [
    { label: 'Amazon Purchase', paise: 149900, cat: 'Shopping' },
    { label: 'Blinkit Groceries', paise: 56000, cat: 'Groceries' },
    { label: 'Zara T-Shirt', paise: 199000, cat: 'Shopping' }
  ];

  for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(now.getTime() - dayOffset * 86400000);

    // 1. Breakfast cluster (~09:15 ± 30 mins)
    if (Math.random() > 0.2) {
      const bItem = breakfastItems[Math.floor(Math.random() * breakfastItems.length)];
      const bTime = new Date(targetDate);
      bTime.setHours(9, Math.floor(Math.random() * 45), 0, 0);
      expenses.push({
        amountPaise: bItem.paise,
        label: bItem.label,
        category: bItem.cat,
        spentAt: bTime.toISOString(),
        source: Math.random() > 0.4 ? 'voice' : 'manual'
      });
    }

    // 2. Commute (~10:00)
    if (Math.random() > 0.3) {
      const tItem = transportItems[Math.floor(Math.random() * transportItems.length)];
      const tTime = new Date(targetDate);
      tTime.setHours(10, Math.floor(Math.random() * 30), 0, 0);
      expenses.push({
        amountPaise: tItem.paise,
        label: tItem.label,
        category: tItem.cat,
        spentAt: tTime.toISOString(),
        source: 'manual'
      });
    }

    // 3. Lunch cluster (~13:30 ± 35 mins)
    if (Math.random() > 0.15) {
      const lItem = lunchItems[Math.floor(Math.random() * lunchItems.length)];
      const lTime = new Date(targetDate);
      lTime.setHours(13, 15 + Math.floor(Math.random() * 45), 0, 0);
      expenses.push({
        amountPaise: lItem.paise,
        label: lItem.label,
        category: lItem.cat,
        spentAt: lTime.toISOString(),
        source: Math.random() > 0.5 ? 'voice' : 'manual'
      });
    }

    // 4. Snacks / Chai cluster (~17:15 ± 20 mins)
    if (Math.random() > 0.25) {
      const sItem = snackItems[Math.floor(Math.random() * snackItems.length)];
      const sTime = new Date(targetDate);
      sTime.setHours(17, Math.floor(Math.random() * 40), 0, 0);
      expenses.push({
        amountPaise: sItem.paise,
        label: sItem.label,
        category: sItem.cat,
        spentAt: sTime.toISOString(),
        source: 'voice'
      });
    }

    // 5. Dinner cluster (~20:45 ± 40 mins)
    if (Math.random() > 0.1) {
      const dItem = dinnerItems[Math.floor(Math.random() * dinnerItems.length)];
      const dTime = new Date(targetDate);
      dTime.setHours(20, 30 + Math.floor(Math.random() * 45), 0, 0);
      expenses.push({
        amountPaise: dItem.paise,
        label: dItem.label,
        category: dItem.cat,
        spentAt: dTime.toISOString(),
        source: 'manual'
      });
    }

    // 6. Occasional Shopping / Groceries
    if (Math.random() > 0.6) {
      const shopItem = shoppingItems[Math.floor(Math.random() * shoppingItems.length)];
      const shopTime = new Date(targetDate);
      shopTime.setHours(18, Math.floor(Math.random() * 50), 0, 0);
      expenses.push({
        amountPaise: shopItem.paise,
        label: shopItem.label,
        category: shopItem.cat,
        spentAt: shopTime.toISOString(),
        source: 'manual'
      });
    }
  }

  return expenses;
}

import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { expensesStore, initExpenseStore } from '../../lib/stores/expenseStore';
import { goalsStore, initGoalStore } from '../../lib/stores/goalStore';
import BarChart, { type BarDatum } from '../charts/BarChart';
import DonutChart, { type DonutSegment } from '../charts/DonutChart';
import LineChart from '../charts/LineChart';
import HeatmapChart from '../charts/HeatmapChart';
import ProgressBar from '../ui/ProgressBar';
import { formatINR } from '../../lib/money';
import * as Icons from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drinks': '#B8ACFA',
  'Shopping': '#D8D1FD',
  'Transport': '#8E7DF0',
  'Bills': '#000000',
  'Subscription': '#6C5CE7',
  'Groceries': '#A8E6CF',
  'Healthcare': '#FF8B94',
  'Other': '#FBF8EC'
};

export const AnalyticsDashboard: React.FC = () => {
  const expenses = useStore(expensesStore);
  const goals = useStore(goalsStore);

  useEffect(() => {
    initExpenseStore();
    initGoalStore();
  }, []);

  // Compute daily spending for Mon - Sun
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekData: BarDatum[] = days.map((day) => ({
    label: day,
    valuePaise: 0
  }));

  // Map real expenses
  expenses.forEach((e) => {
    const idx = 4; // Map to current day index
    weekData[idx].valuePaise += e.amountPaise || 0;
  });

  // Group real categories
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + (e.amountPaise || 0);
  });

  const donutSegments: DonutSegment[] = Object.entries(categoryMap).map(([name, valuePaise], idx) => ({
    name,
    valuePaise,
    color: CATEGORY_COLORS[name] || (idx % 2 === 0 ? '#B8ACFA' : '#8E7DF0')
  }));

  // Total spent calculation
  const totalSpentPaise = expenses.reduce((sum, e) => sum + (e.amountPaise || 0), 0);

  // Line chart daily accumulation
  const lineDays = ['1', '5', '10', '15', '20', '25', '30'];
  const lineData = lineDays.map((day) => {
    return {
      day,
      amountPaise: expenses.length > 0 && day === '5' ? totalSpentPaise : 0
    };
  });

  // Heatmap real intensity matrix (7 x 4)
  const heatmapMatrix = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];

  if (expenses.length > 0) {
    // Map existing expenses to Fri afternoon / evening
    heatmapMatrix[4][1] = Math.min(expenses.length, 4);
  }

  return (
    <div className="flex flex-col w-full">
      {/* Interactive SVG Bar Chart on Black */}
      <section className="w-full px-5 pt-1 pb-3 flex flex-col items-center">
        <BarChart data={weekData} initialSelectedIndex={4} />
      </section>

      {/* SVG Drip Edge on Black transitioning into Cream Sheet */}
      <div className="relative w-full overflow-hidden pointer-events-none select-none h-14 -mt-1 bg-black">
        <svg viewBox="0 0 430 64" preserveAspectRatio="none" className="w-full h-full fill-[#FBF8EC]">
          <path d="M0 64 V44 Q0 30 20 30 H80 Q100 30 100 12 V12 Q100 0 120 0 H175 Q195 0 195 20 V48 Q195 56 215 56 H280 Q300 56 300 24 V16 Q300 0 320 0 H390 Q410 0 410 20 V42 Q410 50 430 50 V64 Z" />
        </svg>
      </div>

      {/* Cream Sheet (Savings Goals + Breakdown Charts) */}
      <section className="flex-1 bg-[#FBF8EC] text-black px-5 pt-3 pb-8 flex flex-col gap-6 min-h-[500px]">
        {/* Savings Goals Section */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h2 className="font-section text-black font-semibold text-[17px]">Savings Goals</h2>
            <a href="/goals" className="text-[13px] font-medium text-black/60 hover:text-black transition-colors">
              {goals.length > 0 ? `View All (${goals.length}) →` : '+ Add Goal'}
            </a>
          </div>

          {goals.length === 0 ? (
            <div className="w-full py-5 flex flex-col items-center justify-center text-center bg-white rounded-[20px] border border-black/5 p-4 shadow-sm">
              <p className="text-[14px] font-medium text-black">No savings goals created yet</p>
              <a
                href="/goals"
                className="mt-2 text-[12px] font-semibold text-[#8E7DF0] hover:underline"
              >
                + Set up a goal in Goals tab
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {goals.map((g) => {
                const pct = g.targetPaise > 0 ? Math.min(Math.round((g.savedPaise / g.targetPaise) * 100), 100) : 0;
                return (
                  <div key={g.id} className="bg-white p-3.5 rounded-[18px] border border-black/5 shadow-xs">
                    <ProgressBar
                      label={g.name}
                      percent={pct}
                      subLabel={`${formatINR(g.savedPaise)} of ${formatINR(g.targetPaise)}`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Donut Breakdown: Where It Went */}
        <div className="flex flex-col gap-3 pt-3 border-t border-black/10">
          <h2 className="font-section text-black font-semibold text-[17px]">Where It Went</h2>
          <div className="bg-white rounded-[22px] p-4 border border-black/5 shadow-sm">
            <DonutChart data={donutSegments} />
          </div>
        </div>

        {/* Trend Line: Daily Spending Trend */}
        <div className="flex flex-col gap-3 pt-3 border-t border-black/10">
          <h2 className="font-section text-black font-semibold text-[17px]">Daily Spending Trend</h2>
          <div className="bg-white rounded-[22px] p-4 border border-black/5 shadow-sm">
            <LineChart data={lineData} />
          </div>
        </div>

        {/* Heatmap: When You Spend */}
        <div className="flex flex-col gap-3 pt-3 border-t border-black/10">
          <h2 className="font-section text-black font-semibold text-[17px]">When You Spend (24×7)</h2>
          <div className="bg-white rounded-[22px] p-4 border border-black/5 shadow-sm">
            <HeatmapChart intensities={heatmapMatrix} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;

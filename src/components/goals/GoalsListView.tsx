import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { goalsStore, initGoalStore, addGoal } from '../../lib/stores/goalStore';
import ProgressBar from '../ui/ProgressBar';
import { formatINR } from '../../lib/money';
import * as Icons from 'lucide-react';
import { playGoalAchievedSound } from '../../lib/audio';
import ConfettiCelebration from '../ui/ConfettiCelebration';

const STARTER_GOALS = [
  { name: '🌴 Vacation Trip', target: 50000, icon: 'Plane', color: '#B8ACFA' },
  { name: '🛡️ Emergency Fund', target: 100000, icon: 'Shield', color: '#D8D1FD' },
  { name: '💻 New Gadget', target: 75000, icon: 'Laptop', color: '#8E7DF0' },
  { name: '🏠 Home Setup', target: 150000, icon: 'Home', color: '#B8ACFA' }
];

export const GoalsListView: React.FC = () => {
  const goals = useStore(goalsStore);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    initGoalStore();
  }, []);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalName.trim() || !newGoalTarget.trim()) return;
    const targetPaise = parseInt(newGoalTarget, 10) * 100;
    if (isNaN(targetPaise) || targetPaise <= 0) return;

    // Trigger celebratory sound & liquid confetti animation
    playGoalAchievedSound();
    setShowConfetti(true);

    addGoal({
      name: newGoalName.trim(),
      savedPaise: 0,
      targetPaise,
      deadline: 'Dec 2026',
      color: '#B8ACFA',
      iconName: 'Target'
    });

    setNewGoalName('');
    setNewGoalTarget('');
    setShowAddModal(false);
  };

  const handleQuickAddStarter = (starter: typeof STARTER_GOALS[0]) => {
    setNewGoalName(starter.name);
    setNewGoalTarget(starter.target.toString());
    setShowAddModal(true);
  };

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex justify-between items-center mb-0.5">
        <h2 className="font-section text-black font-semibold text-[17px]">
          Your Goals {goals.length > 0 ? `(${goals.length})` : ''}
        </h2>
        <a href="/plan" className="text-[13px] font-medium text-black/60 hover:text-black transition-colors">
          View Plan →
        </a>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col gap-4">
          {/* Main Empty State Hero Card */}
          <div className="w-full bg-white rounded-[24px] p-6 shadow-sm border border-black/5 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#B8ACFA]/30 flex items-center justify-center text-black mb-3">
              <Icons.Target size={24} strokeWidth={1.75} />
            </div>
            <h3 className="text-[20px] font-semibold text-black tracking-tight leading-snug">
              Start Your First Savings Goal
            </h3>
            <p className="text-[13px] text-black/55 mt-1.5 max-w-[260px] leading-relaxed">
              Lock in small amounts regularly for emergency funds, upcoming trips, or long-term dreams.
            </p>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="mt-5 w-full h-12 bg-black text-white text-[14px] font-medium rounded-[16px] flex items-center justify-center gap-2 pressable shadow-md active:scale-[0.98] transition-all"
            >
              <Icons.Plus size={18} strokeWidth={2} />
              <span>Create Custom Goal</span>
            </button>
          </div>

          {/* Quick Starter Suggestions */}
          <div className="flex flex-col gap-2.5 pt-1">
            <span className="text-[12px] uppercase tracking-wider font-semibold text-black/45 px-1">
              Popular Starter Ideas
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {STARTER_GOALS.map((starter) => (
                <button
                  key={starter.name}
                  type="button"
                  onClick={() => handleQuickAddStarter(starter)}
                  className="bg-white/80 hover:bg-white text-left p-3.5 rounded-[18px] border border-black/5 shadow-xs flex flex-col justify-between gap-2 active:scale-[0.97] transition-all"
                >
                  <span className="font-body-500 text-[14px] text-black font-medium leading-snug">
                    {starter.name}
                  </span>
                  <div className="flex justify-between items-center text-[12px] text-black/50">
                    <span>Target</span>
                    <span className="font-semibold text-black">₹{starter.target.toLocaleString('en-IN')}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {goals.map((goal) => {
            // @ts-ignore
            const IconComp = Icons[goal.iconName] || Icons.Target;
            const percent = goal.targetPaise > 0 ? Math.min(Math.round((goal.savedPaise / goal.targetPaise) * 100), 100) : 0;
            const remaining = Math.max(0, goal.targetPaise - goal.savedPaise);

            return (
              <div
                key={goal.id}
                className="w-full bg-white rounded-[22px] p-4 shadow-sm border border-black/5 flex flex-col gap-3 transition-transform active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center text-black shrink-0 border border-black/5"
                      style={{ backgroundColor: goal.color || '#B8ACFA' }}
                    >
                      <IconComp size={22} strokeWidth={1.75} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body-500 text-black text-[16px] leading-tight font-medium">{goal.name}</span>
                      <span className="font-caption text-black/50 text-[12px] mt-0.5">Target: {formatINR(goal.targetPaise)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-body-500 text-black text-[16px] tabular-nums font-semibold">
                      {formatINR(goal.savedPaise)}
                    </span>
                  </div>
                </div>

                <ProgressBar
                  label={`Progress (${percent}%)`}
                  percent={percent}
                  subLabel={remaining > 0 ? `${formatINR(remaining)} remaining` : 'Goal Completed! 🎉'}
                />
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full h-16 rounded-[22px] border-2 border-dashed border-black/20 flex items-center justify-center gap-2 text-black/60 font-body-500 hover:text-black hover:border-black/40 transition-colors active:scale-[0.98] bg-white/40"
          >
            <Icons.Plus size={20} strokeWidth={2} />
            <span>Add New Goal</span>
          </button>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white text-black rounded-[26px] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <h3 className="font-display text-[20px] font-semibold mb-4">Set Savings Goal</h3>
            <form onSubmit={handleCreateGoal} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[12px] font-semibold text-black/60 mb-1.5 block">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Goa Trip, New Phone"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full h-13 px-4 rounded-[16px] bg-[#FBF8EC] border border-black/10 focus:border-black focus:outline-none text-[15px] font-medium"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-black/60 mb-1.5 block">Target Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full h-13 px-4 rounded-[16px] bg-[#FBF8EC] border border-black/10 focus:border-black focus:outline-none text-[15px] font-medium"
                  required
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-13 rounded-[18px] border border-black/15 text-black font-medium text-[15px] hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-13 rounded-[18px] bg-[#B8ACFA] text-black font-semibold text-[15px] active:scale-98 shadow-sm"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liquid Droplets Confetti Animation Overlay */}
      <ConfettiCelebration active={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
};

export default GoalsListView;

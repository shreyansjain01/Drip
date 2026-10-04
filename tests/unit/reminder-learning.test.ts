import { describe, it, expect } from 'vitest';
import { learnReminderSlots, formatMinutesToTime, classifyWindow } from '../../src/lib/reminders/learn';

describe('Reminder Slot Learning Algorithm', () => {
  it('returns default cold start slots when fewer than 10 entries exist', () => {
    const slots = learnReminderSlots([new Date()]);
    expect(slots.length).toBe(4);
    expect(slots.map((s) => s.origin)).toEqual(['default', 'default', 'default', 'default']);
  });

  it('detects lunch and dinner clusters with >= 90 mins separation', () => {
    const timestamps: Date[] = [];
    const base = new Date('2026-10-01T00:00:00');

    // 15 lunch entries around 13:30 (810 mins)
    for (let i = 0; i < 15; i++) {
      const d = new Date(base);
      d.setHours(13, 30 + (i % 10) - 5, 0, 0);
      timestamps.push(d);
    }

    // 15 dinner entries around 20:45 (1245 mins)
    for (let i = 0; i < 15; i++) {
      const d = new Date(base);
      d.setHours(20, 45 + (i % 10) - 5, 0, 0);
      timestamps.push(d);
    }

    const slots = learnReminderSlots(timestamps);
    expect(slots.length).toBeGreaterThanOrEqual(2);
    expect(slots.some((s) => s.label === 'lunch')).toBe(true);
    expect(slots.some((s) => s.label === 'dinner')).toBe(true);
  });

  it('classifies time windows correctly', () => {
    expect(classifyWindow(9 * 60)).toBe('breakfast');
    expect(classifyWindow(13 * 60 + 30)).toBe('lunch');
    expect(classifyWindow(17 * 60)).toBe('snacks');
    expect(classifyWindow(20 * 60 + 30)).toBe('dinner');
  });
});

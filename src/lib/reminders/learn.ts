/**
 * Pure, deterministic reminder slot learning algorithm for Drip.
 * Converts 45-day spending timestamps to minutes-since-midnight,
 * builds a 30-minute histogram, applies Gaussian smoothing, detects peaks,
 * and classifies meal windows.
 */

export interface LearnedSlot {
  localTime: string; // "HH:MM:00"
  label: 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'generic';
  medianMinutes: number;
  entryCount: number;
  origin: 'learned' | 'default';
}

const DEFAULT_COLD_START_SLOTS: LearnedSlot[] = [
  { localTime: '09:00:00', label: 'breakfast', medianMinutes: 540, entryCount: 0, origin: 'default' },
  { localTime: '13:00:00', label: 'lunch', medianMinutes: 780, entryCount: 0, origin: 'default' },
  { localTime: '19:00:00', label: 'snacks', medianMinutes: 1140, entryCount: 0, origin: 'default' },
  { localTime: '21:00:00', label: 'dinner', medianMinutes: 1260, entryCount: 0, origin: 'default' }
];

function gaussianSmooth(bins: number[], sigma = 1.2): number[] {
  const kernelSize = 5;
  const radius = Math.floor(kernelSize / 2);
  const kernel: number[] = [];
  let sum = 0;

  for (let i = -radius; i <= radius; i++) {
    const val = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(val);
    sum += val;
  }
  const normalizedKernel = kernel.map((k) => k / sum);

  const smoothed = new Array(bins.length).fill(0);
  const len = bins.length;

  for (let i = 0; i < len; i++) {
    let acc = 0;
    for (let k = -radius; k <= radius; k++) {
      const idx = (i + k + len) % len; // circular wrap for 24h day
      acc += bins[idx] * normalizedKernel[k + radius];
    }
    smoothed[i] = acc;
  }

  return smoothed;
}

export function classifyWindow(minutes: number): 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'generic' {
  const hours = minutes / 60;
  if (hours >= 6 && hours < 11) return 'breakfast';
  if (hours >= 11 && hours < 15) return 'lunch';
  if (hours >= 15 && hours < 18.5) return 'snacks';
  if (hours >= 18.5 && hours < 23) return 'dinner';
  return 'generic';
}

export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
}

export function learnReminderSlots(timestamps: Date[] | string[]): LearnedSlot[] {
  if (timestamps.length < 10) {
    return DEFAULT_COLD_START_SLOTS;
  }

  // Convert to local minutes-since-midnight (0 - 1439)
  const minutesList = timestamps
    .map((t) => {
      const d = typeof t === 'string' ? new Date(t) : t;
      return d.getHours() * 60 + d.getMinutes();
    })
    .sort((a, b) => a - b);

  // 48 bins of 30 minutes each
  const binCount = 48;
  const bins = new Array(binCount).fill(0);
  const binEntries: number[][] = Array.from({ length: binCount }, () => []);

  for (const m of minutesList) {
    const binIdx = Math.floor(m / 30) % binCount;
    bins[binIdx]++;
    binEntries[binIdx].push(m);
  }

  const smoothed = gaussianSmooth(bins);
  const minSupport = Math.max(3, Math.floor(minutesList.length * 0.15));

  // Find local peaks
  const candidatePeaks: { binIdx: number; score: number; entries: number[] }[] = [];

  for (let i = 0; i < binCount; i++) {
    const prev = smoothed[(i - 1 + binCount) % binCount];
    const curr = smoothed[i];
    const next = smoothed[(i + 1) % binCount];

    if (curr >= prev && curr >= next && bins[i] >= minSupport) {
      // Gather entries in cluster window (±1 bin)
      const clusterEntries = [
        ...binEntries[(i - 1 + binCount) % binCount],
        ...binEntries[i],
        ...binEntries[(i + 1) % binCount]
      ].sort((a, b) => a - b);

      candidatePeaks.push({
        binIdx: i,
        score: curr,
        entries: clusterEntries
      });
    }
  }

  // Sort by score descending and enforce >= 90 minutes separation, max 5 slots
  candidatePeaks.sort((a, b) => b.score - a.score);
  const selectedPeaks: { medianMinutes: number; count: number }[] = [];

  for (const cp of candidatePeaks) {
    if (selectedPeaks.length >= 5) break;

    // Calculate cluster median
    const midIdx = Math.floor(cp.entries.length / 2);
    const medianMinutes = cp.entries.length > 0 ? cp.entries[midIdx] : cp.binIdx * 30 + 15;

    const tooClose = selectedPeaks.some((sp) => {
      const diff = Math.abs(sp.medianMinutes - medianMinutes);
      return Math.min(diff, 1440 - diff) < 90;
    });

    if (!tooClose) {
      selectedPeaks.push({ medianMinutes, count: cp.entries.length });
    }
  }

  if (selectedPeaks.length === 0) {
    return DEFAULT_COLD_START_SLOTS;
  }

  // Sort chronologically
  selectedPeaks.sort((a, b) => a.medianMinutes - b.medianMinutes);

  return selectedPeaks.map((sp) => ({
    localTime: formatMinutesToTime(sp.medianMinutes),
    label: classifyWindow(sp.medianMinutes),
    medianMinutes: sp.medianMinutes,
    entryCount: sp.count,
    origin: 'learned'
  }));
}

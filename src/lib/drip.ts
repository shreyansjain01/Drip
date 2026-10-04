export type Seg = { w: number; y: number }; // y = top offset of the step (0 = tallest)

export interface PillCutout {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

/**
 * Generates an SVG path data string for a stepped drip edge with rounded convex & concave corners.
 */
export function dripPath(W: number, H: number, segs: Seg[], r = 20): string {
  const rr = (a: number, b: number, w1: number, w2: number) =>
    Math.min(r, Math.abs(b - a) / 2, w1 / 2, w2 / 2);
  
  let d = `M0 ${H} V${segs[0].y + r} Q0 ${segs[0].y} ${r} ${segs[0].y}`;
  let x = 0;
  
  segs.forEach((s, i) => {
    x += s.w;
    const n = segs[i + 1];
    if (!n) {
      d += ` H${W - r} Q${W} ${s.y} ${W} ${s.y + r} V${H} Z`;
      return;
    }
    const k = rr(s.y, n.y, s.w, n.w);
    const sg = Math.sign(n.y - s.y) || 1;
    d += ` H${x - k} Q${x} ${s.y} ${x} ${s.y + sg * k} V${n.y - sg * k} Q${x} ${n.y} ${x + k} ${n.y}`;
  });
  
  return d;
}

/**
 * Deterministic PRNG seeded by integer or string for consistent silhouettes per screen
 */
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Predefined curated segment profiles matching the reference image styles
 */
export const SCREEN_DRIP_PROFILES: Record<string, { segs: Seg[]; cutouts?: PillCutout[] }> = {
  // Screen 1: Home (Wallet) - perfectly symmetric, balanced, and uniform lavender drips
  home: {
    segs: [
      { w: 86, y: 40 },
      { w: 86, y: 14 },
      { w: 86, y: 44 },
      { w: 86, y: 14 },
      { w: 86, y: 40 }
    ],
    cutouts: []
  },
  // Screen 2: Add Expense (Transfer) - lavender top drip with 2 balanced pill cutouts
  add: {
    segs: [
      { w: 95, y: 44 },
      { w: 85, y: 14 },
      { w: 100, y: 44 },
      { w: 75, y: 14 },
      { w: 75, y: 40 }
    ],
    cutouts: [
      { x: 80, y: 52, w: 52, h: 22, r: 11 },
      { x: 260, y: 50, w: 56, h: 24, r: 12 }
    ]
  },
  // Screen 3: Analytics - cream sheet top drip with 2 black pill cutouts
  analytics: {
    segs: [
      { w: 80, y: 44 },
      { w: 95, y: 14 },
      { w: 85, y: 48 },
      { w: 90, y: 14 },
      { w: 80, y: 42 }
    ],
    cutouts: [
      { x: 70, y: 48, w: 54, h: 22, r: 11 },
      { x: 250, y: 52, w: 58, h: 24, r: 12 }
    ]
  },
  // Plan / Goals / Settings
  plan: {
    segs: [
      { w: 85, y: 42 },
      { w: 100, y: 14 },
      { w: 75, y: 48 },
      { w: 90, y: 18 },
      { w: 80, y: 38 }
    ],
    cutouts: [
      { x: 90, y: 50, w: 52, h: 22, r: 11 },
      { x: 280, y: 48, w: 54, h: 22, r: 11 }
    ]
  },
  goals: {
    segs: [
      { w: 90, y: 16 },
      { w: 80, y: 46 },
      { w: 100, y: 12 },
      { w: 85, y: 44 },
      { w: 75, y: 20 }
    ]
  },
  settings: {
    segs: [
      { w: 75, y: 40 },
      { w: 95, y: 16 },
      { w: 90, y: 48 },
      { w: 85, y: 14 },
      { w: 85, y: 42 }
    ]
  }
};

export function getDripData(seedOrKey: string | number, width = 430, height = 72) {
  if (typeof seedOrKey === 'string' && SCREEN_DRIP_PROFILES[seedOrKey]) {
    const profile = SCREEN_DRIP_PROFILES[seedOrKey];
    const totalW = profile.segs.reduce((acc, s) => acc + s.w, 0);
    const scale = width / totalW;
    const scaledSegs = profile.segs.map(s => ({ w: s.w * scale, y: s.y }));
    const scaledCutouts = profile.cutouts?.map(c => ({
      ...c,
      x: c.x * scale
    }));
    return {
      path: dripPath(width, height, scaledSegs, 22),
      cutouts: scaledCutouts || []
    };
  }

  const seed = typeof seedOrKey === 'number' ? seedOrKey : stringToSeed(seedOrKey);
  const rand = pseudoRandom(seed);
  
  const stepCount = 5;
  const rawWidths = Array.from({ length: stepCount }, () => 60 + rand() * 50);
  const sumW = rawWidths.reduce((a, b) => a + b, 0);
  const segs: Seg[] = rawWidths.map((w, i) => {
    const scaledW = (w / sumW) * width;
    const y = (i % 2 === 0 ? 38 + rand() * 16 : 8 + rand() * 14);
    return { w: scaledW, y };
  });

  return {
    path: dripPath(width, height, segs, 22),
    cutouts: []
  };
}

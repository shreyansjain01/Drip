# DESIGN.md — "Drip" Expense Tracker

> Source of truth for all UI. If code and this file disagree, this file wins.
> Reference image: `/design/reference.jpeg` (3 phones: Wallet, Transfer money, Analytics).
> Working app name: **Drip** (rename freely).

---

## 1. Design Vision

A fintech app that feels like **liquid poured over black glass**. Three flat colours (lavender, black, cream) are layered in big surfaces separated by a **melting "drip" edge** with rounded steps and pill-shaped cutouts. Typography is large, calm, and light. Everything is rounded. No gradients, no shadows, no outlines except one: the selected-item ring.

Keywords: bold flat colour, liquid edges, oversized numbers, generous rounding, playful but precise.

---

## 2. Colour Tokens

Sampled from the reference. Use ONLY these.

```css
:root {
  /* Brand */
  --lavender-500: #B8ACFA;   /* primary surface, buttons, chart highlight, progress fill */
  --lavender-300: #D8D1FD;   /* soft fills, hover, tile backgrounds on black */
  --lavender-700: #8E7DF0;   /* focus ring, pressed state */

  /* Neutrals */
  --ink-900: #000000;        /* app background / black surfaces */
  --ink-800: #0B0B0C;        /* raised black (cards on black) */
  --ink-700: #1A1A1D;        /* dividers on black, disabled */
  --cream-100: #FBF8EC;      /* cream surface, bars, analytics sheet */
  --white: #FFFFFF;          /* keys, action tiles, tooltips */
  --stage: #E8E9EB;          /* page backdrop outside the app column (desktop) */

  /* Text */
  --text-on-lavender: #000000;
  --text-on-lavender-muted: rgba(0,0,0,.50);
  --text-on-black: #FFFFFF;
  --text-on-black-muted: rgba(255,255,255,.55);
  --text-on-cream: #000000;
  --text-on-cream-muted: rgba(0,0,0,.50);

  /* Semantic (use sparingly) */
  --warn: #FF7A6B;           /* over-budget dot / text on black only */
  --ok: var(--lavender-500); /* success = lavender, never green */
}
```

Rules
- Text on lavender is **always black**. Never white on lavender (fails contrast).
- Surfaces alternate: black → lavender → black → cream. Never place two same-colour surfaces touching without a drip edge between them.
- Success, goals, "good" = lavender. Warning = `--warn` dot or text on black only.
- Charts: default bars `--cream-100` on black; selected/highlight bar `--lavender-500`. On cream surfaces, default bars are `--lavender-300`, highlight is black.

---

## 3. Typography

Font: **Instrument Sans** (Google Fonts, weights 400/500/600). Fallback: `"Hanken Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif`. Self-host via `@fontsource-variable/instrument-sans`.
Numbers: `font-variant-numeric: tabular-nums`.

| Token | Size / Line | Weight | Tracking | Use |
|---|---|---|---|---|
| display | 56 / 60 | 500 | -0.02em | Hero amount (balance, keypad amount) |
| title | 18 / 24 | 500 | 0 | Screen titles ("Transfer money", "Analytics") |
| greeting | 20 / 26 | 500 | 0 | "Hi, Cooper" |
| section | 18 / 24 | 500 | 0 | "Transactions", "Savings Goals" |
| body | 15 / 22 | 400 | 0 | Row titles (500) / general |
| caption | 13 / 18 | 400 | 0 | Subtitles, labels, "Your wallet" |
| micro | 11 / 14 | 500 | .02em | Axis labels, card line |
| keypad | 28 / 32 | 400 | 0 | Numbers on keys |

Currency formatting: `Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' })`.
In display amounts the **₹ symbol is 0.5× size, muted colour, baseline-aligned** (as `$` in the reference). Decimals `.00` are muted on the keypad screen (as in "160|.00").
Header copy is sentence case. No ALL CAPS anywhere.

---

## 4. Shape, Spacing, Layout

- Spacing scale (px): 4, 8, 12, 16, 20, 24, 32, 40, 56.
- Screen horizontal padding: **20px**.
- Radii: `r-sm 10` (avatars, tooltip) · `r-md 14` (action tiles, icon tiles) · `r-lg 18` (keys, chips) · `r-xl 20` (primary buttons, wide button) · `r-pill 999` · screen/device 44.
- Touch targets ≥ 48px.
- **App column**: mobile-first, `max-width: 430px`, full height (`100dvh`). On viewports ≥ 768px, centre the column on `--stage` and render it inside a subtle phone-style rounded container (radius 44, 10px black bezel) so the desktop view looks like the reference presentation. Respect `env(safe-area-inset-*)`.
- Status bar and home indicator: do not draw fake ones in production. The home-indicator bar (134×5, radius 3, white at 80% on black) may appear only inside the desktop phone frame.

---

## 5. The Drip System (signature element)

A **Drip edge** is the top (or bottom) boundary of a coloured surface. It is a stepped horizontal silhouette where each step has a different height and every corner is rounded (convex and concave), like melted wax. Some drips contain **pill cutouts**: rounded 56×24 (radius 12) shapes in the *underlying* colour, sitting just inside the edge (see lavender area on screen 2, cream sheet on screen 3).

Build one reusable Astro component: `src/components/ui/Drip.astro` (SVG based, no JS).

Props: `variant: 'top' | 'bottom'`, `fill: CSS var`, `seed: number` (deterministic variation per screen), `height` (default 64), `cutouts: number` (0–2), `cutoutFill`.

Reference path generator (put in `src/lib/drip.ts`; tune visually until it matches the reference):

```ts
export type Seg = { w: number; y: number }; // y = top offset of the step (0 = tallest)

export function dripPath(W: number, H: number, segs: Seg[], r = 20): string {
  const rr = (a: number, b: number, w1: number, w2: number) =>
    Math.min(r, Math.abs(b - a) / 2, w1 / 2, w2 / 2);
  let d = `M0 ${H} V${segs[0].y + r} Q0 ${segs[0].y} ${r} ${segs[0].y}`;
  let x = 0;
  segs.forEach((s, i) => {
    x += s.w;
    const n = segs[i + 1];
    if (!n) { d += ` H${W - r} Q${W} ${s.y} ${W} ${s.y + r} V${H} Z`; return; }
    const k = rr(s.y, n.y, s.w, n.w);
    const sg = Math.sign(n.y - s.y) || 1;
    d += ` H${x - k} Q${x} ${s.y} ${x} ${s.y + sg * k} V${n.y - sg * k} Q${x} ${n.y} ${x + k} ${n.y}`;
  });
  return d;
}
```

Guidelines
- 4–6 steps across the width; step heights vary between 0 and ~48px; adjacent steps differ by ≥ 16px. Widths vary (e.g., 90, 70, 110, 60, 60).
- Seed from route name so each screen has its own silhouette, but the same one every visit.
- Bottom variant = same path flipped vertically (used above the "Send/Add" button zone).
- Page transitions morph the drip path (Section 9).

---

## 6. Iconography

Lucide-style, **1.75px stroke, round caps/joins, 22px** default. Needed: `download`, `arrow-up-right`, `plus`, `grid-dots` (custom 3×3 dots, 3px each), `bell`, `calendar`, `arrow-left`, `more-vertical`, `delete` (backspace), `mic`, `target`, `home`, `bar-chart`, `settings`, `file-text`, `table`. Category icons use the same set; each sits in a 44px tile (radius 14).

---

## 7. Components

**ScreenHeader** — Title centred (`title`), back arrow left, optional action icon right (calendar / more-vertical / bell). Height 56. Icons 22px. Colour follows surface.

**GreetingHeader (Home)** — Black background. 40px rounded-square avatar (radius 10), "Hi, {name}" (greeting, white) with "Your wallet" (caption, muted) beneath, bell icon right. Unread notification shows a 8px lavender dot on the bell.

**BalanceBlock** — On the lavender surface: display amount with muted ₹, then a hairline (black at 12%), then a meta line (micro, black 50%): left "Budget ₹X · N days left", right a small badge (replaces "VISA").

**ActionRow** — Four items in a row, gap 12: three 56×56 **white** square tiles (radius 14, black icon: `mic`, `plus`, `target`) and one wide **black** tile (flex-1, radius 14, white `grid-dots` icon = opens "More": export, settings, history). Press = scale .96 + `--lavender-300` flash.

**TransactionRow** — 44px icon tile (white at 40% on lavender, black icon), title (body 500) + subtitle caption muted (category), amount right-aligned (body 500, black, `-₹99.00`), hairline divider black at 10%. Entry animation: slide up 12px + fade, 40ms stagger. Swipe left reveals Edit/Delete (black tile / lavender tile).

**Keypad** — 3×4 grid, gap 8, keys: white, radius 16, height 56, `keypad` type, black. Bottom row: `.`, `0`, backspace icon key (white, same style, no label). On black surface. Press = scale .95, 80ms.

**AmountDisplay (Add screen)** — Display type, centred on lavender, blinking caret (2px black bar, 1s steps) before muted `.00`. Max 9 digits.

**CategoryChips (replaces contacts row)** — Horizontal scroller. Each: 64×64 rounded-square tile (radius 14) with the category icon on white; label beneath (caption, white muted). **Selected** = 2px lavender ring with 3px black gap, label turns lavender. Last tile is "+ New".

**PrimaryButton** — Full-width, 56 high, radius 20, `--lavender-500`, black text 16/500. Disabled = `--ink-700` bg, muted text. Loading = three black dots pulsing.

**SecondaryButton** — Black bg + white text (on lavender/cream) or white bg + black text (on black).

**BarChart (interactive)** — On black. Bars `--cream-100`, width ~38, gap 6, **top radius 10, bottom radius 6**, min height 28. Selected bar `--lavender-500`. Tooltip: white pill (radius 10, padding 6×10, caption 500 black) floating above and right-aligned to the selected bar, showing `₹2,000`. Day labels below (micro, white 75%, selected label white 100%). Interactions: tap/hover/drag across bars to select; keyboard arrows move selection; range switch Week / Month / Year via a segmented pill (black bg, selected = lavender).

**ProgressBar (Savings Goals)** — Row: label left (caption black), percent right (body 500). Track 5px black, radius 3; fill 5px `--lavender-500`, radius 3, animates 0→value in 900ms ease-out on enter. On black surfaces track = `--ink-700`.

**AllocationBar** — 14px pill, radius 7, segments separated by 2px gaps in the surface colour. Segment colours cycle `#B8ACFA`, `#D8D1FD`, `#8E7DF0`, `#000`, with Unallocated in `--cream-100` (on lavender) or `--ink-700` (on black). Tap a segment to highlight its FieldRow and show a tooltip (name, ₹, %). Widths animate with the bar spring.

**FieldRow** — 44px icon tile, name (body 500), planned amount right (body 500), ProgressBar beneath (this month vs plan), caption "₹X left" / "₹X saved". Locked fields (Expenses, Savings) show a small lock glyph and cannot be deleted.

**GoalCard** — On cream: name + icon tile, `₹saved / ₹target` (body 500), ProgressBar, caption "₹X to go · by {date}". Tap opens goal detail with contribution history and a "Add money" keypad sheet.

**DonutChart** — Category split. Segments use lavender tints only: `#B8ACFA`, `#D8D1FD`, `#8E7DF0`, `#000`, `#FBF8EC` with 3px black/cream gaps; centre shows total (display-sm). Tap a segment to highlight and show its tooltip.

**LineChart / TimeHeatmap** — Daily trend (lavender 2.5px line, round caps, area none) and "when do I spend" 24×7 heat grid (cells radius 6, 5 lavender tints). Same tooltip style.

**BottomNav** — Floating black pill, radius 28, height 64, 16px from bottom, items: Home, Analytics, [Mic FAB], Goals, Settings. Active item = lavender 44px pill behind black icon. Centre **Mic FAB**: 64px circle, lavender, black mic icon, raised 12px above the pill with a black 6px ring.

**VoiceSheet** — Bottom sheet over a lavender surface with a Drip top edge. Idle: "Tap and say: *paid ₹60 for breakfast*". Listening: pulsing lavender rings + 24 waveform bars (cream), live transcript (title). Result: parsed card with editable amount (display), label, category chips, "Save" PrimaryButton and "Edit manually" link. Never auto-save without a 3-second undo toast.

**Toast / InAppNotification** — Black pill with white text and a lavender dot, slides from top; congratulations variant is a lavender card with confetti drips (see Section 9).

**Inputs** — Height 52, radius 16, bg white (on lavender/cream) or `--ink-800` (on black), 1.5px transparent border, focus = 2px `--lavender-700` ring. Labels caption muted above. Errors: caption in `--warn` (on black) or black with a `--warn` dot (on lavender).

**Empty states** — Large drip-shaped illustration in lavender (a single blob with eyes optional), title, one-line caption, one PrimaryButton.

---

## 8. Screen Blueprints (map to the reference)

### 8.1 Home — copy of reference screen 1
Layers top→bottom: black GreetingHeader → **Drip(top, lavender)** → lavender surface containing BalanceBlock ("Spent this month"), ActionRow, "Transactions" section title, TransactionRow list. Surface extends to bottom (under BottomNav). Balance block shows month spend, with budget remaining in the meta line.

### 8.2 Add Expense — copy of reference screen 2
Layers: **lavender top** with ScreenHeader ("Add expense", back arrow, more icon) and AmountDisplay → **Drip(bottom of lavender, with 2 pill cutouts)** → black area with CategoryChips (replacing contacts), optional note input (single line, appears when a chip is selected), Keypad, PrimaryButton "Add expense". A small mic button sits in the header-right slot to switch to voice.

### 8.3 Analytics — copy of reference screen 3
Layers: black with ScreenHeader ("Analytics", back arrow, calendar icon → range picker) → BarChart with tooltip (selected bar lavender) → **Drip(top, cream, 2 black pill cutouts)** → cream sheet: "Savings Goals" with ProgressBar rows. Below the fold on the cream sheet: DonutChart "Where it went", LineChart "Trend", Heatmap "When you spend". Each block animates in on scroll.

### 8.4 Goals
Black header "Goals" + total saved (display on lavender). Cream sheet with GoalCards, "+ New goal" tile (dashed 1.5px black border, radius 20).

### 8.5 Goal detail
Lavender top: goal name, `₹saved` display, `of ₹target`. Black bottom: contribution list, "Add money" PrimaryButton (opens keypad sheet).

### 8.6 Login / Sign up
Black screen, large lavender drip descending from the top containing the app logo mark (a single drop). Heading "Track every rupee." (display-sm, white). Buttons: white "Continue with Google" (with G icon), lavender "Continue with email". Footer caption muted for terms.

### 8.7 Onboarding (4 steps, all skippable)
Lavender top with step title, black bottom with Keypad: (1) "What's your name?" (2) "What's your monthly salary?" (AmountDisplay) (3) "Plan your month": the PlanScreen below, pre-filled with Expenses and Savings (4) "Got a goal in mind?" optional first goal. "Skip" is a text button top-right. Progress = four pills (active lavender).

### 8.8 Settings
Cream sheet list: Profile, Targets, Reminder times (shows learned slots as editable lavender chips + toggles), Notifications permission, Export data, Sign out, Delete account. Group titles caption muted.

### 8.9 Export
Lavender surface, two large white tiles: "Download PDF" and "Download Excel", date range chips (This month / Last 3 months / This year / Everything), caption describing contents. After download: success toast.

### 8.10 Plan (Income and fields)
Black header "Plan" with calendar icon (month switcher). Lavender surface below a Drip edge: display = monthly income (salary + extra), caption "Salary ₹X · Extra ₹Y". Under it the **AllocationBar**: one 14px-high pill split into lavender-tint segments, one per field, with a cream "Unallocated" remainder (animated segment widths).
Cream sheet (Drip top, 2 pill cutouts) lists **FieldRow**s in order: **1 Expenses, 2 Savings, then every goal** (gadget, emergency fund, trip…). Each FieldRow: icon tile, name, planned `₹` (tap to edit via keypad sheet, or % toggle), progress this month (spent or saved vs plan) using ProgressBar. A dashed "+ New goal field" row closes the list. Over-allocation shows the remainder in `--warn` with a black dot, never blocking.

### 8.11 Add income and Month-end extra-income sheet
Lavender top, AmountDisplay ("+₹"), black bottom with a type switch (Salary change / Extra income), label chips (Bonus, Side gig, Gift, Refund, Other), Keypad, PrimaryButton "Add income". After saving, a bottom sheet with **allocation chips** (Savings, each goal field, Expenses buffer, Leave unallocated). The month-end version is the same sheet with the title "Anything extra this month?" and a prominent "Nothing extra" SecondaryButton.

---

## 9. Motion

Library: `motion` (Framer Motion) in React islands; CSS for static Astro parts. Astro View Transitions (`<ClientRouter />`) for navigation.

| Moment | Spec |
|---|---|
| Page change | 350ms; drip edge path morphs between screens (shared `transition:name="drip"`), content fades/slides 12px |
| Number count-up | 700ms ease-out on mount and on change |
| Bars | grow from baseline, 600ms spring (stiffness 180, damping 22), 60ms stagger |
| Bar select | colour swap 150ms, tooltip springs in (scale .9→1) |
| Progress fill | 900ms `cubic-bezier(.2,.8,.2,1)` |
| List rows | slide-up + fade, 40ms stagger, once |
| Press | scale .96, 90ms |
| Mic listening | 3 concentric rings pulse 1.6s infinite; waveform bars follow audio level |
| Drip idle | very subtle 8s loop, ±3px step height breathing (disable under reduced motion) |
| Congrats | lavender card drops in with a drip, 18 lavender/cream confetti droplets fall and fade (1.4s), `navigator.vibrate(30)` |

All motion respects `prefers-reduced-motion` (fall back to 120ms fades, no loops).

---

## 10. Notification Voice (copy)

Quirky, warm, never guilt-tripping. Examples (rotate 4+ per slot):
- Breakfast: "Your wallet is hungry too 🍳 What did breakfast cost?"
- Lunch: "Lunch happened. Receipts didn't. Tell me the damage 🍛"
- Snacks: "Chai o'clock ☕ Log it before the biscuits vanish."
- Dinner: "Dinner done? Let's close today's books 🌙"
- Generic: "Psst… any spending to confess? Takes 5 seconds, just say it."
- Month-end, budget kept: "You stayed under budget this month 🎉 Your wallet is proud."
- Month-end, savings hit: "Savings target smashed 💜 ₹{amount} tucked away."

---

## 11. Accessibility & Quality Bar

- WCAG AA contrast (black on lavender ≈ 11:1; white on black 21:1; never white on lavender).
- Every chart has a visually hidden data table and keyboard navigation; tooltips are `aria-live="polite"`.
- Focus ring: 2px `--lavender-700` with 2px offset on all interactive elements.
- Voice is an enhancement: every voice flow has a manual path.
- Lighthouse targets: Performance ≥ 90, Accessibility ≥ 95, PWA installable.
- Test viewports: 360×740, 390×844, 430×932, 768×1024, 1440×900.

---

## 12. Don'ts

- No gradients, drop shadows, glassmorphism, neon, or emoji in UI chrome (only in notification copy).
- No green/red for gain/loss. Use lavender and black (and `--warn` sparingly).
- No sharp corners (minimum radius 10).
- No third-party chart libraries that impose their own look.
- No white text on lavender.
- No more than 3 colours visible in any one surface (plus white tiles).

---

## 13. Tailwind v4 Tokens (`src/styles/global.css`)

```css
@import "tailwindcss";

@theme {
  --color-lavender-300: #D8D1FD;
  --color-lavender-500: #B8ACFA;
  --color-lavender-700: #8E7DF0;
  --color-ink-900: #000000;
  --color-ink-800: #0B0B0C;
  --color-ink-700: #1A1A1D;
  --color-cream-100: #FBF8EC;
  --color-stage: #E8E9EB;
  --color-warn: #FF7A6B;

  --font-sans: "Instrument Sans Variable", "Hanken Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif;

  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 20px;
  --radius-device: 44px;

  --ease-liquid: cubic-bezier(.2,.8,.2,1);
}

html { background: var(--color-stage); color-scheme: dark light; }
body { font-family: var(--font-sans); font-variant-numeric: tabular-nums; }
```
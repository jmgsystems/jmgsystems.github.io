# Handoff: jmg.systems front page (dark mode)

## Overview
A single-page dark-mode front page for **jmg.systems**, a solo technology consultancy serving Western and Central PA. The design is a "depth field" hero (pointer parallax over a fine blueprint grid with slow-traveling sparks) that recedes as the visitor scrolls, with numbered content sections sliding over it. Under the headline, the company's principles rotate on a vertical ticker. Tone: precise, technical, quiet confidence — an engineer's site with high-end-videogame polish, not a marketing funnel.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate this design in the target codebase's existing environment** (React, Astro, plain HTML, etc.) using its established patterns. If no environment exists yet, choose the most appropriate stack for a small static marketing site and implement it there. `reference/index.html` opens directly in a browser and demonstrates every behavior described below.

## Fidelity
**High-fidelity for visuals and motion** — colors, typography, spacing, and animations are final and should be recreated exactly.
**Placeholder for content** — all body copy is lorem ipsum; section headings, nav labels, the headline, the principle phrases, location line, and dates/version chips are real. Replace lorem with real copy without changing the layout.

## Screens / Views

### Front page (single page, 3 anchored sections)

**Overall structure** (top to bottom in the document):
1. `.hero` — `position: sticky; top: 0; height: 100vh; overflow: hidden` — stays pinned while content scrolls over it.
2. `.story` — normal-flow content that slides over the hero: Services band, Notes band, Contact band, footer.

Page background `#0B1320`. Desktop layout at 1200px+; horizontal page padding 56px.

---

### 1. Hero ("depth field")

**Background layers** (all inside the sticky hero, each is a parallax layer):
- **Grid layer** (`data-plx="16"`, `inset: -60px` so parallax never reveals edges): 1px lines `rgba(58,111,160,0.11)` every **24px** both axes, on the page background.
- **Spark canvas**: same bounds as the grid. **2 sparks** travel along grid lines (see Interactions).
- **Ghost mark** (`data-plx="42"`): `mark-inverse.png` at ~660px wide, `opacity: 0.07`, right side, bleeding off-canvas (`right: -130px`).
- **3 floating status chips** (`data-plx` 54/66/88): 1px `#253449` border, `#0F1B2C` fill, padding 10px 16px, IBM Plex Mono 11px, letter-spacing 0.08em, uppercase, color `#9FB9D4`. One chip is the kaizen version chip in ochre `#E1A956` ("v26.2 → v26.3", not uppercase). Positioned on the right half of the hero.

**Header** (z-index above layers):
- Left: **official inverse lockup** `logo-inverse.png`, height **30px**, top-left corner.
- Right nav: "01 Services / 02 Notes / 03 Contact" — IBM Plex Mono 12px, 500, uppercase, letter-spacing 0.08em, color `#9FB0C5`, hover → `#E8EEF6` (120ms).
- Padding: 22px 56px.

**Hero content** (vertically centered, left-aligned, max-width 900px):
- Eyebrow: "Serving Western and Central PA" — Plex Mono 12px 500 uppercase, 0.08em, `#9FB9D4`, 28px below-margin.
- Headline: "Your small business, continually improved." — **Fraunces 400**, `clamp(48px, 7.5vw, 96px)`, line-height 0.98, letter-spacing −0.025em, `#E8EEF6`. 40px below-margin.
- **Rotating principles line**: a 40px × 1px `#3A6FA0` dash, 20px gap, then a 44px-tall clipped ticker. Rows: Fraunces *italic* 26px, `#9FB9D4`. Phrases in order: "The least technology." / "Continually improved." / "In partnership." / "Saving you time." (+ duplicate of the first row for a seamless loop).
- Entrance: eyebrow/headline/ticker rise in (translateY 28px→0 + fade, 0.6–0.7s, delays 0 / 0.1s / 0.22s, ease `cubic-bezier(0.2,0,0,1)`).

**Hero bottom strip**: 1px `#253449` top border; left "Est. 2011", right "Scroll ↓" (blinking, 2.6s) — both Plex Mono 12px uppercase `#6A7A90`.

---

### 2. Services band (`#services`)
- Grid `200px 1fr 1fr 1fr`; background `#0F1B2C`; band separated by 1px `#253449` hairlines; the story block opens with a 1px `#3A6FA0` top border.
- Label cell: "01 / Services" — Plex Mono 12px uppercase, **ochre `#E1A956`**, right hairline border. (This + the version chip + email underline are the ONLY ochre on the page.)
- 3 service cells: padding 56px 32px, hairline between; H3 Fraunces 400 24px `#E8EEF6`; body Plex Sans 15px/1.55 `#9FB0C5`.

### 3. Notes band (`#notes`)
- Grid `200px 1fr`; label "02 / Notes" (same style).
- Rows: title (Fraunces 22px `#E8EEF6`, hover → `#9FB9D4`) + date (Plex Mono 12px `#6A7A90`), 16px vertical padding, 1px `#253449` separators.

### 4. Contact band (`#contact`) + footer
- Left "03 · Contact" mono label (ochre); right a large mailto link — Plex Mono `clamp(20px, 3vw, 36px)` `#E8EEF6`, 1px underline in **ochre**, `text-underline-offset: 8px`, hover → `#9FB9D4`. Band padding 72px 56px.
- Footer: background **`#1E3A5F`** (Blueprint 700), padding 20px 56px; left = inverse lockup at 20px height; right = "Serving Western and Central PA · Rev v26.3" Plex Mono 11px uppercase `#9FB9D4`.
- A **scanline** — 1px `rgba(58,111,160,0.35)` — sweeps top→bottom across the whole `.story` block on a 14s linear loop.

## Interactions & Behavior

1. **Pointer parallax (hero)** — on `pointermove` over the hero, each `[data-plx]` layer translates opposite the cursor by `depth × normalized-offset` px (depth = the attribute value; grid 16, hero text 8, ghost mark 42, chips 54–88). Each layer has `transition: transform 0.4s cubic-bezier(0.2,0,0,1)` so motion lags smoothly. On `pointerleave`, all reset to 0.
2. **Grid sparks (hero)** — canvas, 2 concurrent sparks on random 24px grid lines (horizontal or vertical, random direction). Speed 0.35–0.75 px/frame (~21–45 px/s — deliberately slow). Rendering: 26–60px fading gradient tail (1px) + sharp 2.5px square head. Color `rgb(125,166,211)` at 0.55 tail / 0.95 head alpha; ~12% of sparks spawn ochre `rgb(225,169,86)`. Respawn on exit. Keep it subtle — 2 sparks max.
3. **Scroll recede (hero)** — as the first viewport-height is scrolled, hero content animates to `opacity: 0.25; scale(0.96)` (keyframe `heroFade`), scroll-driven via CSS `animation-timeline: scroll(root)` with a JS `scroll` fallback for browsers without scroll-timeline support (see reference).
4. **Rotating principles** — keyframe steps the 5-row stack up **44px per step** (fixed px, matching row height — do NOT use translateY percentages), holding ~2.4s per phrase; full cycle **14s**, ease `cubic-bezier(0.2,0,0,1)`.
5. **Scanline** — 14s linear infinite sweep, fades in/out at 8%/92%.
6. **Blink** — status-style blink (opacity 1 → 0.15) on "Scroll ↓", 2.6s.
7. **Nav anchors** — header links scroll to `#services` / `#notes` / `#contact` (smooth scroll).
8. **Hovers** — 120ms `cubic-bezier(0.2,0,0,1)` on all links (see per-element colors above). No other hover effects.
9. **Reduced motion** — not in the reference; production should disable parallax, sparks, ticker, and scanline under `prefers-reduced-motion: reduce` (show the first principle phrase statically).

## State Management
None — fully static page. No forms, no data fetching. The only runtime state is animation-internal (spark positions, parallax offsets).

## Design Tokens
Dark-mode values used on this page (full system in `tokens/colors_and_type.css`):
- `#0B1320` bg-1 (page) · `#0F1B2C` bg-2 (sections, chips) · `#1E3A5F` blueprint-700 (footer)
- `#E8EEF6` fg-1 · `#9FB0C5` fg-2 · `#6A7A90` fg-3 · `#9FB9D4` blueprint-300 (captions, ticker)
- `#253449` rule (hairlines) · `#3A6FA0` blueprint-500 (strong rules, grid, sparks, scanline)
- `#E1A956` ochre (dark variant) — **rare**: section-number labels, version chip, email underline only
- `#F3EFE6` paper / `#0F1B2C` ink — reserved for a paper-fill button if one is ever added
- Type: **Fraunces** (display, 400; italic for principles), **IBM Plex Sans** (body), **IBM Plex Mono** (labels, nav, dates, wordmark). Mono labels: 12px, 500, uppercase, +0.08em.
- Spacing: 4px base; page gutter 56px; hairlines 1px. **Border radius 0 everywhere** (brand signature).
- Motion: single ease `cubic-bezier(0.2, 0, 0, 1)`; 120ms hovers.

## Assets
- `assets/logo-inverse.png` — official inverse (paper-on-dark) horizontal lockup. Header at 30px height, footer at 20px. LOCKED — never recolor, stretch, outline, or place on imagery without a solid plate.
- `assets/mark-inverse.png` — inverse mark only; used as the ghost background element at opacity 0.07.
- Fonts via Google Fonts: Fraunces (variable, ital+opsz), IBM Plex Sans 300–600, IBM Plex Mono 400–600 (all SIL OFL).

## Files
- `reference/index.html` — self-contained working reference of the whole page (open in a browser; all motion works, Chrome shows the scroll-recede natively, other browsers use the JS fallback).
- `tokens/colors_and_type.css` — the full jmg.systems design-token stylesheet (light + dark).
- `assets/` — logo files.

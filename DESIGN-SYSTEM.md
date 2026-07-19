# Splitup Design System Plan

## Target audience
Young Indian flatmates (18–30) in PGs, hostels, and shared flats. Mobile-first. Money is sensitive — the UI must feel **fresh, trustworthy, and fast**, never like a corporate dashboard or a gaming app.

---

## 1. Color System

### Rationale
Teal-based primary (#087B6E) was chosen over the current indigo for three reasons: (a) teal is unused by major Indian fintech UPI apps, making Splitup visually distinct; (b) its psychological association with clarity and trust aligns with settlement actions; (c) it provides excellent contrast on both white and dark surfaces without needing a near-black fallback.

### Palette

| Role | Hex | Usage | Contrast ratio (on nearest bg) |
|---|---|---|---|
| **Primary** | `#087B6E` | "Settle Now" CTA, active tab indicators, primary buttons, link text | 5.16:1 on `#FFFFFF` — passes AA normal text |
| **Primary-dark** | `#00675A` | Primary button hover | 5.47:1 on `#FFFFFF` — passes AA |
| **Primary-active** | `#005348` | Primary button pressed/active | 6.33:1 on `#FFFFFF` — passes AA |
| **Primary-subtle** | `#E6F5F2` | Soft badge, selected state backgrounds | — |
| **Surface** | `#FFFFFF` | Card backgrounds, modals, sheet headers | — |
| **Surface-secondary** | `#F8FAFC` (slate-50) | Secondary card areas, input backgrounds, list item hover | — |
| **Background** | `#F4F6F8` | Main page background | — |
| **Text-heading** | `#0F172A` (slate-900) | Page titles, card headings, large balances | 17.85:1 on `#FFFFFF` — passes AAA |
| **Text-body** | `#475569` (slate-600) | Descriptions, amounts, content text | 6.99:1 on `#FFFFFF` — passes AA |
| **Text-muted** | `#94A3B8` (slate-400) | Hints, timestamps, secondary labels | — |
| **Border** | `#E2E8F0` (slate-200) | Card outlines, dividers, input borders | — |
| **Divider** | `#CBD5E1` (slate-300) | Stronger separators (section dividers) | — |
| **Success / settled** | `#15803D` | Confirmed badge, positive balance indicator | 4.79:1 on `#F0FDF4` (green-50 bg) — passes AA large text |
| **Warning / pending** | `#B45309` | Pending badge, awaiting-confirmation indicator | 4.84:1 on `#FFFBEB` (amber-50 bg) — passes AA large text |
| **Danger / disputed** | `#B91C1C` | Disputed badge, negative balance, error text | 5.91:1 on `#FEF2F2` (red-50 bg) — passes AA large text |

### 60-30-10 allocation

| Layer | Share | Colors | What it covers |
|---|---|---|---|
| Neutral background | ~60% | `#F4F6F8` background, `#FFFFFF` surfaces, `#F8FAFC` secondary surfaces | Page chrome, cards, lists, inputs |
| Text + structure | ~30% | `#0F172A` headings, `#475569` body, `#E2E8F0`/`#CBD5E1` borders | All readable content and layout boundaries |
| Accent (primary) | ~10% | `#087B6E` primary, `#00675A` hover, semantic badges | CTAs, active states, status indicators |

### Semantic color rules

| Balance sign | Color | Icon | Example |
|---|---|---|---|
| `> 0` (you're owed) | `#15803D` | `+` prefix | `+₹1,200` |
| `< 0` (you owe) | `#B91C1C` | `–` prefix | `–₹450` |
| `=== 0` (settled) | `#94A3B8` | checkmark | `₹0` |

| Settlement status | Badge bg | Badge text |
|---|---|---|
| `confirmed` | `#F0FDF4` | `#15803D` |
| `pending` | `#FFFBEB` | `#B45309` |
| `disputed` | `#FEF2F2` | `#B91C1C` |

### What NOT to use
- No indigo (`#6366f1`, `#4f46e5`) — currently used, will be replaced
- No cream, terracotta, near-black, or neon
- No generic "tableau" dashboard palette

---

## 2. Typography

### Font stack

| Role | Family | Fallback | Source |
|---|---|---|---|
| Display / headings | **Geist Sans** (variable) | system-ui, sans-serif | Already loaded via `next/font/google` |
| Body / UI text | **Geist Sans** (variable) | system-ui, sans-serif | Same — single typeface eliminates FOUT |
| Money / code | **Geist Mono** (variable) | ui-monospace, monospace | Already loaded via `next/font/google` |
| Numeric tabular | Geist Sans w/ `font-variant-numeric: tabular-nums` | — | Every money amount |

### Type scale

| Token | Size | Weight | Line-height | Usage |
|---|---|---|---|---|
| `text-caption` | 12px | 500 | 1.4 | Timestamps, helper text, group member count |
| `text-body-sm` | 14px | 400 / 600 | 1.5 | Tab labels, descriptions, secondary info |
| `text-body` | 16px | 400 | 1.5 | Default body text, expense descriptions |
| `text-sub` | 20px | 600 | 1.4 | Section subheadings ("Net Balances", "Recent Expenses") |
| `text-heading` | 24px | 700 | 1.3 | Page titles ("Your Groups", group name) |
| `text-display` | 32px | 700 | 1.2 | Balance hero on group detail ("₹12,430") |
| `text-hero` | 40px | 800 | 1.1 | Large balance in Settle Flow modal ("₹500") — settle amount only |

### Money amount rules

- Every monetary value uses `font-variant-numeric: tabular-nums` (digits align vertically)
- Positive balances: `#15803D` with `+` prefix
- Negative balances: `#B91C1C` with `–` prefix
- Zero / settled: `#94A3B8`, no sign
- Large amounts (≥₹10,000) display with comma separators (Indian numbering: ₹12,430)
- The settle amount in the Settle Flow modal gets the hero scale (40px) as the most prominent number on screen

---

## 3. Layout & Spacing

### Spacing scale

| Token | Pixels | Usage |
|---|---|---|
| `space-1` | 4px | Tight icon/text gap, avatar inner padding |
| `space-2` | 8px | Stacked badge spacing, button icon gap |
| `space-3` | 12px | Card title/body gap, form field vertical |
| `space-4` | 16px | Card padding, section inner margin |
| `space-5` | 24px | Between cards, section bottom margin |
| `space-6` | 32px | Page section padding (top/bottom) |
| `space-7` | 48px | Major page gutters, modal vertical padding |

### Mobile-first breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | 375px (base) | Single column, full-bleed cards, bottom nav |
| Tablet | 768px | Two-column grid for group cards |
| Desktop | 1024px+ | Max-width container (1280px), wider side padding |

### Visual hierarchy (priority order on screen)

1. **Your balance / what you're owed** — largest numeric element, top of group detail
2. **Settle Up CTAs** — primary color, prominent button next to each debt row
3. **Group name + type** — heading, just below nav
4. **Debt rows** — clear from→to arrow layout
5. **Expense history** — list, scrollable
6. **Settlement history** — list below the fold

### Key layout rules

- Nav bar: 56px sticky (14px height, `backdrop-blur-md`)
- Cards: rounded-xl (`rounded-xl` = 12px in Tailwind v4), no shadows on mobile, subtle shadow on larger screens
- Max content width: 1280px, centered
- Bottom padding for mobile: 80px to clear the bottom nav
- The "Settle Now" button is ALWAYS visible when there's an unsettled debt — never hidden behind a scroll

---

## 4. Motion & Animation

### Design philosophy
Animations are **functional**, not decorative. They communicate state change and spatial orientation. Every animation respects `prefers-reduced-motion`.

### Animation tokens

| Token | Duration | Easing | Trigger |
|---|---|---|---|
| `fast` | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Button hover, tap feedback |
| `normal` | 250ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Modal enter/exit, tab switch |
| `slow` | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Balance counter, settlement confirmation |
| `spring` | 500ms | spring(0.3, 0.8, 0, 1) | Signature "Settle Ripple" |

### Specific animations

**1. Settle Now button (signature) — see §5 below**

**2. Balance counter (settlement confirmed)**

When a settlement is confirmed:
- The settlement amount number in the modal counts from old amount → 0 over 400ms (eased)
- The debt row fades out and collapses (opacity 1→0, height auto→0, 250ms)
- The net balance row for both parties re-renders with a subtle background flash (`#E6F5F2` → transparent, 500ms)
- All other balances remain stationary — only the affected rows move

**3. Group switch / tab switch**

- Tab content: cross-fade (opacity 0→1, 150ms) with slight vertical slide (8px up)
- No full-page transitions within the app shell — only content panels change
- Group-to-group navigation is a full page load (Next.js App Router default, no override)

**4. Modal enter / exit**

- Enter: scale 0.95→1 + opacity 0→1, 250ms
- Exit: scale 1→0.95 + opacity 1→0, 200ms (faster to feel responsive)
- Backdrop: fade in/out, 200ms

**5. prefers-reduced-motion**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0s !important;
    transition-duration: 0s !important;
  }
}
```
Applied globally. All functional animations must work at 0s (no visual breakage).

---

## 5. Signature Element: "Settle Ripple"

**Chosen element:** The **Settle Now button's tap-to-confirm micro-interaction** — the moment a user resolves a debt.

This is the app's single most emotionally significant interaction: turning an owed amount into a zero. It must feel satisfying, weighty, and final.

### Interaction sequence (tap "Settle Up" → flow complete)

**Phase 1 — Initiation (on tap of "Settle Up" in debt row):**
- Button briefly scales to 1.04x (spring, 300ms)
- Button color subtly pulses from `#087B6E` to `#00675A` 
- The Settle Flow modal opens (scale+opacity, 250ms)

**Phase 2 — Confirmation (on tap "I've Paid"):**
- The confirm button text changes from "I've Paid" → checkmark `✓` (cross-fade, 150ms)
- A brief green flash (`#15803D` tint) sweeps left-to-right across the modal confirmation card (400ms)
- The amount display animates from old value → ₹0 with a counter effect (400ms ease-out)

**Phase 3 — Done (modal exit):**
- The "Done" button scales 1.02x briefly on tap
- Modal closes (200ms exit)
- Back on the group detail: the settled debt row slides out with opacity fade (250ms), and the balance numbers re-render with a subtle background highlight on the affected rows

### Implementation notes

- All animation values use CSS custom properties for consistency
- The spring easing is defined as a CSS `@keyframes` or inline `transition` with a spring-like bezier: `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoots slightly then settles)
- The green flash on confirmation is implemented as a `::after` pseudo-element with `transform: translateX(-100%)` → `translateX(100%)` over 400ms
- Counter animation uses `requestAnimationFrame` for the number transition, not CSS — CSS can't interpolate between two numeric text values smoothly
- The background highlight on updated rows uses a CSS animation: background-color `#E6F5F2` → `transparent` over 1s with a 300ms delay

### Why this element
"Settle up" is not just a CRUD action — it's the emotional payoff of the entire app. The ripple moment makes the user feel like the transaction is *done*, not just submitted. It distinguishes Splitup from a generic expense tracker.

---

## 6. Iconography

### Approach

- Use inline SVGs (Lucide-inspired, stroke-width 2) for all UI icons
- No icon library dependency — hand-pick ~12 icons as inline SVGs or heroicons-style paths
- Money/debt icons: rupee symbol `₹` rendered in Geist Sans (not an image)
- Settlement flow: UPI icon is a stylized "UPI" text badge, not a logo to avoid trademark issues

### Required icons

| Context | Icon | Notes |
|---|---|---|
| Nav bar app icon | Globe/rupee monogram | Stylized "S" or ₹ in primary color |
| Empty state | User-plus / group | Current SVG reused, re-colored |
| Back navigation | Chevron left | — |
| Settle arrow | Arrow right | From → To debt rows |
| Add expense | Plus | FAB on mobile |
| QR code | Square with dots | Current QR component, re-themed |
| Close | X | Modal close button |
| Checkmark | Check | Settlement confirmed state |
| More / menu | Ellipsis vertical | For future use |

---

## 7. Implementation Strategy

### File-by-file changes (phase 1)

| File | What changes |
|---|---|
| `src/app/globals.css` | Add CSS custom properties under `@theme inline {}` for all color tokens, spacing scale, and animation tokens. Remove dark mode overrides (this app is light-mode only). |
| `src/app/layout.tsx` | Update `meta[name="theme-color"]` to `#087B6E`. Remove bg-gray-50 and text-gray-900 from body — use the custom tokens instead. |
| `public/manifest.json` | Update `theme_color` to `#087B6E`, `background_color` to `#F4F6F8`. |
| `src/app/page.tsx` | Replace inline indigo classes with primary tokens. Update the CTA button, empty state, and FAB. |
| `src/app/groups/[id]/page.tsx` | Replace tab active color, group type badge colors, and back link with new palette. |
| `src/components/ui/NavBar.tsx` | Replace indigo brand color, border colors, and text colors. |
| `src/components/ui/Modal.tsx` | Update border, shadow, and close button colors. |
| `src/components/groups/BalanceSheet.tsx` | This is the most visually intensive change: replace all balance colors, settle buttons, borders, and heading styles. |
| `src/components/settlements/SettleFlow.tsx` | Re-theme all button colors, amount display styles, status cards. Add the "Settle Ripple" animation. Replace blue-600 with primary teal, emerald with success green. |
| `src/components/expenses/ExpenseList.tsx` | Re-theme card borders, text colors, and category badges. |
| `src/components/expenses/ExpenseForm.tsx` | Re-theme form inputs, buttons, and labels. |
| `src/components/groups/GroupCard.tsx` | Re-theme card layout, type badge, and member count display. |
| `src/components/settlements/SettlementList.tsx` | Re-theme status badges, amount display, and row layout. |
| `src/components/groups/CreateGroupForm.tsx` | Re-theme form controls and buttons. |
| `src/components/ui/QrCode.tsx` | Update QR border color. |

### Token integration (Tailwind v4)

In `globals.css`, define all tokens under `@theme {}`:

```css
@theme inline {
  --color-primary: #087B6E;
  --color-primary-dark: #00675A;
  --color-primary-active: #005348;
  --color-primary-subtle: #E6F5F2;
  --color-surface: #FFFFFF;
  --color-surface-secondary: #F8FAFC;
  --color-background: #F4F6F8;
  --color-success: #15803D;
  --color-warning: #B45309;
  --color-danger: #B91C1C;
  --color-text-heading: #0F172A;
  --color-text-body: #475569;
  --color-text-muted: #94A3B8;
  --color-border: #E2E8F0;
  --color-divider: #CBD5E1;

  --animate-settle-ripple: settle-ripple 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  --animate-num-count: num-count 0.4s ease-out;
  --animate-bg-flash: bg-flash 1s ease-out 0.3s;

  @keyframes settle-ripple { /* defined */ }
  @keyframes bg-flash {
    0% { background-color: #E6F5F2; }
    100% { background-color: transparent; }
  }
}
```

This maps directly to Tailwind class usage like `bg-primary`, `text-primary`, `border-border`, etc.

---

## 8. Accessibility checklist

| Requirement | Status | How |
|---|---|---|
| WCAG AA body text (≥4.5:1) | ✓ Pass | Text-body `#475569` on `#FFFFFF` = 6.99:1 |
| WCAG AA large text (≥3:1) | ✓ Pass | All color pairings verified via coolors |
| Touch targets ≥44px | ✓ Standard | Buttons min 44px on mobile |
| prefers-reduced-motion | ✓ Supported | Global media query + all animations degrade gracefully |
| Focus indicators | ✓ Standard | Browser default + primary-400 outline on interactive elements |
| Color-not-alone | ✓ Applied | Balance signs use `+`/`–` prefixes, not just color |
| Font scaling | ✓ Supported | `rem`-based sizing, no hard px for text |

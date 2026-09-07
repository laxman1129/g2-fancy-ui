// ─── Home screen ──────────────────────────────────────────────────────────
export const HOME = {
  title: 'A1 OPS · DISRUPTION ALERT',
  body: `17 Sep · GOI Hub · Storm cell MC-47
47 flights impacted · 2,140 PAX
Avg delay +4h 20min · 3 cancels
Curfew window: 02:00–06:00 UTC
Optimizer ready · 4 strategies`,
  nav: 'Tap → Run Optimizer  ·  Double-tap: Exit',
}

// ─── Optimizer strategy options ───────────────────────────────────────────
export interface Strategy {
  id: string
  name: string
  summary: string
  cost: string
  pax: string
  paxPct: number
  exceptions: number
  open: number
  recommended?: boolean
  detail: string[]
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'A',
    name: 'Aggressive Recovery',
    summary: 'Max delay absorption · 12 swaps',
    cost: '+$340k vs base',
    pax: '91% (1,947 / 2,140)',
    paxPct: 91,
    exceptions: 0,
    open: 0,
    detail: [
      'STRATEGY A · AGGRESSIVE RECOVERY',
      '──────────────────────────────────',
      'Logic: Maximum delay absorption',
      'Aircraft swaps: 12 rotations',
      'Slot purchases: 3 (LHR, JFK, NRT)',
      'Cost delta: +$340k vs do-nothing',
      'PAX resolved: 91% · 1,947 / 2,140',
      'Crew exceptions: 0',
      'Open flights: 0',
      '',
      'Best for: minimal PAX impact',
      'Risk: high overtime + slot cost',
      'Est. completion: 04:15 UTC',
    ],
  },
  {
    id: 'B',
    name: 'Balanced Reprotection',
    summary: 'Crew-aware swaps · 8 rotations',
    cost: '−$198k vs do-nothing',
    pax: '84% (1,813 / 2,140)',
    paxPct: 84,
    exceptions: 1,
    open: 1,
    recommended: true,
    detail: [
      'STRATEGY B · BALANCED  ★ RECOMMENDED',
      '──────────────────────────────────────',
      'Logic: Crew-aware swap logic',
      'Aircraft swaps: 8 rotations',
      'Slot purchases: 1 (LHR)',
      'Cost delta: −$198k vs do-nothing',
      'PAX resolved: 84% · 1,813 / 2,140',
      'Crew exceptions: 1 (A1410)',
      'Open flights: 1 (A1771 – crew TBC)',
      '',
      'Best for: cost + PAX balance',
      'Risk: 1 manual crew review needed',
      'Est. completion: 03:40 UTC',
    ],
  },
  {
    id: 'C',
    name: 'PAX-First Reprotection',
    summary: 'Min stranded PAX · 15 rebooks',
    cost: '+$95k vs base',
    pax: '96% (2,054 / 2,140)',
    paxPct: 96,
    exceptions: 2,
    open: 0,
    detail: [
      'STRATEGY C · PAX-FIRST REPROTECTION',
      '──────────────────────────────────────',
      'Logic: Minimise stranded passengers',
      'Rebook flows: 15 codeshare paths',
      'Hotel vouchers: 86 PAX',
      'Cost delta: +$95k vs do-nothing',
      'PAX resolved: 96% · 2,054 / 2,140',
      'Crew exceptions: 2 (A1410, A1521)',
      'Open flights: 0',
      '',
      'Best for: highest PAX satisfaction',
      'Risk: crew scheduling pressure',
      'Est. completion: 04:50 UTC',
    ],
  },
  {
    id: 'D',
    name: 'Cost-Minimised',
    summary: 'Minimal intervention · 3 swaps',
    cost: '−$420k vs do-nothing',
    pax: '71% (1,519 / 2,140)',
    paxPct: 71,
    exceptions: 4,
    open: 3,
    detail: [
      'STRATEGY D · COST-MINIMISED',
      '──────────────────────────────',
      'Logic: Minimum spend intervention',
      'Aircraft swaps: 3 rotations',
      'Slot purchases: 0',
      'Cost delta: −$420k vs do-nothing',
      'PAX resolved: 71% · 1,519 / 2,140',
      'Crew exceptions: 4',
      'Open flights: 3',
      '',
      'Best for: cost containment only',
      'Risk: high PAX dissatisfaction',
      'Est. completion: 02:55 UTC',
    ],
  },
]

// ─── Flight-level comparison (Do-Nothing vs Proposed under Strategy B) ────
export interface Flight {
  flight: string
  route: string
  doNothing: string
  proposed: string
  ok: boolean
  note?: string
}

export const FLIGHTS: Flight[] = [
  { flight: 'A1101', route: 'GOI→LHR', doNothing: 'DEP +4h 20m', proposed: 'DEP +1h 45m', ok: true },
  { flight: 'A1211', route: 'GOI→JFK', doNothing: 'CANCELLED   ', proposed: 'DEP +3h 00m', ok: true },
  { flight: 'A1305', route: 'GOI→SYD', doNothing: 'DEP +6h 00m', proposed: 'DEP +2h 30m', ok: true },
  { flight: 'A1410', route: 'GOI→CDG', doNothing: 'DEP +5h 15m', proposed: 'DEP +2h 00m', ok: false, note: 'Crew exception · manual review' },
  { flight: 'A1521', route: 'GOI→SIN', doNothing: 'DEP +3h 45m', proposed: 'DEP +1h 20m', ok: true },
  { flight: 'A1612', route: 'GOI→BOM', doNothing: 'DEP +2h 30m', proposed: 'ON TIME     ', ok: true },
  { flight: 'A1718', route: 'GOI→LAX', doNothing: 'CANCELLED   ', proposed: 'DEP +4h 00m', ok: true },
  { flight: 'A1771', route: 'GOI→MXP', doNothing: 'DEP +7h 00m', proposed: 'OPEN        ', ok: false, note: 'Needs crew assignment' },
  { flight: 'A1823', route: 'GOI→NRT', doNothing: 'DEP +4h 50m', proposed: 'DEP +1h 30m', ok: true },
  { flight: 'A1934', route: 'GOI→ORD', doNothing: 'DEP +5h 30m', proposed: 'DEP +2h 15m', ok: true },
]

// ─── Review summary ────────────────────────────────────────────────────────
export const REVIEW = {
  title: 'REVIEW · STRATEGY B',
  metrics: [
    '↓ $198k saved vs Do-Nothing',
    '−34h total delay recovered',
    '84% PAX resolved (1,813 / 2,140)',
    '1 planner exception (A1410)',
    '1 flight open — needs crew (A1771)',
  ],
  nav: 'Tap → Publish Plan  ·  Double-tap: Back',
}

// ─── Publish confirmation ─────────────────────────────────────────────────
export const PUBLISH = {
  title: 'PUBLISH PLAN · STRATEGY B',
  sections: [
    '✓ Crew scheduling notified',
    '✓ FOC push — flight ops ready',
    '✓ PAX SMS / email queued (1,813)',
    '✓ GDS & codeshare feeds updated',
    '──────────────────────────────',
    '⚠  A1410 → Manual crew review',
    '⚠  A1771 → Crew assignment TBC',
    '──────────────────────────────',
    'Ref: OPT-B-20260917-GOI',
    '17 Sep 2026 · 23:14 UTC',
  ],
  nav: 'Tap: CONFIRM & PUBLISH  ·  Double-tap: Back',
  navConfirmed: 'Double-tap: Exit',
}

export const DONE = {
  title: 'PUBLISHED ✓',
  body: 'Plan OPT-B-20260917-GOI published.\n\n1,813 PAX notified.\nCrew scheduling updated.\nA1410 + A1771 flagged for ops.\n\nDouble-tap to exit.',
  nav: 'Double-tap: Exit',
}

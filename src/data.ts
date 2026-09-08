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
export interface Flight {
  flight: string
  route: string
  doNothing: string
  proposed: string
  ok: boolean
  note?: string
}

export interface ReviewMetric {
  val: string
  sub: string
}

export interface ReviewException {
  badge: string
  flight: string
  route: string
  lines: string[]
}

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

  flights: Flight[]

  review: {
    metrics: ReviewMetric[]
    completion: string
    exceptions: ReviewException[]
  }

  publish: {
    notified: string[]
    attention: { flight: string; note: string }[]
  }

  done: {
    stats: string[]
    attention: string
  }
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
    flights: [
      { flight: 'A1101', route: 'GOI→LHR', doNothing: 'DEP +4h 20m', proposed: 'DEP +1h 10m', ok: true },
      { flight: 'A1211', route: 'GOI→JFK', doNothing: 'CANCELLED   ', proposed: 'DEP +2h 20m', ok: true },
      { flight: 'A1305', route: 'GOI→SYD', doNothing: 'DEP +6h 00m', proposed: 'DEP +1h 45m', ok: true },
      { flight: 'A1410', route: 'GOI→CDG', doNothing: 'DEP +5h 15m', proposed: 'DEP +1h 15m', ok: true, note: 'Re-rotated via slot purchase' },
      { flight: 'A1521', route: 'GOI→SIN', doNothing: 'DEP +3h 45m', proposed: 'DEP +0h 50m', ok: true },
      { flight: 'A1612', route: 'GOI→BOM', doNothing: 'DEP +2h 30m', proposed: 'ON TIME     ', ok: true },
      { flight: 'A1718', route: 'GOI→LAX', doNothing: 'CANCELLED   ', proposed: 'DEP +3h 00m', ok: true },
      { flight: 'A1771', route: 'GOI→MXP', doNothing: 'DEP +7h 00m', proposed: 'DEP +2h 10m', ok: true },
      { flight: 'A1823', route: 'GOI→NRT', doNothing: 'DEP +4h 50m', proposed: 'DEP +1h 05m', ok: true },
      { flight: 'A1934', route: 'GOI→ORD', doNothing: 'DEP +5h 30m', proposed: 'DEP +1h 40m', ok: true },
    ],
    review: {
      metrics: [
        { val: '+$340k', sub: 'COST DELTA VS BASE' },
        { val: '−41h',    sub: 'TOTAL DELAY RECOVERED' },
        { val: '91%',     sub: 'PAX RESOLVED · 1,947 / 2,140' },
      ],
      completion: 'Est. completion  04:15 UTC',
      exceptions: [],
    },
    publish: {
      notified: [
        'Crew scheduling',
        'FOC — flight ops',
        'PAX SMS / email (1,947)',
        'GDS & codeshare feeds',
      ],
      attention: [],
    },
    done: {
      stats: [
        '1,947 PAX notified',
        'Crew scheduling updated',
        '12 rotations published',
      ],
      attention: 'No open items — all flights covered',
    },
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
    flights: [
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
    ],
    review: {
      metrics: [
        { val: '↓ $198k', sub: 'COST SAVED VS DO-NOTHING' },
        { val: '−34h',    sub: 'TOTAL DELAY RECOVERED' },
        { val: '84%',     sub: 'PAX RESOLVED · 1,813 / 2,140' },
      ],
      completion: 'Est. completion  03:40 UTC',
      exceptions: [
        {
          badge: 'CREW EXCEPTION',
          flight: 'A1410', route: 'GOI → CDG',
          lines: ['Crew exception flagged', 'Manual review required'],
        },
        {
          badge: 'OPEN FLIGHT',
          flight: 'A1771', route: 'GOI → MXP',
          lines: ['No crew assigned', 'Cannot depart — TBC'],
        },
      ],
    },
    publish: {
      notified: [
        'Crew scheduling',
        'FOC — flight ops',
        'PAX SMS / email (1,813)',
        'GDS & codeshare feeds',
      ],
      attention: [
        { flight: 'A1410', note: 'Manual crew review' },
        { flight: 'A1771', note: 'Crew assignment TBC' },
      ],
    },
    done: {
      stats: [
        '1,813 PAX notified',
        'Crew scheduling updated',
        'A1410 + A1771 flagged for ops',
      ],
      attention: 'A1410 + A1771 flagged for ops',
    },
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
    flights: [
      { flight: 'A1101', route: 'GOI→LHR', doNothing: 'DEP +4h 20m', proposed: 'DEP +1h 25m', ok: true },
      { flight: 'A1211', route: 'GOI→JFK', doNothing: 'CANCELLED   ', proposed: 'DEP +2h 50m', ok: true },
      { flight: 'A1305', route: 'GOI→SYD', doNothing: 'DEP +6h 00m', proposed: 'DEP +1h 55m', ok: true },
      { flight: 'A1410', route: 'GOI→CDG', doNothing: 'DEP +5h 15m', proposed: 'DEP +1h 40m', ok: false, note: 'Crew exception · manual review' },
      { flight: 'A1521', route: 'GOI→SIN', doNothing: 'DEP +3h 45m', proposed: 'DEP +1h 05m', ok: false, note: 'Crew exception · manual review' },
      { flight: 'A1612', route: 'GOI→BOM', doNothing: 'DEP +2h 30m', proposed: 'ON TIME     ', ok: true },
      { flight: 'A1718', route: 'GOI→LAX', doNothing: 'CANCELLED   ', proposed: 'DEP +3h 30m', ok: true },
      { flight: 'A1771', route: 'GOI→MXP', doNothing: 'DEP +7h 00m', proposed: 'DEP +2h 05m', ok: true },
      { flight: 'A1823', route: 'GOI→NRT', doNothing: 'DEP +4h 50m', proposed: 'DEP +1h 20m', ok: true },
      { flight: 'A1934', route: 'GOI→ORD', doNothing: 'DEP +5h 30m', proposed: 'DEP +1h 50m', ok: true },
    ],
    review: {
      metrics: [
        { val: '+$95k',  sub: 'COST DELTA VS BASE' },
        { val: '−38h',   sub: 'TOTAL DELAY RECOVERED' },
        { val: '96%',    sub: 'PAX RESOLVED · 2,054 / 2,140' },
      ],
      completion: 'Est. completion  04:50 UTC',
      exceptions: [
        {
          badge: 'CREW EXCEPTION',
          flight: 'A1410', route: 'GOI → CDG',
          lines: ['Crew exception flagged', 'Manual review required'],
        },
        {
          badge: 'CREW EXCEPTION',
          flight: 'A1521', route: 'GOI → SIN',
          lines: ['Crew legality risk', 'Manual review required'],
        },
      ],
    },
    publish: {
      notified: [
        'Crew scheduling',
        'FOC — flight ops',
        'PAX SMS / email (2,054)',
        'Hotel vouchers (86 PAX)',
      ],
      attention: [
        { flight: 'A1410', note: 'Manual crew review' },
        { flight: 'A1521', note: 'Crew legality review' },
      ],
    },
    done: {
      stats: [
        '2,054 PAX notified',
        'Hotel vouchers issued (86)',
        'A1410 + A1521 flagged for ops',
      ],
      attention: 'A1410 + A1521 flagged for ops',
    },
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
    flights: [
      { flight: 'A1101', route: 'GOI→LHR', doNothing: 'DEP +4h 20m', proposed: 'DEP +3h 00m', ok: true },
      { flight: 'A1211', route: 'GOI→JFK', doNothing: 'CANCELLED   ', proposed: 'CANCELLED   ', ok: false, note: 'Cancelled — no swap assigned' },
      { flight: 'A1305', route: 'GOI→SYD', doNothing: 'DEP +6h 00m', proposed: 'DEP +4h 30m', ok: true },
      { flight: 'A1410', route: 'GOI→CDG', doNothing: 'DEP +5h 15m', proposed: 'DEP +5h 15m', ok: false, note: 'No intervention' },
      { flight: 'A1521', route: 'GOI→SIN', doNothing: 'DEP +3h 45m', proposed: 'DEP +3h 45m', ok: false, note: 'No intervention' },
      { flight: 'A1612', route: 'GOI→BOM', doNothing: 'DEP +2h 30m', proposed: 'DEP +2h 30m', ok: true },
      { flight: 'A1718', route: 'GOI→LAX', doNothing: 'CANCELLED   ', proposed: 'OPEN        ', ok: false, note: 'No crew assigned' },
      { flight: 'A1771', route: 'GOI→MXP', doNothing: 'DEP +7h 00m', proposed: 'OPEN        ', ok: false, note: 'No crew assigned' },
      { flight: 'A1823', route: 'GOI→NRT', doNothing: 'DEP +4h 50m', proposed: 'DEP +4h 50m', ok: true },
      { flight: 'A1934', route: 'GOI→ORD', doNothing: 'DEP +5h 30m', proposed: 'OPEN        ', ok: false, note: 'No crew assigned' },
    ],
    review: {
      metrics: [
        { val: '−$420k', sub: 'COST SAVED VS DO-NOTHING' },
        { val: '−19h',   sub: 'TOTAL DELAY RECOVERED' },
        { val: '71%',    sub: 'PAX RESOLVED · 1,519 / 2,140' },
      ],
      completion: 'Est. completion  02:55 UTC',
      exceptions: [
        {
          badge: 'OPEN FLIGHT',
          flight: 'A1718', route: 'GOI → LAX',
          lines: ['No crew assigned', 'Cannot depart — TBC'],
        },
        {
          badge: 'OPEN FLIGHT',
          flight: 'A1771', route: 'GOI → MXP',
          lines: ['No crew assigned', 'Cannot depart — TBC'],
        },
        {
          badge: 'OPEN FLIGHT',
          flight: 'A1934', route: 'GOI → ORD',
          lines: ['No crew assigned', 'Cannot depart — TBC'],
        },
      ],
    },
    publish: {
      notified: [
        'Crew scheduling',
        'FOC — flight ops',
        'PAX SMS / email (1,519)',
        'GDS & codeshare feeds',
      ],
      attention: [
        { flight: 'A1718', note: 'Crew assignment TBC' },
        { flight: 'A1771', note: 'Crew assignment TBC' },
        { flight: 'A1934', note: 'Crew assignment TBC' },
      ],
    },
    done: {
      stats: [
        '1,519 PAX notified',
        'Crew scheduling updated',
        '3 open flights flagged for ops',
      ],
      attention: '3 open flights flagged for ops',
    },
  },
]

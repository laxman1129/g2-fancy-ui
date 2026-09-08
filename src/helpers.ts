// ─── Random disruption scenario (generated once on load) ───────────────────
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pad2(n: number): string { return String(n).padStart(2, '0') }

export interface Scenario {
  flights: number
  pax: number
  delay: string      // display like "+14h 20m"
  curfew: string     // display like "02:00 – 06:00"
  cancels: number
}

function makeScenario(): Scenario {
  const flights = randInt(25, 70)
  const pax     = randInt(750, 7500)
  const h       = randInt(3, 30)
  const m       = [0, 10, 15, 20, 30, 40, 45, 50][randInt(0, 7)]
  const gap     = randInt(3, 18)
  const startH  = randInt(0, 24 - gap)   // keep window within a single day
  const cancels = randInt(2, Math.max(3, Math.round(flights * 0.1)))
  return {
    flights,
    pax,
    delay: `+${h}h ${pad2(m)}m`,
    curfew: `${pad2(startH)}:00 – ${pad2(startH + gap)}:00`,
    cancels,
  }
}

export const SCENARIO: Scenario = makeScenario()

// ─── Current date/time helpers ─────────────────────────────────────────────
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function fmtDateLong(d: Date = new Date()): string {
  return `${pad2(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function fmtDateShort(d: Date = new Date()): string {
  const m = MONTHS[d.getUTCMonth()]
  return `${pad2(d.getUTCDate())} ${m.charAt(0)}${m.slice(1, 3).toLowerCase()}`
}

export function fmtDateCompact(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`
}

export function fmtTimeUTC(d: Date = new Date()): string {
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())} UTC`
}
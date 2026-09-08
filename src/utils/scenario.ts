import { pad2 } from './format'

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

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

// Random disruption scenario (generated once on load)
export const SCENARIO: Scenario = makeScenario()
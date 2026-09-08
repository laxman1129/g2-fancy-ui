import { DW, DH, MF, C } from '../constants'
import type { DrawingContext } from '../drawing-context'
import { state } from '../state'
import { STRATEGIES } from '../data'
import type { Flight } from '../data'

// Total height of the flight comparison list (rows with a note are taller)
function listHeight(flights: Flight[]): number {
  const ROW_H = 22
  const NOTE_H = 13
  const step = ROW_H + NOTE_H
  return flights.reduce((acc, f) => acc + (f.note ? step : ROW_H), 0)
}

// Max scroll offset for the flight comparison list
export function comparisonMaxScroll(): number {
  const HEADER_BOTTOM = 48
  const FTR = 36
  const SCROLL_H = DH - HEADER_BOTTOM - FTR
  return Math.max(0, listHeight(STRATEGIES[state.strategyIdx].flights) - SCROLL_H)
}

// Comparison — Do-Nothing vs Proposed flight table, scrollable below the header.
export function drawComparison(ctx: CanvasRenderingContext2D, d: DrawingContext = { w: DW, h: DH, c: C }) {
  const W = d.w, H = d.h
  const s = STRATEGIES[state.strategyIdx]

  // Fixed header height; the flight list scrolls below it
  const HEADER_BOTTOM = 48
  const FTR = 36          // footer/scroll-hint band
  const SCROLL_H = H - HEADER_BOTTOM - FTR
  const ROW_H  = 22       // primary line height (note shown on a 2nd row)
  const NOTE_H = 13       // note line height

  ctx.fillStyle = d.c.bg
  ctx.fillRect(0, 0, W, H)

  // Header — outline only
  ctx.strokeStyle = d.c.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, 29)
  ctx.fillStyle = d.c.border
  ctx.fillRect(0, 30, W, 1)
  ctx.fillStyle = d.c.text
  ctx.font = `bold 12px ${MF}`
  ctx.letterSpacing = '0.1em'
  ctx.textBaseline = 'middle'
  ctx.fillText(`FLIGHT COMPARISON  ·  STRATEGY ${s.id}  ·  ${s.name.toUpperCase()}`, 14, 15)

  // Column headers
  const cols = { icon: 14, flight: 30, route: 96, doNothing: 186, arrow: 322, proposed: 342, status: 498 }
  ctx.fillStyle = d.c.mid
  ctx.font = `11px ${MF}`
  ctx.letterSpacing = '0.08em'
  ctx.textBaseline = 'middle'
  ctx.fillText('FLT',      cols.flight, 42)
  ctx.fillText('ROUTE',    cols.route,  42)
  ctx.fillText('DO NOTHING', cols.doNothing, 42)
  ctx.fillText('PROPOSED', cols.proposed, 42)

  ctx.fillStyle = d.c.border
  ctx.fillRect(0, HEADER_BOTTOM, W, 1)

  // ── Scrollable flight list ──
  const flights = STRATEGIES[state.strategyIdx].flights
  const step = ROW_H + NOTE_H          // rows with a note are taller
  const maxOffset = Math.max(0, listHeight(flights) - SCROLL_H)

  // Clip list drawing to the scrollable viewport so rows don't bleed into the footer
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, HEADER_BOTTOM + 1, W, SCROLL_H - 1)
  ctx.clip()

  let y = HEADER_BOTTOM + 1 - state.compScroll
  for (const f of flights) {
    const isNote = !!f.note
    const rh = isNote ? step : ROW_H
    const invisible = y + rh <= HEADER_BOTTOM + 1 || y >= HEADER_BOTTOM + SCROLL_H
    if (!invisible) {
      // Row separator
      ctx.fillStyle = d.c.bg2
      ctx.fillRect(0, y, W, 1)

      // Primary line vertically centered within ROW_H
      const ym = y + ROW_H / 2

      // Status icon
      ctx.fillStyle = f.ok ? d.c.mid : d.c.bright
      ctx.font = `bold 13px ${MF}`
      ctx.letterSpacing = '0'
      ctx.textBaseline = 'middle'
      ctx.fillText(f.ok ? '✓' : '⚠', cols.icon, ym)

      // Flight
      ctx.fillStyle = d.c.bright
      ctx.font = `bold 13px ${MF}`
      ctx.fillText(f.flight, cols.flight, ym)

      // Route
      ctx.fillStyle = d.c.sub
      ctx.font = `11px ${MF}`
      ctx.fillText(f.route, cols.route, ym)

      // Do-Nothing
      ctx.fillStyle = f.doNothing.includes('CANCEL') ? d.c.mid : d.c.sub
      ctx.font = `12px ${MF}`
      ctx.fillText(f.doNothing.trim(), cols.doNothing, ym)

      // Arrow
      ctx.fillStyle = d.c.mid
      ctx.font = `12px ${MF}`
      ctx.fillText('→', cols.arrow, ym)

      // Proposed — clip to avoid overflowing into the note/right region
      ctx.save()
      ctx.beginPath()
      ctx.rect(cols.proposed, HEADER_BOTTOM, W - cols.proposed, SCROLL_H)
      ctx.clip()
      const pColor = f.proposed.trim() === 'OPEN'    ? d.c.sub
                   : f.proposed.trim() === 'ON TIME' ? d.c.bright
                   : d.c.text
      ctx.fillStyle = pColor
      ctx.font = `bold 13px ${MF}`
      ctx.fillText(f.proposed.trim(), cols.proposed, ym)
      ctx.restore()

      // Note — second line, full-width hint
      if (f.note) {
        ctx.fillStyle = d.c.mid
        ctx.font = `10px ${MF}`
        ctx.letterSpacing = '0.02em'
        ctx.textBaseline = 'top'
        ctx.fillText(f.note, cols.route, y + ROW_H + 2)
      }
    }
    y += rh
  }

  // Final row separator
  ctx.fillStyle = d.c.bg2
  ctx.fillRect(0, y, W, 1)
  ctx.restore()

  // ── Footer: scroll hint or "list fits" indicator ──
  ctx.fillStyle = d.c.border
  ctx.fillRect(0, H - FTR, W, 1)
  const listH = listHeight(flights)
  const canScroll = listH > SCROLL_H
  ctx.fillStyle = d.c.mid
  ctx.font = `9px ${MF}`
  ctx.letterSpacing = '0.06em'
  ctx.textBaseline = 'middle'
  if (canScroll) {
    const atTop    = state.compScroll <= 0
    const atBottom = state.compScroll >= maxOffset
    const up = atTop    ? ' ' : '▲'
    const dn = atBottom ? ' ' : '▼'
    ctx.textAlign = 'center'
    ctx.fillText(`SCROLL   ${up}  ${flights.length} FLIGHTS  ${dn}`, W / 2, H - FTR / 2)
    ctx.textAlign = 'left'
  } else {
    ctx.textAlign = 'center'
    ctx.fillText(`TAP A FLIGHT  ·  ${flights.length} FLIGHTS  ·  DOUBLE-TAP BACK`, W / 2, H - FTR / 2)
    ctx.textAlign = 'left'
  }
}
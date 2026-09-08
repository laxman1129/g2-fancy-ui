import { DW, DH, MF, C } from '../constants'
import type { DrawingContext } from '../drawing-context'
import { fmtDateLong, SCENARIO } from '../helpers'

// Home — disruption overview with impact stats and the RUN OPTIMIZER CTA.
export function drawHome(ctx: CanvasRenderingContext2D, d: DrawingContext = { w: DW, h: DH, c: C }) {
  const W = d.w, H = d.h

  ctx.fillStyle = d.c.bg
  ctx.fillRect(0, 0, W, H)

  // Top accent strip — outline only
  ctx.strokeStyle = d.c.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, 43)
  ctx.fillStyle = d.c.border
  ctx.fillRect(0, 44, W, 1)

  // Alert tag
  ctx.fillStyle = d.c.bright
  ctx.font = `bold 13px ${MF}`
  ctx.letterSpacing = '0.14em'
  ctx.textBaseline = 'middle'
  ctx.fillText('▸ DISRUPTION ALERT', 16, 16)

  // Date / hub / event
  ctx.fillStyle = d.c.sub
  ctx.font = `12px ${MF}`
  ctx.letterSpacing = '0.04em'
  ctx.fillText(`${fmtDateLong()}  ·  GOI HUB  ·  STORM CELL MC-47`, 16, 33)

  // Three large stat boxes
  const stats = [
    { val: String(SCENARIO.flights), label: 'FLIGHTS\nIMPACTED' },
    { val: SCENARIO.pax.toLocaleString(), label: 'PAX\nAFFECTED' },
    { val: SCENARIO.delay, label: 'AVG\nDELAY' },
  ]
  const bw = Math.floor((W - 48) / 3)
  stats.forEach((s, i) => {
    const bx = 16 + i * (bw + 8)
    const by = 56

    ctx.strokeStyle = d.c.bright
    ctx.lineWidth = 1
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 91)

    ctx.fillStyle = d.c.bright
    ctx.font      = `bold 34px ${MF}`
    ctx.letterSpacing = '-0.02em'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(s.val, bx + bw / 2, by + 38)

    ctx.fillStyle = d.c.sub
    ctx.font = `11px ${MF}`
    ctx.letterSpacing = '0.08em'
    const lines = s.label.split('\n')
    lines.forEach((l, li) => ctx.fillText(l, bx + bw / 2, by + 62 + li * 15))
  })

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Secondary info row
  ctx.fillStyle = d.c.dim
  ctx.fillRect(16, 158, W - 32, 1)

  ctx.fillStyle = d.c.bright
  ctx.font = `bold 13px ${MF}`
  ctx.letterSpacing = '0.02em'
  ctx.textBaseline = 'top'
  ctx.fillText(`${SCENARIO.cancels} cancellations`, 16, 166)
  ctx.fillText('4 recovery strategies ready', 16, 184)

  ctx.fillStyle = d.c.sub
  ctx.font = `12px ${MF}`
  ctx.fillText(`Curfew window  ${SCENARIO.curfew} UTC`, 16, 202)
  ctx.fillStyle = d.c.sub
  ctx.fillText(`Optimizer ready  ·  Delay recover  –34h`, 16, 220)

  // CTA bar
  ctx.strokeStyle = d.c.bright
  ctx.lineWidth = 2
  ctx.strokeRect(0.5, H - 44.5, W - 1, 43)

  ctx.fillStyle = d.c.bright
  ctx.font = `bold 14px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TAP  →  RUN OPTIMIZER', W / 2, H - 22)
  ctx.textAlign = 'left'
}
import { DW, DH, MF, C } from '../constants'
import type { DrawingContext } from '../drawing-context'
import { state } from '../state'
import { STRATEGIES } from '../data'
import { fmtDateCompact } from '../helpers'

// Done — publish confirmation with checkmark, reference and summary stats.
export function drawDone(ctx: CanvasRenderingContext2D, d: DrawingContext = { w: DW, h: DH, c: C }) {
  const W = d.w, H = d.h
  const s = STRATEGIES[state.strategyIdx]
  ctx.fillStyle = d.c.bg
  ctx.fillRect(0, 0, W, H)

  // Large check
  ctx.fillStyle = d.c.bright
  ctx.font = `bold 56px ${MF}`
  ctx.letterSpacing = '0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✓', W / 2, 66)

  ctx.font = `bold 22px ${MF}`
  ctx.letterSpacing = '0.06em'
  ctx.fillText('PLAN PUBLISHED', W / 2, 116)

  ctx.fillStyle = d.c.border
  ctx.fillRect(W / 2 - 120, 132, 240, 1)

  ctx.fillStyle = d.c.text
  ctx.font = `13px ${MF}`
  ctx.letterSpacing = '0.02em'
  ctx.fillText(`OPT-${s.id}-${fmtDateCompact()}-GOI`, W / 2, 150)

  const stats2 = s.done.stats
  ctx.fillStyle = d.c.sub
  ctx.font = `12px ${MF}`
  ctx.letterSpacing = '0'
  stats2.forEach((l, i) => ctx.fillText(l, W / 2, 174 + i * 20))

  ctx.fillStyle = d.c.border
  ctx.fillRect(W / 2 - 120, H - 50, 240, 1)

  ctx.fillStyle = d.c.mid
  ctx.font = `11px ${MF}`
  ctx.letterSpacing = '0.08em'
  ctx.fillText('DOUBLE-TAP TO EXIT', W / 2, H - 26)

  ctx.textAlign = 'left'
}
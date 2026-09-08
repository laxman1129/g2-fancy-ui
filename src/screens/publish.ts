import { DW, DH, MF, C } from '../constants'
import type { DrawingContext } from '../drawing-context'
import { state } from '../state'
import { STRATEGIES } from '../data'
import { fmtDateCompact, fmtDateLong, fmtTimeUTC } from '../helpers'

// Publish — systems notified vs requires attention, then confirm & publish.
export function drawPublish(ctx: CanvasRenderingContext2D, d: DrawingContext = { w: DW, h: DH, c: C }) {
  const W = d.w, H = d.h
  const s = STRATEGIES[state.strategyIdx]
  ctx.fillStyle = d.c.bg
  ctx.fillRect(0, 0, W, H)

  // Header — outline only
  ctx.strokeStyle = d.c.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, 37)
  ctx.fillStyle = d.c.border
  ctx.fillRect(0, 38, W, 1)
  ctx.fillStyle = d.c.bright
  ctx.font = `bold 16px ${MF}`
  ctx.letterSpacing = '0.08em'
  ctx.textBaseline = 'middle'
  ctx.fillText(`PUBLISH PLAN  ·  STRATEGY ${s.id}`, 16, 19)

  // Two-column layout
  const colW = Math.floor(W / 2) - 24

  // Left: notifications sent
  ctx.fillStyle = d.c.mid
  ctx.font = `bold 11px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textBaseline = 'top'
  ctx.fillText('SYSTEMS NOTIFIED', 16, 48)
  ctx.fillStyle = d.c.border
  ctx.fillRect(16, 60, colW, 1)

  const notified = s.publish.notified
  let ly = 66
  notified.forEach(n => {
    ctx.fillStyle = d.c.bright
    ctx.font = `13px ${MF}`
    ctx.letterSpacing = '0'
    ctx.fillText('✓', 16, ly)
    ctx.fillStyle = d.c.text
    ctx.fillText(n, 32, ly)
    ly += 24
  })

  // Right: exceptions
  const rx = W / 2 + 8
  ctx.fillStyle = d.c.mid
  ctx.font = `bold 11px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.fillText('REQUIRES ATTENTION', rx, 48)
  ctx.fillStyle = d.c.border
  ctx.fillRect(rx, 60, colW, 1)

  const exceptions = s.publish.attention
  let ry = 66
  if (exceptions.length === 0) {
    ctx.fillStyle = d.c.bright
    ctx.font = `13px ${MF}`
    ctx.letterSpacing = '0'
    ctx.fillText('✓  NONE', rx, ry)
    ctx.fillStyle = d.c.sub
    ctx.font = `11px ${MF}`
    ctx.fillText('Plan is fully staffed', rx, ry + 16)
  } else {
    exceptions.forEach(e => {
      ctx.fillStyle = d.c.bright
      ctx.font = `13px ${MF}`
      ctx.letterSpacing = '0'
      ctx.fillText('⚠', rx, ry)
      ctx.fillStyle = d.c.bright
      ctx.font = `bold 13px ${MF}`
      ctx.fillText(e.flight, rx + 14, ry)
      ctx.fillStyle = d.c.sub
      ctx.font = `11px ${MF}`
      ctx.fillText(e.note, rx + 14, ry + 16)
      ry += 38
    })
  }

  // Reference + timestamp
  ctx.fillStyle = d.c.border
  ctx.fillRect(16, H - 80, W - 32, 1)

  ctx.fillStyle = d.c.mid
  ctx.font = `11px ${MF}`
  ctx.letterSpacing = '0.04em'
  ctx.fillText(`REF  OPT-${s.id}-${fmtDateCompact()}-GOI`, 16, H - 70)
  ctx.fillText(`${fmtDateLong()}  ·  ${fmtTimeUTC()}`, 16, H - 54)

  // CTA — outline only
  if (state.published) {
    ctx.strokeStyle = d.c.mid
    ctx.lineWidth = 2
    ctx.strokeRect(0.5, H - 37.5, W - 1, 37)
    ctx.fillStyle = d.c.bright
    ctx.font = `bold 14px ${MF}`
    ctx.letterSpacing = '0.1em'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('PUBLISHED  ✓  DOUBLE-TAP TO EXIT', W / 2, H - 19)
  } else {
    ctx.strokeStyle = d.c.bright
    ctx.lineWidth = 2
    ctx.strokeRect(0.5, H - 37.5, W - 1, 37)
    ctx.fillStyle = d.c.bright
    ctx.font = `bold 15px ${MF}`
    ctx.letterSpacing = '0.12em'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TAP  →  CONFIRM & PUBLISH', W / 2, H - 19)
  }
  ctx.textAlign = 'left'
}
import { DW, DH, MF, C } from '../core/constants'
import type { DrawingContext } from '../core/drawing-context'
import { state } from '../core/state'
import { STRATEGIES } from '../data/strategies'

// Max scroll offset for the review exceptions list
export function reviewMaxScroll(): number {
  const EX_TOP = 34
  const EX_BOT = DH - 42
  const EX_H = 93
  const exH = EX_BOT - EX_TOP
  return Math.max(0, STRATEGIES[state.strategyIdx].review.exceptions.length * EX_H - exH)
}

// Review — left: outcome summary metrics, right: exceptions + PUBLISH CTA.
export function drawReview(ctx: CanvasRenderingContext2D, d: DrawingContext = { w: DW, h: DH, c: C }) {
  const W = d.w, H = d.h
  const s = STRATEGIES[state.strategyIdx]
  ctx.fillStyle = d.c.bg
  ctx.fillRect(0, 0, W, H)

  // ── Left half: key metrics (288px wide) ──────────────────────────────────
  const lw = Math.floor(W / 2)

  // Left panel — outline only
  ctx.strokeStyle = d.c.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, lw - 1, H - 1)

  // Section label
  ctx.fillStyle = d.c.mid
  ctx.font = `bold 11px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textBaseline = 'top'
  ctx.fillText(`STRATEGY ${s.id} · OUTCOME SUMMARY`, 14, 12)

  ctx.fillStyle = d.c.border
  ctx.fillRect(14, 26, lw - 28, 1)

  // Three stacked big-number metrics
  const metrics = STRATEGIES[state.strategyIdx].review.metrics

  metrics.forEach((m, i) => {
    const my = 34 + i * 68
    ctx.fillStyle = d.c.bright
    ctx.font      = `bold 38px ${MF}`
    ctx.letterSpacing = '-0.02em'
    ctx.textBaseline = 'top'
    ctx.fillText(m.val, 14, my)

    ctx.fillStyle = d.c.sub
    ctx.font      = `11px ${MF}`
    ctx.letterSpacing = '0.06em'
    ctx.fillText(m.sub, 14, my + 44)

    ctx.fillStyle = d.c.bg3
    ctx.fillRect(14, my + 60, lw - 28, 1)
  })

  // Est. completion
  ctx.fillStyle = d.c.muted
  ctx.font = `11px ${MF}`
  ctx.letterSpacing = '0.04em'
  ctx.fillText(STRATEGIES[state.strategyIdx].review.completion, 14, 242)

  // Vertical divider
  ctx.fillStyle = d.c.border
  ctx.fillRect(lw, 0, 1, H)

  // ── Right half: exceptions + CTA (288px wide) ────────────────────────────
  const rx = lw + 1

  ctx.fillStyle = d.c.mid
  ctx.font = `bold 11px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textBaseline = 'top'
  ctx.fillText('EXCEPTIONS & OPEN ITEMS', rx + 13, 12)

  ctx.fillStyle = d.c.border
  ctx.fillRect(rx + 13, 26, lw - 28, 1)

  const exceptions = STRATEGIES[state.strategyIdx].review.exceptions
  const EX_TOP = 34
  const EX_BOT = H - 42
  const EX_H = 93
  const exH = EX_BOT - EX_TOP
  const maxExScroll = Math.max(0, exceptions.length * EX_H - exH)

  if (exceptions.length === 0) {
    ctx.fillStyle = d.c.bright
    ctx.font = `14px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textBaseline = 'top'
    ctx.fillText('✓ NO EXCEPTIONS', rx + 13, 42)
    ctx.fillStyle = d.c.mid
    ctx.font = `11px ${MF}`
    ctx.fillText('All flights fully covered', rx + 13, 64)
  } else {
    ctx.save()
    ctx.beginPath()
    ctx.rect(rx + 12, EX_TOP, lw - 25, exH)
    ctx.clip()

    let ey = EX_TOP - state.exScroll
    exceptions.forEach(e => {
      // Badge — outline only
      ctx.strokeStyle = d.c.mid
      ctx.lineWidth = 1
      ctx.strokeRect(rx + 13.5, ey + 0.5, lw - 29, 15)
      ctx.fillStyle = d.c.sub
      ctx.font = `bold 10px ${MF}`
      ctx.letterSpacing = '0.1em'
      ctx.textBaseline = 'middle'
      ctx.fillText(`⚠ ${e.badge}`, rx + 17, ey + 8)
      ey += 19

      ctx.fillStyle = d.c.bright
      ctx.font = `bold 18px ${MF}`
      ctx.letterSpacing = '0'
      ctx.textBaseline = 'top'
      ctx.fillText(e.flight, rx + 13, ey)

      ctx.fillStyle = d.c.sub
      ctx.font = `11px ${MF}`
      ctx.fillText(e.route, rx + 84, ey + 3)
      ey += 26

      e.lines.forEach(l => {
        ctx.fillStyle = d.c.mid
        ctx.font = `11px ${MF}`
        ctx.fillText(l, rx + 13, ey)
        ey += 16
      })

      ctx.fillStyle = d.c.bg3
      ctx.fillRect(rx + 13, ey + 4, lw - 28, 1)
      ey += 16
    })
    ctx.restore()

    if (maxExScroll > 0) {
      ctx.fillStyle = d.c.mid
      ctx.font = `10px ${MF}`
      ctx.letterSpacing = '0'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(state.exScroll > 0 ? '▲' : '', rx + lw - 6, EX_TOP + 10)
      ctx.fillText(state.exScroll < maxExScroll ? '▼' : '', rx + lw - 6, EX_BOT - 10)
      ctx.textAlign = 'left'
    }
  }

  // CTA bar — outline only
  ctx.strokeStyle = d.c.bright
  ctx.lineWidth = 2
  ctx.strokeRect(rx + 0.5, H - 38.5, lw - 1, 37)

  ctx.fillStyle = d.c.bright
  ctx.font = `bold 14px ${MF}`
  ctx.letterSpacing = '0.1em'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TAP  →  PUBLISH', rx + lw / 2, H - 20)
  ctx.textAlign = 'left'
}
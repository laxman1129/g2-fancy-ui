import { DW, DH, MF, C } from '../constants'
import type { DrawingContext } from '../drawing-context'
import { state } from '../state'
import { STRATEGIES } from '../data'

// Options — the four recovery strategy cards, one per column.
export function drawOptions(ctx: CanvasRenderingContext2D, d: DrawingContext = { w: DW, h: DH, c: C }) {
  const W = d.w, H = d.h
  ctx.fillStyle = d.c.bg
  ctx.fillRect(0, 0, W, H)

  // Header — outline only
  ctx.strokeStyle = d.c.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, 33)
  ctx.fillStyle = d.c.border
  ctx.fillRect(0, 34, W, 1)
  ctx.fillStyle = d.c.text
  ctx.font = `bold 12px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textBaseline = 'middle'
  ctx.fillText('SELECT RECOVERY STRATEGY', 16, 17)
  ctx.fillStyle = d.c.sub
  ctx.font = `10px ${MF}`
  ctx.letterSpacing = '0.04em'
  ctx.fillText('SCROLL TO NAVIGATE  ·  TAP TO CONFIRM', W - 16 - 220, 17)

  // Strategy cards — one column each (144px wide)
  const cw = Math.floor(W / 4)
  STRATEGIES.forEach((s, i) => {
    const cx = i * cw
    const sel = i === state.strategyIdx

    // Card frame — selected card gets a bold bright outline
    ctx.strokeStyle = sel ? d.c.bright : d.c.border
    ctx.lineWidth = sel ? 3 : 1
    ctx.strokeRect(cx + 1.5, 36.5, cw - 4, H - 38)

    // Header strip divider (top of each card)
    ctx.fillStyle = sel ? d.c.bright : d.c.border
    ctx.fillRect(cx + 2, 61, cw - 4, 1)

    // ── Top row: ID badge + recommended star ──
    ctx.strokeStyle = sel ? d.c.bright : d.c.mid
    ctx.lineWidth = 1
    ctx.strokeRect(cx + 8.5, 42.5, 27, 17)
    ctx.fillStyle = sel ? d.c.bright : d.c.text
    ctx.font = `bold 12px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(s.id, cx + 8 + 14, 51)
    ctx.textAlign = 'left'

    if (s.recommended) {
      ctx.fillStyle = d.c.bright
      ctx.font = `13px ${MF}`
      ctx.fillText('★', cx + cw - 20, 48)
      ctx.font = `8px ${MF}`
      ctx.letterSpacing = '0.06em'
      ctx.fillText('BEST', cx + cw - 20, 58)
    }

    // ── Name ──
    ctx.fillStyle = sel ? d.c.bright : d.c.text
    ctx.font = `bold 14px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textBaseline = 'top'
    const words = s.name.split(' ')
    let line = ''
    let ly = 68
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (ctx.measureText(test).width > cw - 20 && line) {
        ctx.fillText(line, cx + 10, ly); ly += 17; line = w
      } else { line = test }
    }
    if (line) ctx.fillText(line, cx + 10, ly)

    // ── Summary ──
    ly += 22
    ctx.fillStyle = sel ? d.c.sub : d.c.mid
    ctx.font = `10px ${MF}`
    ctx.letterSpacing = '0.02em'
    const sumWords = s.summary.split(' ')
    let sline = ''
    for (const w of sumWords) {
      const test = sline ? `${sline} ${w}` : w
      if (ctx.measureText(test).width > cw - 20 && sline) {
        ctx.fillText(sline, cx + 10, ly); ly += 14; sline = w
      } else { sline = test }
    }
    if (sline) ctx.fillText(sline, cx + 10, ly)

    // ── Cost — amount + "vs …" on two centered lines ──
    ly += 26
    ctx.fillStyle = d.c.bg3
    ctx.fillRect(cx + 10, ly - 6, cw - 20, 1)
    ctx.fillStyle = sel ? d.c.bright : d.c.text
    ctx.font = `bold 15px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textAlign = 'center'
    const costParts = s.cost.split(' vs ')
    ctx.textBaseline = 'top'
    ctx.fillText(costParts[0], cx + cw / 2, ly)
    if (costParts[1]) {
      ctx.font = `10px ${MF}`
      ctx.fillStyle = sel ? d.c.bright : d.c.mid
      ctx.fillText(`vs ${costParts[1]}`, cx + cw / 2, ly + 17)
      ly += 33
    } else {
      ly += 17
    }
    ctx.textAlign = 'left'

    // ── PAX section ──
    ly += 4
    ctx.fillStyle = sel ? d.c.bright : d.c.mid
    ctx.font = `9px ${MF}`
    ctx.letterSpacing = '0.06em'
    ctx.fillText('PAX COVERED', cx + 8, ly)
    ctx.textAlign = 'right'
    ctx.fillStyle = sel ? d.c.bright : d.c.text
    ctx.font = `bold 13px ${MF}`
    ctx.fillText(`${s.paxPct}%`, cx + cw - 8, ly - 2)
    ctx.textAlign = 'left'
    ly += 13

    // PAX bar
    ctx.strokeStyle = sel ? d.c.bright : d.c.mid
    ctx.lineWidth = 1
    ctx.strokeRect(cx + 8.5, ly + 0.5, cw - 18, 5)
    ctx.fillStyle = sel ? d.c.bright : d.c.text
    ctx.fillRect(cx + 8, ly + 2, Math.floor((cw - 18) * s.paxPct / 100), 1)
    ly += 12

    // ── Exceptions / open footer ──
    ly += 8
    ctx.fillStyle = sel ? d.c.bright : d.c.sub
    ctx.font = `10px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textBaseline = 'top'
    ctx.fillText(`${s.exceptions} EXCEP  ·  ${s.open} OPEN`, cx + 8, ly)
  })
}
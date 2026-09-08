import {
  waitForEvenAppBridge,
  TextContainerProperty,
  ImageContainerProperty,
  ImageRawDataUpdate,
  CreateStartUpPageContainer,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'
import UPNG from 'upng-js'
import { STRATEGIES, FLIGHTS } from './data'

// ─── Display geometry ──────────────────────────────────────────────────────
const DW = 576   // full display width
const DH = 288   // full display height
const QW = 288   // quadrant width  (SDK max per image container)
const QH = 144   // quadrant height (SDK max per image container)

// Four image containers tile the full 576×288 display
const QUADS = [
  { id: 1, name: 'q_tl', x: 0,  y: 0   },   // top-left
  { id: 2, name: 'q_tr', x: QW, y: 0   },   // top-right
  { id: 3, name: 'q_bl', x: 0,  y: QH  },   // bottom-left
  { id: 4, name: 'q_br', x: QW, y: QH  },   // bottom-right
]

// ─── App state ─────────────────────────────────────────────────────────────
type Screen = 'HOME' | 'OPTIONS' | 'COMPARISON' | 'REVIEW' | 'PUBLISH' | 'DONE'

let screen: Screen = 'HOME'
let strategyIdx = 0
let published   = false

// ─── Event capture ─────────────────────────────────────────────────────────
// The G2 firmware allows only ONE event-capturing container per page, so a
// single full-screen invisible text container receives every ring gesture.
// A tap therefore performs the current screen's primary action (i.e. the
// drawn CTA button), which is the highest-fidelity "button" available here.
const C_GESTURE = 9

// ─── Typography & palette ──────────────────────────────────────────────────
const MF = '"JetBrains Mono","SF Mono","Fira Code","Consolas",ui-monospace,monospace'

// Grayscale palette — spread across full 16-level gray range for G2 4-bit display
// After quantization: 0, 1, 2, 3, 5, 7, 9, 11, 13, 15
const C = {
  bg:      '#000000',   // level  0
  bg1:     '#080808',   // level  1
  bg2:     '#151515',   // level  1
  bg3:     '#222222',   // level  2
  border:  '#333333',   // level  3
  dim:     '#555555',   // level  5
  muted:   '#777777',   // level  7
  mid:     '#999999',   // level  9
  sub:     '#BBBBBB',   // level 11
  text:    '#E0E0E0',   // level 13
  bright:  '#FFFFFF',   // level 15
  invert:  '#FFFFFF',   // for selected-item text on white bg
  sel:     '#FFFFFF',   // selected item background
  selText: '#000000',
}

// ─── Canvas → packed gray4 number[] ────────────────────────────────────────
// G2 expects two 4-bit luma nibbles per byte: byte = (g0 << 4) | g1
// Floyd–Steinberg error diffusion preserves sub-level detail lost by direct
// quantization, smoothing anti-aliased text edges and eliminating banding on
// the 16-level gray display.
function toGray4(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext('2d')!
  const d   = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const w   = canvas.width
  const h   = canvas.height
  const n   = w * h

  const err = new Float32Array(n + w)   // +w row guard for bottom-row writes
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      const i  = row + x
      const a  = i << 2
      const luma = (0.299 * d[a] + 0.587 * d[a + 1] + 0.114 * d[a + 2]) / 255 * 15
      const val = Math.max(0, Math.min(15, luma + err[i]))
      const q = Math.round(val)
      const e = val - q

      // Distribute quantization error (Floyd–Steinberg coefficients)
      if (x + 1 < w) err[i + 1]      += e * 7 / 16
      const rowN = row + w
      if (y + 1 < h) {
        if (x > 0)     err[rowN + x - 1] += e * 3 / 16
        err[rowN + x]                   += e * 5 / 16
        if (x + 1 < w) err[rowN + x + 1] += e * 1 / 16
      }
      err[i] = q
    }
  }

  const out = new Array<number>(n >> 1)
  for (let i = 0; i < n; i += 2) {
    out[i >> 1] = ((err[i] & 0xF) << 4) | ((i + 1 < n ? err[i + 1] : 0) & 0xF)
  }
  return out
}

// UPNG → base64 data URL (used by companion mirror)
function toPngUrl(canvas: HTMLCanvasElement): string {
  const ctx  = canvas.getContext('2d')!
  const img  = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const buf  = UPNG.encode([img.data.buffer], canvas.width, canvas.height, 0)
  const u8   = new Uint8Array(buf)
  let b64 = ''
  for (let i = 0; i < u8.length; i++) b64 += String.fromCharCode(u8[i])
  return `data:image/png;base64,${btoa(b64)}`
}

// ─── Screen drawing functions ──────────────────────────────────────────────
// Each draws onto a 576×288 canvas.  No title bar, no nav bar — full bleed.

function drawHome(ctx: CanvasRenderingContext2D) {
  const W = DW, H = DH

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Top accent strip — outline only
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, 43)
  ctx.fillStyle = C.border
  ctx.fillRect(0, 44, W, 1)

  // Alert tag
  ctx.fillStyle = C.bright
  ctx.font = `bold 13px ${MF}`
  ctx.letterSpacing = '0.14em'
  ctx.textBaseline = 'middle'
  ctx.fillText('▸ DISRUPTION ALERT', 16, 16)

  // Date / hub / event
  ctx.fillStyle = C.sub
  ctx.font = `12px ${MF}`
  ctx.letterSpacing = '0.04em'
  ctx.fillText('17 SEP 2026  ·  GOI HUB  ·  STORM CELL MC-47', 16, 33)

  // Three large stat boxes
  const stats = [
    { val: '47',     label: 'FLIGHTS\nIMPACTED' },
    { val: '2,140',  label: 'PAX\nAFFECTED' },
    { val: '+4h 20m',label: 'AVG\nDELAY' },
  ]
  const bw = Math.floor((W - 48) / 3)
  stats.forEach((s, i) => {
    const bx = 16 + i * (bw + 8)
    const by = 56

    ctx.strokeStyle = C.bright
    ctx.lineWidth = 1
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, 91)

    ctx.fillStyle = C.bright
    ctx.font      = `bold 34px ${MF}`
    ctx.letterSpacing = '-0.02em'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(s.val, bx + bw / 2, by + 38)

    ctx.fillStyle = C.sub
    ctx.font = `11px ${MF}`
    ctx.letterSpacing = '0.08em'
    const lines = s.label.split('\n')
    lines.forEach((l, li) => ctx.fillText(l, bx + bw / 2, by + 62 + li * 15))
  })

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Secondary info row
  ctx.fillStyle = C.dim
  ctx.fillRect(16, 158, W - 32, 1)

  ctx.fillStyle = C.bright
  ctx.font = `bold 13px ${MF}`
  ctx.letterSpacing = '0.02em'
  ctx.textBaseline = 'top'
  ctx.fillText('3 cancellations', 16, 166)
  ctx.fillText('4 recovery strategies ready', 16, 184)

  ctx.fillStyle = C.sub
  ctx.font = `12px ${MF}`
  ctx.fillText(`Curfew window  02:00 – 06:00 UTC`, 16, 202)
  ctx.fillStyle = C.sub
  ctx.fillText(`Optimizer ready  ·  Delay recover  –34h`, 16, 220)

  // CTA bar
  ctx.strokeStyle = C.bright
  ctx.lineWidth = 2
  ctx.strokeRect(0.5, H - 44.5, W - 1, 43)

  ctx.fillStyle = C.bright
  ctx.font = `bold 14px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TAP  →  RUN OPTIMIZER', W / 2, H - 22)
  ctx.textAlign = 'left'
}

function drawOptions(ctx: CanvasRenderingContext2D) {
  const W = DW, H = DH
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Header — outline only
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, 33)
  ctx.fillStyle = C.border
  ctx.fillRect(0, 34, W, 1)
  ctx.fillStyle = C.text
  ctx.font = `bold 12px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textBaseline = 'middle'
  ctx.fillText('SELECT RECOVERY STRATEGY', 16, 17)
  ctx.fillStyle = C.sub
  ctx.font = `10px ${MF}`
  ctx.letterSpacing = '0.04em'
  ctx.fillText('SCROLL TO NAVIGATE  ·  TAP TO CONFIRM', W - 16 - 220, 17)

  // Strategy cards — one column each (144px wide)
  const cw = Math.floor(W / 4)
  STRATEGIES.forEach((s, i) => {
    const cx = i * cw
    const sel = i === strategyIdx

    // Card frame — selected card gets a bold bright outline
    ctx.strokeStyle = sel ? C.bright : C.border
    ctx.lineWidth = sel ? 3 : 1
    ctx.strokeRect(cx + 1.5, 36.5, cw - 4, H - 38)

    // Header strip divider (top of each card)
    ctx.fillStyle = sel ? C.bright : C.border
    ctx.fillRect(cx + 2, 61, cw - 4, 1)

    // ── Top row: ID badge + recommended star ──
    ctx.strokeStyle = sel ? C.bright : C.mid
    ctx.lineWidth = 1
    ctx.strokeRect(cx + 8.5, 42.5, 27, 17)
    ctx.fillStyle = sel ? C.bright : C.text
    ctx.font = `bold 12px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(s.id, cx + 8 + 14, 51)
    ctx.textAlign = 'left'

    if (s.recommended) {
      ctx.fillStyle = C.bright
      ctx.font = `13px ${MF}`
      ctx.fillText('★', cx + cw - 20, 48)
      ctx.font = `8px ${MF}`
      ctx.letterSpacing = '0.06em'
      ctx.fillText('BEST', cx + cw - 20, 58)
    }

    // ── Name ──
    ctx.fillStyle = sel ? C.bright : C.text
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
    ctx.fillStyle = sel ? C.sub : C.mid
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
    ctx.fillStyle = C.bg3
    ctx.fillRect(cx + 10, ly - 6, cw - 20, 1)
    ctx.fillStyle = sel ? C.bright : C.text
    ctx.font = `bold 15px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textAlign = 'center'
    const costParts = s.cost.split(' vs ')
    ctx.textBaseline = 'top'
    ctx.fillText(costParts[0], cx + cw / 2, ly)
    if (costParts[1]) {
      ctx.font = `10px ${MF}`
      ctx.fillStyle = sel ? C.bright : C.mid
      ctx.fillText(`vs ${costParts[1]}`, cx + cw / 2, ly + 17)
      ly += 33
    } else {
      ly += 17
    }
    ctx.textAlign = 'left'

    // ── PAX section ──
    ly += 4
    ctx.fillStyle = sel ? C.bright : C.mid
    ctx.font = `9px ${MF}`
    ctx.letterSpacing = '0.06em'
    ctx.fillText('PAX COVERED', cx + 8, ly)
    ctx.textAlign = 'right'
    ctx.fillStyle = sel ? C.bright : C.text
    ctx.font = `bold 13px ${MF}`
    ctx.fillText(`${s.paxPct}%`, cx + cw - 8, ly - 2)
    ctx.textAlign = 'left'
    ly += 13

    // PAX bar
    ctx.strokeStyle = sel ? C.bright : C.mid
    ctx.lineWidth = 1
    ctx.strokeRect(cx + 8.5, ly + 0.5, cw - 18, 5)
    ctx.fillStyle = sel ? C.bright : C.text
    ctx.fillRect(cx + 8, ly + 2, Math.floor((cw - 18) * s.paxPct / 100), 1)
    ly += 12

    // ── Exceptions / open footer ──
    ly += 8
    ctx.fillStyle = sel ? C.bright : C.sub
    ctx.font = `10px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textBaseline = 'top'
    ctx.fillText(`${s.exceptions} EXCEP  ·  ${s.open} OPEN`, cx + 8, ly)
  })
}

function drawComparison(ctx: CanvasRenderingContext2D) {
  const W = DW, H = DH
  const s = STRATEGIES[strategyIdx]

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Header — outline only
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, 29)
  ctx.fillStyle = C.border
  ctx.fillRect(0, 30, W, 1)
  ctx.fillStyle = C.text
  ctx.font = `bold 12px ${MF}`
  ctx.letterSpacing = '0.1em'
  ctx.textBaseline = 'middle'
  ctx.fillText(`FLIGHT COMPARISON  ·  STRATEGY ${s.id}  ·  ${s.name.toUpperCase()}`, 14, 15)

  // Column headers
  const cols = { icon: 14, flight: 30, route: 96, doNothing: 186, arrow: 322, proposed: 342, status: 498 }
  ctx.fillStyle = C.mid
  ctx.font = `11px ${MF}`
  ctx.letterSpacing = '0.08em'
  ctx.textBaseline = 'middle'
  ctx.fillText('FLT',      cols.flight, 42)
  ctx.fillText('ROUTE',    cols.route,  42)
  ctx.fillText('DO NOTHING', cols.doNothing, 42)
  ctx.fillText('PROPOSED', cols.proposed, 42)

  ctx.fillStyle = C.border
  ctx.fillRect(0, 48, W, 1)

    // Flight rows
  const rowH = 23
  let y = 50
  FLIGHTS.forEach(f => {
    if (y + rowH > H) return

    // Row separator
    ctx.fillStyle = C.bg2
    ctx.fillRect(0, y, W, 1)

    const ym = y + rowH / 2

    // Status icon
    ctx.fillStyle = f.ok ? C.mid : C.bright
    ctx.font = `bold 13px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textBaseline = 'middle'
    ctx.fillText(f.ok ? '✓' : '⚠', cols.icon, ym)

    // Flight
    ctx.fillStyle = C.bright
    ctx.font = `bold 13px ${MF}`
    ctx.fillText(f.flight, cols.flight, ym)

    // Route
    ctx.fillStyle = C.sub
    ctx.font = `11px ${MF}`
    ctx.fillText(f.route, cols.route, ym)

    // Do-Nothing
    ctx.fillStyle = f.doNothing.includes('CANCEL') ? C.mid : C.sub
    ctx.font = `12px ${MF}`
    ctx.fillText(f.doNothing.trim(), cols.doNothing, ym)

    // Arrow
    ctx.fillStyle = C.mid
    ctx.font = `12px ${MF}`
    ctx.fillText('→', cols.arrow, ym)

    // Proposed
    const pColor = f.proposed.trim() === 'OPEN'    ? C.sub
                 : f.proposed.trim() === 'ON TIME' ? C.bright
                 : C.text
    ctx.fillStyle = pColor
    ctx.font = `bold 13px ${MF}`
    ctx.fillText(f.proposed.trim(), cols.proposed, ym)

    // Note (right edge)
    if (f.note) {
      ctx.fillStyle = C.mid
      ctx.font = `10px ${MF}`
      ctx.letterSpacing = '0.04em'
      const noteW = ctx.measureText(f.note).width
      ctx.fillText(f.note, W - noteW - 10, ym)
    }

    y += rowH

    // Row separator
    ctx.fillStyle = C.bg2
    ctx.fillRect(0, y, W, 1)
  })
}

function drawReview(ctx: CanvasRenderingContext2D) {
  const W = DW, H = DH
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // ── Left half: key metrics (288px wide) ──────────────────────────────────
  const lw = Math.floor(W / 2)

  // Left panel — outline only
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, lw - 1, H - 1)

  // Section label
  ctx.fillStyle = C.mid
  ctx.font = `bold 11px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textBaseline = 'top'
  ctx.fillText('STRATEGY B · OUTCOME SUMMARY', 14, 12)

  ctx.fillStyle = C.border
  ctx.fillRect(14, 26, lw - 28, 1)

  // Three stacked big-number metrics
  const metrics = [
    { val: '↓ $198k', sub: 'COST SAVED VS DO-NOTHING', y: 34 },
    { val: '−34h',    sub: 'TOTAL DELAY RECOVERED',    y: 102 },
    { val: '84%',     sub: 'PAX RESOLVED · 1,813 / 2,140', y: 170 },
  ]

  metrics.forEach(m => {
    ctx.fillStyle = C.bright
    ctx.font      = `bold 38px ${MF}`
    ctx.letterSpacing = '-0.02em'
    ctx.textBaseline = 'top'
    ctx.fillText(m.val, 14, m.y)

    ctx.fillStyle = C.sub
    ctx.font      = `11px ${MF}`
    ctx.letterSpacing = '0.06em'
    ctx.fillText(m.sub, 14, m.y + 44)

    ctx.fillStyle = C.bg3
    ctx.fillRect(14, m.y + 60, lw - 28, 1)
  })

  // Est. completion
  ctx.fillStyle = C.muted
  ctx.font = `11px ${MF}`
  ctx.letterSpacing = '0.04em'
  ctx.fillText('Est. completion  03:40 UTC', 14, 242)

  // Vertical divider
  ctx.fillStyle = C.border
  ctx.fillRect(lw, 0, 1, H)

  // ── Right half: exceptions + CTA (288px wide) ────────────────────────────
  const rx = lw + 1

  ctx.fillStyle = C.mid
  ctx.font = `bold 11px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textBaseline = 'top'
  ctx.fillText('EXCEPTIONS & OPEN ITEMS', rx + 13, 12)

  ctx.fillStyle = C.border
  ctx.fillRect(rx + 13, 26, lw - 28, 1)

  const exceptions = [
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
  ]

  let ey = 34
  exceptions.forEach(e => {
    // Badge — outline only
    ctx.strokeStyle = C.mid
    ctx.lineWidth = 1
    ctx.strokeRect(rx + 13.5, ey + 0.5, lw - 29, 15)
    ctx.fillStyle = C.sub
    ctx.font = `bold 10px ${MF}`
    ctx.letterSpacing = '0.1em'
    ctx.textBaseline = 'middle'
    ctx.fillText(`⚠ ${e.badge}`, rx + 17, ey + 8)
    ey += 19

    ctx.fillStyle = C.bright
    ctx.font = `bold 20px ${MF}`
    ctx.letterSpacing = '0'
    ctx.textBaseline = 'top'
    ctx.fillText(e.flight, rx + 13, ey)

    ctx.fillStyle = C.sub
    ctx.font = `12px ${MF}`
    ctx.fillText(e.route, rx + 74, ey + 3)
    ey += 26

    e.lines.forEach(l => {
      ctx.fillStyle = C.mid
      ctx.font = `11px ${MF}`
      ctx.fillText(l, rx + 13, ey)
      ey += 16
    })

    ctx.fillStyle = C.bg3
    ctx.fillRect(rx + 13, ey + 4, lw - 28, 1)
    ey += 16
  })

  // CTA bar — outline only
  ctx.strokeStyle = C.bright
  ctx.lineWidth = 2
  ctx.strokeRect(rx + 0.5, H - 38.5, lw - 1, 37)

  ctx.fillStyle = C.bright
  ctx.font = `bold 14px ${MF}`
  ctx.letterSpacing = '0.1em'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('TAP  →  PUBLISH', rx + lw / 2, H - 20)
  ctx.textAlign = 'left'
}

function drawPublish(ctx: CanvasRenderingContext2D) {
  const W = DW, H = DH
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Header — outline only
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, W - 1, 37)
  ctx.fillStyle = C.border
  ctx.fillRect(0, 38, W, 1)
  ctx.fillStyle = C.bright
  ctx.font = `bold 16px ${MF}`
  ctx.letterSpacing = '0.08em'
  ctx.textBaseline = 'middle'
  ctx.fillText('PUBLISH PLAN  ·  STRATEGY B', 16, 19)

  // Two-column layout
  const colW = Math.floor(W / 2) - 24

  // Left: notifications sent
  ctx.fillStyle = C.mid
  ctx.font = `bold 11px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.textBaseline = 'top'
  ctx.fillText('SYSTEMS NOTIFIED', 16, 48)
  ctx.fillStyle = C.border
  ctx.fillRect(16, 60, colW, 1)

  const notified = [
    'Crew scheduling',
    'FOC — flight ops',
    'PAX SMS / email (1,813)',
    'GDS & codeshare feeds',
  ]
  let ly = 66
  notified.forEach(n => {
    ctx.fillStyle = C.bright
    ctx.font = `13px ${MF}`
    ctx.letterSpacing = '0'
    ctx.fillText('✓', 16, ly)
    ctx.fillStyle = C.text
    ctx.fillText(n, 32, ly)
    ly += 24
  })

  // Right: exceptions
  const rx = W / 2 + 8
  ctx.fillStyle = C.mid
  ctx.font = `bold 11px ${MF}`
  ctx.letterSpacing = '0.12em'
  ctx.fillText('REQUIRES ATTENTION', rx, 48)
  ctx.fillStyle = C.border
  ctx.fillRect(rx, 60, colW, 1)

  const exceptions = [
    { flight: 'A1410', note: 'Manual crew review' },
    { flight: 'A1771', note: 'Crew assignment TBC' },
  ]
  let ry = 66
  exceptions.forEach(e => {
    ctx.fillStyle = C.bright
    ctx.font = `13px ${MF}`
    ctx.letterSpacing = '0'
    ctx.fillText('⚠', rx, ry)
    ctx.fillStyle = C.bright
    ctx.font = `bold 13px ${MF}`
    ctx.fillText(e.flight, rx + 14, ry)
    ctx.fillStyle = C.sub
    ctx.font = `11px ${MF}`
    ctx.fillText(e.note, rx + 14, ry + 16)
    ry += 38
  })

  // Reference + timestamp
  ctx.fillStyle = C.border
  ctx.fillRect(16, H - 80, W - 32, 1)

  ctx.fillStyle = C.mid
  ctx.font = `11px ${MF}`
  ctx.letterSpacing = '0.04em'
  ctx.fillText('REF  OPT-B-20260917-GOI', 16, H - 70)
  ctx.fillText('17 SEP 2026  ·  23:14 UTC', 16, H - 54)

  // CTA — outline only
  if (published) {
    ctx.strokeStyle = C.mid
    ctx.lineWidth = 2
    ctx.strokeRect(0.5, H - 37.5, W - 1, 37)
    ctx.fillStyle = C.bright
    ctx.font = `bold 14px ${MF}`
    ctx.letterSpacing = '0.1em'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('PUBLISHED  ✓  DOUBLE-TAP TO EXIT', W / 2, H - 19)
  } else {
    ctx.strokeStyle = C.bright
    ctx.lineWidth = 2
    ctx.strokeRect(0.5, H - 37.5, W - 1, 37)
    ctx.fillStyle = C.bright
    ctx.font = `bold 15px ${MF}`
    ctx.letterSpacing = '0.12em'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TAP  →  CONFIRM & PUBLISH', W / 2, H - 19)
  }
  ctx.textAlign = 'left'
}

function drawDone(ctx: CanvasRenderingContext2D) {
  const W = DW, H = DH
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Large check
  ctx.fillStyle = C.bright
  ctx.font = `bold 56px ${MF}`
  ctx.letterSpacing = '0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('✓', W / 2, 66)

  ctx.font = `bold 22px ${MF}`
  ctx.letterSpacing = '0.06em'
  ctx.fillText('PLAN PUBLISHED', W / 2, 116)

  ctx.fillStyle = C.border
  ctx.fillRect(W / 2 - 120, 132, 240, 1)

  ctx.fillStyle = C.text
  ctx.font = `13px ${MF}`
  ctx.letterSpacing = '0.02em'
  ctx.fillText('OPT-B-20260917-GOI', W / 2, 150)

  const stats2 = [
    '1,813 PAX notified',
    'Crew scheduling updated',
    'A1410 + A1771 flagged for ops',
  ]
  ctx.fillStyle = C.sub
  ctx.font = `12px ${MF}`
  ctx.letterSpacing = '0'
  stats2.forEach((l, i) => ctx.fillText(l, W / 2, 174 + i * 20))

  ctx.fillStyle = C.border
  ctx.fillRect(W / 2 - 120, H - 50, 240, 1)

  ctx.fillStyle = C.mid
  ctx.font = `11px ${MF}`
  ctx.letterSpacing = '0.08em'
  ctx.fillText('DOUBLE-TAP TO EXIT', W / 2, H - 26)

  ctx.textAlign = 'left'
}

// ─── Render pipeline ───────────────────────────────────────────────────────

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = DW; c.height = DH
  return c
}

function drawCurrentScreen(): HTMLCanvasElement {
  const c = makeCanvas()
  const ctx = c.getContext('2d')!
  switch (screen) {
    case 'HOME':       drawHome(ctx);       break
    case 'OPTIONS':    drawOptions(ctx);    break
    case 'COMPARISON': drawComparison(ctx); break
    case 'REVIEW':     drawReview(ctx);     break
    case 'PUBLISH':    drawPublish(ctx);    break
    case 'DONE':       drawDone(ctx);       break
  }
  return c
}

// Split the 576×288 canvas into 4 quadrant canvases (288×144 each)
function splitQuadrants(src: HTMLCanvasElement): HTMLCanvasElement[] {
  return QUADS.map(q => {
    const qc  = document.createElement('canvas')
    qc.width  = QW; qc.height = QH
    const qctx = qc.getContext('2d')!
    qctx.drawImage(src, q.x, q.y, QW, QH, 0, 0, QW, QH)
    return qc
  })
}

// ─── Bridge ────────────────────────────────────────────────────────────────
const bridge = await waitForEvenAppBridge()

// All four image containers created once at startup; thereafter only pixel data is pushed
const imageContainers = QUADS.map(q => new ImageContainerProperty({
  xPosition: q.x, yPosition: q.y, width: QW, height: QH,
  containerID: q.id, containerName: q.name,
}))

// Thin off-screen capture container to receive ring gestures (tap / scroll)
const gestureContainer = new TextContainerProperty({
  xPosition: 0, yPosition: 0, width: DW, height: DH,
  borderWidth: 0, borderColor: 0, paddingLength: 0,
  containerID: C_GESTURE, containerName: 'gesture',
  content: '', isEventCapture: 1,
})

const created = await bridge.createStartUpPageContainer(
  new CreateStartUpPageContainer({
    containerTotalNum: 5,            // 4 image + 1 gesture-capture text
    textObject:  [gestureContainer],
    imageObject: imageContainers,
  }),
)
if (created !== 0) console.error('createStartUpPageContainer failed:', created)

// ─── Rendering ─────────────────────────────────────────────────────────────
let rendering: Promise<unknown> = Promise.resolve()

async function render() {
  rendering = rendering.then(async () => {
    const full  = drawCurrentScreen()
    const quads = splitQuadrants(full)
    for (let i = 0; i < QUADS.length; i++) {
      await bridge.updateImageRawData(new ImageRawDataUpdate({
        containerID:   QUADS[i].id,
        containerName: QUADS[i].name,
        imageData:     toGray4(quads[i]),
      }))
    }
  })
  await rendering
  mirrorCompanion()
}

await render()

// ─── Interaction handlers ──────────────────────────────────────────────────
function handleTap() {
  switch (screen) {
    case 'HOME':       screen = 'OPTIONS';    strategyIdx = 0; break
    case 'OPTIONS':    screen = 'COMPARISON'; break
    case 'COMPARISON': screen = 'REVIEW';     break
    case 'REVIEW':     screen = 'PUBLISH';    break
    case 'PUBLISH':    if (!published) { published = true; screen = 'DONE' } break
    case 'DONE': break
  }
  render().catch(console.error)
}

function handleDoubleTap() {
  switch (screen) {
    case 'HOME':
      bridge.shutDownPageContainer(1)
      cleanup()
      return
    case 'OPTIONS':    screen = 'HOME';       break
    case 'COMPARISON': screen = 'OPTIONS';    break
    case 'REVIEW':     screen = 'COMPARISON'; break
    case 'PUBLISH':    screen = 'REVIEW';     break
    case 'DONE':       screen = 'HOME'; published = false; break
  }
  render().catch(console.error)
}

function handleScrollUp() {
  if (screen === 'OPTIONS' && strategyIdx > 0) {
    strategyIdx--
    render().catch(console.error)
  }
}

function handleScrollDown() {
  if (screen === 'OPTIONS' && strategyIdx < STRATEGIES.length - 1) {
    strategyIdx++
    render().catch(console.error)
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────
let cleanedUp = false
function cleanup() {
  if (cleanedUp) return
  cleanedUp = true
  unsubscribe()
}

function eventTypeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
  if (!envelope) return null
  return envelope.eventType ?? OsEventTypeList.CLICK_EVENT
}

const unsubscribe = bridge.onEvenHubEvent(event => {
  const sysType  = eventTypeOf(event.sysEvent)
  const textType = eventTypeOf(event.textEvent)

  if (
    sysType  === OsEventTypeList.DOUBLE_CLICK_EVENT ||
    textType === OsEventTypeList.DOUBLE_CLICK_EVENT
  ) { handleDoubleTap(); return }

  if (sysType === OsEventTypeList.SCROLL_TOP_EVENT    || textType === OsEventTypeList.SCROLL_TOP_EVENT)
    { handleScrollUp();   return }
  if (sysType === OsEventTypeList.SCROLL_BOTTOM_EVENT || textType === OsEventTypeList.SCROLL_BOTTOM_EVENT)
    { handleScrollDown(); return }

  if (
    sysType  === OsEventTypeList.CLICK_EVENT ||
    textType === OsEventTypeList.CLICK_EVENT
  ) { handleTap(); return }

  if (
    sysType === OsEventTypeList.SYSTEM_EXIT_EVENT ||
    sysType === OsEventTypeList.ABNORMAL_EXIT_EVENT
  ) { cleanup() }
})

window.addEventListener('beforeunload', cleanup)

// ─── Companion web UI ──────────────────────────────────────────────────────
const STEPS: Screen[] = ['HOME', 'OPTIONS', 'COMPARISON', 'REVIEW', 'PUBLISH', 'DONE']

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
<div class="companion">
  <header class="comp-header">
    <div class="comp-logo">
      <span class="comp-logo-mark">A1</span>
      <span class="comp-logo-text">Disruption Optimizer</span>
    </div>
    <div class="comp-meta">
      <span class="comp-date">17 Sep 2026  ·  GOI</span>
      <span class="comp-badge" id="screenBadge">HOME</span>
    </div>
  </header>

  <div class="stepper" id="stepper"></div>

  <div class="display-shell">
    <div class="display-bezel">
      <div class="display-scanlines"></div>
      <img class="display-img" id="displayImg" alt="G2 display" />
    </div>
    <div class="display-label">G2  ·  576 × 288  ·  UPNG-rendered  ·  gray4</div>
  </div>

  <div class="comp-controls">
    <button class="ctrl-btn ctrl-primary"   id="btnTap">    <span class="ctrl-icon">→</span><span class="ctrl-label">Tap</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnDouble"> <span class="ctrl-icon">↩</span><span class="ctrl-label">Double-tap</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnUp">     <span class="ctrl-icon">↑</span><span class="ctrl-label">Scroll up</span></button>
    <button class="ctrl-btn ctrl-secondary" id="btnDown">   <span class="ctrl-icon">↓</span><span class="ctrl-label">Scroll down</span></button>
  </div>
  <p class="comp-hint">Buttons simulate G2 ring gestures</p>
</div>
`

const style = document.createElement('style')
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; background: #07080D; color: #C8D8E8; font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
  #app { display: flex; min-height: 100%; }

  .companion { width: 100%; max-width: 660px; margin: 0 auto; padding: 20px 16px 32px; display: flex; flex-direction: column; gap: 14px; }

  .comp-header { display: flex; justify-content: space-between; align-items: center; }
  .comp-logo { display: flex; align-items: center; gap: 10px; }
  .comp-logo-mark { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 13px; background: linear-gradient(135deg,#1A6B9A,#2A9FD6); color:#fff; padding: 4px 8px; border-radius: 6px; letter-spacing:.04em; }
  .comp-logo-text { font-size: 14px; font-weight: 600; color: #8BAFC8; letter-spacing:.02em; }
  .comp-meta { display: flex; align-items: center; gap: 10px; }
  .comp-date { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #3A5570; letter-spacing:.04em; }
  .comp-badge { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; color: #5BC4F5; background: #081524; border: 1px solid #1A3A55; padding: 3px 10px; border-radius: 20px; letter-spacing:.08em; transition: all .2s; }

  .stepper { display: flex; align-items: center; padding: 0 2px; }
  .step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; }
  .step::after { content:''; position:absolute; top:9px; left:calc(50% + 9px); right:calc(-50% + 9px); height:1px; background:#1A2535; transition:background .3s; }
  .step:last-child::after { display:none; }
  .step-dot { width:18px; height:18px; border-radius:50%; border:1.5px solid #1A2535; background:#0C1018; display:flex; align-items:center; justify-content:center; font-size:8px; color:#2A3A4A; font-family:'JetBrains Mono',monospace; font-weight:600; transition:all .3s; z-index:1; }
  .step-label { font-size:9px; color:#2A3A4A; letter-spacing:.04em; font-family:'JetBrains Mono',monospace; transition:color .3s; }
  .step.done .step-dot { background:#0D2B1A; border-color:#2D7A4A; color:#3DD68C; }
  .step.done .step-label { color:#2D7A4A; }
  .step.done::after { background:#1A3A2A; }
  .step.active .step-dot { background:#0D2340; border-color:#2B6CB0; color:#5BC4F5; box-shadow:0 0 8px rgba(91,196,245,.3); }
  .step.active .step-label { color:#5BC4F5; }

  .display-shell { display:flex; flex-direction:column; align-items:center; gap:8px; }
  .display-bezel { position:relative; width:100%; max-width:576px; border-radius:10px; overflow:hidden; border:1.5px solid #111D2E; box-shadow:0 0 0 3px #070A0F, 0 0 24px rgba(0,0,0,.6); background:#000; }
  .display-scanlines { position:absolute; inset:0; background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.06) 2px,rgba(0,0,0,.06) 4px); pointer-events:none; z-index:2; }
  .display-img { display:block; width:100%; height:auto; image-rendering:pixelated; image-rendering:crisp-edges; }
  .display-label { font-family:'JetBrains Mono',monospace; font-size:10px; color:#202E3E; letter-spacing:.06em; }

  .comp-controls { display:grid; grid-template-columns:2fr 2fr 1fr 1fr; gap:8px; }
  .ctrl-btn { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:12px 8px; border:1.5px solid transparent; border-radius:10px; cursor:pointer; font-family:'Inter',system-ui; transition:all .15s; user-select:none; }
  .ctrl-btn:active { transform:scale(.96); }
  .ctrl-primary { background:linear-gradient(160deg,#1558A8,#1A6CC0); border-color:#2B7FD4; color:#fff; box-shadow:0 2px 8px rgba(26,108,192,.3); }
  .ctrl-primary:hover { background:linear-gradient(160deg,#1A6CC0,#2280D4); }
  .ctrl-secondary { background:#0C1018; border-color:#1A2535; color:#8BAFC8; }
  .ctrl-secondary:hover { background:#111820; border-color:#253545; color:#A8C4D8; }
  .ctrl-icon { font-size:16px; line-height:1; }
  .ctrl-label { font-size:10px; font-weight:500; letter-spacing:.04em; opacity:.8; }
  .comp-hint { text-align:center; font-size:11px; color:#1E2D3D; letter-spacing:.02em; }
`
document.head.appendChild(style)

document.getElementById('btnTap')!   .addEventListener('click', handleTap)
document.getElementById('btnDouble')!.addEventListener('click', handleDoubleTap)
document.getElementById('btnUp')!    .addEventListener('click', handleScrollUp)
document.getElementById('btnDown')!  .addEventListener('click', handleScrollDown)

// ─── Companion mirror ──────────────────────────────────────────────────────
function mirrorCompanion() {
  const badge   = document.getElementById('screenBadge') as HTMLElement | null
  const dispImg = document.getElementById('displayImg')  as HTMLImageElement | null
  const stepper = document.getElementById('stepper')     as HTMLElement | null
  if (!badge || !dispImg || !stepper) return

  badge.textContent = screen

  // Render full canvas and encode via UPNG for the companion preview
  dispImg.src = toPngUrl(drawCurrentScreen())

  const activeIdx = STEPS.indexOf(screen)
  stepper.innerHTML = STEPS.map((s, i) => {
    const cls = i < activeIdx ? 'step done' : i === activeIdx ? 'step active' : 'step'
    const dot = i < activeIdx ? '✓' : `${i + 1}`
    return `<div class="${cls}"><div class="step-dot">${dot}</div><div class="step-label">${s}</div></div>`
  }).join('')
}

mirrorCompanion()

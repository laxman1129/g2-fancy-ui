// ─── Display geometry ──────────────────────────────────────────────────────
export const DW = 576   // full display width
export const DH = 288   // full display height
export const QW = 288   // quadrant width  (SDK max per image container)
export const QH = 144   // quadrant height (SDK max per image container)

// Four image containers tile the full 576×288 display
export const QUADS = [
  { id: 1, name: 'q_tl', x: 0,  y: 0   },   // top-left
  { id: 2, name: 'q_tr', x: QW, y: 0   },   // top-right
  { id: 3, name: 'q_bl', x: 0,  y: QH  },   // bottom-left
  { id: 4, name: 'q_br', x: QW, y: QH  },   // bottom-right
]

// ─── Typography & palette ──────────────────────────────────────────────────
export const MF = '"JetBrains Mono","SF Mono","Fira Code","Consolas",ui-monospace,monospace'

// Grayscale palette — spread across full 16-level gray range for G2 4-bit display
// After quantization: 0, 1, 2, 3, 5, 7, 9, 11, 13, 15
export const C = {
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
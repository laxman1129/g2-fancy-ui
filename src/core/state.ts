// ─── App state ─────────────────────────────────────────────────────────────
export type Screen = 'HOME' | 'OPTIONS' | 'COMPARISON' | 'REVIEW' | 'PUBLISH' | 'DONE'

export const SCREEN_ORDER: Screen[] = [
  'HOME', 'OPTIONS', 'COMPARISON', 'REVIEW', 'PUBLISH', 'DONE',
]

export const state = {
  screen: 'HOME' as Screen,
  strategyIdx: 0,
  published: false,
  compScroll: 0,
  exScroll: 0,
}
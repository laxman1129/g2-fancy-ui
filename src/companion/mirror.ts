import { state, SCREEN_ORDER } from '../core/state'
import { toPngUrl } from '../core/rendering'
import { fmtDateShort } from '../utils/date'
import { voice } from '../core/voice'
import { COMPANION_STYLES } from './styles'
import { COMPANION_TEMPLATE } from './template'
import type { Engine } from '../app/engine'

// ─── Companion web UI ──────────────────────────────────────────────────────
// Mounts the developer companion: live preview mirror + gesture simulation
// buttons wired to the engine's interaction handlers.
export function mountCompanion(engine: Engine) {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return
  app.innerHTML = COMPANION_TEMPLATE

  const style = document.createElement('style')
  style.textContent = COMPANION_STYLES
  document.head.appendChild(style)

  const compDate = document.getElementById('compDate')
  if (compDate) compDate.textContent = `${fmtDateShort()} ${new Date().getUTCFullYear()}  ·  GOI`

  document.getElementById('btnTap')!   .addEventListener('click', engine.handleTap)
  document.getElementById('btnDouble')!.addEventListener('click', engine.handleDoubleTap)
  document.getElementById('btnUp')!    .addEventListener('click', engine.handleScrollUp)
  document.getElementById('btnDown')!  .addEventListener('click', engine.handleScrollDown)

  mirrorCompanion(engine.drawCurrentScreen)
}

// ─── Companion mirror ──────────────────────────────────────────────────────
export function mirrorCompanion(drawCurrentScreen: () => HTMLCanvasElement) {
  const badge   = document.getElementById('screenBadge') as HTMLElement | null
  const dispImg = document.getElementById('displayImg')  as HTMLImageElement | null
  const stepper = document.getElementById('stepper')     as HTMLElement | null
  const voiceLb = document.getElementById('voiceStatus') as HTMLElement | null
  if (!badge || !dispImg || !stepper) return

  badge.textContent = state.screen

  // Live voice-control status for the developer companion
  if (voiceLb) {
    voiceLb.textContent =
      !voice.enabled ? 'VOICE OFF'
      : voice.supported ? (voice.listening ? 'VOICE ● LISTENING' : 'VOICE ◌ READY')
      : 'VOICE ◌ ACTIVITY ONLY'
  }

  // Render full canvas and encode via UPNG for the companion preview
  dispImg.src = toPngUrl(drawCurrentScreen())

  const activeIdx = SCREEN_ORDER.indexOf(state.screen)
  stepper.innerHTML = SCREEN_ORDER.map((s, i) => {
    const cls = i < activeIdx ? 'step done' : i === activeIdx ? 'step active' : 'step'
    const dot = i < activeIdx ? '✓' : `${i + 1}`
    return `<div class="${cls}"><div class="step-dot">${dot}</div><div class="step-label">${s}</div></div>`
  }).join('')
}
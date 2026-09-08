import { AudioInputSource } from '@evenrealities/even_hub_sdk'
import type { Bridge } from '../app/bridge'
import { state, type Screen } from './state'
import { STRATEGIES } from '../data/strategies'
import { C, MF } from './constants'
import type { DrawingContext } from './drawing-context'

// ─── Voice navigation ──────────────────────────────────────────────────────
// Maps spoken keywords to semantic navigation actions. The G2 SDK only streams
// raw 16 kHz PCM (no built-in speech-to-text), so keyword recognition is done
// here via the Web Speech API where it is available (browser / phone), while
// the raw glasses PCM stream drives the live "listening" voice-activity meter
// shown on screen. Gesture navigation is untouched — voice is additive.
export type VoiceAction =
  | { kind: 'tap' }
  | { kind: 'doubleTap' }
  | { kind: 'scrollUp' }
  | { kind: 'scrollDown' }
  | { kind: 'goto'; screen: Screen }
  | { kind: 'selectStrategy'; index: number }
  | { kind: 'publish' }

export interface VoiceState {
  enabled: boolean
  supported: boolean   // is speech recognition available in this environment
  listening: boolean   // voice activity detected in the glasses mic stream
  level: number        // 0..15 averaged mic level for the on-screen meter
  lastWord: string     // last recognized transcript (for on-screen feedback)
  lastAction: string   // last dispatched action label (for on-screen feedback)
  since: number        // timestamp of last feedback, for the auto-hide window
}

export const voice = {
  enabled: false,
  supported: false,
  listening: false,
  level: 0,
  lastWord: '',
  lastAction: '',
  since: 0,
} as VoiceState

const FEEDBACK_MS = 2200   // how long recognized feedback stays on screen

// ─── Semantic commands per keyword ─────────────────────────────────────────
interface KeywordRule {
  re: RegExp
  action: VoiceAction
  label: string
}

// Ordered — first match wins. Screen-wide commands are checked regardless of
// the current screen; context-sensitive ones (strategy selection) are gated.
const RULES: KeywordRule[] = [
  // Direct screen jumps
  { re: /\b(home)\b/,                  action: { kind: 'goto', screen: 'HOME' },        label: 'HOME' },
  { re: /\b(options|strategies|strategy list)\b/, action: { kind: 'goto', screen: 'OPTIONS' }, label: 'OPTIONS' },
  { re: /\b(comparison|flights)\b/,    action: { kind: 'goto', screen: 'COMPARISON' },  label: 'COMPARISON' },
  { re: /\b(review)\b/,                action: { kind: 'goto', screen: 'REVIEW' },      label: 'REVIEW' },
  { re: /\b(publish)\b/,               action: { kind: 'goto', screen: 'PUBLISH' },     label: 'PUBLISH' },

  // Run optimizer from home → options
  { re: /\b(run optimizer|run|start)\b/, action: { kind: 'goto', screen: 'OPTIONS' },   label: 'RUN' },

  // Navigation primitives (context handled in engine dispatch).
  // Spoken keyword → gesture mapping:
  //   ok → tap · back → double-tap · next → scroll up · previous → scroll down
  { re: /\b(ok|okay|confirm|continue)\b/,          action: { kind: 'tap' },        label: 'OK' },
  { re: /\b(back|return|exit|cancel|go back)\b/,   action: { kind: 'doubleTap' },  label: 'BACK' },
  { re: /\b(next|forward|up|scroll up)\b/,         action: { kind: 'scrollUp' },   label: 'NEXT' },
  { re: /\b(previous|down|scroll down)\b/,         action: { kind: 'scrollDown' }, label: 'PREVIOUS' },

  // Strategy selection (OPTIONS screen)
  { re: /\b(strategy a|option a|a)\b/,     action: { kind: 'selectStrategy', index: 0 }, label: 'STRATEGY A' },
  { re: /\b(strategy b|option b|b)\b/,     action: { kind: 'selectStrategy', index: 1 }, label: 'STRATEGY B' },
  { re: /\b(strategy c|option c|c)\b/,     action: { kind: 'selectStrategy', index: 2 }, label: 'STRATEGY C' },
  { re: /\b(strategy d|option d|d)\b/,     action: { kind: 'selectStrategy', index: 3 }, label: 'STRATEGY D' },
  { re: /\b(aggressive)\b/,                action: { kind: 'selectStrategy', index: 0 }, label: 'STRATEGY A' },
  { re: /\b(balanced)\b/,                  action: { kind: 'selectStrategy', index: 1 }, label: 'STRATEGY B' },
  { re: /\b(pax first|pax)\b/,             action: { kind: 'selectStrategy', index: 2 }, label: 'STRATEGY C' },
  { re: /\b(cost|cost minimized|minimised)\b/, action: { kind: 'selectStrategy', index: 3 }, label: 'STRATEGY D' },

  // Publish confirmation
  { re: /\b(confirm|publish now|send)\b/,  action: { kind: 'publish' }, label: 'PUBLISH' },
]

export function matchKeyword(text: string): { action: VoiceAction; label: string } | null {
  const t = text.toLowerCase().replace(/[^\w\s]/g, ' ')
  for (const r of RULES) {
    if (r.re.test(t)) return { action: r.action, label: r.label }
  }
  return null
}

// ─── Speech recognition (Web Speech API) ───────────────────────────────────
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

// ─── Initialise voice control ──────────────────────────────────────────────
// `dispatch(action)` is called by the engine for every recognized command.
// Voice is optional — create the controller at boot but do NOT start it; the
// user enables it via long-press (or the companion toggle / 'v' key).
export interface VoiceController {
  start(): void
  stop(): void
  toggle(): void
}

export function createVoice(
  bridge: Bridge,
  dispatch: (action: VoiceAction) => void,
): VoiceController {
  let recognition: SpeechRecognitionLike | null = null
  let unsubMicro: () => void = () => {}
  let running = false

  function start() {
    if (running) return
    running = true
    voice.enabled = true

    // Open the G2 glasses mic. This streams raw PCM which we use to drive the
    // live listening meter; speech recognition (where available) uses the phone.
    bridge.audioControl(true, AudioInputSource.Glasses)
      .then(ok => { if (!ok) console.warn('audioControl(glasses) failed') })
      .catch(e => console.warn('audioControl error', e))

    unsubMicro = bridge.onEvenHubEvent(event => {
      const audio = event.audioEvent
      if (!audio || !audio.audioPcm) return
      driveLevel(audio.audioPcm)
    })

    // Web Speech API recognizer for keyword recognition (continuous loop).
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      voice.supported = true
      const rec: SpeechRecognitionLike = new SR()
      rec.lang = 'en-US'
      rec.continuous = true
      rec.interimResults = false
      rec.maxAlternatives = 1

      rec.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]
          if (res.isFinal) {
            const transcript = res[0].transcript
            voice.lastWord = transcript.trim()
            const m = matchKeyword(transcript)
            if (m) {
              voice.lastAction = m.label
              voice.since = Date.now()
              dispatch(m.action)
            }
          }
        }
      }
      rec.onerror = (e: any) => {
        // 'aborted' from restart is expected; other errors just get retried.
        if (e && e.error && e.error !== 'aborted' && e.error !== 'no-speech') {
          console.warn('voice recognition error:', e.error)
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            stop()    // permission denied — don't retry in a loop
          }
        }
      }
      rec.onend = () => { if (voice.enabled) { try { rec.start() } catch {} } }

      recognition = rec
      try { rec.start() } catch {}
    } else {
      voice.supported = false   // still listen for the level meter only
    }
  }

  function stop() {
    if (!running) return
    running = false
    voice.enabled = false
    voice.supported = false
    voice.listening = false
    voice.level = 0
    voice.lastWord = ''
    voice.lastAction = ''
    voice.since = 0
    if (recognition) { try { recognition.stop() } catch {} }
    recognition = null
    unsubMicro()
    bridge.audioControl(false).catch(() => {})
  }

  return {
    start,
    stop,
    toggle() { running ? stop() : start() },
  }
}

// ─── Context-aware action validation (used by the engine) ──────────────────
export function isStrategySelectRelevant(index: number): boolean {
  return state.screen === 'OPTIONS' && index >= 0 && index < STRATEGIES.length
}

// ─── Voice-activity meter from the raw glasses PCM stream ──────────────────
function driveLevel(pcm: Uint8Array) {
  // 16 kHz 16-bit little-endian mono. Compute a running average of |sample|.
  const n = Math.min(pcm.length, 640)     // ~20ms window
  let acc = 0
  for (let i = 1; i < n; i += 2) {
    const low  = pcm[i - 1]
    const high = pcm[i]
    const raw  = (high << 8) | low
    const s16  = raw >= 0x8000 ? raw - 0x10000 : raw
    acc += Math.abs(s16)
  }
  const avg = n > 0 ? acc / (n / 2) : 0

  // Sensitivity-normalised to 0..15; a low threshold means "someone is talking".
  const level = Math.min(15, Math.round(avg / 320))
  voice.level = level
  voice.listening = level >= 3
}

// The recognized-keyword feedback overlay should currently be visible.
export function voiceFeedbackActive(): boolean {
  return !!voice.lastAction && (Date.now() - voice.since) < FEEDBACK_MS
}

// ─── On-screen voice status chip (drawn on top of every screen) ────────────
// A compact, right-aligned indicator so the wearer always knows the mic state
// and gets brief feedback showing the keyword that was just recognized.
// Rendered only while voice is enabled — no indicator when it is off.
export function drawVoiceOverlay(ctx: CanvasRenderingContext2D, d: DrawingContext = { w: 576, h: 288, c: C }) {
  if (!voice.enabled) return   // disabled → invisible indicator

  const W = d.w
  const c = d.c
  const M = 6           // right/top margin

  ctx.save()
  ctx.textBaseline = 'middle'

  // Compact status chip
  const chipW = 64
  const chipH = 16
  const cx = W - M - chipW
  const cy = M

  ctx.strokeStyle = voice.enabled ? c.sub : c.border
  ctx.lineWidth = 1
  ctx.strokeRect(cx + 0.5, cy + 0.5, chipW - 1, chipH - 1)
  ctx.fillStyle = c.bg1
  ctx.fillRect(cx, cy, chipW, chipH)

  // Mic glyph
  ctx.fillStyle = voice.listening ? c.bright : voice.enabled ? c.sub : c.mid
  ctx.font = `bold 8px ${MF}`
  ctx.letterSpacing = '0'
  ctx.textAlign = 'left'
  ctx.fillText('◉', cx + 4, cy + 6)

  // Status word
  ctx.fillStyle = voice.listening ? c.bright : voice.enabled ? c.text : c.mid
  ctx.font = `bold 7px ${MF}`
  ctx.letterSpacing = '0.08em'
  ctx.textAlign = 'left'
  ctx.fillText(
    !voice.enabled ? 'OFF' : voice.listening ? 'LISTEN' : 'VOICE',
    cx + 11, cy + 6,
  )

  // 5-step level meter along the chip bottom
  const bars = 5
  const lit = Math.round((voice.level / 15) * bars)
  const bw = 6, bh = 2, gap = 2
  for (let i = 0; i < bars; i++) {
    const bx = cx + 4 + i * (bw + gap)
    const by = cy + chipH - 7
    ctx.fillStyle = i < lit ? (voice.listening ? c.bright : c.sub) : c.bg3
    ctx.fillRect(bx, by, bw, bh)
  }

  // Recognized-keyword feedback line (brief, auto-hides)
  if (voiceFeedbackActive()) {
    const word = (voice.lastWord || '').trim().slice(0, 26)
    const line = word ? `"${word}"` : ''
    const label = voice.lastAction ? `→ ${voice.lastAction}` : ''
    const text = line ? `${line}  ${label}` : label

    ctx.font = `9px ${MF}`
    ctx.letterSpacing = '0.04em'
    ctx.textAlign = 'right'
    ctx.fillStyle = c.bright
    ctx.fillText(text, W - M, cy + chipH + 11)
  }

  ctx.restore()
}

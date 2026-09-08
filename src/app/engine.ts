import {
  ImageRawDataUpdate,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'
import { DW, DH, QW, QH, QUADS } from '../core/constants'
import { state } from '../core/state'
import { toGray4 } from '../core/rendering'
import { STRATEGIES } from '../data/strategies'
import { DRAWERS, comparisonMaxScroll, reviewMaxScroll } from '../screens'
import { mirrorCompanion } from '../companion/mirror'
import { createVoice, drawVoiceOverlay, isStrategySelectRelevant, type VoiceAction, type VoiceController } from '../core/voice'
import type { Bridge } from './bridge'

export interface Engine {
  render(): Promise<void>
  drawCurrentScreen(): HTMLCanvasElement
  handleTap(): void
  handleDoubleTap(): void
  handleScrollUp(): void
  handleScrollDown(): void
  toggleVoice(): void
}

export function createEngine(bridge: Bridge): Engine {
  // ─── Canvas helpers ──────────────────────────────────────────────────────
  function makeCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas')
    c.width = DW; c.height = DH
    return c
  }

  function drawCurrentScreen(): HTMLCanvasElement {
    const c = makeCanvas()
    const ctx = c.getContext('2d')!
    DRAWERS[state.screen](ctx)
    drawVoiceOverlay(ctx)
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

  // ─── Rendering ───────────────────────────────────────────────────────────
  let rendering: Promise<unknown> = Promise.resolve()

  async function render(): Promise<void> {
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
    mirrorCompanion(drawCurrentScreen)
  }

  // ─── Interaction handlers ────────────────────────────────────────────────
  function handleTap() {
    switch (state.screen) {
      case 'HOME':       state.screen = 'OPTIONS';    state.strategyIdx = 0; break
      case 'OPTIONS':    state.screen = 'COMPARISON'; state.compScroll = 0; break
      case 'COMPARISON': state.screen = 'REVIEW';     state.exScroll = 0; break
      case 'REVIEW':     state.screen = 'PUBLISH';    break
      case 'PUBLISH':    if (!state.published) { state.published = true; state.screen = 'DONE' } break
      case 'DONE': break
    }
    render().catch(console.error)
  }

  function handleDoubleTap() {
    switch (state.screen) {
      case 'HOME':
        bridge.shutDownPageContainer(1)
        cleanup()
        return
      case 'OPTIONS':    state.screen = 'HOME';       break
      case 'COMPARISON': state.screen = 'OPTIONS';    break
      case 'REVIEW':     state.screen = 'COMPARISON'; break
      case 'PUBLISH':    state.screen = 'REVIEW';     break
      case 'DONE':       state.screen = 'HOME'; state.published = false; break
    }
    render().catch(console.error)
  }

  function handleScrollUp() {
    if (state.screen === 'OPTIONS' && state.strategyIdx > 0) {
      state.strategyIdx--
      render().catch(console.error)
    } else if (state.screen === 'COMPARISON' && state.compScroll > 0) {
      state.compScroll = Math.max(0, state.compScroll - 46)
      render().catch(console.error)
    } else if (state.screen === 'REVIEW' && state.exScroll > 0) {
      state.exScroll = Math.max(0, state.exScroll - 93)
      render().catch(console.error)
    }
  }

  function handleScrollDown() {
    if (state.screen === 'OPTIONS' && state.strategyIdx < STRATEGIES.length - 1) {
      state.strategyIdx++
      render().catch(console.error)
    } else if (state.screen === 'COMPARISON') {
      const maxOffset = comparisonMaxScroll()
      if (state.compScroll < maxOffset) {
        state.compScroll = Math.min(maxOffset, state.compScroll + 46)
        render().catch(console.error)
      }
    } else if (state.screen === 'REVIEW') {
      const maxOffset = reviewMaxScroll()
      if (state.exScroll < maxOffset) {
        state.exScroll = Math.min(maxOffset, state.exScroll + 93)
        render().catch(console.error)
      }
    }
  }

  // ─── Voice navigation ─────────────────────────────────────────────────────
  // Spoken keywords dispatch to the same navigation handlers as the ring —
  // gesture input is completely untouched; voice is purely additive.
  function dispatchVoice(action: VoiceAction) {
    switch (action.kind) {
      case 'tap':
        handleTap()
        break
      case 'doubleTap':
        handleDoubleTap()
        break
      case 'scrollUp':
        handleScrollUp()
        break
      case 'scrollDown':
        handleScrollDown()
        break
      case 'publish':
        if (state.screen === 'PUBLISH') handleTap()
        else if (state.screen === 'REVIEW') { state.screen = 'PUBLISH'; render().catch(console.error) }
        break
      case 'selectStrategy':
        if (isStrategySelectRelevant(action.index)) {
          state.strategyIdx = action.index
          render().catch(console.error)
        }
        break
      case 'goto':
        state.screen = action.screen
        if (action.screen === 'OPTIONS') state.strategyIdx = 0
        if (action.screen === 'COMPARISON') state.compScroll = 0
        if (action.screen === 'REVIEW') state.exScroll = 0
        render().catch(console.error)
        break
    }
  }

  // ─── Lifecycle: device events ────────────────────────────────────────────
  let cleanedUp = false

  // Voice is optional and disabled by default. The controller is created once
  // at boot (so the mic can be started later) but not started; the user opts
  // in via a long-press on the ring (or the companion toggle / 'v' key).
  const voiceCtrl: VoiceController = createVoice(bridge, dispatchVoice)
  let stopVoice: () => void = () => {}

  function toggleVoice() {
    voiceCtrl.toggle()
    render().catch(console.error)
  }

  function cleanup() {
    if (cleanedUp) return
    cleanedUp = true
    unsubscribe()
    stopVoice()
  }

  function eventTypeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
    if (!envelope) return null
    return envelope.eventType ?? OsEventTypeList.CLICK_EVENT
  }

  const unsubscribe = bridge.onEvenHubEvent(event => {
    const sysType  = eventTypeOf(event.sysEvent)
    const textType = eventTypeOf(event.textEvent)

    // Long press toggles voice control on/off.
    if (
      sysType  === OsEventTypeList.LONG_PRESS_EVENT ||
      textType === OsEventTypeList.LONG_PRESS_EVENT
    ) { toggleVoice(); return }

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

  stopVoice = voiceCtrl.stop

  return { render, drawCurrentScreen, handleTap, handleDoubleTap, handleScrollUp, handleScrollDown, toggleVoice }
}
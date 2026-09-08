import { drawHome } from './home'
import { drawOptions } from './options'
import { drawComparison } from './comparison'
import { drawReview } from './review'
import { drawPublish } from './publish'
import { drawDone } from './done'
import type { Screen } from '../core/state'
import type { DrawingContext } from '../core/drawing-context'

// Screen name → drawing function, used by the render engine.
export const DRAWERS: Record<Screen, (ctx: CanvasRenderingContext2D, d?: DrawingContext) => void> = {
  HOME:       drawHome,
  OPTIONS:    drawOptions,
  COMPARISON: drawComparison,
  REVIEW:     drawReview,
  PUBLISH:    drawPublish,
  DONE:       drawDone,
}

export { comparisonMaxScroll } from './comparison'
export { reviewMaxScroll } from './review'
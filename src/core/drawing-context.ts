import type { C } from './constants'

// Everything a screen needs to draw itself.  Keeps the per-screen drawing
// functions free of global imports so they are self-contained and testable.
export interface DrawingContext {
  w: number
  h: number
  c: typeof C
}
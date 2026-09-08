import UPNG from 'upng-js'

// Canvas → packed gray4 number[]
// G2 expects two 4-bit luma nibbles per byte: byte = (g0 << 4) | g1
// Floyd–Steinberg error diffusion preserves sub-level detail lost by direct
// quantization, smoothing anti-aliased text edges and eliminating banding on
// the 16-level gray display.
export function toGray4(canvas: HTMLCanvasElement): number[] {
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
export function toPngUrl(canvas: HTMLCanvasElement): string {
  const ctx  = canvas.getContext('2d')!
  const img  = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const buf  = UPNG.encode([img.data.buffer], canvas.width, canvas.height, 0)
  const u8   = new Uint8Array(buf)
  let b64 = ''
  for (let i = 0; i < u8.length; i++) b64 += String.fromCharCode(u8[i])
  return `data:image/png;base64,${btoa(b64)}`
}
declare module 'upng-js' {
  const UPNG: {
    encode(bufs: ArrayBuffer[], w: number, h: number, cnum: number): ArrayBuffer
    decode(buf: ArrayBuffer): { width: number; height: number; depth: number; ctype: number; tabs: Record<string, unknown>; frames: { x: number; y: number; width: number; height: number; delay: number; dispose: number; blend: number }[]; data: Uint8Array }
    toRGBA8(out: ReturnType<typeof UPNG.decode>): Uint8Array[]
  }
  export default UPNG
}

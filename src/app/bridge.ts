import {
  waitForEvenAppBridge,
  TextContainerProperty,
  ImageContainerProperty,
  CreateStartUpPageContainer,
} from '@evenrealities/even_hub_sdk'
import { DW, DH, QW, QH, QUADS } from '../core/constants'

export type Bridge = Awaited<ReturnType<typeof waitForEvenAppBridge>>

// ─── Event capture ─────────────────────────────────────────────────────────
// The G2 firmware allows only ONE event-capturing container per page, so a
// single full-screen invisible text container receives every ring gesture.
// A tap therefore performs the current screen's primary action (i.e. the
// drawn CTA button), which is the highest-fidelity "button" available here.
const C_GESTURE = 9

// ─── Bridge setup ──────────────────────────────────────────────────────────
export async function setupBridge(): Promise<Bridge> {
  const bridge = await waitForEvenAppBridge()

  // All four image containers created once at startup; thereafter only pixel data is pushed
  const imageContainers = QUADS.map(q => new ImageContainerProperty({
    xPosition: q.x, yPosition: q.y, width: QW, height: QH,
    containerID: q.id, containerName: q.name,
  }))

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

  return bridge
}
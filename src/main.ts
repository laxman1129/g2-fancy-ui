import { setupBridge } from './app/bridge'
import { createEngine } from './app/engine'
import { mountCompanion } from './companion/mirror'

// ─── Boot ──────────────────────────────────────────────────────────────────
const bridge = await setupBridge()
const engine = createEngine(bridge)

await engine.render()
mountCompanion(engine)
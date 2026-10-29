import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Checkbox } from '@shared'
import FlowMap from './FlowMap'

const PROTOTYPE_URL = './prototype/index.html'
const DEVICE_WIDTH = 390
const DEVICE_HEIGHT = 844
const MIN_SCALE = 0.4

/* Left: logic map (copy of the Miro board). Right: the prototype. Clicking a
   yellow node on the map shows that screen in the prototype. */
export default function App() {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<{ node: string; screen: string } | null>(null)
  const [scale, setScale] = useState(1)
  const [highRisk, setHighRisk] = useState(false)
  const [darkMap, setDarkMap] = useState(() => localStorage.getItem('signup-map-theme') === 'dark')

  const post = useCallback((screen: string) => {
    frameRef.current?.contentWindow?.postMessage(
      { type: 'goto-screen', screen },
      window.location.origin,
    )
  }, [])

  const postFlags = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: 'set-flags', highRisk },
      window.location.origin,
    )
  }, [highRisk])

  const postSelected = useCallback(() => {
    if (selected) post(selected.screen)
  }, [post, selected])

  useEffect(postSelected, [postSelected])
  useEffect(postFlags, [postFlags])

  useLayoutEffect(() => {
    const el = slotRef.current
    if (!el) return
    const fit = () => {
      const r = el.getBoundingClientRect()
      const s = Math.min(1, Math.max(MIN_SCALE, Math.min(r.height / DEVICE_HEIGHT, r.width / DEVICE_WIDTH)))
      setScale(s)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Sign up and login flows - 2026 revamp</h1>
      </header>

      <section className="page__map" aria-label="Logic map" data-theme={darkMap ? 'dark' : 'light'}>
        <button
          type="button"
          role="switch"
          aria-checked={darkMap}
          className="map-toggle"
          onClick={() => {
            const next = !darkMap
            setDarkMap(next)
            localStorage.setItem('signup-map-theme', next ? 'dark' : 'light')
          }}
        >
          <span className="map-toggle__track" aria-hidden="true" />
          Dark mode
        </button>
        <FlowMap
          selected={selected?.node ?? null}
          onSelectScreen={(node, screen) => setSelected({ node, screen })}
        />
        <p className="page__hint">Click a yellow screen to see it in the prototype; other nodes only center the map. Drag or scroll to pan, pinch to zoom, arrow keys to move between nodes.</p>
      </section>

      <section className="page__proto" aria-label="Prototype">
        <div className="page__controls">
          <Checkbox
            label="High-risk user"
            checked={highRisk}
            onChange={(event) => setHighRisk(event.target.checked)}
          />
        </div>
        <div ref={slotRef} className="device-slot">
          <div
            className="device-box"
            style={{ width: DEVICE_WIDTH * scale, height: DEVICE_HEIGHT * scale }}
          >
            <div
              className="device"
              style={{ width: DEVICE_WIDTH, height: DEVICE_HEIGHT, transform: `scale(${scale})` }}
            >
              <iframe
                ref={frameRef}
                className="device__screen"
                title="Signup / login prototype"
                src={PROTOTYPE_URL}
                onLoad={() => {
                  postSelected()
                  postFlags()
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

const PROTOTYPE_URL = `${import.meta.env.BASE_URL}prototype/index.html`
const DEVICE_WIDTH = 390
const DEVICE_HEIGHT = 844
const PAGE_BOTTOM_PADDING = 32
const PAGE_SIDE_PADDING = 16
const MIN_SCALE = 0.3

type AiLabelState = {
  total: number
  index: number
  screen: string | null
  name: string | null
}

export default function App() {
  const [highlightAi, setHighlightAi] = useState(false)
  const [referenceImage, setReferenceImage] = useState(false)
  const [aiLabel, setAiLabel] = useState<AiLabelState>({
    total: 0,
    index: -1,
    screen: null,
    name: null,
  })
  const frameRef = useRef<HTMLIFrameElement>(null)
  const sideRef = useRef<HTMLElement>(null)
  const slotRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  /* Fit the device into the viewport height: scale it down, never up. */
  useLayoutEffect(() => {
    const update = () => {
      const slot = slotRef.current
      if (!slot) return
      const availableHeight =
        window.innerHeight -
        slot.getBoundingClientRect().top -
        PAGE_BOTTOM_PADDING
      const availableWidth = window.innerWidth - PAGE_SIDE_PADDING * 2
      const fit = Math.min(
        availableHeight / DEVICE_HEIGHT,
        availableWidth / DEVICE_WIDTH,
      )
      setScale(Math.min(1, Math.max(MIN_SCALE, fit)))
    }
    update()
    window.addEventListener('resize', update)
    const observer = new ResizeObserver(update)
    if (sideRef.current) observer.observe(sideRef.current)
    return () => {
      window.removeEventListener('resize', update)
      observer.disconnect()
    }
  }, [])

  const post = useCallback((message: Record<string, unknown>) => {
    frameRef.current?.contentWindow?.postMessage(
      message,
      window.location.origin,
    )
  }, [])

  useEffect(() => {
    post({ type: 'highlight-ai', value: highlightAi })
  }, [highlightAi, post])

  useEffect(() => {
    post({ type: 'reference-image', value: referenceImage })
  }, [referenceImage, post])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== frameRef.current?.contentWindow ||
        event.data?.type !== 'ai-labels'
      ) {
        return
      }
      const { total, index, screen, name } = event.data
      setAiLabel({ total, index, screen, name })
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const step = (direction: 1 | -1) => {
    if (aiLabel.total === 0) return
    const from =
      aiLabel.index < 0 && direction === -1 ? aiLabel.total : aiLabel.index
    post({ type: 'focus-ai-label', index: from + direction })
  }

  return (
    <main className="page">
      <aside className="page__side" ref={sideRef}>
        <header className="page__header">
          <h1 className="page__title">AI labels touchpoints</h1>
        </header>
        <label className="page__toggle">
          <input
            type="checkbox"
            checked={highlightAi}
            onChange={(event) => {
              setHighlightAi(event.target.checked)
              if (event.target.checked) {
                post({ type: 'focus-ai-label', index: 0 })
              }
            }}
          />
          Highlight AI labels
        </label>
        <label className="page__toggle">
          <input
            type="checkbox"
            checked={referenceImage}
            onChange={(event) => setReferenceImage(event.target.checked)}
          />
          Reference image
        </label>
        {highlightAi && (
          <>
            <div className="label-nav" role="group" aria-label="AI labels">
              <button
                type="button"
                className="label-nav__btn"
                aria-label="Previous AI label"
                disabled={aiLabel.total === 0}
                onClick={() => step(-1)}
              >
                &larr;
              </button>
              <span className="label-nav__count" aria-live="polite">
                {aiLabel.index + 1 > 0 ? aiLabel.index + 1 : '–'} /{' '}
                {aiLabel.total}
              </span>
              <button
                type="button"
                className="label-nav__btn"
                aria-label="Next AI label"
                disabled={aiLabel.total === 0}
                onClick={() => step(1)}
              >
                &rarr;
              </button>
            </div>
            {aiLabel.name && (
              <p className="label-nav__name">
                {aiLabel.name}
                <span>{aiLabel.screen}</span>
              </p>
            )}
          </>
        )}
      </aside>
      <div
        className="device-slot"
        ref={slotRef}
        style={{ width: DEVICE_WIDTH * scale, height: DEVICE_HEIGHT * scale }}
      >
        <div className="device" style={{ transform: `scale(${scale})` }}>
          <iframe
            ref={frameRef}
            className="device__screen"
            src={PROTOTYPE_URL}
            title="Store flow prototype"
            onLoad={() => {
              post({ type: 'highlight-ai', value: highlightAi })
              post({ type: 'reference-image', value: referenceImage })
              post({ type: 'ai-labels-query' })
            }}
          />
        </div>
      </div>
    </main>
  )
}

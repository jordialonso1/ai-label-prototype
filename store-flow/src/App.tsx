import { useEffect, useRef, useState } from 'react'

const PROTOTYPE_URL = `${import.meta.env.BASE_URL}prototype/index.html`

export default function App() {
  const [highlightAi, setHighlightAi] = useState(false)
  const frameRef = useRef<HTMLIFrameElement>(null)

  const sendHighlight = (value: boolean) => {
    frameRef.current?.contentWindow?.postMessage(
      { type: 'highlight-ai', value },
      window.location.origin,
    )
  }

  useEffect(() => {
    sendHighlight(highlightAi)
  }, [highlightAi])

  return (
    <main className="page">
      <aside className="page__side">
        <header className="page__header">
          <h1 className="page__title">Store flow prototype</h1>
          <p className="page__subtitle">
            Store wall &rarr; Store view &rarr; Product view
          </p>
        </header>
        <label className="page__toggle">
          <input
            type="checkbox"
            checked={highlightAi}
            onChange={(event) => setHighlightAi(event.target.checked)}
          />
          Highlight AI labels
        </label>
      </aside>
      <div className="device">
        <iframe
          ref={frameRef}
          className="device__screen"
          src={PROTOTYPE_URL}
          title="Store flow prototype"
          onLoad={() => sendHighlight(highlightAi)}
        />
      </div>
    </main>
  )
}

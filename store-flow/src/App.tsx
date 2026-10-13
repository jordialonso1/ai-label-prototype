const PROTOTYPE_URL = `${import.meta.env.BASE_URL}prototype/index.html`

export default function App() {
  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">Store flow prototype</h1>
        <p className="page__subtitle">
          Store wall &rarr; Store view &rarr; Product view
        </p>
      </header>
      <div className="device">
        <iframe
          className="device__screen"
          src={PROTOTYPE_URL}
          title="Store flow prototype"
        />
      </div>
    </main>
  )
}

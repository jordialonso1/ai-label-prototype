import { useState } from 'react'
import { Button } from '@shared'

/* Placeholder screen: proves the shared design system resolves from here. */
export default function App() {
  const [clicks, setClicks] = useState(0)

  return (
    <main className="screen">
      <h1>Signup / login flow</h1>
      <p>
        Placeholder screen. The button below comes from the shared design
        system.
      </p>
      <Button variant="primary" onClick={() => setClicks((n) => n + 1)}>
        Continue ({clicks})
      </Button>
    </main>
  )
}

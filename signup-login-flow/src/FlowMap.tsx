import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EDGES, NODES, type FlowEdge, type FlowNode } from './flow'

/* Board units to map pixels. Wider horizontally so arrows between boxes stay visible. */
const SCALE_X = 4
const SCALE_Y = 3.6
/* Width (board px) of the visible area after clicking a screen, and the
   duration of the animated move. */
const FOCUS_WIDTH = 520
const FOCUS_MS = 380
const MIN_VIEW_WIDTH = 300
const SIZE = {
  screen: { w: 112, h: 58 },
  backend: { w: 104, h: 50 },
  decision: { w: 128, h: 66 },
} as const
const MAX_CHARS = { screen: 19, backend: 18, decision: 17 } as const

interface Placed extends FlowNode {
  px: number
  py: number
  w: number
  h: number
}

function wrap(text: string, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines
}

const placed = new Map<string, Placed>(
  NODES.map((n) => {
    const { w, h } = SIZE[n.kind]
    return [n.id, { ...n, px: n.x * SCALE_X, py: n.y * SCALE_Y, w, h }]
  }),
)

const bounds = (() => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of placed.values()) {
    minX = Math.min(minX, n.px - n.w / 2)
    maxX = Math.max(maxX, n.px + n.w / 2)
    minY = Math.min(minY, n.py - n.h / 2)
    maxY = Math.max(maxY, n.py + n.h / 2)
  }
  const pad = 60
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 }
})()

type Branch = 'yes' | 'no'

/* Edge labels out of decisions start with "Yes" or "No" (e.g. "No, matches account B"). */
function branchOf(label?: string): Branch | null {
  if (!label) return null
  if (/^yes/i.test(label)) return 'yes'
  if (/^no\b/i.test(label)) return 'no'
  return null
}

const ARROWS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
}
/* First node selected when an arrow key is pressed with nothing selected. */
const START_NODE = 'landing'

/* Closest node in the given direction: prefers
   nodes straight ahead over ones far off to the side. */
function nearestInDirection(from: Placed, [dx, dy]: [number, number]): Placed | null {
  let best: Placed | null = null
  let bestScore = Infinity
  for (const n of placed.values()) {
    if (n.id === from.id) continue
    const ax = (n.px - from.px) * dx + (n.py - from.py) * dy // distance ahead
    if (ax <= 4) continue
    const side = Math.abs((n.px - from.px) * dy) + Math.abs((n.py - from.py) * dx)
    const score = ax + side * 2.5
    if (score < bestScore) {
      best = n
      bestScore = score
    }
  }
  return best
}

interface Route {
  d: string
  /** Label center: the middle of the arrow's last stretch, so arrows that
      leave the same node (shared first stretch) never share a label spot. */
  lx: number
  ly: number
}

/* Boxes closer than this horizontally are joined vertically instead (a
   labeled arrow needs a longer run to hold its label). */
const MIN_HORIZONTAL_GAP = 36
const MIN_HORIZONTAL_GAP_LABELED = 60
/* Labeled arrows bend this close to the source so the last stretch is long
   enough to hold the label. */
const LABELED_BEND_OFFSET = 16

function route(from: Placed, to: Placed, edge: FlowEdge): Route {
  const { bendX, exit } = edge
  const labeled = Boolean(edge.label)
  const x1 = from.px + from.w / 2
  const x2 = to.px - to.w / 2
  if (exit === 'bottom') {
    return {
      d: `M${from.px},${from.py + from.h / 2} V${to.py} H${x2}`,
      lx: (from.px + x2) / 2,
      ly: to.py,
    }
  }
  if (bendX === undefined && x2 - x1 < (labeled ? MIN_HORIZONTAL_GAP_LABELED : MIN_HORIZONTAL_GAP)) {
    const down = to.py > from.py
    const y1 = from.py + (down ? from.h / 2 : -from.h / 2)
    const y2 = to.py + (down ? -to.h / 2 : to.h / 2)
    const bendY = labeled ? y1 + (down ? 14 : -14) : (y1 + y2) / 2
    return {
      d: `M${from.px},${y1} V${bendY} H${to.px} V${y2}`,
      lx: to.px,
      ly: (bendY + y2) / 2,
    }
  }
  const mid =
    bendX !== undefined
      ? bendX * SCALE_X
      : labeled
        ? Math.min(x1 + LABELED_BEND_OFFSET, (x1 + x2) / 2)
        : (x1 + x2) / 2
  return {
    d: `M${x1},${from.py} H${mid} V${to.py} H${x2}`,
    lx: (mid + x2) / 2,
    ly: to.py,
  }
}

const LABEL_CHARS = 15
const LABEL_LINE = 11
const LABEL_CHAR_W = 5.3

/* Label in a white box, centered on the middle of the arrow's last stretch. */
function EdgeLabel({ label, r, branch }: { label: string; r: Route; branch?: Branch }) {
  const lines = wrap(label, LABEL_CHARS)
  const w = Math.max(...lines.map((l) => l.length)) * LABEL_CHAR_W + 10
  const h = lines.length * LABEL_LINE + 6
  const cx = r.lx
  const cy = r.ly
  return (
    <g className={`map__edge-label${branch ? ` map__edge-label--${branch}` : ''}`}>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={4} />
      <text textAnchor="middle" x={cx} y={cy - ((lines.length - 1) * LABEL_LINE) / 2 + 3.5}>
        {lines.map((l, i) => (
          <tspan key={i} x={cx} dy={i === 0 ? 0 : LABEL_LINE}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  )
}

interface Props {
  selected: string | null
  onSelectScreen: (nodeId: string, screen: string) => void
}

export default function FlowMap({ selected, onSelectScreen }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h })
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  const viewRef = useRef(view)
  useEffect(() => {
    viewRef.current = view
  }, [view])
  const anim = useRef(0)
  /* Once the user has moved the view, a pane resize must not reset it. */
  const touched = useRef(false)

  /* Smoothly center a node and zoom in to it, keeping the current aspect ratio. */
  const focusNode = useCallback((id: string) => {
    const n = placed.get(id)
    if (!n) return
    touched.current = true
    const from = viewRef.current
    const w = FOCUS_WIDTH
    const h = w * (from.h / from.w)
    const to = { x: n.px - w / 2, y: n.py - h / 2, w, h }
    const start = performance.now()
    cancelAnimationFrame(anim.current)
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FOCUS_MS)
      const e = 1 - Math.pow(1 - t, 3)
      setView({
        x: from.x + (to.x - from.x) * e,
        y: from.y + (to.y - from.y) * e,
        w: from.w + (to.w - from.w) * e,
        h: from.h + (to.h - from.h) * e,
      })
      if (t < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => () => cancelAnimationFrame(anim.current), [])

  const fit = useCallback(() => {
    cancelAnimationFrame(anim.current)
    const el = wrapRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    const k = Math.max(bounds.w / r.width, bounds.h / r.height)
    const w = r.width * k
    const h = r.height * k
    setView({ x: bounds.x - (w - bounds.w) / 2, y: bounds.y - (h - bounds.h) / 2, w, h })
  }, [])

  useEffect(() => {
    fit()
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      if (!touched.current) {
        fit()
        return
      }
      /* Keep the zoom and position; only match the new aspect ratio. */
      const r = el.getBoundingClientRect()
      if (r.width && r.height) setView((v) => ({ ...v, h: (v.w * r.height) / r.width }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit])

  /* Zoom by `factor` (>1 zooms out) keeping the point under (clientX, clientY) fixed. */
  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const el = wrapRef.current
    if (!el) return
    touched.current = true
    cancelAnimationFrame(anim.current)
    const r = el.getBoundingClientRect()
    setView((v) => {
      const nw = Math.min(Math.max(v.w * factor, MIN_VIEW_WIDTH), bounds.w * 3)
      const k = nw / v.w
      const cx = v.x + ((clientX - r.left) / r.width) * v.w
      const cy = v.y + ((clientY - r.top) / r.height) * v.h
      return { x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k, w: nw, h: v.h * k }
    })
  }, [])

  const panBy = useCallback((dxPx: number, dyPx: number) => {
    const el = wrapRef.current
    if (!el) return
    touched.current = true
    cancelAnimationFrame(anim.current)
    const r = el.getBoundingClientRect()
    setView((v) => ({
      ...v,
      x: v.x + (dxPx / r.width) * v.w,
      y: v.y + (dyPx / r.height) * v.h,
    }))
  }, [])

  /* Pinch zooms, two-finger scroll pans. On a trackpad the browser reports a
     pinch as a wheel event with ctrlKey set; Safari reports gesture events.
     Non-passive so the page itself does not zoom or scroll. */
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * 0.01))
      else panBy(e.deltaX, e.deltaY)
    }
    let gestureStartWidth = 0
    const onGestureStart = (e: Event) => {
      e.preventDefault()
      gestureStartWidth = viewRef.current.w
    }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
      const g = e as Event & { scale: number; clientX: number; clientY: number }
      zoomAt(g.clientX, g.clientY, gestureStartWidth / g.scale / viewRef.current.w)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('gesturestart', onGestureStart)
    el.addEventListener('gesturechange', onGestureChange)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('gesturestart', onGestureStart)
      el.removeEventListener('gesturechange', onGestureChange)
    }
  }, [zoomAt, panBy])

  /* Pointer drag pans; two touch pointers pinch. */
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    drag.current = { x: e.clientX, y: e.clientY, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const next = { x: e.clientX, y: e.clientY }
    if (pointers.current.size === 2) {
      const other = [...pointers.current.entries()].find(([id]) => id !== e.pointerId)![1]
      const before = Math.hypot(prev.x - other.x, prev.y - other.y)
      const after = Math.hypot(next.x - other.x, next.y - other.y)
      pointers.current.set(e.pointerId, next)
      if (drag.current) drag.current.moved = true
      if (before > 0 && after > 0) {
        zoomAt((next.x + other.x) / 2, (next.y + other.y) / 2, before / after)
      }
      return
    }
    pointers.current.set(e.pointerId, next)
    const d = drag.current
    if (!d) return
    const dxPx = e.clientX - d.x
    const dyPx = e.clientY - d.y
    if (!d.moved && Math.hypot(dxPx, dyPx) < 4) return
    d.moved = true
    d.x = e.clientX
    d.y = e.clientY
    panBy(-dxPx, -dyPx)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) window.setTimeout(() => (drag.current = null), 0)
  }

  const edges = useMemo(
    () =>
      EDGES.map((e) => {
        const a = placed.get(e.from)
        const b = placed.get(e.to)
        return a && b ? { e, r: route(a, b, e) } : null
      }).filter((x): x is { e: (typeof EDGES)[number]; r: Route } => x !== null),
    [],
  )

  /* Clicking a decision lights the paths after it: "yes" green, "no" red,
     following through backend nodes (signup, login...) until the next screen
     or decision. Purely visual: the prototype is not touched. */
  const [decision, setDecision] = useState<string | null>(null)
  const paths = useMemo(() => {
    const out = new Map<number, Branch>()
    if (!decision) return out
    EDGES.forEach((first, i) => {
      if (first.from !== decision) return
      const branch = branchOf(first.label)
      if (!branch) return
      const seen = new Set<number>([i])
      const queue = [i]
      while (queue.length) {
        const cur = EDGES[queue.shift()!]
        out.set(EDGES.indexOf(cur), branch)
        if (placed.get(cur.to)?.kind !== 'backend') continue
        EDGES.forEach((next, j) => {
          if (next.from === cur.to && !seen.has(j)) {
            seen.add(j)
            queue.push(j)
          }
        })
      }
    })
    return out
  }, [decision])

  /* Selecting a node, by click or keyboard: screens drive the prototype,
     decisions only light their paths. Both center and zoom the view. */
  const [current, setCurrent] = useState<string | null>(null)
  const activate = useCallback(
    (n: Placed) => {
      if (n.kind === 'screen' && n.screen) {
        setDecision(null)
        onSelectScreen(n.id, n.screen)
      } else if (n.kind === 'decision') {
        setDecision(n.id)
      } else {
        /* Backend states only center the view; the prototype is untouched. */
        setDecision(null)
      }
      setCurrent(n.id)
      focusNode(n.id)
    },
    [onSelectScreen, focusNode],
  )

  /* Arrow keys jump to the nearest clickable node in that direction. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = ARROWS[e.key]
      if (!dir || e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return
      e.preventDefault()
      const from = current ? placed.get(current) : undefined
      if (!from) {
        const start = placed.get(START_NODE)
        if (start) activate(start)
        return
      }
      const next = nearestInDirection(from, dir)
      if (next) activate(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, activate])

  const edgesSorted = useMemo(
    () => edges.map((item, i) => ({ ...item, i })).sort((a, b) => Number(paths.has(a.i)) - Number(paths.has(b.i))),
    [edges, paths],
  )

  return (
    <div
      ref={wrapRef}
      className="map"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="map__svg">
        <defs>
          {['arrow', 'arrow-yes', 'arrow-no'].map((id) => (
            <marker
              key={id}
              id={id}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerUnits="userSpaceOnUse"
              markerWidth="10"
              markerHeight="10"
              orient="auto-start-reverse"
            >
              <path
                d="M0,0 L10,5 L0,10 z"
                className={`map__arrow${id === 'arrow' ? '' : ` map__arrow--${id.slice(6)}`}`}
              />
            </marker>
          ))}
        </defs>

        {edgesSorted.map(({ e, r, i }) => {
          const branch = paths.get(i)
          return (
            <g key={i}>
              <path
                d={r.d}
                className={`map__edge${branch ? ` map__edge--${branch}` : ''}`}
                markerEnd={`url(#arrow${branch ? `-${branch}` : ''})`}
              />
              {e.label && <EdgeLabel label={e.label} r={r} branch={branch} />}
            </g>
          )
        })}

        {[...placed.values()].map((n) => (
          <NodeShape
            key={n.id}
            n={n}
            selected={n.kind === 'decision' ? decision === n.id : n.kind === 'backend' ? current === n.id : selected === n.id}
            onSelect={() => {
              if (drag.current?.moved) return
              activate(n)
            }}
          />
        ))}
      </svg>

      <button
        type="button"
        className="map__fit"
        onClick={() => {
          touched.current = false
          fit()
        }}
      >
        Fit
      </button>
    </div>
  )
}

function NodeShape({ n, selected, onSelect }: { n: Placed; selected: boolean; onSelect: () => void }) {
  const lines = wrap(n.label, MAX_CHARS[n.kind])
  const lh = 12
  const text = (
    <text className="map__text" textAnchor="middle" x={n.px} y={n.py - ((lines.length - 1) * lh) / 2 + 4}>
      {lines.map((l, i) => (
        <tspan key={i} x={n.px} dy={i === 0 ? 0 : lh}>
          {l}
        </tspan>
      ))}
    </text>
  )
  const x = n.px - n.w / 2
  const y = n.py - n.h / 2

  if (n.kind === 'decision') {
    const pts = `${n.px},${y} ${x + n.w},${n.py} ${n.px},${y + n.h} ${x},${n.py}`
    return (
      <g
        className={`map__decision-node${selected ? ' is-selected' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Show paths after decision: ${n.label}`}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        <polygon points={pts} className="map__decision" />
        {text}
      </g>
    )
  }
  if (n.kind === 'backend') {
    return (
      <g
        className={`map__backend map__backend--${n.tone ?? 'green'}${selected ? ' is-selected' : ''}`}
        role="button"
        tabIndex={0}
        aria-label={`Center on state: ${n.label}`}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
      >
        <rect x={x} y={y} width={n.w} height={n.h} rx={n.tone === 'green' ? n.h / 2 : 8} />
        {text}
      </g>
    )
  }
  return (
    <g
      className={`map__screen${selected ? ' is-selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Open screen: ${n.label}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <rect x={x} y={y} width={n.w} height={n.h} rx={8} />
      {text}
      {n.code && (
        <text className="map__code" x={x + n.w - 5} y={y + n.h - 4} textAnchor="end">
          {n.code}
        </text>
      )}
    </g>
  )
}

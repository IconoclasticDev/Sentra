import { useEffect, useMemo, useRef, useState } from 'react'
import { EDGES, ENTITIES } from '../data/company'
import type { EntityKind } from '../data/types'

const KIND_COLORS: Record<EntityKind, string> = {
  PERSON: '#2f5f8f',
  PROJECT: '#1f4a73',
  CUSTOMER: '#8a6d3b',
  DECISION: '#6b5b95',
  REPO: '#4c7a4c',
  DOCUMENT: '#8b93a1',
  EVENT: '#b0682c',
  TOPIC: '#5b7a8c',
}

const KIND_SIZES: Record<EntityKind, number> = {
  PERSON: 7, PROJECT: 9, CUSTOMER: 7, DECISION: 7.5, REPO: 5.5, DOCUMENT: 5, EVENT: 5.5, TOPIC: 6,
}

interface SimNode {
  key: string
  x: number
  y: number
  vx: number
  vy: number
  entity: (typeof ENTITIES)[number]
}

interface Transform {
  x: number
  y: number
  k: number
}

interface Props {
  focus?: string
  compact?: boolean
  onSelect?: (key: string) => void
  onExpand?: (key: string) => void
  visibleKinds?: EntityKind[]
  className?: string
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function GraphCanvas({ focus, compact, onSelect, onExpand, visibleKinds, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; key: string } | null>(null)
  const [selected, setSelected] = useState<string | null>(focus ?? null)
  const [zoomLabel, setZoomLabel] = useState(100)

  const simRef = useRef<SimNode[]>([])
  const rafRef = useRef<number>(0)
  const transformRef = useRef<Transform>({ x: 0, y: 0, k: 1 })
  const initRef = useRef(false)
  const heatRef = useRef(1)
  const dragRef = useRef<{ key: string; moved: number } | null>(null)
  const panRef = useRef<{ sx: number; sy: number; tx: number; ty: number; moved: number } | null>(null)
  const tweenRef = useRef<{ t0: number; dur: number; from: Transform; to: Transform } | null>(null)
  const selectedRef = useRef<string | null>(selected)
  selectedRef.current = selected
  const hoverRef = useRef<string | null>(null)

  const graph = useMemo(() => {
    let nodes = ENTITIES
    let edges = EDGES
    if (visibleKinds) nodes = nodes.filter((n) => visibleKinds.includes(n.kind))
    const keys = new Set(nodes.map((n) => n.key))
    if (focus) {
      const oneHop = new Set([focus])
      for (const e of edges) {
        if (e.from === focus) oneHop.add(e.to)
        if (e.to === focus) oneHop.add(e.from)
      }
      const twoHop = new Set(oneHop)
      for (const e of edges) {
        if (oneHop.has(e.from) && keys.has(e.to)) twoHop.add(e.to)
        if (oneHop.has(e.to) && keys.has(e.from)) twoHop.add(e.from)
      }
      const keep = new Set([...twoHop].filter((k) => keys.has(k)))
      nodes = nodes.filter((n) => keep.has(n.key))
      const kept = new Set(nodes.map((n) => n.key))
      edges = edges.filter((e) => kept.has(e.from) && kept.has(e.to))
    }
    return { nodes, edges }
  }, [focus, visibleKinds])

  // Deterministic spiral layout in world space (origin at 0,0)
  useEffect(() => {
    simRef.current = graph.nodes.map((entity, i) => {
      const golden = i * 2.399963
      const r = 26 + 10.5 * Math.sqrt(i)
      return {
        key: entity.key, entity,
        x: r * Math.cos(golden) + (((i * 37) % 11) - 5),
        y: r * Math.sin(golden) + (((i * 53) % 11) - 5),
        vx: 0, vy: 0,
      }
    })
    heatRef.current = 1
    initRef.current = false
  }, [graph])

  // Keep selection in sync when the focus prop changes from outside
  useEffect(() => {
    if (focus) setSelected(focus)
  }, [focus])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const size = { w: 0, h: 0 }

    const resize = () => {
      size.w = wrap.clientWidth
      size.h = wrap.clientHeight
      canvas.width = size.w * dpr
      canvas.height = size.h * dpr
      canvas.style.width = `${size.w}px`
      canvas.style.height = `${size.h}px`
      if (!initRef.current && size.w > 0) {
        transformRef.current = { x: size.w / 2, y: size.h / 2, k: 1 }
        initRef.current = true
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const nodeByKey = () => new Map(simRef.current.map((n) => [n.key, n]))
    const toWorld = (sx: number, sy: number): [number, number] => {
      const t = transformRef.current
      return [(sx - t.x) / t.k, (sy - t.y) / t.k]
    }
    const toScreen = (wx: number, wy: number): [number, number] => {
      const t = transformRef.current
      return [wx * t.k + t.x, wy * t.k + t.y]
    }

    const startTween = (to: Transform, dur = 320) => {
      tweenRef.current = { t0: performance.now(), dur, from: { ...transformRef.current }, to }
    }

    const zoomAround = (factor: number, cx?: number, cy?: number) => {
      const t = transformRef.current
      const px = cx ?? size.w / 2
      const py = cy ?? size.h / 2
      const k2 = Math.min(2.6, Math.max(0.35, t.k * factor))
      const wx = (px - t.x) / t.k
      const wy = (py - t.y) / t.k
      startTween({ x: px - wx * k2, y: py - wy * k2, k: k2 }, 220)
    }

    const fit = (): void => {
      const nodes = simRef.current
      if (!nodes.length) return
      const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const bw = Math.max(120, maxX - minX), bh = Math.max(120, maxY - minY)
      const k = Math.min(1.5, Math.max(0.35, Math.min((size.w - 110) / bw, (size.h - 110) / bh)))
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
      startTween({ x: size.w / 2 - cx * k, y: size.h / 2 - cy * k, k }, 380)
    }

    // ----------------------------- physics -----------------------------
    const step = () => {
      const nodes = simRef.current
      const keys = new Set(nodes.map((n) => n.key))
      const edges = graph.edges.filter((e) => keys.has(e.from) && keys.has(e.to))
      const heat = heatRef.current = Math.max(0.06, heatRef.current * 0.985)
      const byKey = nodeByKey()

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        if (dragRef.current?.key === a.key) { a.vx = 0; a.vy = 0; continue }
        a.vx *= 0.86; a.vy *= 0.86
        a.vx += (0 - a.x) * 0.0032
        a.vy += (0 - a.y) * 0.0038
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          let dx = b.x - a.x, dy = b.y - a.y
          let d2 = dx * dx + dy * dy
          if (d2 < 1) { d2 = 1; dx = Math.random() - 0.5; dy = Math.random() - 0.5 }
          const min = (KIND_SIZES[a.entity.kind] + KIND_SIZES[b.entity.kind]) * 2.6 + 30
          if (d2 < min * min * 9) {
            const d = Math.sqrt(d2)
            const f = ((min * min) / d2) * 0.6
            const fx = (dx / d) * f, fy = (dy / d) * f
            a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy
          }
        }
      }
      for (const e of edges) {
        const a = byKey.get(e.from), b = byKey.get(e.to)
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.max(1, Math.hypot(dx, dy))
        const rest = 92 + (1 - e.weight) * 60
        const f = (d - rest) * 0.014
        const fx = (dx / d) * f, fy = (dy / d) * f
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
      }
      if (focus) {
        const f = byKey.get(focus)
        if (f) { f.vx += (0 - f.x) * 0.06; f.vy += (0 - f.y) * 0.06 }
      }
      const cap = 2 + heat * 6
      for (const n of nodes) {
        if (dragRef.current?.key === n.key) continue
        n.x += Math.max(-cap, Math.min(cap, n.vx))
        n.y += Math.max(-cap, Math.min(cap, n.vy))
      }
    }

    // ------------------------------ draw -------------------------------
    const draw = (now: number) => {
      const nodes = simRef.current
      const t = transformRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size.w, size.h)
      const byKey = nodeByKey()
      const keys = new Set(nodes.map((n) => n.key))
      const edges = graph.edges.filter((e) => keys.has(e.from) && keys.has(e.to))

      const active = selectedRef.current ?? hoverRef.current
      const neighbors = new Set<string>()
      if (active) {
        neighbors.add(active)
        for (const e of edges) {
          if (e.from === active) neighbors.add(e.to)
          if (e.to === active) neighbors.add(e.from)
        }
      }

      // world space: edges + nodes
      ctx.save()
      ctx.translate(t.x, t.y)
      ctx.scale(t.k, t.k)

      const dash = (now / 40) % 24

      for (const e of edges) {
        const a = byKey.get(e.from), b = byKey.get(e.to)
        if (!a || !b) continue
        const isActiveEdge = active && (e.from === active || e.to === active)
        const dim = active ? !isActiveEdge : false
        if (isActiveEdge) {
          ctx.strokeStyle = 'rgba(47,95,143,0.20)'
          ctx.lineWidth = 3.2
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          ctx.strokeStyle = '#2f5f8f'
          ctx.lineWidth = 1.3
          ctx.setLineDash([6, 6])
          ctx.lineDashOffset = -dash
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          ctx.setLineDash([])
        } else {
          ctx.strokeStyle = dim ? 'rgba(148,155,168,0.12)' : 'rgba(107,114,128,0.32)'
          ctx.lineWidth = dim ? 0.7 : 0.7 + e.weight * 0.9
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        }
      }

      for (const n of nodes) {
        const r = KIND_SIZES[n.entity.kind]
        const dim = active ? !neighbors.has(n.key) : false
        const isSel = n.key === selectedRef.current
        const color = KIND_COLORS[n.entity.kind]
        ctx.globalAlpha = dim ? 0.22 : 1
        if (isSel) {
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2)
          ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.lineWidth = 1.5 / t.k; ctx.strokeStyle = '#ffffff'; ctx.stroke()
        ctx.globalAlpha = 1
      }
      ctx.restore()

      // screen space: labels
      for (const n of nodes) {
        const [sx, sy] = toScreen(n.x, n.y)
        if (sx < -80 || sx > size.w + 80 || sy < -40 || sy > size.h + 40) continue
        const dim = active ? !neighbors.has(n.key) : false
        const show = !compact || n.key === selectedRef.current || n.key === hoverRef.current || KIND_SIZES[n.entity.kind] >= 7
        if (!show) continue
        ctx.globalAlpha = dim ? 0.25 : 1
        ctx.fillStyle = '#3f4551'
        ctx.font = `${compact ? 9 : 10}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(n.entity.name, sx, sy + KIND_SIZES[n.entity.kind] * t.k + 12)
        ctx.globalAlpha = 1
      }

      if (!compact) {
        for (const e of edges) {
          const isActiveEdge = active && (e.from === active || e.to === active)
          const dim = active ? !isActiveEdge : false
          if (dim) continue
          const a = byKey.get(e.from), b = byKey.get(e.to)
          if (!a || !b) continue
          const [mx, my] = toScreen((a.x + b.x) / 2, (a.y + b.y) / 2)
          if (mx < 0 || mx > size.w || my < 0 || my > size.h) continue
          ctx.globalAlpha = isActiveEdge ? 0.95 : 0.5
          ctx.fillStyle = isActiveEdge ? '#2f5f8f' : 'rgba(63,69,81,0.55)'
          ctx.font = '8.5px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(e.kind, mx, my - 3)
          ctx.globalAlpha = 1
        }
      }
    }

    const loop = (now: number) => {
      // tween transform
      const tw = tweenRef.current
      if (tw) {
        const p = Math.min(1, (now - tw.t0) / tw.dur)
        const e = easeOutCubic(p)
        transformRef.current = {
          x: tw.from.x + (tw.to.x - tw.from.x) * e,
          y: tw.from.y + (tw.to.y - tw.from.y) * e,
          k: tw.from.k + (tw.to.k - tw.from.k) * e,
        }
        setZoomLabel(Math.round(transformRef.current.k * 100))
        if (p >= 1) tweenRef.current = null
      }
      step()
      draw(now)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    // --------------------------- interaction ---------------------------
    const hitTest = (sx: number, sy: number): SimNode | null => {
      const t = transformRef.current
      for (const n of simRef.current) {
        const [nx, ny] = toScreen(n.x, n.y)
        if (Math.hypot(nx - sx, ny - sy) <= KIND_SIZES[n.entity.kind] * t.k + 5) return n
      }
      return null
    }

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault()
      const rect = canvas.getBoundingClientRect()
      zoomAround(Math.exp(-ev.deltaY * 0.0012), ev.clientX - rect.left, ev.clientY - rect.top)
    }

    const onMouseDown = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = ev.clientX - rect.left, sy = ev.clientY - rect.top
      const hit = hitTest(sx, sy)
      if (hit) {
        dragRef.current = { key: hit.key, moved: 0 }
        heatRef.current = Math.max(heatRef.current, 0.5)
        canvas.style.cursor = 'grabbing'
      } else {
        panRef.current = { sx, sy, tx: transformRef.current.x, ty: transformRef.current.y, moved: 0 }
        canvas.style.cursor = 'grabbing'
      }
    }

    const onMouseMove = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = ev.clientX - rect.left, sy = ev.clientY - rect.top

      if (dragRef.current) {
        const node = nodeByKey().get(dragRef.current.key)
        if (node) {
          const [wx, wy] = toWorld(sx, sy)
          dragRef.current.moved += Math.abs(wx - node.x) + Math.abs(wy - node.y)
          node.x = wx; node.y = wy; node.vx = 0; node.vy = 0
          heatRef.current = 0.4
        }
        return
      }
      if (panRef.current) {
        const p = panRef.current
        p.moved += Math.abs(sx - p.sx) + Math.abs(sy - p.sy)
        transformRef.current = { ...transformRef.current, x: p.tx + (sx - p.sx), y: p.ty + (sy - p.sy) }
        return
      }

      const hit = hitTest(sx, sy)
      hoverRef.current = hit?.key ?? null
      canvas.style.cursor = hit ? 'pointer' : 'grab'
      setTooltip(hit ? { x: sx, y: sy, key: hit.key } : null)
    }

    const onMouseUp = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = ev.clientX - rect.left, sy = ev.clientY - rect.top
      if (dragRef.current) {
        const { key, moved } = dragRef.current
        dragRef.current = null
        heatRef.current = Math.max(heatRef.current, 0.25)
        if (moved < 5) {
          setSelected(key)
          onSelect?.(key)
        }
      } else if (panRef.current) {
        const moved = panRef.current.moved
        panRef.current = null
        if (moved < 4) setSelected(null)
      }
      canvas.style.cursor = hitTest(sx, sy) ? 'pointer' : 'grab'
    }

    const onDblClick = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const hit = hitTest(ev.clientX - rect.left, ev.clientY - rect.top)
      if (hit) {
        setSelected(hit.key)
        onExpand?.(hit.key)
        const t = transformRef.current
        const k = Math.max(t.k, 1.35)
        startTween({ x: size.w / 2 - hit.x * k, y: size.h / 2 - hit.y * k, k }, 420)
      }
    }

    const onLeave = () => {
      hoverRef.current = null
      setTooltip(null)
    }

    void fit
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('dblclick', onDblClick)
    canvas.addEventListener('mouseleave', onLeave)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('dblclick', onDblClick)
      canvas.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [graph, compact, focus, onSelect, onExpand])

  const selectedEntity = graph.nodes.find((n) => n.key === selected)
  const tooltipEntity = tooltip ? graph.nodes.find((n) => n.key === tooltip.key) : null
  const tooltipEdges = tooltipEntity && tooltip ? graph.edges.filter((e) => e.from === tooltip.key || e.to === tooltip.key).length : 0

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className ?? ''}`}>
      <canvas ref={canvasRef} className="h-full w-full" style={{ cursor: 'grab' }} />

      {!compact && tooltipEntity && tooltip && (
        <div
          className="pointer-events-none absolute z-20 w-48 rounded-lg border border-ink-200 bg-white/95 p-2.5 shadow-card backdrop-blur"
          style={{
            left: Math.min(tooltip.x + 14, (wrapRef.current?.clientWidth ?? 300) - 200),
            top: Math.max(6, tooltip.y - 54),
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLORS[tooltipEntity.kind] }} />
            <span className="text-[12px] font-semibold text-ink-950">{tooltipEntity.name}</span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-ink-400">{tooltipEntity.meta}</div>
          <div className="mt-1 text-[9.5px] font-medium text-ink-300">{tooltipEdges} connections · drag to rearrange</div>
        </div>
      )}

      {!compact && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg border border-ink-200 bg-white/95 px-1 py-1 shadow-card backdrop-blur">
          <button
            onClick={() => {
              const ev = new WheelEvent('wheel', { deltaY: -240 })
              canvasRef.current?.dispatchEvent(ev)
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-ink-100"
            title="Zoom in"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <span className="num w-9 text-center text-[10px] font-semibold text-ink-400">{zoomLabel}%</span>
          <button
            onClick={() => {
              const ev = new WheelEvent('wheel', { deltaY: 240 })
              canvasRef.current?.dispatchEvent(ev)
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-ink-100"
            title="Zoom out"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14" /></svg>
          </button>
          <div className="mx-0.5 h-4 w-px bg-ink-200" />
          <button
            onClick={() => {
              const nodes = simRef.current
              if (!nodes.length) return
              const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y)
              const minX = Math.min(...xs), maxX = Math.max(...xs)
              const minY = Math.min(...ys), maxY = Math.max(...ys)
              const bw = Math.max(120, maxX - minX), bh = Math.max(120, maxY - minY)
              const wrap = wrapRef.current
              const w = wrap?.clientWidth ?? 600, h = wrap?.clientHeight ?? 320
              const k = Math.min(1.5, Math.max(0.35, Math.min((w - 110) / bw, (h - 110) / bh)))
              const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
              tweenRef.current = {
                t0: performance.now(), dur: 380,
                from: { ...transformRef.current },
                to: { x: w / 2 - cx * k, y: h / 2 - cy * k, k },
              }
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-ink-500 hover:bg-ink-100"
            title="Fit to view"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>
          </button>
        </div>
      )}

      {!compact && (
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap items-center gap-2 rounded-lg bg-white/85 px-2.5 py-1.5 backdrop-blur">
          {(Object.keys(KIND_COLORS) as EntityKind[]).slice(0, 6).map((k) => (
            <span key={k} className="flex items-center gap-1 text-[9.5px] font-medium text-ink-500">
              <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLORS[k] }} />
              {k.toLowerCase()}
            </span>
          ))}
          <span className="text-[9.5px] text-ink-300">· drag nodes · scroll to zoom · dbl-click to focus</span>
        </div>
      )}

      {selectedEntity && !compact && (
        <div className="absolute right-2 top-2 rounded-lg border border-ink-200 bg-white/95 px-3 py-2 text-[11px] shadow-card backdrop-blur">
          <div className="font-semibold text-ink-900">{selectedEntity.name}</div>
          <div className="text-ink-400">{selectedEntity.meta}</div>
        </div>
      )}
    </div>
  )
}

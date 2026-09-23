import type { ReactNode } from 'react'
import { CATEGORY_COLORS, CLEARANCE_LABELS } from '../data/types'
import type { Category } from '../data/types'

export function Avatar({ name, initials, accent, size = 32 }: { name?: string; initials: string; accent: string; size?: number }) {
  return (
    <div
      title={name}
      className="flex items-center justify-center rounded-full font-semibold text-white shrink-0"
      style={{ width: size, height: size, background: accent, fontSize: size * 0.38 }}
      aria-label={name}
    >
      {initials}
    </div>
  )
}

export function Badge({ children, color, className = '' }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${className}`}
      style={color ? { background: `${color}14`, color, border: `1px solid ${color}30` } : undefined}
    >
      {children}
    </span>
  )
}

const EFFECT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  ALLOW: { bg: '#e7f2e9', text: '#3d6b45', border: '#cde3d1' },
  LIMITED: { bg: '#f4ecd9', text: '#7a5f23', border: '#e8d9b5' },
  DENY: { bg: '#f7e7e7', text: '#8f4c4c', border: '#ecd0d0' },
  FULL: { bg: '#e7f2e9', text: '#3d6b45', border: '#cde3d1' },
  NONE: { bg: '#f7e7e7', text: '#8f4c4c', border: '#ecd0d0' },
}

export function EffectPill({ effect }: { effect: string }) {
  const s = EFFECT_STYLES[effect] ?? EFFECT_STYLES.DENY
  const label = effect === 'FULL' ? 'ALLOW' : effect
  return (
    <span className="rounded px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  )
}

export function CategoryPill({ category }: { category: Category }) {
  const c = CATEGORY_COLORS[category]
  return (
    <Badge color={c}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {category}
    </Badge>
  )
}

export function ConfidenceBar({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.round(value * 100)
  const color = pct >= 85 ? '#3d6b45' : pct >= 65 ? '#8a6d3b' : '#8f4c4c'
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="num text-xs font-semibold" style={{ color }}>{pct}%</span>
    </div>
  )
}

export function SectionHeading({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h3 className="eyebrow">{children}</h3>
      {right}
    </div>
  )
}

export function EmptyState({ title, body, icon = '◌' }: { title: string; body: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 bg-white/60 px-6 py-12 text-center">
      <div className="mb-2 text-2xl text-ink-200">{icon}</div>
      <div className="text-sm font-semibold text-ink-700">{title}</div>
      <div className="mt-1 max-w-sm text-xs leading-relaxed text-ink-400">{body}</div>
    </div>
  )
}

export function timeAgo(ts: string): string {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (Number.isNaN(diff)) return ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtClearance(level: number): string {
  return CLEARANCE_LABELS[level] ?? `L${level}`
}

import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/AppContext'
import { Avatar } from '../lib/ui'
import { fmtClearance } from '../lib/ui'
import { CommandPalette } from './CommandPalette'

export function TopBar() {
  const { user, notifications, markNotificationsRead, demoMode, setDemoMode } = useApp()
  const [bellOpen, setBellOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        setDemoMode(!demoMode)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [demoMode, setDemoMode])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <header className="flex h-13 items-center gap-3 border-b border-ink-200/70 bg-white/80 px-5 backdrop-blur" style={{ height: 52 }}>
      <div className="flex items-center gap-2 text-[12.5px]">
        <span className="text-ink-400">Viewing as</span>
        <Avatar initials={user.initials} accent={user.accent} size={20} name={user.name} />
        <span className="font-semibold text-ink-900">{user.name}</span>
        <span className="text-ink-400">· {user.role} · {fmtClearance(user.clearance)}</span>
      </div>

      <div className="flex-1" />

      <button
        onClick={() => setPaletteOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-1.5 text-[12px] text-ink-400 transition-colors hover:border-ink-300 hover:text-ink-500 md:flex"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" /></svg>
        Search everything
        <kbd className="rounded border border-ink-200 bg-white px-1 py-px text-[10px] font-medium text-ink-400">⌘K</kbd>
      </button>

      <button
        onClick={() => setDemoMode(!demoMode)}
        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-colors ${
          demoMode ? 'bg-ink-950 text-white' : 'border border-ink-200 text-ink-500 hover:text-ink-700'
        }`}
        title="Toggle recommended demo questions"
      >
        DEMO MODE
      </button>

      <div className="relative" ref={bellRef}>
        <button
          onClick={() => { setBellOpen((v) => !v); if (!bellOpen) setTimeout(markNotificationsRead, 1200) }}
          className="relative rounded-lg border border-ink-200 bg-white p-1.5 text-ink-500 transition-colors hover:text-ink-700"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
          </svg>
          {notifications.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
              {notifications.length}
            </span>
          )}
        </button>
        {bellOpen && (
          <div className="absolute right-0 top-11 z-50 w-80 animate-in rounded-xl border border-ink-200 bg-white shadow-pop">
            <div className="border-b border-ink-100 px-4 py-2.5 text-[12px] font-semibold text-ink-900">Notifications</div>
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-[12px] text-ink-400">You’re all caught up.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex gap-2.5 border-b border-ink-50 px-4 py-2.5 last:border-0">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    n.kind === 'conflict' ? 'bg-amber-500' : n.kind === 'security' ? 'bg-red-500' : n.kind === 'sync' ? 'bg-emerald-500' : 'bg-accent'
                  }`} />
                  <div>
                    <div className="text-[12px] font-medium text-ink-900">{n.title}</div>
                    <div className="text-[11px] leading-snug text-ink-400">{n.body}</div>
                  </div>
                  <div className="num ml-auto text-[10px] text-ink-300">{n.ts}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </header>
  )
}

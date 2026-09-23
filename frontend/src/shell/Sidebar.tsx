import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { Avatar, fmtClearance } from '../lib/ui'
import { RoleSwitcher } from './RoleSwitcher'
import { ResetDemoButton } from './ResetDemoButton'

const NAV = [
  { to: '/overview', label: 'Overview', icon: 'M3 12l9-8 9 8M5 10v10h14V10' },
  { to: '/ask', label: 'Ask Brain', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { to: '/memory', label: 'Memory', icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/decisions', label: 'Decisions', icon: 'M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z' },
  { to: '/graph', label: 'Knowledge Graph', icon: 'M12 5a2 2 0 100-4 2 2 0 000 4zM5 21a2 2 0 100-4 2 2 0 000 4zM19 21a2 2 0 100-4 2 2 0 000 4zM12 5v6m0 0l-6 8m6-8l6 8' },
  { to: '/timeline', label: 'Timeline', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/sources', label: 'Sources', icon: 'M4 7c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2zm0 0v10c0 1.1 3.6 2 8 2s8-.9 8-2V7' },
  { to: '/agents', label: 'Agents', icon: 'M12 2a4 4 0 014 4v1h1a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2h1V6a4 4 0 014-4z' },
  { to: '/access', label: 'Access Control', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z' },
  { to: '/audit', label: 'Audit Log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { to: '/system', label: 'System / Privacy', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
]

export function Sidebar() {
  const { user, profile, demoMode } = useApp()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-ink-200/70 bg-white">
      <div className="flex items-center gap-2.5 px-4 pb-2 pt-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.4" />
            <circle cx="8" cy="8" r="2.2" fill="#2f5f8f" />
            <path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" stroke="white" strokeWidth="1.2" />
          </svg>
        </div>
        <div>
          <div className="text-[13.5px] font-semibold leading-tight tracking-tight text-ink-950">Sentra</div>
          <div className="text-[10px] leading-tight text-ink-400">NexaCore Systems</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-px overflow-y-auto px-2 pb-2">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors ${
                isActive ? 'bg-ink-950 text-white font-medium' : 'text-ink-700 hover:bg-ink-100/70'
              }`
            }
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80">
              <path d={n.icon} />
            </svg>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {demoMode && (
        <div className="mx-3 mb-2 rounded-lg bg-accent-soft px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-accent-strong">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
            DEMO MODE
          </div>
          <div className="mt-0.5 text-[10px] leading-snug text-ink-500">Synthetic dataset · simulated connectors</div>
        </div>
      )}

      <div className="relative border-t border-ink-100 p-3">
        {switcherOpen && <RoleSwitcher onClose={() => setSwitcherOpen(false)} />}
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-ink-100/70"
        >
          <Avatar initials={user.initials} accent={user.accent} size={34} name={user.name} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold leading-tight text-ink-900">{user.name}</div>
            <div className="truncate text-[10.5px] leading-tight text-ink-400">{user.role} · {fmtClearance(user.clearance)}</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-400">
            <path d="M8 9l4-4 4 4M8 15l4 4 4-4" strokeLinecap="round" />
          </svg>
        </button>
        <div className="mt-1 px-1.5">
          <ResetDemoButton />
        </div>
        <div className="mt-1 px-1.5 text-[9.5px] leading-snug text-ink-300">
          {profile.summary}
        </div>
      </div>
    </aside>
  )
}

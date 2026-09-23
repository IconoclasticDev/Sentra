import { useEffect, type ReactNode } from 'react'

export function Drawer({ title, sub, onClose, children, width = 460 }: { title: string; sub?: string; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-ink-950/25" onClick={onClose}>
      <div
        className="flex h-full animate-in flex-col border-l border-ink-200 bg-white shadow-pop"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <div className="text-[14px] font-semibold text-ink-950">{title}</div>
            {sub && <div className="mt-0.5 text-[11.5px] text-ink-400">{sub}</div>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

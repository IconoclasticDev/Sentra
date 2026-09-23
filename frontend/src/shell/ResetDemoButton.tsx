import { useState } from 'react'
import { useApp } from '../state/AppContext'

export function ResetDemoButton() {
  const { resetDemo } = useApp()
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full rounded-md border border-ink-200 px-2 py-1 text-[10.5px] font-medium text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-700"
      >
        Reset Demo Data
      </button>
    )
  }
  return (
    <div className="flex gap-1">
      <button
        onClick={() => { resetDemo(); setConfirming(false) }}
        className="flex-1 rounded-md bg-ink-950 px-2 py-1 text-[10.5px] font-semibold text-white"
      >
        Confirm reset
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-md border border-ink-200 px-2 py-1 text-[10.5px] text-ink-500"
      >
        Cancel
      </button>
    </div>
  )
}

import { useRef, useState } from 'react'
import { SOURCES } from '../data/company'
import type { Source } from '../data/types'
import { useApp } from '../state/AppContext'
import { sourceLevelFor } from '../lib/permissions'
import { Badge, EmptyState } from '../lib/ui'

const SYNC_STAGES = [
  'Connecting…',
  'Fetching objects…',
  'Parsing…',
  'Extracting entities…',
  'Updating memories…',
  'Updating graph…',
  'Complete',
]

const UPLOAD_STAGES = [
  'Parsing file…',
  'Extracting entities…',
  'Creating memories…',
  'Updating graph…',
  'Indexed',
]

const HEALTH_STYLES: Record<string, string> = {
  CONNECTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DEGRADED: 'bg-amber-50 text-amber-700 border-amber-200',
  PAUSED: 'bg-ink-100 text-ink-500 border-ink-200',
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function SourcesPage() {
  const { user, sourceMatrix, recordSync, syncedSources, ingestedFiles, addIngestedFile, logAudit } = useApp()
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncStage, setSyncStage] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState(-1)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const visibleSources = SOURCES.filter((s) => sourceLevelFor(user, s.key, sourceMatrix) !== 'NONE')
  const restricted = SOURCES.filter((s) => sourceLevelFor(user, s.key, sourceMatrix) === 'NONE')

  const sync = (s: Source) => {
    if (syncing) return
    setSyncing(s.key)
    setSyncStage(0)
    let i = 0
    const t = setInterval(() => {
      i += 1
      setSyncStage(i)
      if (i >= SYNC_STAGES.length - 1) {
        clearInterval(t)
        recordSync(s.key)
        setTimeout(() => { setSyncing(null); setSyncStage(0) }, 1100)
      }
    }, 340)
  }

  const upload = (file: File) => {
    setUploadError('')
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Upload failed — file exceeds the 10 MB demonstration limit.')
      logAudit({ userKey: user.key, action: 'DOCUMENT_UPLOADED', resource: file.name, result: 'ERROR', reason: 'Size limit exceeded in demo ingestion', risk: 'LOW' })
      return
    }
    const okTypes = /\.(pdf|txt|md|csv|json)$/i
    if (!okTypes.test(file.name)) {
      setUploadError('Upload failed — supported types are PDF, TXT, MD, CSV and JSON.')
      logAudit({ userKey: user.key, action: 'DOCUMENT_UPLOADED', resource: file.name, result: 'ERROR', reason: 'Unsupported file type', risk: 'LOW' })
      return
    }
    setUploading(true)
    setUploadStage(0)
    // Deterministic pseudo-extraction from file size + name
    const seed = [...file.name].reduce((a, c) => a + c.charCodeAt(0), 0)
    const memories = 4 + (seed % 21)
    const entities = 2 + (seed % 9)
    let i = 0
    const t = setInterval(() => {
      i += 1
      setUploadStage(i)
      if (i >= UPLOAD_STAGES.length - 1) {
        clearInterval(t)
        addIngestedFile({ name: file.name, size: file.size, memories, entities })
        setTimeout(() => { setUploading(false); setUploadStage(-1) }, 1200)
      }
    }, 380)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="eyebrow">Demo connectors</div>
          <h1 className="mt-1 font-display text-[24px] font-medium tracking-tight text-ink-950">Sources</h1>
          <p className="mt-0.5 text-[12.5px] text-ink-400">
            Simulated enterprise connectors — no external systems are contacted. Your access: {visibleSources.length} of {SOURCES.length} sources.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-ink-950 px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity disabled:opacity-40"
          >
            {uploading ? 'Ingesting…' : 'Upload Company Data'}
          </button>
          <div className="mt-1 text-right text-[10px] text-ink-300">PDF · TXT · MD · CSV · JSON — parsed locally</div>
        </div>
      </div>

      {uploadError && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12px] font-medium text-rose-700">{uploadError}</div>
      )}

      {uploading && (
        <div className="card mt-3 p-4">
          <div className="eyebrow mb-2">Ingestion pipeline</div>
          <div className="flex flex-wrap items-center gap-2">
            {UPLOAD_STAGES.map((s, i) => (
              <span key={s} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                i < uploadStage ? 'bg-emerald-50 text-emerald-700' : i === uploadStage ? 'bg-accent text-white' : 'bg-ink-100 text-ink-400'
              }`}>
                {i < uploadStage ? '✓ ' : ''}{s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleSources.map((s) => {
          const level = sourceLevelFor(user, s.key, sourceMatrix)
          const isSyncing = syncing === s.key
          const done = syncedSources[s.key]
          return (
            <div key={s.key} className={`card p-4 ${s.status === 'DEGRADED' ? 'border-amber-300' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: s.color }}>
                    {s.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold text-ink-950">{s.name}</div>
                    <div className="text-[10.5px] text-ink-400">{s.kind} · {s.description}</div>
                  </div>
                </div>
                <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${HEALTH_STYLES[s.status]}`}>{s.status}</span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-ink-50 py-1.5">
                  <div className="num text-[13px] font-semibold text-ink-900">{done ? s.objects + done.memories : s.objects.toLocaleString()}</div>
                  <div className="text-[9px] text-ink-400">objects</div>
                </div>
                <div className="rounded-lg bg-ink-50 py-1.5">
                  <div className="num text-[13px] font-semibold text-ink-900">{Math.round(s.coverage * 100)}%</div>
                  <div className="text-[9px] text-ink-400">coverage</div>
                </div>
                <div className="rounded-lg bg-ink-50 py-1.5">
                  <div className="text-[10.5px] font-semibold text-ink-900">{s.lastSync.slice(5, 10).replace('-', '/')}</div>
                  <div className="text-[9px] text-ink-400">last sync</div>
                </div>
              </div>

              {s.status === 'DEGRADED' && (
                <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-[10.5px] leading-snug text-amber-700">
                  Stale source — last successful crawl 4 days ago. Some references may be outdated.
                </div>
              )}

              {isSyncing && (
                <div className="mt-2.5 rounded-lg border border-accent/30 bg-accent-soft/50 px-2.5 py-2">
                  <div className="text-[11px] font-semibold text-accent-strong">{SYNC_STAGES[Math.min(syncStage, SYNC_STAGES.length - 1)]}</div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${((syncStage + 1) / SYNC_STAGES.length) * 100}%` }} />
                  </div>
                </div>
              )}

              {done && !isSyncing && (
                <div className="num mt-2.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10.5px] font-medium text-emerald-700">
                  ✓ Sync complete — +{done.memories} memories · +{done.entities} entities · +{done.relationships} relationships
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <Badge color={level === 'FULL' ? '#3d6b45' : '#8a6d3b'}>{level === 'FULL' ? 'FULL ACCESS' : 'LIMITED'}</Badge>
                <button
                  onClick={() => sync(s)}
                  disabled={!!syncing}
                  className="rounded-md border border-ink-200 px-2.5 py-1 text-[11px] font-semibold text-ink-700 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  Sync Now
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {restricted.length > 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-ink-200 bg-white/60 px-4 py-3 text-[12px] text-ink-500">
          <span className="font-semibold">{restricted.length} source{restricted.length === 1 ? '' : 's'} hidden by your access level:</span>{' '}
          {restricted.map((s) => s.name).join(', ')}. Switch identity in the bottom-left to see more.
        </div>
      )}

      {ingestedFiles.length > 0 && (
        <div className="card mt-6 p-5">
          <div className="eyebrow mb-3">Ingested files ({ingestedFiles.length})</div>
          <div className="space-y-2">
            {ingestedFiles.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-ink-100 px-3.5 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-[10px] font-bold text-accent-strong">UP</span>
                  <div>
                    <div className="text-[12.5px] font-medium text-ink-900">{f.name}</div>
                    <div className="num text-[10.5px] text-ink-400">{fmtBytes(f.size)} · {f.ts.slice(11, 19)}</div>
                  </div>
                </div>
                <div className="num text-[11px] text-emerald-700">+{f.memories} memories · +{f.entities} entities</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10.5px] text-ink-400">
            Files are parsed locally in this demonstration; entity extraction is deterministic, not a cloud service.
          </div>
        </div>
      )}

      {visibleSources.length === 0 && (
        <div className="mt-4"><EmptyState title="No sources available" body="Your role has no connector access. This itself is the demo: permission-aware intelligence starts at the source layer." /></div>
      )}
    </div>
  )
}

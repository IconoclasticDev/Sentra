import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  SEED_AUDIT,
  SEED_POLICY_MATRIX,
  SEED_SOURCE_MATRIX,
} from '../data/company'
import type { AuditEntry, Category, Effect, PolicyMatrix, SourceLevel, SourceMatrix, User } from '../data/types'
import { DEMO_USER_KEYS, PEOPLE } from '../data/company'
import { buildProfile, userByKey } from '../lib/permissions'
import type { Profile } from '../lib/permissions'

export interface Notification {
  id: number
  title: string
  body: string
  ts: string
  kind: 'memory' | 'conflict' | 'security' | 'sync'
}

interface AppState {
  user: User
  setUser: (key: string) => void
  policies: PolicyMatrix
  setPolicy: (roleKey: string, category: Category, effect: Effect) => void
  resetPolicies: () => void
  sourceMatrix: SourceMatrix
  setSourceLevel: (roleKey: string, sourceKey: string, level: SourceLevel) => void
  audit: AuditEntry[]
  logAudit: (entry: Omit<AuditEntry, 'ts'>) => void
  notifications: Notification[]
  markNotificationsRead: () => void
  demoMode: boolean
  setDemoMode: (v: boolean) => void
  resetDemo: () => void
  profile: Profile
  ingestedFiles: { name: string; size: number; memories: number; entities: number; ts: string }[]
  addIngestedFile: (f: { name: string; size: number; memories: number; entities: number }) => void
  syncedSources: Record<string, { ts: string; memories: number; entities: number; relationships: number }>
  recordSync: (sourceKey: string) => void
}

const Ctx = createContext<AppState | null>(null)

let auditSeq = 0
let notifSeq = 0

function nowTs(): string {
  return new Date().toISOString().slice(0, 19)
}

const SEED_NOTIFICATIONS: Notification[] = [
  { id: ++notifSeq, title: '3 new memories', body: 'Slack · #orion — migration tracker updated', ts: '09:12', kind: 'memory' },
  { id: ++notifSeq, title: '1 memory conflict detected', body: 'Orion GA risk: status rollup vs GPU incident', ts: '09:04', kind: 'conflict' },
  { id: ++notifSeq, title: '2 access denied attempts', body: 'Kunal Verma → Finance (L4 required)', ts: '07:55', kind: 'security' },
  { id: ++notifSeq, title: 'Source sync completed', body: 'Slack · 41,218 objects scanned', ts: '08:12', kind: 'sync' },
]

export function AppProvider({ children }: { children: ReactNode }) {
  const [userKey, setUserKey] = useState<string>('maya')
  const [policies, setPolicies] = useState<PolicyMatrix>(() => JSON.parse(JSON.stringify(SEED_POLICY_MATRIX)))
  const [sourceMatrix, setSourceMatrix] = useState<SourceMatrix>(() => JSON.parse(JSON.stringify(SEED_SOURCE_MATRIX)))
  const [audit, setAudit] = useState<AuditEntry[]>(() => [...SEED_AUDIT])
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS)
  const [demoMode, setDemoMode] = useState(true)
  const [ingestedFiles, setIngestedFiles] = useState<AppState['ingestedFiles']>([])
  const [syncedSources, setSyncedSources] = useState<AppState['syncedSources']>({})

  const user = useMemo(() => userByKey(userKey), [userKey])

  const profile = useMemo(() => buildProfile(user, policies, sourceMatrix), [user, policies, sourceMatrix])

  const logAudit = (entry: Omit<AuditEntry, 'ts'>) => {
    auditSeq += 1
    setAudit((prev) => [{ ...entry, ts: nowTs(), _seq: auditSeq } as AuditEntry, ...prev].slice(0, 200))
  }

  const setUser = (key: string) => {
    const target = PEOPLE.find((p) => p.key === key)
    setUserKey(key)
    if (target) {
      logAudit({
        userKey: key,
        action: 'USER_SWITCHED',
        resource: `Session identity → ${target.name} (${target.role})`,
        result: 'OK',
        reason: 'Demo role switcher',
        risk: 'LOW',
      })
    }
  }

  const setPolicy = (roleKey: string, category: Category, effect: Effect) => {
    setPolicies((prev) => ({ ...prev, [roleKey]: { ...prev[roleKey], [category]: effect } }))
    logAudit({
      userKey,
      action: 'PERMISSION_CHANGED',
      resource: `${roleKey} → ${category} → ${effect}`,
      result: 'OK',
      reason: 'Policy cell updated in Access Control',
      risk: 'MEDIUM',
      category,
    })
  }

  const setSourceLevel = (roleKey: string, sourceKey: string, level: SourceLevel) => {
    setSourceMatrix((prev) => ({ ...prev, [roleKey]: { ...prev[roleKey], [sourceKey]: level } }))
    logAudit({
      userKey,
      action: 'PERMISSION_CHANGED',
      resource: `${roleKey} → source:${sourceKey} → ${level}`,
      result: 'OK',
      reason: 'Source access level updated',
      risk: 'MEDIUM',
    })
  }

  const markNotificationsRead = () => setNotifications([])

  const resetPolicies = () => {
    setPolicies(JSON.parse(JSON.stringify(SEED_POLICY_MATRIX)))
    setSourceMatrix(JSON.parse(JSON.stringify(SEED_SOURCE_MATRIX)))
  }

  const resetDemo = () => {
    setPolicies(JSON.parse(JSON.stringify(SEED_POLICY_MATRIX)))
    setSourceMatrix(JSON.parse(JSON.stringify(SEED_SOURCE_MATRIX)))
    setAudit([...SEED_AUDIT])
    setNotifications(SEED_NOTIFICATIONS)
    setIngestedFiles([])
    setSyncedSources({})
    setUserKey('maya')
    logAudit({
      userKey: 'maya',
      action: 'DEMO_RESET',
      resource: 'All demo state restored to seed',
      result: 'OK',
      reason: 'Reset Demo Data invoked',
      risk: 'LOW',
    })
  }

  const addIngestedFile = (f: { name: string; size: number; memories: number; entities: number }) => {
    setIngestedFiles((prev) => [{ ...f, ts: nowTs() }, ...prev])
    logAudit({
      userKey,
      action: 'DOCUMENT_UPLOADED',
      resource: f.name,
      result: 'OK',
      reason: `${f.memories} memories extracted, ${f.entities} entities linked`,
      risk: 'LOW',
    })
  }

  const recordSync = (sourceKey: string) => {
    const memories = 40 + Math.floor(Math.random() * 180)
    const entities = 4 + Math.floor(Math.random() * 26)
    const relationships = 12 + Math.floor(Math.random() * 60)
    setSyncedSources((prev) => ({ ...prev, [sourceKey]: { ts: nowTs(), memories, entities, relationships } }))
    logAudit({
      userKey,
      action: 'SOURCE_SYNC',
      resource: `Manual sync · ${sourceKey}`,
      result: 'OK',
      reason: `+${memories} memories · +${entities} entities · +${relationships} relationships`,
      risk: 'LOW',
    })
  }

  const value: AppState = {
    user, setUser, policies, setPolicy, resetPolicies, sourceMatrix, setSourceLevel,
    audit, logAudit, notifications, markNotificationsRead, demoMode, setDemoMode,
    resetDemo, profile, ingestedFiles, addIngestedFile, syncedSources, recordSync,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

export { DEMO_USER_KEYS }

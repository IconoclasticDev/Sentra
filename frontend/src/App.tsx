import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppProvider } from './state/AppContext'
import { Sidebar } from './shell/Sidebar'
import { TopBar } from './shell/TopBar'
import { Landing } from './pages/Landing'
import { Overview } from './pages/Overview'
import { AskBrain } from './pages/AskBrain'
import { MemoryPage } from './pages/Memory'
import { DecisionsPage } from './pages/Decisions'
import { GraphPage } from './pages/Graph'
import { TimelinePage } from './pages/Timeline'
import { SourcesPage } from './pages/Sources'
import { AgentsPage } from './pages/Agents'
import { AccessControlPage } from './pages/AccessControl'
import { AuditLogPage } from './pages/AuditLog'
import { SystemPage } from './pages/System'

function Shell() {
  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Shell />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/ask" element={<AskBrain />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/decisions" element={<DecisionsPage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/sources" element={<SourcesPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/access" element={<AccessControlPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/system" element={<SystemPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}

import React, { useMemo, useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import DashboardPage from './pages/DashboardPage'
import ArchivioPage from './pages/ArchivioPage'
import SalutePage from './pages/SalutePage'
import ViaggiPage from './pages/ViaggiPage'
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'ti ti-layout-dashboard' },
  { key: 'archivio', label: 'Archivio', icon: 'ti ti-folder' },
  { key: 'salute', label: 'Salute & Terapie', icon: 'ti ti-medical-cross' },
  { key: 'viaggi', label: 'Viaggi', icon: 'ti ti-plane' },
  { key: 'membri', label: 'Membri famiglia', icon: 'ti ti-users' },
  { key: 'spese', label: 'Spese di viaggio', icon: 'ti ti-receipt-2' },
  { key: 'guida', label: 'Guida setup', icon: 'ti ti-book' },
]
function AppShell() {
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { family, trips } = useApp()
  const activeTrip = trips[0] || null
  const pageTitle = useMemo(() => NAV.find((n) => n.key === page)?.label || 'Family Hub', [page])
  return <div className="app-shell" data-sidebar={sidebarOpen ? 'open' : 'closed'}><aside className="sidebar"><div className="sidebar-logo"><div className="logo-mark">🏠</div><div><div className="logo-name">Family Hub</div><div className="logo-tagline">drive & care</div></div></div><nav className="sidebar-nav">{NAV.map((item) => <button key={item.key} className={`nav-item ${page === item.key ? 'active' : ''}`} onClick={() => setPage(item.key)}><i className={`nav-icon ${item.icon}`} /><span>{item.label}</span></button>)}</nav></aside><div className="main-area"><header className="header"><button className="hdr-toggle" onClick={() => setSidebarOpen((v) => !v)}><i className="ti ti-menu-2" /></button><div className="hdr-title">{pageTitle}</div><div className="hdr-spacer" /><div className="family-avatars">{family.map((m) => <div key={m.id} className="av-chip" style={{ background: m.bg, color: m.color }}>{m.initials}</div>)}</div></header><main className="page-content">{page === 'dashboard' && <DashboardPage />}{page === 'archivio' && <ArchivioPage />}{page === 'salute' && <SalutePage />}{page === 'viaggi' && <ViaggiPage />}{page === 'membri' && <MembersPage />}{page === 'spese' && <TravelExpensesPage trip={activeTrip} />}{page === 'guida' && <GuidePage />}</main></div></div>
}
function MembersPage() { const { family } = useApp(); return <section><div className="sh"><div className="st"><i className="ti ti-users" /> Membri famiglia</div></div><div className="g3">{family.map((m) => <div key={m.id} className="mem-card"><div className="mem-av" style={{ background: m.bg, color: m.color }}>{m.initials}</div><div className="mem-name">{m.name}</div><div className="mem-row"><i className="ti ti-user" /> {m.role}</div><div className="mem-row"><i className="ti ti-phone" /> {m.phone || '—'}</div><div className="mem-row"><i className="ti ti-id" /> {m.cf}</div></div>)}</div></section> }
function TravelExpensesPage({ trip }) { if (!trip) return <div className="card empty"><i className="ti ti-receipt-off" /> Nessun viaggio disponibile — creane uno nella sezione Viaggi</div>; const total = trip.expenses.reduce((s, e) => s + Number(e.amount || 0), 0); return <section><div className="sh"><div className="st"><i className="ti ti-receipt-2" /> Spese di viaggio</div></div><div className="card"><div className="trip-nm">{trip.emoji} {trip.name}</div><p style={{ marginTop: 8, color: '#666' }}>Totale registrato: <strong>€ {total.toFixed(2)}</strong></p>{!trip.expenses.length && <div className="empty"><i className="ti ti-wallet-off" /> Nessuna spesa registrata</div>}</div></section> }
function GuidePage() { return <section><div className="sh"><div className="st"><i className="ti ti-book" /> Guida setup</div></div><div className="card guide-section"><h3>Installazione</h3><div className="guide-step"><div className="step-num">1</div><div className="step-body"><h4>Installa dipendenze</h4><p>Esegui <code>npm install</code> nella cartella progetto.</p></div></div><div className="guide-step"><div className="step-num">2</div><div className="step-body"><h4>Avvio locale</h4><p>Esegui <code>npm run dev</code> e apri il browser su localhost.</p></div></div><div className="guide-step"><div className="step-num">3</div><div className="step-body"><h4>Build</h4><p>Usa <code>npm run build</code> prima del deploy.</p></div></div></div></section> }
export default function App() { return <AppProvider><AppShell /></AppProvider> }

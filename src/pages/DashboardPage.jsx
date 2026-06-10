import { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'

function fmtDate(value) {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function diffDays(dateValue) {
  if (!dateValue) return null
  const today = startOfToday()
  const target = new Date(dateValue)
  if (Number.isNaN(target.getTime())) return null
  const normalized = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((normalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function statusTripLabel(status) {
  const map = {
    planning: 'Pianificato',
    incoming: 'In arrivo',
    ongoing: 'In corso',
    done: 'Concluso',
    cancelled: 'Annullato',
  }
  return map[status] || status || '—'
}

function statusBadgeClass(days) {
  if (days === null) return 'badge-muted'
  if (days < 0) return 'badge-danger'
  if (days <= 30) return 'badge-warning'
  return 'badge-success'
}

function deadlineText(days) {
  if (days === null) return 'Nessuna data'
  if (days < 0) return `Scaduto da ${Math.abs(days)} gg`
  if (days === 0) return 'Oggi'
  if (days === 1) return 'Domani'
  return `Tra ${days} gg`
}

function Widget({ tone, icon, label, value, sub, onClick }) {
  return (
    <button className={`widget-card ${tone}`} onClick={onClick} type="button">
      <div className="widget-icon">{icon}</div>
      <div className="widget-label">{label}</div>
      <div className="widget-value">{value}</div>
      <div className="widget-sub">{sub}</div>
    </button>
  )
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>
}

export default function DashboardPage({ onNavigate }) {
  const {
    trips,
    familyMembers,
    archiveTables,
    healthTables,
    loadingData,
    syncError,
  } = useAppContext()

  const summary = useMemo(() => {
    const today = startOfToday()
    const weekEnd = addDays(today, 7)

    const documents = archiveTables?.documents || []
    const visits = healthTables?.specialistVisits || []
    const therapies = healthTables?.visitTherapies || []
    const therapyMedications = healthTables?.therapyMedications || []
    const members = familyMembers || []
    const tripList = trips || []

    const upcomingTrips = tripList
      .map((trip) => ({
        ...trip,
        daysToStart: diffDays(trip.dateFrom),
      }))
      .filter((trip) => trip.status === 'incoming' || trip.status === 'ongoing' || trip.status === 'planning')
      .sort((a, b) => {
        const av = a.daysToStart ?? 9999
        const bv = b.daysToStart ?? 9999
        return av - bv
      })

    const nextTrip = upcomingTrips[0] || null

    const expiringDocuments = documents
      .map((doc) => ({
        ...doc,
        daysToExpiry: diffDays(doc.expiryDate),
      }))
      .filter((doc) => doc.expiryDate)
      .sort((a, b) => {
        const av = a.daysToExpiry ?? 9999
        const bv = b.daysToExpiry ?? 9999
        return av - bv
      })

    const urgentDocuments = expiringDocuments.filter((doc) => doc.daysToExpiry !== null && doc.daysToExpiry <= 30)

    const upcomingVisits = visits
      .map((visit) => ({
        ...visit,
        daysToVisit: diffDays(visit.date),
      }))
      .filter((visit) => visit.date)
      .sort((a, b) => {
        const av = a.daysToVisit ?? 9999
        const bv = b.daysToVisit ?? 9999
        return av - bv
      })

    const nextVisit = upcomingVisits.find((visit) => visit.daysToVisit === null || visit.daysToVisit >= 0) || null

    const activeTherapies = therapies.filter((therapy) => {
      const start = therapy.startDate ? new Date(therapy.startDate) : null
      const end = therapy.endDate ? new Date(therapy.endDate) : null
      const validStart = start && !Number.isNaN(start.getTime()) ? start : null
      const validEnd = end && !Number.isNaN(end.getTime()) ? end : null

      if (!validStart && !validEnd) return true
      if (validStart && validStart > weekEnd) return false
      if (validEnd && validEnd < today) return false
      return true
    })

    const medicationsToday = members.reduce((count, member) => {
      const meds = Array.isArray(member.medications) ? member.medications : []
      return count + meds.filter((med) => med.name || med.schedule || med.dosage).length
    }, 0)

    const weeklyEvents = [
      ...upcomingVisits
        .filter((visit) => {
          const raw = new Date(visit.date)
          return !Number.isNaN(raw.getTime()) && raw >= today && raw <= weekEnd
        })
        .map((visit) => ({
          id: `visit_${visit.id}`,
          date: visit.date,
          tone: 'tl-health',
          badge: 'badge-health',
          type: 'Visita',
          title: visit.title || 'Visita specialistica',
          subtitle: `${visit.specialty || 'Specialistica'} · ${visit.doctor || 'Medico non indicato'}`,
          meta: visit.location || 'Luogo da definire',
          action: 'salute',
        })),
      ...expiringDocuments
        .filter((doc) => {
          const raw = new Date(doc.expiryDate)
          return !Number.isNaN(raw.getTime()) && raw >= today && raw <= weekEnd
        })
        .map((doc) => ({
          id: `doc_${doc.id}`,
          date: doc.expiryDate,
          tone: 'tl-arch',
          badge: 'badge-arch',
          type: 'Scadenza',
          title: doc.title || 'Documento',
          subtitle: `${doc.category || 'Categoria'} · ${doc.owner || 'Intestatario non indicato'}`,
          meta: 'Documento in scadenza',
          action: 'archivio',
        })),
      ...upcomingTrips
        .filter((trip) => {
          const raw = new Date(trip.dateFrom)
          return !Number.isNaN(raw.getTime()) && raw >= today && raw <= weekEnd
        })
        .map((trip) => ({
          id: `trip_${trip.id}`,
          date: trip.dateFrom,
          tone: 'tl-travel',
          badge: 'badge-travel',
          type: 'Partenza',
          title: trip.name || 'Viaggio',
          subtitle: `${statusTripLabel(trip.status)} · ${fmtDate(trip.dateFrom)}`,
          meta: `${(trip.persons || []).length} partecipanti`,
          action: 'viaggi',
        })),
    ]
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .slice(0, 8)

    return {
      totalMembers: members.length,
      medicationsToday,
      nextTrip,
      urgentDocuments,
      nextVisit,
      activeTherapiesCount: activeTherapies.length,
      therapyMedicationsCount: therapyMedications.length,
      weeklyEvents,
      expiringDocuments: expiringDocuments.slice(0, 5),
      upcomingVisits: upcomingVisits.slice(0, 5),
      upcomingTrips: upcomingTrips.slice(0, 5),
    }
  }, [archiveTables, familyMembers, healthTables, trips])

  if (loadingData) {
    return (
      <div className="page-stack">
        <div className="hero-card">
          <div className="eyebrow">Dashboard famiglia</div>
          <h1 className="page-title">Sto caricando i dati</h1>
          <p className="page-subtitle">Sincronizzo archivio, salute e viaggi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Dashboard famiglia</div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Tutto sotto controllo</h1>
            <p className="page-subtitle">
              Archivio digitale, terapie, scadenze e viaggi in un solo colpo d’occhio.
            </p>
          </div>
          <div className="row">
            <span className="badge badge-dash">{summary.totalMembers} membri</span>
            <span className="badge badge-health">{summary.activeTherapiesCount} terapie attive</span>
            <span className="badge badge-travel">{summary.upcomingTrips.length} viaggi</span>
          </div>
        </div>

        {syncError ? <div className="app-status">{syncError}</div> : null}
      </section>

      <section>
        <div className="section-title">Panoramica rapida</div>
        <div className="grid-2 widget-grid">
          <Widget
            tone="wc-dash"
            icon="👨‍👩‍👧‍👦"
            label="Famiglia"
            value={summary.totalMembers}
            sub={`${summary.medicationsToday} farmaci registrati`}
            onClick={() => onNavigate?.('salute')}
          />
          <Widget
            tone="wc-health"
            icon="❤️"
            label="Salute"
            value={summary.nextVisit ? fmtDate(summary.nextVisit.date) : '—'}
            sub={
              summary.nextVisit
                ? `${summary.nextVisit.title || 'Prossima visita'}`
                : 'Nessuna visita programmata'
            }
            onClick={() => onNavigate?.('salute')}
          />
          <Widget
            tone="wc-arch"
            icon="🗂️"
            label="Archivio"
            value={summary.urgentDocuments.length}
            sub="documenti in scadenza entro 30 giorni"
            onClick={() => onNavigate?.('archivio')}
          />
          <Widget
            tone="wc-travel"
            icon="✈️"
            label="Viaggi"
            value={summary.nextTrip ? (summary.nextTrip.daysToStart ?? '—') : '—'}
            sub={
              summary.nextTrip
                ? `${summary.nextTrip.name || 'Prossimo viaggio'} · ${statusTripLabel(summary.nextTrip.status)}`
                : 'Nessun viaggio imminente'
            }
            onClick={() => onNavigate?.('viaggi')}
          />
        </div>
      </section>

      <section className="card">
        <div className="between">
          <div>
            <div className="section-title">Settimana in arrivo</div>
            <p className="page-subtitle">Eventi e scadenze dei prossimi 7 giorni.</p>
          </div>
        </div>

        <div className="timeline-list">
          {summary.weeklyEvents.length === 0 ? (
            <EmptyState text="Nessun evento nei prossimi 7 giorni." />
          ) : (
            summary.weeklyEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                className={`timeline-item ${event.tone}`}
                onClick={() => onNavigate?.(event.action)}
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="between">
                  <span className={`badge ${event.badge}`}>{event.type}</span>
                  <span className="small muted">{fmtDate(event.date)}</span>
                </div>
                <div className="strong" style={{ marginTop: 8 }}>{event.title}</div>
                <div className="small muted" style={{ marginTop: 4 }}>{event.subtitle}</div>
                <div className="small" style={{ marginTop: 6 }}>{event.meta}</div>
              </button>
            ))
          )}
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="between">
            <div>
              <div className="section-title">Documenti urgenti</div>
              <p className="page-subtitle">Le prossime scadenze da monitorare.</p>
            </div>
            <button className="btn btn-sm" onClick={() => onNavigate?.('archivio')}>
              Apri archivio
            </button>
          </div>

          <div className="timeline-list" style={{ marginTop: 12 }}>
            {summary.expiringDocuments.length === 0 ? (
              <EmptyState text="Nessun documento con scadenza registrata." />
            ) : (
              summary.expiringDocuments.map((doc) => (
                <div key={doc.id} className="timeline-item tl-arch">
                  <div className="between">
                    <span className={`badge ${statusBadgeClass(doc.daysToExpiry)}`}>
                      {deadlineText(doc.daysToExpiry)}
                    </span>
                    <span className="small muted">{fmtDate(doc.expiryDate)}</span>
                  </div>
                  <div className="strong" style={{ marginTop: 8 }}>{doc.title || 'Documento'}</div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {doc.category || 'Categoria'} · {doc.owner || 'Intestatario'}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card">
          <div className="between">
            <div>
              <div className="section-title">Salute attiva</div>
              <p className="page-subtitle">Visite imminenti e terapie in corso.</p>
            </div>
            <button className="btn btn-sm" onClick={() => onNavigate?.('salute')}>
              Apri salute
            </button>
          </div>

          <div className="timeline-list" style={{ marginTop: 12 }}>
            {summary.upcomingVisits.length === 0 ? (
              <EmptyState text="Nessuna visita specialistica registrata." />
            ) : (
              summary.upcomingVisits.map((visit) => (
                <div key={visit.id} className="timeline-item tl-health">
                  <div className="between">
                    <span className={`badge ${statusBadgeClass(visit.daysToVisit)}`}>
                      {deadlineText(visit.daysToVisit)}
                    </span>
                    <span className="small muted">{fmtDate(visit.date)}</span>
                  </div>
                  <div className="strong" style={{ marginTop: 8 }}>
                    {visit.title || 'Visita specialistica'}
                  </div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {visit.specialty || 'Specialistica'} · {visit.doctor || 'Medico da definire'}
                  </div>
                  <div className="small" style={{ marginTop: 6 }}>
                    {visit.location || 'Luogo non indicato'}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="between">
          <div>
            <div className="section-title">Prossimi viaggi</div>
            <p className="page-subtitle">Le partenze e i piani già presenti in app.</p>
          </div>
          <button className="btn btn-sm" onClick={() => onNavigate?.('viaggi')}>
            Apri viaggi
          </button>
        </div>

        <div className="timeline-list" style={{ marginTop: 12 }}>
          {summary.upcomingTrips.length === 0 ? (
            <EmptyState text="Nessun viaggio disponibile." />
          ) : (
            summary.upcomingTrips.map((trip) => (
              <div key={trip.id} className="timeline-item tl-travel">
                <div className="between">
                  <span className="badge badge-travel">{statusTripLabel(trip.status)}</span>
                  <span className="small muted">
                    {trip.dateFrom ? `${fmtDate(trip.dateFrom)} → ${fmtDate(trip.dateTo)}` : 'Date non definite'}
                  </span>
                </div>
                <div className="strong" style={{ marginTop: 8 }}>{trip.name || 'Viaggio'}</div>
                <div className="small muted" style={{ marginTop: 4 }}>
                  {(trip.persons || []).length} partecipanti
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  {trip.daysToStart === null
                    ? 'Data partenza non disponibile'
                    : trip.daysToStart < 0
                      ? 'Viaggio già iniziato'
                      : trip.daysToStart === 0
                        ? 'Partenza oggi'
                        : `Partenza tra ${trip.daysToStart} giorni`}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="row" style={{ marginTop: 14 }}>
          <span className="badge badge-health">{summary.therapyMedicationsCount} farmaci terapia</span>
          <span className="badge badge-dash">{summary.medicationsToday} farmaci anagrafica</span>
          <span className="badge badge-arch">{summary.urgentDocuments.length} scadenze urgenti</span>
        </div>
      </section>
    </div>
  )
}
import { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'

function fmtDate(value) {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function daysBetween(from, to = new Date()) {
  if (!from) return null
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const diff = start.getTime() - end.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function statusBadge(days) {
  if (days === null) return 'badge-muted'
  if (days < 0) return 'badge-danger'
  if (days <= 7) return 'badge-warning'
  return 'badge-success'
}

function statusText(days) {
  if (days === null) return 'Senza data'
  if (days < 0) return 'Scaduto'
  if (days === 0) return 'Oggi'
  if (days === 1) return 'Domani'
  return `${days} gg`
}

export default function DashboardPage() {
  const { archiveTables, healthTables, trips, familyMembers, loadingData, syncError } = useAppContext()

  const deadlineRows = useMemo(() => {
    const rows = []

    ;(archiveTables?.documents || []).forEach((doc) => {
      if (!doc?.expiryDate) return
      rows.push({
        id: `doc_${doc.id}`,
        area: 'Archivio',
        title: doc.title || 'Documento',
        owner:
          familyMembers.find((member) => member.id === doc.ownerId)?.name ||
          doc.owner ||
          '—',
        date: doc.expiryDate,
        note: doc.category || '',
      })
    })

    ;(healthTables?.specialistVisits || []).forEach((visit) => {
      if (!visit?.date) return
      rows.push({
        id: `visit_${visit.id}`,
        area: 'Salute',
        title: visit.title || 'Visita',
        owner:
          familyMembers.find((member) => member.id === visit.memberId)?.name ||
          '—',
        date: visit.date,
        note: visit.doctor || visit.location || '',
      })
    })

    ;(healthTables?.visitTherapies || []).forEach((therapy) => {
      if (!therapy?.endDate) return
      rows.push({
        id: `therapy_${therapy.id}`,
        area: 'Salute',
        title: therapy.title || 'Fine terapia',
        owner:
          familyMembers.find((member) => member.id === therapy.memberId)?.name ||
          '—',
        date: therapy.endDate,
        note: 'Fine terapia',
      })
    })

    ;(trips || []).forEach((trip) => {
      if (trip?.dateFrom) {
        rows.push({
          id: `trip_${trip.id}`,
          area: 'Viaggi',
          title: trip.name || 'Viaggio',
          owner: 'Famiglia',
          date: trip.dateFrom,
          note: 'Partenza',
        })
      }

      ;(trip?.flights || []).forEach((flight) => {
        if (!flight?.date) return
        rows.push({
          id: `flight_${flight.id}`,
          area: 'Viaggi',
          title: `${flight.company || 'Volo'} ${flight.flightNumber || ''}`.trim(),
          owner: trip.name || 'Viaggio',
          date: flight.date,
          note: `${flight.from || '—'} → ${flight.to || '—'}`,
        })
      })

      ;(trip?.hotels || []).forEach((hotel) => {
        if (!hotel?.checkIn) return
        rows.push({
          id: `hotel_${hotel.id}`,
          area: 'Viaggi',
          title: hotel.name || 'Hotel',
          owner: trip.name || 'Viaggio',
          date: hotel.checkIn,
          note: 'Check-in',
        })
      })
    })

    return rows
      .map((row) => ({ ...row, days: daysBetween(row.date) }))
      .sort((a, b) => {
        const av = a.date || '9999-99-99'
        const bv = b.date || '9999-99-99'
        return av.localeCompare(bv)
      })
  }, [archiveTables, healthTables, trips, familyMembers])

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Dashboard</div>
          <h1>Caricamento scadenze…</h1>
          <p className="page-subtitle">Sto raccogliendo solo gli elementi davvero urgenti.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Dashboard</div>
        <h1>Scadenze di famiglia</h1>
        <p className="page-subtitle">
          Una vista unica e sintetica di documenti, visite, terapie e partenze.
        </p>
        {syncError ? <div className="app-status">{syncError}</div> : null}
      </section>

      <section className="card stack-card">
        <div className="page-header">
          <div>
            <div className="card-title">Scadenze prossime</div>
            <div className="card-subtitle">
              Solo elementi con data, ordinati dal più vicino.
            </div>
          </div>
          <div className="badge badge-dash">{deadlineRows.length} elementi</div>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Area</th>
                <th>Titolo</th>
                <th>Persona / Contesto</th>
                <th>Data</th>
                <th>Nota</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              {deadlineRows.length ? (
                deadlineRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.area}</td>
                    <td>{row.title}</td>
                    <td>{row.owner}</td>
                    <td>{fmtDate(row.date)}</td>
                    <td>{row.note || '—'}</td>
                    <td>
                      <span className={`badge ${statusBadge(row.days)}`}>
                        {statusText(row.days)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty">Nessuna scadenza registrata.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
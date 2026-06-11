import { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'

function fmtDate(value) {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function sortByDate(items, selector) {
  return [...items].sort((a, b) => {
    const av = selector(a) || '9999-99-99'
    const bv = selector(b) || '9999-99-99'
    return av.localeCompare(bv)
  })
}

function daysBetween(from, to = new Date()) {
  if (!from) return null
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const diff = start.getTime() - end.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function tripStatusLabel(status) {
  const map = {
    planning: 'Pianificato',
    incoming: 'In arrivo',
    ongoing: 'In corso',
    done: 'Concluso',
    cancelled: 'Annullato',
  }
  return map[status] || status || '—'
}

function tripStatusClass(status) {
  if (status === 'incoming' || status === 'ongoing') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'planning') return 'warning'
  return ''
}

function EmptyBox({ text }) {
  return <div className="empty">{text}</div>
}

function healthRows(healthEntries = [], familyMembers = []) {
  return sortByDate(
    healthEntries
      .filter((row) => row.date)
      .map((row) => {
        const member = familyMembers.find((item) => item.id === row.memberId)
        return {
          id: row.id,
          member,
          type: row.type || 'Visita',
          date: row.date,
          doctor: row.doctor || '',
          location: row.location || '',
          note: row.notes || '',
        }
      }),
    (row) => row.date,
  )
}

function archiveRows(archiveDocs = []) {
  return sortByDate(
    archiveDocs
      .filter((row) => row.expiryDate)
      .map((row) => ({
        id: row.id,
        category: row.category || 'Documento',
        owner: row.owner || '',
        title: row.title || '',
        expiryDate: row.expiryDate,
      })),
    (row) => row.expiryDate,
  )
}

function tripRows(trips = []) {
  const rows = []

  trips.forEach((trip) => {
    if (trip.dateFrom) {
      rows.push({
        id: `${trip.id}-trip-start`,
        area: 'Viaggi',
        title: trip.name || 'Viaggio',
        personOrContext: trip.persons?.length ? 'Famiglia' : '—',
        date: trip.dateFrom,
        note: 'Partenza',
        status: trip.status,
      })
    }

    ;(trip.flights || []).forEach((flight) => {
      if (flight.date) {
        rows.push({
          id: `${trip.id}-flight-${flight.id}`,
          area: 'Viaggi',
          title: flight.company || 'Volo',
          personOrContext: trip.name || 'Viaggio',
          date: flight.date,
          note: `${flight.from || '—'} → ${flight.to || '—'}`,
          status: trip.status,
        })
      }

      ;(flight.deadlines || []).forEach((deadline) => {
        if (deadline.date) {
          rows.push({
            id: `${trip.id}-flight-deadline-${deadline.id}`,
            area: 'Viaggi',
            title: deadline.title || 'Scadenza volo',
            personOrContext: flight.company || trip.name || 'Viaggio',
            date: deadline.date,
            note: deadline.notes || 'Volo',
            status: trip.status,
          })
        }
      })
    })

    ;(trip.hotels || []).forEach((hotel) => {
      if (hotel.checkIn) {
        rows.push({
          id: `${trip.id}-hotel-${hotel.id}`,
          area: 'Viaggi',
          title: hotel.name || 'Hotel',
          personOrContext: trip.name || 'Viaggio',
          date: hotel.checkIn,
          note: 'Check-in',
          status: trip.status,
        })
      }

      if (hotel.cancellationDate) {
        rows.push({
          id: `${trip.id}-hotel-cancel-${hotel.id}`,
          area: 'Viaggi',
          title: hotel.name || 'Hotel',
          personOrContext: trip.name || 'Viaggio',
          date: hotel.cancellationDate,
          note: 'Cancellazione',
          status: trip.status,
        })
      }

      ;(hotel.deadlines || []).forEach((deadline) => {
        if (deadline.date) {
          rows.push({
            id: `${trip.id}-hotel-deadline-${deadline.id}`,
            area: 'Viaggi',
            title: deadline.title || 'Scadenza hotel',
            personOrContext: hotel.name || trip.name || 'Viaggio',
            date: deadline.date,
            note: deadline.notes || 'Hotel',
            status: trip.status,
          })
        }
      })
    })

    ;(trip.parkingReservations || []).forEach((parking) => {
      if (parking.dateFrom) {
        rows.push({
          id: `${trip.id}-parking-${parking.id}`,
          area: 'Viaggi',
          title: parking.name || 'Parcheggio',
          personOrContext: trip.name || 'Viaggio',
          date: parking.dateFrom,
          note: 'Parcheggio',
          status: trip.status,
        })
      }
    })

    ;(trip.carRentals || []).forEach((car) => {
      if (car.pickupDate) {
        rows.push({
          id: `${trip.id}-car-${car.id}`,
          area: 'Viaggi',
          title: car.company || 'Auto a noleggio',
          personOrContext: trip.name || 'Viaggio',
          date: car.pickupDate,
          note: 'Ritiro auto',
          status: trip.status,
        })
      }
    })

    ;(trip.travelDiary?.days || []).forEach((day) => {
      if (day.date) {
        rows.push({
          id: `${trip.id}-day-${day.id}`,
          area: 'Viaggi',
          title: day.title || 'Giorno di viaggio',
          personOrContext: trip.name || 'Viaggio',
          date: day.date,
          note: 'Diario',
          status: trip.status,
        })
      }
    })
  })

  return sortByDate(rows, (row) => row.date)
}

function statusBadgeLabel(date) {
  const days = daysBetween(date)
  if (days === null) return '—'
  if (days < 0) return 'Scaduto'
  return `${days} gg`
}

function statusBadgeClass(date) {
  const days = daysBetween(date)
  if (days === null) return 'muted'
  if (days < 0) return 'danger'
  if (days <= 30) return 'success'
  if (days <= 90) return 'warning'
  return 'muted'
}

export default function DashboardPage() {
  const {
    familyMembers,
    archiveDocs,
    healthEntries,
    trips,
    loadingData,
    syncError,
  } = useAppContext()

  const healthUpcoming = useMemo(() => healthRows(healthEntries, familyMembers).slice(0, 5), [healthEntries, familyMembers])
  const archiveUpcoming = useMemo(() => archiveRows(archiveDocs).slice(0, 5), [archiveDocs])
  const tripUpcoming = useMemo(() => tripRows(trips), [trips])

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Dashboard</div>
          <h1>Scadenze di famiglia</h1>
          <p>Sto preparando i dati di famiglia, salute, archivio e viaggi.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Dashboard</div>
        <h1>Scadenze di famiglia</h1>
        <p>Tutto in alto, leggibile e sincronizzato: membri, documenti, salute e viaggi in un solo colpo d’occhio.</p>

        {syncError ? <div className="app-status" style={{ marginTop: 14 }}>{syncError}</div> : null}
      </section>

      <section className="card stack-card">
        <div className="between">
          <div>
            <div className="card-title">Scadenze prossime</div>
            <div className="muted">Solo scadenze viaggio con data, ordinate dal più vicino.</div>
          </div>
          <div className="badge badge-dash">{tripUpcoming.length} scadenze viaggio</div>
        </div>

        {tripUpcoming.length ? (
          <div className="drive-table-wrap">
            <table className="drive-table">
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
                {tripUpcoming.map((row) => (
                  <tr key={row.id}>
                    <td>{row.area}</td>
                    <td>{row.title}</td>
                    <td>{row.personOrContext}</td>
                    <td>{fmtDate(row.date)}</td>
                    <td>{row.note || '—'}</td>
                    <td>
                      <span className={`badge badge-${statusBadgeClass(row.date)}`}>
                        {statusBadgeLabel(row.date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBox text="Nessuna scadenza viaggio disponibile." />
        )}
      </section>

      <section className="grid-cards cols-2">
        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Salute</div>
              <div className="muted">Visite e controlli con data.</div>
            </div>
            <div className="badge badge-success">{healthUpcoming.length} elementi</div>
          </div>

          {healthUpcoming.length ? (
            <div className="drive-table-wrap">
              <table className="drive-table">
                <thead>
                  <tr>
                    <th>Membro</th>
                    <th>Tipo</th>
                    <th>Data</th>
                    <th>Medico</th>
                    <th>Luogo</th>
                  </tr>
                </thead>
                <tbody>
                  {healthUpcoming.map((row) => (
                    <tr key={row.id}>
                      <td>{row.member?.initials || row.member?.name || '—'}</td>
                      <td>{row.type || '—'}</td>
                      <td>{fmtDate(row.date)}</td>
                      <td>{row.doctor || '—'}</td>
                      <td>{row.location || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBox text="Nessuna visita o terapia con data disponibile." />
          )}
        </article>

        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Archivio</div>
              <div className="muted">Documenti con scadenza registrata.</div>
            </div>
            <div className="badge badge-warning">{archiveUpcoming.length} elementi</div>
          </div>

          {archiveUpcoming.length ? (
            <div className="drive-table-wrap">
              <table className="drive-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Intestatario</th>
                    <th>Titolo</th>
                    <th>Scadenza</th>
                    <th>Mancano</th>
                  </tr>
                </thead>
                <tbody>
                  {archiveUpcoming.map((row) => {
                    const days = daysBetween(row.expiryDate)
                    return (
                      <tr key={row.id}>
                        <td>{row.category || '—'}</td>
                        <td>{row.owner || '—'}</td>
                        <td>{row.title || '—'}</td>
                        <td>{fmtDate(row.expiryDate)}</td>
                        <td>{days === null ? '—' : days >= 0 ? `${days} giorni` : 'scaduto'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBox text="Nessun documento con scadenza disponibile." />
          )}
        </article>
      </section>

      <section className="card stack-card">
        <div className="between">
          <div>
            <div className="card-title">Viaggi attivi</div>
            <div className="muted">Riepilogo sintetico dei viaggi presenti in archivio.</div>
          </div>
          <div className="badge badge-dash">{trips.length} viaggi</div>
        </div>

        {trips.length ? (
          <div className="timeline-list">
            {trips.map((trip) => (
              <div key={trip.id} className="timeline-item">
                <div className="between">
                  <div>
                    <div className="strong">{trip.name || 'Viaggio'}</div>
                    <div className="small muted">
                      {trip.dateFrom ? fmtDate(trip.dateFrom) : 'Data non disponibile'}
                      {trip.dateTo ? ` → ${fmtDate(trip.dateTo)}` : ''}
                    </div>
                    <div className="small muted">
                      {(trip.persons || []).length} partecipanti · {(trip.flights || []).length} voli · {(trip.hotels || []).length} hotel
                    </div>
                  </div>
                  <span className={`badge badge-${tripStatusClass(trip.status)}`}>{tripStatusLabel(trip.status)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyBox text="Nessun viaggio presente." />
        )}
      </section>
    </div>
  )
}
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

function ProgressBar({ value, total }) {
  const safeTotal = total > 0 ? total : 0
  const pct = safeTotal > 0 ? Math.min(100, Math.round((value / safeTotal) * 100)) : 0

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          width: '100%',
          height: 10,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
          }}
        />
      </div>
      <div className="muted">{pct}% completato</div>
    </div>
  )
}

export default function DashboardPage() {
  const {
    trips,
    familyMembers,
    archiveTables,
    healthTables,
    loadingData,
    syncError,
  } = useAppContext()

  const documents = archiveTables?.documents || []
  const warranties = archiveTables?.warranties || []
  const therapies = healthTables?.therapies || []
  const appointments = healthTables?.appointments || []

  const stats = useMemo(() => {
    const activeTrips = trips.filter((trip) => trip.status === 'incoming' || trip.status === 'ongoing')

    const checklistTotal = trips.reduce((acc, trip) => {
      const groups = trip.packingChecklist || []
      return (
        acc +
        groups.reduce((groupAcc, group) => groupAcc + (group.items?.length || 0), 0)
      )
    }, 0)

    const checklistDone = trips.reduce((acc, trip) => {
      const groups = trip.packingChecklist || []
      return (
        acc +
        groups.reduce(
          (groupAcc, group) =>
            groupAcc + (group.items || []).filter((item) => item.done).length,
          0
        )
      )
    }, 0)

    const docsWithExpiry = documents.filter((doc) => doc.expiryDate)
    const nextExpiry = sortByDate(docsWithExpiry, (doc) => doc.expiryDate)[0] || null

    const nextAppointment =
      sortByDate(
        appointments.filter((row) => row.date),
        (row) => row.date
      )[0] || null

    return {
      familyCount: familyMembers.length,
      activeTrips: activeTrips.length,
      totalTrips: trips.length,
      archiveCount: documents.length + warranties.length,
      documentsCount: documents.length,
      warrantiesCount: warranties.length,
      healthCount: therapies.length + appointments.length,
      therapiesCount: therapies.length,
      appointmentsCount: appointments.length,
      checklistDone,
      checklistTotal,
      nextExpiry,
      nextAppointment,
    }
  }, [trips, familyMembers, documents, warranties, therapies, appointments])

  const nextTrips = useMemo(() => {
    return sortByDate(
      trips.filter((trip) => trip.dateFrom),
      (trip) => trip.dateFrom
    ).slice(0, 4)
  }, [trips])

  const upcomingAppointments = useMemo(() => {
    return sortByDate(
      appointments.filter((row) => row.date),
      (row) => row.date
    ).slice(0, 5)
  }, [appointments])

  const expiringDocuments = useMemo(() => {
    return sortByDate(
      documents.filter((row) => row.expiryDate),
      (row) => row.expiryDate
    ).slice(0, 5)
  }, [documents])

  const recentDocuments = useMemo(() => {
    return [...documents].slice(-5).reverse()
  }, [documents])

  const familyOverview = useMemo(() => {
    return familyMembers.map((member) => {
      const memberAppointments = appointments.filter((row) => row.memberId === member.id)
      const nextMemberAppointment =
        sortByDate(
          memberAppointments.filter((row) => row.date),
          (row) => row.date
        )[0] || null

      return {
        id: member.id,
        initials: member.initials || '—',
        name: member.name || 'Senza nome',
        role: member.role || '—',
        medications: member.medications?.length || 0,
        doctor: member.doctor || member.pediatrician || 'Non indicato',
        bloodGroup: member.bloodGroup || '—',
        nextAppointment: nextMemberAppointment,
      }
    })
  }, [familyMembers, appointments])

  const urgentItems = useMemo(() => {
    const expiringDocs = documents
      .filter((doc) => doc.expiryDate)
      .map((doc) => ({
        id: `doc_${doc.id}`,
        type: 'document',
        title: doc.title || 'Documento',
        subtitle: [doc.category, doc.owner].filter(Boolean).join(' · '),
        date: doc.expiryDate,
        days: daysBetween(doc.expiryDate),
      }))

    const visitItems = appointments
      .filter((item) => item.date)
      .map((item) => {
        const member = familyMembers.find((m) => m.id === item.memberId)
        return {
          id: `app_${item.id}`,
          type: 'appointment',
          title: item.type || 'Appuntamento',
          subtitle: member?.name || member?.initials || item.memberId || 'Membro',
          date: item.date,
          days: daysBetween(item.date),
        }
      })

    return [...expiringDocs, ...visitItems]
      .filter((item) => item.days !== null)
      .sort((a, b) => a.days - b.days)
      .slice(0, 6)
  }, [documents, appointments, familyMembers])

  if (loadingData) {
    return (
      <div className="page-stack">
        <div className="hero-card">
          <div className="eyebrow">Dashboard</div>
          <h1>Caricamento in corso...</h1>
          <p className="muted">Sto preparando i dati di famiglia, salute, archivio e viaggi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Dashboard</div>
        <h1>Panoramica Family Hub</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Tutto in alto, leggibile e sincronizzato: membri, documenti, salute e viaggi in un solo colpo d’occhio.
        </p>

        <div className="hero-meta" style={{ marginTop: 12 }}>
          <span className="meta-chip">👨‍👩‍👧‍👦 {stats.familyCount} membri</span>
          <span className="meta-chip">✈️ {stats.activeTrips} viaggi attivi</span>
          <span className="meta-chip">🗂️ {stats.archiveCount} elementi archivio</span>
          <span className="meta-chip">❤️ {stats.healthCount} elementi salute</span>
        </div>

        {syncError ? (
          <div className="app-status" style={{ marginTop: 14 }}>
            {syncError}
          </div>
        ) : null}
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-label">Membri famiglia</div>
          <div className="stat-value">{stats.familyCount}</div>
          <div className="stat-note">Anagrafica attualmente caricata</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">Viaggi aperti</div>
          <div className="stat-value">{stats.activeTrips}</div>
          <div className="stat-note">{stats.totalTrips} viaggi totali registrati</div>
        </article>

        <article className="stat-card">
          <div className="stat-label">Archivio totale</div>
          <div className="stat-value">{stats.archiveCount}</div>
          <div className="stat-note">
            {stats.documentsCount} documenti · {stats.warrantiesCount} garanzie
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-label">Salute totale</div>
          <div className="stat-value">{stats.healthCount}</div>
          <div className="stat-note">
            {stats.therapiesCount} terapie · {stats.appointmentsCount} appuntamenti
          </div>
        </article>
      </section>

      <section className="grid-cards cols-2">
        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Checklist viaggi</div>
              <div className="muted">Avanzamento complessivo di tutte le valigie</div>
            </div>
            <span className="badge">
              {stats.checklistDone}/{stats.checklistTotal}
            </span>
          </div>

          {stats.checklistTotal === 0 ? (
            <EmptyBox text="Nessuna checklist disponibile." />
          ) : (
            <ProgressBar value={stats.checklistDone} total={stats.checklistTotal} />
          )}
        </article>

        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Prossima scadenza</div>
              <div className="muted">Il prossimo elemento utile da monitorare</div>
            </div>
          </div>

          {!stats.nextExpiry && !stats.nextAppointment ? (
            <EmptyBox text="Nessuna scadenza o visita registrata." />
          ) : (
            <div className="grid-cards responsive-2">
              <div className="subsection-box">
                <div className="card-subtitle">Documento</div>
                <div>{stats.nextExpiry?.title || '—'}</div>
                <div className="muted">
                  {stats.nextExpiry?.expiryDate ? fmtDate(stats.nextExpiry.expiryDate) : 'Nessuna data'}
                </div>
              </div>

              <div className="subsection-box">
                <div className="card-subtitle">Visita</div>
                <div>{stats.nextAppointment?.type || '—'}</div>
                <div className="muted">
                  {stats.nextAppointment?.date ? fmtDate(stats.nextAppointment.date) : 'Nessuna data'}
                </div>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="grid-cards cols-2">
        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Prossimi viaggi</div>
              <div className="muted">Partenze ordinate per data</div>
            </div>
          </div>

          {nextTrips.length === 0 ? (
            <EmptyBox text="Nessun viaggio registrato." />
          ) : (
            <div className="list-clean">
              {nextTrips.map((trip) => {
                const days = daysBetween(trip.dateFrom)
                return (
                  <div key={trip.id} className="list-item">
                    <div className="between">
                      <div>
                        <div className="card-subtitle">{trip.name || 'Viaggio senza nome'}</div>
                        <div className="muted">
                          {fmtDate(trip.dateFrom)} → {fmtDate(trip.dateTo)}
                        </div>
                      </div>
                      <span className={`badge ${tripStatusClass(trip.status)}`}>
                        {tripStatusLabel(trip.status)}
                      </span>
                    </div>

                    <div className="hero-meta" style={{ marginTop: 10 }}>
                      <span className="meta-chip">👥 {trip.persons?.length || 0} partecipanti</span>
                      <span className="meta-chip">🏨 {trip.hotels?.length || 0} hotel</span>
                      <span className="meta-chip">🛫 {trip.flights?.length || 0} voli</span>
                      <span className="meta-chip">
                        ⏳ {days === null ? 'data non valida' : days >= 0 ? `${days} giorni` : 'già iniziato'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </article>

        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Priorità rapide</div>
              <div className="muted">Scadenze e visite più vicine</div>
            </div>
          </div>

          {urgentItems.length === 0 ? (
            <EmptyBox text="Nessuna priorità imminente." />
          ) : (
            <div className="list-clean">
              {urgentItems.map((item) => (
                <div key={item.id} className="list-item">
                  <div className="between">
                    <div>
                      <div className="card-subtitle">
                        {item.type === 'document' ? '🗂️' : '🩺'} {item.title}
                      </div>
                      <div className="muted">{item.subtitle || '—'}</div>
                    </div>
                    <span className={`badge ${item.days < 0 ? 'danger' : item.days <= 7 ? 'warning' : ''}`}>
                      {item.days < 0 ? 'Scaduto' : `${item.days} gg`}
                    </span>
                  </div>
                  <div className="muted" style={{ marginTop: 8 }}>
                    Data: {fmtDate(item.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="grid-cards cols-2">
        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Prossime visite</div>
              <div className="muted">Agenda sanitaria essenziale</div>
            </div>
          </div>

          {upcomingAppointments.length === 0 ? (
            <EmptyBox text="Nessuna visita in agenda." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
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
                  {upcomingAppointments.map((row) => {
                    const member = familyMembers.find((m) => m.id === row.memberId)
                    return (
                      <tr key={row.id}>
                        <td>{member?.initials || member?.name || row.memberId || '—'}</td>
                        <td>{row.type || '—'}</td>
                        <td>{fmtDate(row.date)}</td>
                        <td>{row.doctor || '—'}</td>
                        <td>{row.location || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="card stack-card">
          <div className="card-title">Documenti in scadenza</div>
          <div className="muted">Controllo rapido delle prossime date utili</div>

          {expiringDocuments.length === 0 ? (
            <EmptyBox text="Nessun documento con scadenza registrata." />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
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
                  {expiringDocuments.map((row) => {
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
          )}
        </article>
      </section>

      <section className="grid-cards cols-2">
        <article className="card stack-card">
          <div className="card-title">Ultimi documenti</div>
          <div className="muted">Inserimenti recenti dall’archivio</div>

          {recentDocuments.length === 0 ? (
            <EmptyBox text="Nessun documento disponibile." />
          ) : (
            <div className="list-clean">
              {recentDocuments.map((doc) => (
                <div key={doc.id} className="list-item">
                  <div className="between">
                    <div>
                      <div className="card-subtitle">{doc.title || 'Documento'}</div>
                      <div className="muted">
                        {[doc.category, doc.owner].filter(Boolean).join(' · ') || 'Senza dettagli'}
                      </div>
                    </div>
                    <span className="badge">{fmtDate(doc.issueDate)}</span>
                  </div>

                  <div className="hero-meta" style={{ marginTop: 10 }}>
                    <span className="meta-chip">🔗 {doc.driveLinks?.length || 0} link</span>
                    <span className="meta-chip">📂 {doc.storage || 'Nessuna posizione'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card stack-card">
          <div className="card-title">Membri famiglia</div>
          <div className="muted">Scheda sintetica per ogni persona</div>

          {familyOverview.length === 0 ? (
            <EmptyBox text="Nessun membro disponibile." />
          ) : (
            <div className="list-clean">
              {familyOverview.map((member) => (
                <div key={member.id} className="list-item">
                  <div className="between">
                    <div>
                      <div className="card-subtitle">
                        {member.initials} · {member.name}
                      </div>
                      <div className="muted">{member.role}</div>
                    </div>
                    <span className="badge">{member.bloodGroup}</span>
                  </div>

                  <div className="hero-meta" style={{ marginTop: 10 }}>
                    <span className="meta-chip">💊 {member.medications} farmaci</span>
                    <span className="meta-chip">🩺 {member.doctor}</span>
                    <span className="meta-chip">
                      📅 {member.nextAppointment?.date ? fmtDate(member.nextAppointment.date) : 'nessuna visita'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
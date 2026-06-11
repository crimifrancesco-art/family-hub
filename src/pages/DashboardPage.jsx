import { useMemo } from 'react'
import { useAppContext } from '../context/AppContext'

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function formatDate(value) {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function daysUntil(value) {
  if (!value) return null
  const target = new Date(`${value}T09:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function visitStatusLabel(days) {
  if (days === null) return 'Senza data'
  if (days < 0) return 'Passata'
  if (days === 0) return 'Oggi'
  if (days === 1) return 'Domani'
  if (days <= 7) return `Tra ${days} gg`
  return `Tra ${days} gg`
}

function tripStatusLabel(days) {
  if (days === null) return 'Da pianificare'
  if (days < 0) return 'Concluso'
  if (days === 0) return 'In partenza'
  if (days === 1) return 'Domani'
  return `Tra ${days} gg`
}

function compactMemberName(member) {
  return member?.name || member?.role || member?.initials || 'Membro'
}

function StatCard({ label, value, note, tone = 'default' }) {
  return (
    <div className={`dash-stat dash-stat-${tone}`}>
      <div className="dash-stat-label">{label}</div>
      <div className="dash-stat-value">{value}</div>
      <div className="dash-stat-note">{note}</div>
    </div>
  )
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="dash-section-head">
      <div>
        <div className="dash-section-title">{title}</div>
        {subtitle ? <div className="dash-section-subtitle">{subtitle}</div> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

export default function DashboardPage() {
  const { familyMembers, healthTables, archiveItems, trips, loadingData, syncError } = useAppContext()

  const specialistVisits = ensureArray(healthTables?.specialistVisits)
  const visitTherapies = ensureArray(healthTables?.visitTherapies)

  const dashboardData = useMemo(() => {
    const members = ensureArray(familyMembers)
    const archive = ensureArray(archiveItems)
    const travelList = ensureArray(trips)

    const upcomingVisits = specialistVisits
      .map((visit) => {
        const member = members.find((m) => m.id === visit.memberId)
        const diff = daysUntil(visit.date)
        return {
          ...visit,
          memberName: compactMemberName(member),
          days: diff,
        }
      })
      .filter((visit) => visit.days === null || visit.days >= 0)
      .sort((a, b) => {
        const left = `${a.date || '9999-99-99'}_${a.time || '99:99'}`
        const right = `${b.date || '9999-99-99'}_${b.time || '99:99'}`
        return left.localeCompare(right)
      })

    const recentVisits = specialistVisits
      .map((visit) => {
        const member = members.find((m) => m.id === visit.memberId)
        return {
          ...visit,
          memberName: compactMemberName(member),
        }
      })
      .sort((a, b) => {
        const left = `${b.date || ''}_${b.time || ''}`
        const right = `${a.date || ''}_${a.time || ''}`
        return left.localeCompare(right)
      })
      .slice(0, 5)

    const therapiesByMember = members.map((member) => {
      const memberTherapies = visitTherapies.filter((therapy) => therapy.memberId === member.id)
      return {
        id: member.id,
        name: compactMemberName(member),
        count: memberTherapies.length,
      }
    })

    const medicationsCount = members.reduce((acc, member) => {
      return acc + ensureArray(member.medications).length
    }, 0)

    const nextTrip = travelList
      .map((trip) => ({
        ...trip,
        days: daysUntil(trip.startDate || trip.dateFrom || trip.date),
      }))
      .filter((trip) => trip.days === null || trip.days >= 0)
      .sort((a, b) => {
        const left = `${a.startDate || a.dateFrom || a.date || '9999-99-99'}`
        const right = `${b.startDate || b.dateFrom || b.date || '9999-99-99'}`
        return left.localeCompare(right)
      })[0]

    const archiveRecent = archive
      .slice()
      .sort((a, b) => `${b.updatedAt || b.createdAt || ''}`.localeCompare(`${a.updatedAt || a.createdAt || ''}`))
      .slice(0, 6)

    return {
      membersCount: members.length,
      upcomingVisits,
      recentVisits,
      therapiesByMember,
      medicationsCount,
      nextTrip,
      archiveRecent,
      archiveCount: archive.length,
      totalVisits: specialistVisits.length,
      totalTherapies: visitTherapies.length,
    }
  }, [familyMembers, specialistVisits, visitTherapies, archiveItems, trips])

  if (loadingData) {
    return (
      <div className="dash-page">
        <div className="card">
          <div className="page-title">Dashboard</div>
          <p className="page-subtitle">Sto caricando la panoramica del Family Hub.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-page">
      <style>{`
        .dash-page {
          display: grid;
          gap: 14px;
        }

        .dash-grid-main {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
          gap: 14px;
        }

        .dash-grid-half {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .dash-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .dash-stat {
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(120, 138, 164, 0.12);
          background: rgba(255, 255, 255, 0.92);
          display: grid;
          gap: 6px;
          min-height: 116px;
        }

        .dash-stat-primary {
          background: linear-gradient(180deg, rgba(37, 99, 235, 0.10), rgba(255,255,255,0.96));
          border-color: rgba(37, 99, 235, 0.16);
        }

        .dash-stat-success {
          background: linear-gradient(180deg, rgba(22, 163, 74, 0.08), rgba(255,255,255,0.96));
          border-color: rgba(22, 163, 74, 0.14);
        }

        .dash-stat-warning {
          background: linear-gradient(180deg, rgba(245, 158, 11, 0.10), rgba(255,255,255,0.96));
          border-color: rgba(245, 158, 11, 0.18);
        }

        .dash-stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted, #667085);
          font-weight: 700;
        }

        .dash-stat-value {
          font-size: 30px;
          line-height: 1;
          letter-spacing: -0.03em;
          font-weight: 800;
          color: #0f172a;
        }

        .dash-stat-note {
          font-size: 12px;
          line-height: 1.45;
          color: var(--muted, #667085);
        }

        .dash-hero {
          display: grid;
          gap: 14px;
        }

        .dash-hero-card,
        .dash-panel,
        .dash-list-card {
          border-radius: 22px;
          border: 1px solid rgba(120, 138, 164, 0.12);
          background: rgba(255, 255, 255, 0.92);
          padding: 16px;
        }

        .dash-hero-card {
          display: grid;
          gap: 14px;
        }

        .dash-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.10);
          color: #2563eb;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .dash-hero-title {
          font-size: 28px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .dash-hero-subtitle {
          font-size: 14px;
          color: var(--muted, #667085);
          line-height: 1.55;
          max-width: 70ch;
        }

        .dash-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .dash-mini {
          border-radius: 16px;
          background: rgba(248, 250, 252, 0.96);
          border: 1px solid rgba(120, 138, 164, 0.10);
          padding: 12px;
          display: grid;
          gap: 4px;
        }

        .dash-mini-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted, #667085);
          font-weight: 700;
        }

        .dash-mini-value {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.1;
          color: #0f172a;
        }

        .dash-mini-note {
          font-size: 12px;
          color: var(--muted, #667085);
          line-height: 1.45;
        }

        .dash-section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .dash-section-title {
          font-size: 16px;
          line-height: 1.2;
          font-weight: 800;
          color: #0f172a;
        }

        .dash-section-subtitle {
          margin-top: 4px;
          font-size: 12px;
          color: var(--muted, #667085);
          line-height: 1.45;
        }

        .dash-rows {
          display: grid;
          gap: 10px;
        }

        .dash-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(248, 250, 252, 0.94);
          border: 1px solid rgba(120, 138, 164, 0.10);
        }

        .dash-row-left {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .dash-row-title {
          font-size: 14px;
          line-height: 1.25;
          font-weight: 700;
          color: #0f172a;
        }

        .dash-row-subtitle {
          font-size: 12px;
          line-height: 1.4;
          color: var(--muted, #667085);
        }

        .dash-row-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .dash-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 28px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .dash-badge-neutral {
          background: rgba(148, 163, 184, 0.10);
          color: #475569;
          border-color: rgba(148, 163, 184, 0.16);
        }

        .dash-badge-primary {
          background: rgba(37, 99, 235, 0.10);
          color: #2563eb;
          border-color: rgba(37, 99, 235, 0.16);
        }

        .dash-badge-success {
          background: rgba(22, 163, 74, 0.10);
          color: #15803d;
          border-color: rgba(22, 163, 74, 0.16);
        }

        .dash-badge-warning {
          background: rgba(245, 158, 11, 0.10);
          color: #b45309;
          border-color: rgba(245, 158, 11, 0.18);
        }

        .dash-badge-danger {
          background: rgba(220, 38, 38, 0.10);
          color: #b91c1c;
          border-color: rgba(220, 38, 38, 0.16);
        }

        .dash-member-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .dash-member-card {
          border-radius: 16px;
          padding: 12px;
          background: rgba(248, 250, 252, 0.95);
          border: 1px solid rgba(120, 138, 164, 0.10);
          display: grid;
          gap: 6px;
        }

        .dash-member-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .dash-member-count {
          font-size: 22px;
          line-height: 1;
          font-weight: 800;
          color: #0f172a;
        }

        .dash-member-note {
          font-size: 12px;
          color: var(--muted, #667085);
        }

        .dash-empty {
          border-radius: 16px;
          padding: 14px;
          background: rgba(248, 250, 252, 0.86);
          border: 1px dashed rgba(120, 138, 164, 0.18);
          color: var(--muted, #667085);
          font-size: 13px;
          line-height: 1.5;
        }

        .dash-alert {
          border-radius: 16px;
          padding: 12px 14px;
          border: 1px solid rgba(220, 38, 38, 0.14);
          background: rgba(220, 38, 38, 0.06);
          color: #991b1b;
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 1100px) {
          .dash-grid-main,
          .dash-grid-half,
          .dash-stat-grid,
          .dash-strip,
          .dash-member-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {syncError ? (
        <div className="dash-alert">
          Errore di sincronizzazione: {String(syncError)}
        </div>
      ) : null}

      <div className="dash-stat-grid">
        <StatCard
          label="Familiari"
          value={dashboardData.membersCount}
          note="Persone gestite nel Family Hub"
          tone="primary"
        />
        <StatCard
          label="Visite"
          value={dashboardData.totalVisits}
          note="Storico visite registrate"
        />
        <StatCard
          label="Terapie"
          value={dashboardData.totalTherapies}
          note="Terapie collegate alle visite"
          tone="success"
        />
        <StatCard
          label="Documenti"
          value={dashboardData.archiveCount}
          note="Elementi presenti in archivio"
          tone="warning"
        />
      </div>

      <div className="dash-grid-main">
        <div className="dash-hero">
          <div className="dash-hero-card">
            <div className="dash-kicker">Panoramica operativa</div>

            <div>
              <h2 className="dash-hero-title">Tutto quello che conta, subito visibile.</h2>
              <div className="dash-hero-subtitle">
                La dashboard riassume salute, archivio e viaggi in una vista unica, con
                priorità alle informazioni imminenti e ai dati che richiedono attenzione.
              </div>
            </div>

            <div className="dash-strip">
              <div className="dash-mini">
                <div className="dash-mini-label">Prossima visita</div>
                <div className="dash-mini-value">
                  {dashboardData.upcomingVisits[0]
                    ? formatDate(dashboardData.upcomingVisits[0].date)
                    : '—'}
                </div>
                <div className="dash-mini-note">
                  {dashboardData.upcomingVisits[0]
                    ? `${dashboardData.upcomingVisits[0].title} · ${dashboardData.upcomingVisits[0].memberName}`
                    : 'Nessuna visita pianificata'}
                </div>
              </div>

              <div className="dash-mini">
                <div className="dash-mini-label">Farmaci personali</div>
                <div className="dash-mini-value">{dashboardData.medicationsCount}</div>
                <div className="dash-mini-note">
                  Terapie continuative inserite nei profili famiglia
                </div>
              </div>

              <div className="dash-mini">
                <div className="dash-mini-label">Prossimo viaggio</div>
                <div className="dash-mini-value">
                  {dashboardData.nextTrip
                    ? formatDate(
                        dashboardData.nextTrip.startDate ||
                          dashboardData.nextTrip.dateFrom ||
                          dashboardData.nextTrip.date,
                      )
                    : '—'}
                </div>
                <div className="dash-mini-note">
                  {dashboardData.nextTrip
                    ? dashboardData.nextTrip.title ||
                      dashboardData.nextTrip.destination ||
                      'Viaggio pianificato'
                    : 'Nessun viaggio imminente'}
                </div>
              </div>
            </div>
          </div>

          <div className="dash-panel">
            <SectionTitle
              title="Visite imminenti"
              subtitle="Le prossime scadenze sanitarie da tenere d’occhio."
            />

            {dashboardData.upcomingVisits.length ? (
              <div className="dash-rows">
                {dashboardData.upcomingVisits.slice(0, 5).map((visit) => {
                  const tone =
                    visit.days === null
                      ? 'neutral'
                      : visit.days <= 1
                        ? 'danger'
                        : visit.days <= 7
                          ? 'warning'
                          : 'primary'

                  return (
                    <div key={visit.id} className="dash-row">
                      <div className="dash-row-left">
                        <div className="dash-row-title">{visit.title || 'Visita'}</div>
                        <div className="dash-row-subtitle">
                          {visit.memberName} · {visit.specialty || 'Specialità'} · {formatDate(visit.date)}
                          {visit.time ? ` · ${visit.time}` : ''}
                        </div>
                      </div>

                      <div className="dash-row-right">
                        <span className={`dash-badge dash-badge-${tone}`}>
                          {visitStatusLabel(visit.days)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="dash-empty">Nessuna visita futura disponibile.</div>
            )}
          </div>
        </div>

        <div className="dash-list-card">
          <SectionTitle
            title="Focus rapido"
            subtitle="Stato sintetico delle aree più utili."
          />

          <div className="dash-rows">
            <div className="dash-row">
              <div className="dash-row-left">
                <div className="dash-row-title">Archivio condiviso</div>
                <div className="dash-row-subtitle">
                  Materiali salvati e pronti da recuperare al bisogno
                </div>
              </div>
              <div className="dash-row-right">
                <span className="dash-badge dash-badge-primary">{dashboardData.archiveCount}</span>
              </div>
            </div>

            <div className="dash-row">
              <div className="dash-row-left">
                <div className="dash-row-title">Terapie attive / storiche</div>
                <div className="dash-row-subtitle">
                  Numero totale di terapie registrate nel sistema
                </div>
              </div>
              <div className="dash-row-right">
                <span className="dash-badge dash-badge-success">{dashboardData.totalTherapies}</span>
              </div>
            </div>

            <div className="dash-row">
              <div className="dash-row-left">
                <div className="dash-row-title">Farmaci personali</div>
                <div className="dash-row-subtitle">
                  Farmaci associati direttamente ai profili familiari
                </div>
              </div>
              <div className="dash-row-right">
                <span className="dash-badge dash-badge-warning">{dashboardData.medicationsCount}</span>
              </div>
            </div>

            <div className="dash-row">
              <div className="dash-row-left">
                <div className="dash-row-title">Viaggio più vicino</div>
                <div className="dash-row-subtitle">
                  Primo itinerario pianificato in ordine temporale
                </div>
              </div>
              <div className="dash-row-right">
                <span className="dash-badge dash-badge-neutral">
                  {dashboardData.nextTrip
                    ? tripStatusLabel(dashboardData.nextTrip.days)
                    : 'Nessuno'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid-half">
        <div className="dash-panel">
          <SectionTitle
            title="Terapie per familiare"
            subtitle="Distribuzione semplice per capire chi ha più elementi attivi o storici."
          />

          {dashboardData.therapiesByMember.length ? (
            <div className="dash-member-grid">
              {dashboardData.therapiesByMember.map((item) => (
                <div key={item.id} className="dash-member-card">
                  <div className="dash-member-name">{item.name}</div>
                  <div className="dash-member-count">{item.count}</div>
                  <div className="dash-member-note">Terapie registrate</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty">Nessun familiare disponibile.</div>
          )}
        </div>

        <div className="dash-panel">
          <SectionTitle
            title="Archivio recente"
            subtitle="Ultimi elementi aggiornati o creati."
          />

          {dashboardData.archiveRecent.length ? (
            <div className="dash-rows">
              {dashboardData.archiveRecent.map((item, index) => (
                <div key={item.id || `${item.title}_${index}`} className="dash-row">
                  <div className="dash-row-left">
                    <div className="dash-row-title">
                      {item.title || item.name || item.label || 'Documento'}
                    </div>
                    <div className="dash-row-subtitle">
                      {(item.category || item.type || 'Archivio')} ·{' '}
                      {formatDate(item.updatedAt || item.createdAt || item.date)}
                    </div>
                  </div>

                  <div className="dash-row-right">
                    <span className="dash-badge dash-badge-neutral">
                      {item.status || item.folder || 'Salvato'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty">L’archivio è ancora vuoto.</div>
          )}
        </div>
      </div>

      <div className="dash-grid-half">
        <div className="dash-panel">
          <SectionTitle
            title="Storico visite"
            subtitle="Le ultime visite registrate, anche se già passate."
          />

          {dashboardData.recentVisits.length ? (
            <div className="dash-rows">
              {dashboardData.recentVisits.map((visit) => (
                <div key={visit.id} className="dash-row">
                  <div className="dash-row-left">
                    <div className="dash-row-title">{visit.title || 'Visita'}</div>
                    <div className="dash-row-subtitle">
                      {visit.memberName} · {visit.specialty || 'Specialità'} · {formatDate(visit.date)}
                    </div>
                  </div>

                  <div className="dash-row-right">
                    <span className="dash-badge dash-badge-neutral">
                      {visit.status || 'Registrata'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty">Nessuna visita registrata.</div>
          )}
        </div>

        <div className="dash-panel">
          <SectionTitle
            title="Viaggi"
            subtitle="Vista rapida sul prossimo spostamento pianificato."
          />

          {dashboardData.nextTrip ? (
            <div className="dash-rows">
              <div className="dash-row">
                <div className="dash-row-left">
                  <div className="dash-row-title">
                    {dashboardData.nextTrip.title ||
                      dashboardData.nextTrip.destination ||
                      'Viaggio'}
                  </div>
                  <div className="dash-row-subtitle">
                    {formatDate(
                      dashboardData.nextTrip.startDate ||
                        dashboardData.nextTrip.dateFrom ||
                        dashboardData.nextTrip.date,
                    )}
                    {dashboardData.nextTrip.endDate || dashboardData.nextTrip.dateTo
                      ? ` → ${formatDate(
                          dashboardData.nextTrip.endDate || dashboardData.nextTrip.dateTo,
                        )}`
                      : ''}
                  </div>
                </div>

                <div className="dash-row-right">
                  <span className="dash-badge dash-badge-primary">
                    {tripStatusLabel(dashboardData.nextTrip.days)}
                  </span>
                </div>
              </div>

              {(dashboardData.nextTrip.notes || dashboardData.nextTrip.description) ? (
                <div className="dash-empty">
                  {dashboardData.nextTrip.notes || dashboardData.nextTrip.description}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="dash-empty">Nessun viaggio presente al momento.</div>
          )}
        </div>
      </div>
    </div>
  )
}
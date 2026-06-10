import { useEffect, useMemo, useState } from 'react'
import { AIRLINE_DIRECTORY, TRIP_STATUS_OPTIONS, useAppContext } from '../context/AppContext'

const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

function fmtDate(value) {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function diffDays(value) {
  if (!value) return null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const normalized = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((normalized.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function tripStatusLabel(status) {
  return TRIP_STATUS_OPTIONS.find((item) => item.value === status)?.label || status || '—'
}

function tripStatusBadge(status) {
  if (status === 'incoming' || status === 'ongoing') return 'badge-travel'
  if (status === 'planning') return 'badge-warning'
  if (status === 'cancelled') return 'badge-danger'
  return 'badge-muted'
}

function mapsLink(address, lat, lng) {
  if (lat && lng) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''
}

function directionsLink(address, lat, lng) {
  const destination = lat && lng ? `${lat},${lng}` : address
  if (!destination) return ''
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

function googleCalendarLink({ title, startDate, endDate, details = '', location = '' }) {
  if (!startDate) return ''
  const start = `${startDate.replaceAll('-', '')}T090000`
  const end = `${(endDate || startDate).replaceAll('-', '')}T100000`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
}

function youtubeThumb(url) {
  const match = url?.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : ''
}

function guessMediaThumb(type, url, thumb) {
  if (thumb) return thumb
  if (type === 'youtube') return youtubeThumb(url)
  return ''
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>
}

function TravelMetric({ icon, label, value, sub }) {
  return (
    <div className="widget-card wc-travel" style={{ cursor: 'default' }}>
      <div className="widget-icon">{icon}</div>
      <div className="widget-label">{label}</div>
      <div className="widget-value">{value}</div>
      <div className="widget-sub">{sub}</div>
    </div>
  )
}

function tripCover(name) {
  const seed = encodeURIComponent(name || 'family travel')
  return `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80&${seed}`
}

export default function ViaggiPage() {
  const {
    trips,
    familyMembers,
    loadingData,
    syncError,
    addTrip,
    updateTrip,
    deleteTrip,
    toggleTripMember,
    addFlight,
    updateFlight,
    deleteFlight,
    invertFlightRoute,
  } = useAppContext()

  const members = familyMembers || []
  const tripList = trips || []

  const [selectedTripId, setSelectedTripId] = useState(tripList[0]?.id || '')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!tripList.length) {
      setSelectedTripId('')
      return
    }
    if (!tripList.some((trip) => trip.id === selectedTripId)) {
      setSelectedTripId(tripList[0].id)
    }
  }, [selectedTripId, tripList])

  const selectedTrip = useMemo(
    () => tripList.find((trip) => trip.id === selectedTripId) || tripList[0] || null,
    [selectedTripId, tripList],
  )

  const travelSummary = useMemo(() => {
    const activeTrips = tripList.filter((trip) => trip.status === 'incoming' || trip.status === 'ongoing')
    const deadlines = tripList.reduce((acc, trip) => acc + (trip.generalDeadlines || []).length, 0)
    const flights = tripList.reduce((acc, trip) => acc + (trip.flights || []).length, 0)
    const hotels = tripList.reduce((acc, trip) => acc + (trip.hotels || []).length, 0)

    return {
      totalTrips: tripList.length,
      activeTrips: activeTrips.length,
      deadlines,
      flights,
      hotels,
    }
  }, [tripList])

  function createTrip() {
    addTrip({
      name: 'Nuovo viaggio',
      status: 'planning',
      dateFrom: '',
      dateTo: '',
      persons: [],
      flights: [],
      hotels: [],
      parkingReservations: [],
      carRentals: [],
      travelDiary: { days: [], places: [], mediaLinks: [], notes: '' },
      generalDeadlines: [],
    })
  }

  function updateSelectedTrip(patch) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, patch)
  }

  function addHotel() {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      hotels: [
        ...(selectedTrip.hotels || []),
        {
          id: uid('hotel'),
          name: '',
          phone: '',
          address: '',
          lat: '',
          lng: '',
          bookingUrl: '',
          alternateUrl: '',
          checkIn: '',
          checkOut: '',
          paidAmount: '',
          dueAmount: '',
          paymentMethod: '',
          cancellationDate: '',
          deadlines: [],
        },
      ],
    })
  }

  function updateHotel(hotelId, patch) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      hotels: (selectedTrip.hotels || []).map((hotel) =>
        hotel.id === hotelId ? { ...hotel, ...patch } : hotel,
      ),
    })
  }

  function deleteHotel(hotelId) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      hotels: (selectedTrip.hotels || []).filter((hotel) => hotel.id !== hotelId),
    })
  }

  function addDeadline() {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      generalDeadlines: [
        ...(selectedTrip.generalDeadlines || []),
        {
          id: uid('ddl'),
          title: 'Nuova scadenza',
          date: '',
          note: '',
          url: '',
        },
      ],
    })
  }

  function updateDeadline(deadlineId, patch) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      generalDeadlines: (selectedTrip.generalDeadlines || []).map((row) =>
        row.id === deadlineId ? { ...row, ...patch } : row,
      ),
    })
  }

  function deleteDeadline(deadlineId) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      generalDeadlines: (selectedTrip.generalDeadlines || []).filter((row) => row.id !== deadlineId),
    })
  }

  function addChecklistGroup() {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      packingChecklist: [
        ...(selectedTrip.packingChecklist || []),
        { id: uid('grp'), category: 'Nuova categoria', color: 'blue', items: [] },
      ],
    })
  }

  function updateChecklistGroup(groupId, patch) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      packingChecklist: (selectedTrip.packingChecklist || []).map((group) =>
        group.id === groupId ? { ...group, ...patch } : group,
      ),
    })
  }

  function deleteChecklistGroup(groupId) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      packingChecklist: (selectedTrip.packingChecklist || []).filter((group) => group.id !== groupId),
    })
  }

  function addChecklistItem(groupId) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      packingChecklist: (selectedTrip.packingChecklist || []).map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: [...(group.items || []), { id: uid('chk'), label: 'Nuovo elemento', done: false }],
            }
          : group,
      ),
    })
  }

  function updateChecklistItem(groupId, itemId, patch) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      packingChecklist: (selectedTrip.packingChecklist || []).map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: (group.items || []).map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            }
          : group,
      ),
    })
  }

  function deleteChecklistItem(groupId, itemId) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      packingChecklist: (selectedTrip.packingChecklist || []).map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: (group.items || []).filter((item) => item.id !== itemId),
            }
          : group,
      ),
    })
  }

  function addDiaryDay() {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        days: [
          ...((selectedTrip.travelDiary && selectedTrip.travelDiary.days) || []),
          { id: uid('day'), date: '', title: 'Nuova giornata', notes: '' },
        ],
      },
    })
  }

  function updateDiaryDay(dayId, patch) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        days: ((selectedTrip.travelDiary && selectedTrip.travelDiary.days) || []).map((day) =>
          day.id === dayId ? { ...day, ...patch } : day,
        ),
      },
    })
  }

  function deleteDiaryDay(dayId) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        days: ((selectedTrip.travelDiary && selectedTrip.travelDiary.days) || []).filter(
          (day) => day.id !== dayId,
        ),
      },
    })
  }

  function addDiaryPlace() {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        places: [
          ...((selectedTrip.travelDiary && selectedTrip.travelDiary.places) || []),
          { id: uid('place'), name: '', note: '', address: '', lat: '', lng: '' },
        ],
      },
    })
  }

  function updateDiaryPlace(placeId, patch) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        places: ((selectedTrip.travelDiary && selectedTrip.travelDiary.places) || []).map((place) =>
          place.id === placeId ? { ...place, ...patch } : place,
        ),
      },
    })
  }

  function deleteDiaryPlace(placeId) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        places: ((selectedTrip.travelDiary && selectedTrip.travelDiary.places) || []).filter(
          (place) => place.id !== placeId,
        ),
      },
    })
  }

  function addMediaLink() {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        mediaLinks: [
          ...((selectedTrip.travelDiary && selectedTrip.travelDiary.mediaLinks) || []),
          { id: uid('media'), type: 'link', title: '', url: '', thumb: '', note: '' },
        ],
      },
    })
  }

  function updateMediaLink(mediaId, patch) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        mediaLinks: ((selectedTrip.travelDiary && selectedTrip.travelDiary.mediaLinks) || []).map((item) =>
          item.id === mediaId ? { ...item, ...patch } : item,
        ),
      },
    })
  }

  function deleteMediaLink(mediaId) {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, {
      travelDiary: {
        ...(selectedTrip.travelDiary || {}),
        mediaLinks: ((selectedTrip.travelDiary && selectedTrip.travelDiary.mediaLinks) || []).filter(
          (item) => item.id !== mediaId,
        ),
      },
    })
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Viaggi famiglia</div>
          <h1 className="page-title">Sto caricando i viaggi</h1>
          <p className="page-subtitle">Voli, hotel, checklist, diario e reminder.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Viaggi famiglia</div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Viaggi & Organizzazione</h1>
            <p className="page-subtitle">
              Gestisci destinazioni, prenotazioni, checklist, tappe e promemoria di tutta la famiglia.
            </p>
          </div>
          <div className="row">
            <span className="badge badge-travel">{travelSummary.totalTrips} viaggi</span>
            <span className="badge badge-dash">{travelSummary.flights} voli</span>
            <span className="badge badge-warning">{travelSummary.deadlines} scadenze</span>
          </div>
        </div>
        {syncError ? <div className="app-status">{syncError}</div> : null}
      </section>

      <section>
        <div className="section-title">Panoramica viaggi</div>
        <div className="grid-2 widget-grid">
          <TravelMetric icon="✈️" label="Viaggi" value={travelSummary.totalTrips} sub={`${travelSummary.activeTrips} attivi o imminenti`} />
          <TravelMetric icon="🛫" label="Voli" value={travelSummary.flights} sub="Tratte registrate in app" />
          <TravelMetric icon="🏨" label="Hotel" value={travelSummary.hotels} sub="Prenotazioni e soggiorni" />
          <TravelMetric icon="⏰" label="Reminder" value={travelSummary.deadlines} sub="Check-in, booking, scadenze" />
        </div>
      </section>

      <section className="card">
        <div className="between">
          <div>
            <div className="section-title">I tuoi viaggi</div>
            <p className="page-subtitle">Ogni viaggio è una scheda completa con logistica e diario.</p>
          </div>
          <button className="btn btn-travel" onClick={createTrip}>
            + Nuovo viaggio
          </button>
        </div>

        <div className="timeline-list" style={{ marginTop: 12 }}>
          {tripList.length === 0 ? (
            <EmptyState text="Nessun viaggio presente." />
          ) : (
            tripList.map((trip) => {
              const isSelected = selectedTrip?.id === trip.id
              const days = diffDays(trip.dateFrom)

              return (
                <button
                  key={trip.id}
                  type="button"
                  className="subsection-box"
                  onClick={() => setSelectedTripId(trip.id)}
                  style={{
                    textAlign: 'left',
                    borderColor: isSelected ? 'rgba(52,211,153,0.35)' : undefined,
                    background: isSelected ? 'rgba(52,211,153,0.08)' : undefined,
                    cursor: 'pointer',
                  }}
                >
                  <div className="between">
                    <div>
                      <div className="strong">{trip.name || 'Viaggio'}</div>
                      <div className="small muted" style={{ marginTop: 4 }}>
                        {trip.dateFrom ? `${fmtDate(trip.dateFrom)} → ${fmtDate(trip.dateTo)}` : 'Date non definite'}
                      </div>
                    </div>
                    <div className="row">
                      <span className={`badge ${tripStatusBadge(trip.status)}`}>{tripStatusLabel(trip.status)}</span>
                      <span className="badge badge-muted">
                        {days === null ? '—' : days < 0 ? 'iniziato' : days === 0 ? 'oggi' : `${days} gg`}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </section>

      {!selectedTrip ? null : (
        <>
          <section
            className="card"
            style={{
              overflow: 'hidden',
              padding: 0,
            }}
          >
            <div
              style={{
                minHeight: 220,
                padding: 20,
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.62)), url(${tripCover(selectedTrip.name)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <div className="row">
                <span className={`badge ${tripStatusBadge(selectedTrip.status)}`}>{tripStatusLabel(selectedTrip.status)}</span>
                <span className="badge badge-travel">{(selectedTrip.persons || []).length} partecipanti</span>
              </div>
              <h2 style={{ marginTop: 10, fontSize: 28, fontWeight: 800 }}>{selectedTrip.name || 'Viaggio'}</h2>
              <div className="small" style={{ marginTop: 6, color: 'rgba(255,255,255,0.85)' }}>
                {selectedTrip.dateFrom ? `${fmtDate(selectedTrip.dateFrom)} → ${fmtDate(selectedTrip.dateTo)}` : 'Periodo da definire'}
              </div>
            </div>

            <div style={{ padding: 18 }}>
              <div className="form-grid">
                <div className="fg">
                  <label className="fl">Destinazione</label>
                  <input className="fi fi-travel" value={selectedTrip.name || ''} onChange={(e) => updateSelectedTrip({ name: e.target.value })} />
                </div>
                <div className="fg">
                  <label className="fl">Stato</label>
                  <select className="fi fi-travel" value={selectedTrip.status || 'planning'} onChange={(e) => updateSelectedTrip({ status: e.target.value })}>
                    {TRIP_STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label className="fl">Dal</label>
                  <input className="fi fi-travel" type="date" value={selectedTrip.dateFrom || ''} onChange={(e) => updateSelectedTrip({ dateFrom: e.target.value })} />
                </div>
                <div className="fg">
                  <label className="fl">Al</label>
                  <input className="fi fi-travel" type="date" value={selectedTrip.dateTo || ''} onChange={(e) => updateSelectedTrip({ dateTo: e.target.value })} />
                </div>
              </div>

              <div className="section-divider" />

              <div className="section-title">Partecipanti</div>
              <div className="row">
                {members.map((member) => {
                  const active = (selectedTrip.persons || []).includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`member-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleTripMember(selectedTrip.id, member.id)}
                    >
                      <span className="chip-avatar">{member.initials || 'FH'}</span>
                      <span>{member.name || member.role || member.initials || 'Membro'}</span>
                    </button>
                  )
                })}
              </div>

              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn btn-d btn-sm" onClick={() => deleteTrip(selectedTrip.id)}>
                  Elimina viaggio
                </button>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="row">
              {[
                ['overview', 'Overview'],
                ['flights', 'Voli'],
                ['hotels', 'Hotel'],
                ['checklist', 'Checklist'],
                ['diary', 'Diario'],
                ['deadlines', 'Reminder'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`btn btn-sm ${activeTab === key ? 'btn-travel' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'overview' ? (
            <section className="card">
              <div className="section-title">Overview viaggio</div>
              <div className="grid-2 widget-grid">
                <TravelMetric
                  icon="🛫"
                  label="Voli"
                  value={(selectedTrip.flights || []).length}
                  sub="Andate, ritorni e tratte intermedie"
                />
                <TravelMetric
                  icon="🏨"
                  label="Hotel"
                  value={(selectedTrip.hotels || []).length}
                  sub="Strutture e soggiorni prenotati"
                />
                <TravelMetric
                  icon="🧳"
                  label="Checklist"
                  value={(selectedTrip.packingChecklist || []).reduce((acc, group) => acc + (group.items || []).length, 0)}
                  sub="Elementi da preparare"
                />
                <TravelMetric
                  icon="⏰"
                  label="Scadenze"
                  value={(selectedTrip.generalDeadlines || []).length}
                  sub="Check-in, cancellazioni, booking"
                />
              </div>

              <div className="timeline-list" style={{ marginTop: 16 }}>
                <div className="timeline-item tl-travel">
                  <div className="strong">Promemoria rapido</div>
                  <div className="small muted" style={{ marginTop: 4 }}>
                    Usa questa scheda come centro operativo del viaggio: partecipanti, booking, logistica e diario.
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'flights' ? (
            <section className="card">
              <div className="between">
                <div>
                  <div className="section-title">Voli</div>
                  <p className="page-subtitle">Carte volo con compagnia, orari, bagagli e riferimenti prenotazione.</p>
                </div>
                <button
                  className="btn btn-travel"
                  onClick={() =>
                    addFlight(selectedTrip.id, {
                      company: '',
                      companyUrl: '',
                      from: '',
                      to: '',
                      date: '',
                      departureTime: '',
                      arrivalTime: '',
                      flightNumber: '',
                      bookingRef: '',
                      purchaseCost: '',
                      baggage: [],
                      deadlines: [],
                    })
                  }
                >
                  + Volo
                </button>
              </div>

              <div className="timeline-list" style={{ marginTop: 12 }}>
                {(selectedTrip.flights || []).length === 0 ? (
                  <EmptyState text="Nessun volo registrato." />
                ) : (
                  (selectedTrip.flights || []).map((flight) => (
                    <div key={flight.id} className="subsection-box">
                      <div className="between">
                        <div>
                          <div className="strong">{flight.company || 'Compagnia aerea'}</div>
                          <div className="small muted" style={{ marginTop: 4 }}>
                            {flight.from || 'Partenza'} → {flight.to || 'Arrivo'} · {fmtDate(flight.date)}
                          </div>
                        </div>
                        <div className="row">
                          <button className="btn btn-sm" onClick={() => invertFlightRoute(selectedTrip.id, flight.id)}>
                            Inverti tratta
                          </button>
                          <button className="btn btn-d btn-sm" onClick={() => deleteFlight(selectedTrip.id, flight.id)}>
                            Elimina
                          </button>
                        </div>
                      </div>

                      <div className="form-grid" style={{ marginTop: 12 }}>
                        <div className="fg">
                          <label className="fl">Compagnia</label>
                          <input
                            className="fi fi-travel"
                            value={flight.company || ''}
                            onChange={(e) =>
                              updateFlight(selectedTrip.id, flight.id, {
                                company: e.target.value,
                                companyUrl: AIRLINE_DIRECTORY[e.target.value] || flight.companyUrl || '',
                              })
                            }
                          />
                        </div>
                        <div className="fg">
                          <label className="fl">Numero volo</label>
                          <input
                            className="fi fi-travel"
                            value={flight.flightNumber || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { flightNumber: e.target.value })}
                          />
                        </div>
                        <div className="fg">
                          <label className="fl">Da</label>
                          <input
                            className="fi fi-travel"
                            value={flight.from || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { from: e.target.value })}
                          />
                        </div>
                        <div className="fg">
                          <label className="fl">A</label>
                          <input
                            className="fi fi-travel"
                            value={flight.to || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { to: e.target.value })}
                          />
                        </div>
                        <div className="fg">
                          <label className="fl">Data</label>
                          <input
                            className="fi fi-travel"
                            type="date"
                            value={flight.date || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { date: e.target.value })}
                          />
                        </div>
                        <div className="fg">
                          <label className="fl">Partenza</label>
                          <input
                            className="fi fi-travel"
                            type="time"
                            value={flight.departureTime || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { departureTime: e.target.value })}
                          />
                        </div>
                        <div className="fg">
                          <label className="fl">Arrivo</label>
                          <input
                            className="fi fi-travel"
                            type="time"
                            value={flight.arrivalTime || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { arrivalTime: e.target.value })}
                          />
                        </div>
                        <div className="fg">
                          <label className="fl">Booking ref</label>
                          <input
                            className="fi fi-travel"
                            value={flight.bookingRef || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { bookingRef: e.target.value })}
                          />
                        </div>
                        <div className="fg">
                          <label className="fl">Costo</label>
                          <input
                            className="fi fi-travel"
                            value={flight.purchaseCost || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { purchaseCost: e.target.value })}
                          />
                        </div>
                        <div className="fg col-full">
                          <label className="fl">URL compagnia</label>
                          <input
                            className="fi fi-travel"
                            value={flight.companyUrl || ''}
                            onChange={(e) => updateFlight(selectedTrip.id, flight.id, { companyUrl: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="row" style={{ marginTop: 10 }}>
                        {flight.companyUrl ? (
                          <a className="drive-link" href={flight.companyUrl} target="_blank" rel="noreferrer">
                            🌐 Apri compagnia
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {activeTab === 'hotels' ? (
            <section className="card">
              <div className="between">
                <div>
                  <div className="section-title">Hotel e soggiorni</div>
                  <p className="page-subtitle">Booking, pagamenti, coordinate e aperture rapide su Maps.</p>
                </div>
                <button className="btn btn-travel" onClick={addHotel}>
                  + Hotel
                </button>
              </div>

              <div className="timeline-list" style={{ marginTop: 12 }}>
                {(selectedTrip.hotels || []).length === 0 ? (
                  <EmptyState text="Nessun hotel registrato." />
                ) : (
                  (selectedTrip.hotels || []).map((hotel) => {
                    const mapUrl = mapsLink(hotel.address, hotel.lat, hotel.lng)
                    const dirUrl = directionsLink(hotel.address, hotel.lat, hotel.lng)

                    return (
                      <div key={hotel.id} className="subsection-box">
                        <div className="between">
                          <div>
                            <div className="strong">{hotel.name || 'Hotel / Alloggio'}</div>
                            <div className="small muted" style={{ marginTop: 4 }}>
                              {hotel.checkIn ? `${fmtDate(hotel.checkIn)} → ${fmtDate(hotel.checkOut)}` : 'Date da definire'}
                            </div>
                          </div>
                          <button className="btn btn-d btn-sm" onClick={() => deleteHotel(hotel.id)}>
                            Elimina
                          </button>
                        </div>

                        <div className="form-grid" style={{ marginTop: 12 }}>
                          <div className="fg">
                            <label className="fl">Nome struttura</label>
                            <input className="fi fi-travel" value={hotel.name || ''} onChange={(e) => updateHotel(hotel.id, { name: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Telefono</label>
                            <input className="fi fi-travel" value={hotel.phone || ''} onChange={(e) => updateHotel(hotel.id, { phone: e.target.value })} />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">Indirizzo</label>
                            <input className="fi fi-travel" value={hotel.address || ''} onChange={(e) => updateHotel(hotel.id, { address: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Latitudine</label>
                            <input className="fi fi-travel" value={hotel.lat || ''} onChange={(e) => updateHotel(hotel.id, { lat: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Longitudine</label>
                            <input className="fi fi-travel" value={hotel.lng || ''} onChange={(e) => updateHotel(hotel.id, { lng: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Check-in</label>
                            <input className="fi fi-travel" type="date" value={hotel.checkIn || ''} onChange={(e) => updateHotel(hotel.id, { checkIn: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Check-out</label>
                            <input className="fi fi-travel" type="date" value={hotel.checkOut || ''} onChange={(e) => updateHotel(hotel.id, { checkOut: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Pagato</label>
                            <input className="fi fi-travel" value={hotel.paidAmount || ''} onChange={(e) => updateHotel(hotel.id, { paidAmount: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Da pagare</label>
                            <input className="fi fi-travel" value={hotel.dueAmount || ''} onChange={(e) => updateHotel(hotel.id, { dueAmount: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Metodo pagamento</label>
                            <input className="fi fi-travel" value={hotel.paymentMethod || ''} onChange={(e) => updateHotel(hotel.id, { paymentMethod: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Scadenza cancellazione</label>
                            <input className="fi fi-travel" type="date" value={hotel.cancellationDate || ''} onChange={(e) => updateHotel(hotel.id, { cancellationDate: e.target.value })} />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">Booking URL</label>
                            <input className="fi fi-travel" value={hotel.bookingUrl || ''} onChange={(e) => updateHotel(hotel.id, { bookingUrl: e.target.value })} />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">URL alternativo</label>
                            <input className="fi fi-travel" value={hotel.alternateUrl || ''} onChange={(e) => updateHotel(hotel.id, { alternateUrl: e.target.value })} />
                          </div>
                        </div>

                        <div className="row" style={{ marginTop: 10 }}>
                          {hotel.bookingUrl ? (
                            <a className="drive-link" href={hotel.bookingUrl} target="_blank" rel="noreferrer">
                              🏨 Booking
                            </a>
                          ) : null}
                          {hotel.alternateUrl ? (
                            <a className="drive-link" href={hotel.alternateUrl} target="_blank" rel="noreferrer">
                              🔗 Altro link
                            </a>
                          ) : null}
                          {mapUrl ? (
                            <a className="drive-link" href={mapUrl} target="_blank" rel="noreferrer">
                              🗺️ Maps
                            </a>
                          ) : null}
                          {dirUrl ? (
                            <a className="drive-link" href={dirUrl} target="_blank" rel="noreferrer">
                              🚗 Indicazioni
                            </a>
                          ) : null}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          ) : null}

          {activeTab === 'checklist' ? (
            <section className="card">
              <div className="between">
                <div>
                  <div className="section-title">Checklist viaggio</div>
                  <p className="page-subtitle">Preparazione famigliare con categorie e checkbox grandi per mobile.</p>
                </div>
                <button className="btn btn-travel" onClick={addChecklistGroup}>
                  + Categoria checklist
                </button>
              </div>

              <div className="timeline-list" style={{ marginTop: 12 }}>
                {(selectedTrip.packingChecklist || []).length === 0 ? (
                  <EmptyState text="Nessuna checklist presente." />
                ) : (
                  (selectedTrip.packingChecklist || []).map((group) => (
                    <div key={group.id} className="subsection-box">
                      <div className="between">
                        <div className="strong">{group.category || 'Categoria checklist'}</div>
                        <div className="row">
                          <button className="btn btn-sm" onClick={() => addChecklistItem(group.id)}>
                            + Elemento
                          </button>
                          <button className="btn btn-d btn-sm" onClick={() => deleteChecklistGroup(group.id)}>
                            Elimina
                          </button>
                        </div>
                      </div>

                      <div className="form-grid" style={{ marginTop: 12 }}>
                        <div className="fg">
                          <label className="fl">Titolo categoria</label>
                          <input className="fi fi-travel" value={group.category || ''} onChange={(e) => updateChecklistGroup(group.id, { category: e.target.value })} />
                        </div>
                        <div className="fg">
                          <label className="fl">Colore</label>
                          <input className="fi fi-travel" value={group.color || ''} onChange={(e) => updateChecklistGroup(group.id, { color: e.target.value })} />
                        </div>
                      </div>

                      <div className="timeline-list" style={{ marginTop: 12 }}>
                        {(group.items || []).length === 0 ? (
                          <EmptyState text="Nessun elemento in questa categoria." />
                        ) : (
                          (group.items || []).map((item) => (
                            <div key={item.id} className="between" style={{ padding: '12px 14px', borderRadius: 12, background: '#161922', border: '1px solid #262c3b' }}>
                              <div className="row" style={{ flex: 1 }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.done)}
                                  onChange={(e) => updateChecklistItem(group.id, item.id, { done: e.target.checked })}
                                  style={{ width: 20, height: 20 }}
                                />
                                <input
                                  className="fi fi-travel"
                                  value={item.label || ''}
                                  onChange={(e) => updateChecklistItem(group.id, item.id, { label: e.target.value })}
                                  style={{ flex: 1 }}
                                />
                              </div>
                              <button className="btn btn-d btn-sm" onClick={() => deleteChecklistItem(group.id, item.id)}>
                                X
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {activeTab === 'diary' ? (
            <section className="card">
              <div className="between">
                <div>
                  <div className="section-title">Diario viaggio</div>
                  <p className="page-subtitle">Giornate, luoghi, media e note utili da conservare nel tempo.</p>
                </div>
                <div className="row">
                  <button className="btn btn-sm" onClick={addDiaryDay}>+ Giorno</button>
                  <button className="btn btn-travel btn-sm" onClick={addDiaryPlace}>+ Luogo</button>
                  <button className="btn btn-sm" onClick={addMediaLink}>+ Media</button>
                </div>
              </div>

              <div className="stack-card" style={{ marginTop: 12 }}>
                <div className="subsection-box">
                  <label className="fl">Note generali</label>
                  <textarea
                    className="fi fi-travel"
                    value={selectedTrip.travelDiary?.notes || ''}
                    onChange={(e) =>
                      updateSelectedTrip({
                        travelDiary: {
                          ...(selectedTrip.travelDiary || {}),
                          notes: e.target.value,
                        },
                      })
                    }
                  />
                </div>

                <div className="subsection-box">
                  <div className="section-title">Giornate</div>
                  <div className="timeline-list" style={{ marginTop: 12 }}>
                    {!(selectedTrip.travelDiary?.days || []).length ? (
                      <EmptyState text="Nessuna giornata registrata." />
                    ) : (
                      (selectedTrip.travelDiary?.days || []).map((day) => (
                        <div key={day.id} className="subsection-box">
                          <div className="form-grid">
                            <div className="fg">
                              <label className="fl">Data</label>
                              <input className="fi fi-travel" type="date" value={day.date || ''} onChange={(e) => updateDiaryDay(day.id, { date: e.target.value })} />
                            </div>
                            <div className="fg">
                              <label className="fl">Titolo</label>
                              <input className="fi fi-travel" value={day.title || ''} onChange={(e) => updateDiaryDay(day.id, { title: e.target.value })} />
                            </div>
                            <div className="fg col-full">
                              <label className="fl">Note</label>
                              <textarea className="fi fi-travel" value={day.notes || ''} onChange={(e) => updateDiaryDay(day.id, { notes: e.target.value })} />
                            </div>
                          </div>
                          <button className="btn btn-d btn-sm" onClick={() => deleteDiaryDay(day.id)}>
                            Elimina giorno
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="subsection-box">
                  <div className="section-title">Luoghi</div>
                  <div className="timeline-list" style={{ marginTop: 12 }}>
                    {!(selectedTrip.travelDiary?.places || []).length ? (
                      <EmptyState text="Nessun luogo registrato." />
                    ) : (
                      (selectedTrip.travelDiary?.places || []).map((place) => {
                        const mapUrl = mapsLink(place.address, place.lat, place.lng)
                        return (
                          <div key={place.id} className="subsection-box">
                            <div className="form-grid">
                              <div className="fg">
                                <label className="fl">Luogo</label>
                                <input className="fi fi-travel" value={place.name || ''} onChange={(e) => updateDiaryPlace(place.id, { name: e.target.value })} />
                              </div>
                              <div className="fg">
                                <label className="fl">Indirizzo</label>
                                <input className="fi fi-travel" value={place.address || ''} onChange={(e) => updateDiaryPlace(place.id, { address: e.target.value })} />
                              </div>
                              <div className="fg">
                                <label className="fl">Latitudine</label>
                                <input className="fi fi-travel" value={place.lat || ''} onChange={(e) => updateDiaryPlace(place.id, { lat: e.target.value })} />
                              </div>
                              <div className="fg">
                                <label className="fl">Longitudine</label>
                                <input className="fi fi-travel" value={place.lng || ''} onChange={(e) => updateDiaryPlace(place.id, { lng: e.target.value })} />
                              </div>
                              <div className="fg col-full">
                                <label className="fl">Note</label>
                                <textarea className="fi fi-travel" value={place.note || ''} onChange={(e) => updateDiaryPlace(place.id, { note: e.target.value })} />
                              </div>
                            </div>
                            <div className="row">
                              {mapUrl ? (
                                <a className="drive-link" href={mapUrl} target="_blank" rel="noreferrer">
                                  🗺️ Apri su Maps
                                </a>
                              ) : null}
                              <button className="btn btn-d btn-sm" onClick={() => deleteDiaryPlace(place.id)}>
                                Elimina luogo
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="subsection-box">
                  <div className="section-title">Media e link</div>
                  <div className="timeline-list" style={{ marginTop: 12 }}>
                    {!(selectedTrip.travelDiary?.mediaLinks || []).length ? (
                      <EmptyState text="Nessun media o link salvato." />
                    ) : (
                      (selectedTrip.travelDiary?.mediaLinks || []).map((media) => {
                        const thumb = guessMediaThumb(media.type, media.url, media.thumb)
                        return (
                          <div key={media.id} className="media-card">
                            {thumb ? <img className="media-thumb" src={thumb} alt={media.title || 'Media'} /> : null}
                            <div className="media-body">
                              <div className="form-grid">
                                <div className="fg">
                                  <label className="fl">Tipo</label>
                                  <input className="fi fi-travel" value={media.type || ''} onChange={(e) => updateMediaLink(media.id, { type: e.target.value })} />
                                </div>
                                <div className="fg">
                                  <label className="fl">Titolo</label>
                                  <input className="fi fi-travel" value={media.title || ''} onChange={(e) => updateMediaLink(media.id, { title: e.target.value })} />
                                </div>
                                <div className="fg col-full">
                                  <label className="fl">URL</label>
                                  <input className="fi fi-travel" value={media.url || ''} onChange={(e) => updateMediaLink(media.id, { url: e.target.value })} />
                                </div>
                                <div className="fg col-full">
                                  <label className="fl">Thumbnail</label>
                                  <input className="fi fi-travel" value={media.thumb || ''} onChange={(e) => updateMediaLink(media.id, { thumb: e.target.value })} />
                                </div>
                                <div className="fg col-full">
                                  <label className="fl">Note</label>
                                  <textarea className="fi fi-travel" value={media.note || ''} onChange={(e) => updateMediaLink(media.id, { note: e.target.value })} />
                                </div>
                              </div>
                              <div className="row">
                                {media.url ? (
                                  <a className="drive-link" href={media.url} target="_blank" rel="noreferrer">
                                    🔗 Apri media
                                  </a>
                                ) : null}
                                <button className="btn btn-d btn-sm" onClick={() => deleteMediaLink(media.id)}>
                                  Elimina media
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'deadlines' ? (
            <section className="card">
              <div className="between">
                <div>
                  <div className="section-title">Reminder e scadenze</div>
                  <p className="page-subtitle">Check-in, cancellazioni, prenotazioni e azioni importanti.</p>
                </div>
                <button className="btn btn-travel" onClick={addDeadline}>
                  + Reminder
                </button>
              </div>

              <div className="timeline-list" style={{ marginTop: 12 }}>
                {(selectedTrip.generalDeadlines || []).length === 0 ? (
                  <EmptyState text="Nessun reminder registrato." />
                ) : (
                  (selectedTrip.generalDeadlines || []).map((row) => {
                    const calendarUrl = googleCalendarLink({
                      title: row.title || 'Reminder viaggio',
                      startDate: row.date,
                      endDate: row.date,
                      details: row.note || '',
                      location: selectedTrip.name || '',
                    })

                    return (
                      <div key={row.id} className="subsection-box">
                        <div className="form-grid">
                          <div className="fg">
                            <label className="fl">Titolo</label>
                            <input className="fi fi-travel" value={row.title || ''} onChange={(e) => updateDeadline(row.id, { title: e.target.value })} />
                          </div>
                          <div className="fg">
                            <label className="fl">Data</label>
                            <input className="fi fi-travel" type="date" value={row.date || ''} onChange={(e) => updateDeadline(row.id, { date: e.target.value })} />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">Note</label>
                            <textarea className="fi fi-travel" value={row.note || ''} onChange={(e) => updateDeadline(row.id, { note: e.target.value })} />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">URL utile</label>
                            <input className="fi fi-travel" value={row.url || ''} onChange={(e) => updateDeadline(row.id, { url: e.target.value })} />
                          </div>
                        </div>

                        <div className="row">
                          {calendarUrl ? (
                            <a className="drive-link" href={calendarUrl} target="_blank" rel="noreferrer">
                              📅 Calendar
                            </a>
                          ) : null}
                          {row.url ? (
                            <a className="drive-link" href={row.url} target="_blank" rel="noreferrer">
                              🔗 Apri link
                            </a>
                          ) : null}
                          <button className="btn btn-d btn-sm" onClick={() => deleteDeadline(row.id)}>
                            Elimina
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
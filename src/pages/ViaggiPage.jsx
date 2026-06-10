import { useEffect, useMemo, useState } from 'react'
import { AIRLINE_DIRECTORY, TRIP_STATUS_OPTIONS, useAppContext } from '../context/AppContext'

function fmt(iso) {
  if (!iso) return '—'
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function labelStatus(value) {
  return TRIP_STATUS_OPTIONS.find((item) => item.value === value)?.label || value || '—'
}

function badgeClass(status) {
  if (status === 'incoming' || status === 'ongoing') return 'badge-success'
  if (status === 'cancelled') return 'badge-danger'
  if (status === 'planning') return 'badge-warning'
  return 'badge-muted'
}

function mapsLink(address, lat, lng) {
  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`
  }
  return address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : ''
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
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title || 'Promemoria viaggio',
  )}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(
    location,
  )}`
}

function daysUntil(date, base = new Date()) {
  if (!date) return null
  const target = new Date(date)
  const now = new Date(base)
  if (Number.isNaN(target.getTime()) || Number.isNaN(now.getTime())) return null
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function daysText(days) {
  if (days === null) return 'Senza data'
  if (days < 0) return 'Passato'
  if (days === 0) return 'Oggi'
  if (days === 1) return 'Domani'
  return `${days} gg`
}

function tripParticipantLabels(trip, familyMembers) {
  return (trip?.persons || [])
    .map((memberId) => familyMembers.find((member) => member.id === memberId))
    .filter(Boolean)
    .map((member) => member.name || member.role || member.initials)
    .join(', ')
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
    deleteFlight,
    addHotel,
    deleteHotel,
  } = useAppContext()

  const [selectedTripId, setSelectedTripId] = useState('')
  const [tripForm, setTripForm] = useState({
    name: '',
    status: 'planning',
    dateFrom: '',
    dateTo: '',
  })
  const [flightForm, setFlightForm] = useState({
    company: '',
    from: '',
    to: '',
    date: '',
    departureTime: '',
    arrivalTime: '',
    flightNumber: '',
    bookingRef: '',
    purchaseCost: '',
  })
  const [hotelForm, setHotelForm] = useState({
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
  })

  useEffect(() => {
    if (!selectedTripId && trips?.length) {
      setSelectedTripId(trips[0].id)
      return
    }
    if (selectedTripId && !trips.some((trip) => trip.id === selectedTripId)) {
      setSelectedTripId(trips[0]?.id || '')
    }
  }, [trips, selectedTripId])

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) || null,
    [trips, selectedTripId],
  )

  const tripsRows = useMemo(
    () =>
      [...(trips || [])].sort((a, b) => {
        const av = a.dateFrom || '9999-99-99'
        const bv = b.dateFrom || '9999-99-99'
        return av.localeCompare(bv)
      }),
    [trips],
  )

  const selectedTripFlights = selectedTrip?.flights || []
  const selectedTripHotels = selectedTrip?.hotels || []

  const handleAddTrip = (event) => {
    event.preventDefault()
    if (!tripForm.name.trim()) return

    addTrip({
      name: tripForm.name.trim(),
      status: tripForm.status,
      dateFrom: tripForm.dateFrom,
      dateTo: tripForm.dateTo,
      persons: [],
      flights: [],
      hotels: [],
      parkingReservations: [],
      carRentals: [],
      travelDiary: { days: [], places: [], mediaLinks: [], notes: '' },
      generalDeadlines: [],
    })

    setTripForm({
      name: '',
      status: 'planning',
      dateFrom: '',
      dateTo: '',
    })
  }

  const handleDeleteTrip = (tripId) => {
    deleteTrip(tripId)
  }

  const handleTripField = (field, value) => {
    if (!selectedTrip) return
    updateTrip(selectedTrip.id, { [field]: value })
  }

  const handleAddFlight = (event) => {
    event.preventDefault()
    if (!selectedTrip || !flightForm.company.trim()) return

    addFlight(selectedTrip.id, {
      company: flightForm.company.trim(),
      companyUrl: AIRLINE_DIRECTORY[flightForm.company.trim()] || '',
      from: flightForm.from.trim(),
      to: flightForm.to.trim(),
      date: flightForm.date,
      departureTime: flightForm.departureTime,
      arrivalTime: flightForm.arrivalTime,
      flightNumber: flightForm.flightNumber.trim(),
      bookingRef: flightForm.bookingRef.trim(),
      purchaseCost: flightForm.purchaseCost.trim(),
      baggage: [],
      deadlines: [],
    })

    setFlightForm({
      company: '',
      from: '',
      to: '',
      date: '',
      departureTime: '',
      arrivalTime: '',
      flightNumber: '',
      bookingRef: '',
      purchaseCost: '',
    })
  }

  const handleAddHotel = (event) => {
    event.preventDefault()
    if (!selectedTrip || !hotelForm.name.trim()) return

    addHotel(selectedTrip.id, {
      name: hotelForm.name.trim(),
      phone: hotelForm.phone.trim(),
      address: hotelForm.address.trim(),
      lat: hotelForm.lat.trim(),
      lng: hotelForm.lng.trim(),
      bookingUrl: hotelForm.bookingUrl.trim(),
      alternateUrl: hotelForm.alternateUrl.trim(),
      checkIn: hotelForm.checkIn,
      checkOut: hotelForm.checkOut,
      paidAmount: hotelForm.paidAmount.trim(),
      dueAmount: hotelForm.dueAmount.trim(),
      paymentMethod: hotelForm.paymentMethod.trim(),
      cancellationDate: hotelForm.cancellationDate,
      deadlines: [],
    })

    setHotelForm({
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
    })
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Viaggi</div>
          <h1>Caricamento viaggi…</h1>
          <p className="page-subtitle">Sto caricando partenze, voli, hotel e partecipanti.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Viaggi</div>
        <h1>Viaggi in formato semplice</h1>
        <p className="page-subtitle">
          Niente overview dispersiva: dati già inseriti in tabella, moduli separati qui sotto.
        </p>
        {syncError ? <div className="app-status">{syncError}</div> : null}
      </section>

      <section className="card stack-card">
        <div className="page-header">
          <div>
            <div className="card-title">Viaggi inseriti</div>
            <div className="card-subtitle">
              Tabella sintetica dei viaggi già presenti, con selezione del viaggio attivo.
            </div>
          </div>
        </div>

        <div className="data-area">
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seleziona</th>
                  <th>Viaggio</th>
                  <th>Periodo</th>
                  <th>Stato</th>
                  <th>Partecipanti</th>
                  <th>Partenza</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {tripsRows.length ? (
                  tripsRows.map((trip) => {
                    const days = daysUntil(trip.dateFrom)
                    return (
                      <tr key={trip.id}>
                        <td>
                          <button
                            type="button"
                            className="btn btn-s"
                            onClick={() => setSelectedTripId(trip.id)}
                          >
                            {selectedTripId === trip.id ? 'Attivo' : 'Apri'}
                          </button>
                        </td>
                        <td>{trip.name || '—'}</td>
                        <td>
                          {fmt(trip.dateFrom)} → {fmt(trip.dateTo)}
                        </td>
                        <td>
                          <span className={`badge ${badgeClass(trip.status)}`}>
                            {labelStatus(trip.status)}
                          </span>
                        </td>
                        <td>{tripParticipantLabels(trip, familyMembers) || '—'}</td>
                        <td>{daysText(days)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-d btn-s"
                            onClick={() => handleDeleteTrip(trip.id)}
                          >
                            Elimina
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="7">
                      <div className="empty">Nessun viaggio inserito.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card stack-card">
        <div className="card-title">Nuovo viaggio</div>
        <div className="card-subtitle">
          Il modulo è separato dalla tabella dei viaggi già presenti.
        </div>

        <div className="form-area">
          <form className="form-shell form-grid" onSubmit={handleAddTrip}>
            <label className="fg">
              <span className="fl">
                Nome viaggio <span className="required">*</span>
              </span>
              <input
                className="fi fi-travel"
                value={tripForm.name}
                onChange={(e) => setTripForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Es. Atene estate"
                required
              />
            </label>

            <label className="fg">
              <span className="fl">Stato</span>
              <select
                className="fi fi-travel"
                value={tripForm.status}
                onChange={(e) => setTripForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {TRIP_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="fg">
              <span className="fl">Data partenza</span>
              <input
                className="fi fi-travel"
                type="date"
                value={tripForm.dateFrom}
                onChange={(e) => setTripForm((prev) => ({ ...prev, dateFrom: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Data ritorno</span>
              <input
                className="fi fi-travel"
                type="date"
                value={tripForm.dateTo}
                onChange={(e) => setTripForm((prev) => ({ ...prev, dateTo: e.target.value }))}
              />
            </label>

            <div className="responsive-full actions-row">
              <button type="submit" className="btn btn-travel">
                + Salva viaggio
              </button>
            </div>
          </form>
        </div>
      </section>

      {selectedTrip ? (
        <>
          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Viaggio attivo</div>
                <div className="card-subtitle">
                  Modifica rapida del viaggio selezionato.
                </div>
              </div>
              <div className={`badge ${badgeClass(selectedTrip.status)}`}>
                {labelStatus(selectedTrip.status)}
              </div>
            </div>

            <div className="form-area">
              <div className="form-grid">
                <label className="fg">
                  <span className="fl">Nome viaggio</span>
                  <input
                    className="fi fi-travel"
                    value={selectedTrip.name || ''}
                    onChange={(e) => handleTripField('name', e.target.value)}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Stato</span>
                  <select
                    className="fi fi-travel"
                    value={selectedTrip.status || 'planning'}
                    onChange={(e) => handleTripField('status', e.target.value)}
                  >
                    {TRIP_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fg">
                  <span className="fl">Data partenza</span>
                  <input
                    className="fi fi-travel"
                    type="date"
                    value={selectedTrip.dateFrom || ''}
                    onChange={(e) => handleTripField('dateFrom', e.target.value)}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Data ritorno</span>
                  <input
                    className="fi fi-travel"
                    type="date"
                    value={selectedTrip.dateTo || ''}
                    onChange={(e) => handleTripField('dateTo', e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="data-area">
              <div className="card-title">Partecipanti</div>
              <div className="card-subtitle">
                Selezione semplice dei componenti famiglia associati al viaggio.
              </div>

              <div className="family-switcher" style={{ marginTop: 12 }}>
                {familyMembers.map((member) => {
                  const active = selectedTrip.persons?.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`member-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleTripMember(selectedTrip.id, member.id)}
                    >
                      <span className="chip-avatar">
                        {member.initials || member.name?.slice(0, 2) || 'FM'}
                      </span>
                      <span>{member.name || member.role || member.initials}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Voli inseriti</div>
                <div className="card-subtitle">
                  Dati già presenti in tabella, modulo separato sotto.
                </div>
              </div>
            </div>

            <div className="data-area">
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Compagnia</th>
                      <th>Tratta</th>
                      <th>Data</th>
                      <th>Orari</th>
                      <th>Volo</th>
                      <th>Prenotazione</th>
                      <th>Costo</th>
                      <th>Link</th>
                      <th>Calendar</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTripFlights.length ? (
                      selectedTripFlights.map((flight) => (
                        <tr key={flight.id}>
                          <td>{flight.company || '—'}</td>
                          <td>
                            {flight.from || '—'} → {flight.to || '—'}
                          </td>
                          <td>{fmt(flight.date)}</td>
                          <td>
                            {flight.departureTime || '—'} / {flight.arrivalTime || '—'}
                          </td>
                          <td>{flight.flightNumber || '—'}</td>
                          <td>{flight.bookingRef || '—'}</td>
                          <td>{flight.purchaseCost || '—'}</td>
                          <td>
                            {flight.companyUrl ? (
                              <a
                                className="drive-link"
                                href={flight.companyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apri compagnia
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {flight.date ? (
                              <a
                                className="drive-link"
                                href={googleCalendarLink({
                                  title: `${selectedTrip.name} - ${flight.company || 'Volo'}`,
                                  startDate: flight.date,
                                  endDate: flight.date,
                                  details: `${flight.from || ''} → ${flight.to || ''} ${
                                    flight.flightNumber || ''
                                  }`.trim(),
                                  location: `${flight.from || ''} ${flight.to ? `- ${flight.to}` : ''}`.trim(),
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Google Calendar
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-d btn-s"
                              onClick={() => deleteFlight(selectedTrip.id, flight.id)}
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10">
                          <div className="empty">Nessun volo inserito.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-area">
              <div className="card-title">Nuovo volo</div>
              <div className="card-subtitle">
                Compila il modulo: il volo salvato comparirà nella tabella sopra.
              </div>

              <form className="form-shell form-grid" onSubmit={handleAddFlight}>
                <label className="fg">
                  <span className="fl">
                    Compagnia <span className="required">*</span>
                  </span>
                  <input
                    className="fi fi-travel"
                    value={flightForm.company}
                    onChange={(e) => setFlightForm((prev) => ({ ...prev, company: e.target.value }))}
                    placeholder="Es. Ryanair"
                    required
                  />
                </label>

                <label className="fg">
                  <span className="fl">Numero volo</span>
                  <input
                    className="fi fi-travel"
                    value={flightForm.flightNumber}
                    onChange={(e) =>
                      setFlightForm((prev) => ({ ...prev, flightNumber: e.target.value }))
                    }
                    placeholder="Es. FR1234"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Da</span>
                  <input
                    className="fi fi-travel"
                    value={flightForm.from}
                    onChange={(e) => setFlightForm((prev) => ({ ...prev, from: e.target.value }))}
                    placeholder="Aeroporto partenza"
                  />
                </label>

                <label className="fg">
                  <span className="fl">A</span>
                  <input
                    className="fi fi-travel"
                    value={flightForm.to}
                    onChange={(e) => setFlightForm((prev) => ({ ...prev, to: e.target.value }))}
                    placeholder="Aeroporto arrivo"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Data</span>
                  <input
                    className="fi fi-travel"
                    type="date"
                    value={flightForm.date}
                    onChange={(e) => setFlightForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Prenotazione</span>
                  <input
                    className="fi fi-travel"
                    value={flightForm.bookingRef}
                    onChange={(e) =>
                      setFlightForm((prev) => ({ ...prev, bookingRef: e.target.value }))
                    }
                    placeholder="Booking reference"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Partenza</span>
                  <input
                    className="fi fi-travel"
                    type="time"
                    value={flightForm.departureTime}
                    onChange={(e) =>
                      setFlightForm((prev) => ({ ...prev, departureTime: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Arrivo</span>
                  <input
                    className="fi fi-travel"
                    type="time"
                    value={flightForm.arrivalTime}
                    onChange={(e) =>
                      setFlightForm((prev) => ({ ...prev, arrivalTime: e.target.value }))
                    }
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Costo acquisto</span>
                  <input
                    className="fi fi-travel"
                    value={flightForm.purchaseCost}
                    onChange={(e) =>
                      setFlightForm((prev) => ({ ...prev, purchaseCost: e.target.value }))
                    }
                    placeholder="Es. 180€"
                  />
                </label>

                <div className="responsive-full actions-row">
                  <button type="submit" className="btn btn-travel">
                    + Salva volo
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Hotel inseriti</div>
                <div className="card-subtitle">
                  Strutture del viaggio attivo in tabella chiara.
                </div>
              </div>
            </div>

            <div className="data-area">
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hotel</th>
                      <th>Periodo</th>
                      <th>Indirizzo</th>
                      <th>Contatti</th>
                      <th>Prenotazione</th>
                      <th>Mappe</th>
                      <th>Calendar</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTripHotels.length ? (
                      selectedTripHotels.map((hotel) => {
                        const mapUrl = mapsLink(hotel.address, hotel.lat, hotel.lng)
                        const dirUrl = directionsLink(hotel.address, hotel.lat, hotel.lng)
                        return (
                          <tr key={hotel.id}>
                            <td>{hotel.name || '—'}</td>
                            <td>
                              {fmt(hotel.checkIn)} → {fmt(hotel.checkOut)}
                            </td>
                            <td>{hotel.address || '—'}</td>
                            <td>{hotel.phone || '—'}</td>
                            <td>
                              <div className="stack-card">
                                {hotel.bookingUrl ? (
                                  <a
                                    className="drive-link"
                                    href={hotel.bookingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Booking
                                  </a>
                                ) : null}
                                {hotel.alternateUrl ? (
                                  <a
                                    className="drive-link"
                                    href={hotel.alternateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Link alternativo
                                  </a>
                                ) : !hotel.bookingUrl ? (
                                  '—'
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <div className="stack-card">
                                {mapUrl ? (
                                  <a
                                    className="drive-link"
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Mappa
                                  </a>
                                ) : null}
                                {dirUrl ? (
                                  <a
                                    className="drive-link"
                                    href={dirUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Indicazioni
                                  </a>
                                ) : !mapUrl ? (
                                  '—'
                                ) : null}
                              </div>
                            </td>
                            <td>
                              {hotel.checkIn ? (
                                <a
                                  className="drive-link"
                                  href={googleCalendarLink({
                                    title: `${selectedTrip.name} - ${hotel.name || 'Hotel'}`,
                                    startDate: hotel.checkIn,
                                    endDate: hotel.checkOut || hotel.checkIn,
                                    details: hotel.phone || '',
                                    location: hotel.address || '',
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Google Calendar
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-d btn-s"
                                onClick={() => deleteHotel(selectedTrip.id, hotel.id)}
                              >
                                Elimina
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="8">
                          <div className="empty">Nessun hotel inserito.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-area">
              <div className="card-title">Nuovo hotel</div>
              <div className="card-subtitle">
                Modulo separato dai dati già registrati.
              </div>

              <form className="form-shell form-grid" onSubmit={handleAddHotel}>
                <label className="fg">
                  <span className="fl">
                    Nome struttura <span className="required">*</span>
                  </span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.name}
                    onChange={(e) => setHotelForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Es. Athena Resort"
                    required
                  />
                </label>

                <label className="fg">
                  <span className="fl">Telefono</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.phone}
                    onChange={(e) => setHotelForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Telefono struttura"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Indirizzo</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.address}
                    onChange={(e) => setHotelForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Indirizzo completo"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Latitudine</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.lat}
                    onChange={(e) => setHotelForm((prev) => ({ ...prev, lat: e.target.value }))}
                    placeholder="37.12345"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Longitudine</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.lng}
                    onChange={(e) => setHotelForm((prev) => ({ ...prev, lng: e.target.value }))}
                    placeholder="14.12345"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Check-in</span>
                  <input
                    className="fi fi-travel"
                    type="date"
                    value={hotelForm.checkIn}
                    onChange={(e) => setHotelForm((prev) => ({ ...prev, checkIn: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Check-out</span>
                  <input
                    className="fi fi-travel"
                    type="date"
                    value={hotelForm.checkOut}
                    onChange={(e) =>
                      setHotelForm((prev) => ({ ...prev, checkOut: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Link prenotazione</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.bookingUrl}
                    onChange={(e) =>
                      setHotelForm((prev) => ({ ...prev, bookingUrl: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </label>

                <label className="fg">
                  <span className="fl">Link alternativo</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.alternateUrl}
                    onChange={(e) =>
                      setHotelForm((prev) => ({ ...prev, alternateUrl: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </label>

                <label className="fg">
                  <span className="fl">Pagato</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.paidAmount}
                    onChange={(e) =>
                      setHotelForm((prev) => ({ ...prev, paidAmount: e.target.value }))
                    }
                    placeholder="Es. 200€"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Da pagare</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.dueAmount}
                    onChange={(e) =>
                      setHotelForm((prev) => ({ ...prev, dueAmount: e.target.value }))
                    }
                    placeholder="Es. 150€"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Metodo pagamento</span>
                  <input
                    className="fi fi-travel"
                    value={hotelForm.paymentMethod}
                    onChange={(e) =>
                      setHotelForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
                    }
                    placeholder="Es. Carta / bonifico / saldo in struttura"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Scadenza cancellazione</span>
                  <input
                    className="fi fi-travel"
                    type="date"
                    value={hotelForm.cancellationDate}
                    onChange={(e) =>
                      setHotelForm((prev) => ({
                        ...prev,
                        cancellationDate: e.target.value,
                      }))
                    }
                  />
                </label>

                <div className="responsive-full actions-row">
                  <button type="submit" className="btn btn-travel">
                    + Salva hotel
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Diario viaggio</div>
                <div className="card-subtitle">
                  Campo unico, semplice e leggibile per note generali del viaggio.
                </div>
              </div>
            </div>

            <div className="form-area">
              <label className="fg">
                <span className="fl">Note viaggio</span>
                <textarea
                  className="fi fi-travel"
                  value={selectedTrip.travelDiary?.notes || ''}
                  onChange={(e) =>
                    updateTrip(selectedTrip.id, {
                      travelDiary: {
                        ...(selectedTrip.travelDiary || {
                          days: [],
                          places: [],
                          mediaLinks: [],
                          notes: '',
                        }),
                        notes: e.target.value,
                      },
                    })
                  }
                  placeholder="Programma sintetico, appunti, cose da ricordare..."
                />
              </label>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
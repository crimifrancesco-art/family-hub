import { useEffect, useMemo, useState } from 'react'
import { AIRLINE_DIRECTORY, TRIP_STATUS_OPTIONS, useAppContext } from '../context/AppContext'

function fmt(iso) {
  if (!iso) return '—'
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function labelStatus(value) {
  return TRIP_STATUS_OPTIONS.find((item) => item.value === value)?.label || value
}

function badgeClass(status) {
  if (status === 'incoming' || status === 'ongoing') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'planning') return 'warning'
  return ''
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

function Label({ children, required = false }) {
  return (
    <span className="fl">
      {children}
      {required ? <span className="required">*</span> : null}
    </span>
  )
}

function isFilled(value) {
  return String(value ?? '').trim().length > 0
}

function fieldClass(value, invalid = false) {
  return `fi ${isFilled(value) ? 'field-active' : ''} ${invalid ? 'field-invalid' : ''}`.trim()
}

function ErrorLine({ text }) {
  if (!text) return null
  return <div className="field-error">{text}</div>
}

const MEDIA_TYPE_OPTIONS = [
  { value: 'guide', label: 'Guida / blog' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'map', label: 'Mappa Google Maps' },
  { value: 'hotel', label: 'Hotel / booking' },
  { value: 'restaurant', label: 'Ristorante' },
  { value: 'link', label: 'Link generico' },
]

const EMPTY_TRIP_FORM = { name: '', status: 'planning', dateFrom: '', dateTo: '' }
const EMPTY_FLIGHT_FORM = { company: '', from: '', to: '', date: '', departureTime: '', arrivalTime: '', flightNumber: '', bookingRef: '', purchaseCost: '' }
const EMPTY_BAGGAGE_FORM = { label: '', qty: '1', cost: '' }
const EMPTY_FLIGHT_DEADLINE_FORM = { title: '', date: '', notes: '' }
const EMPTY_HOTEL_FORM = { name: '', phone: '', address: '', lat: '', lng: '', bookingUrl: '', alternateUrl: '', checkIn: '', checkOut: '', paidAmount: '', dueAmount: '', paymentMethod: '', cancellationDate: '' }
const EMPTY_HOTEL_DEADLINE_FORM = { title: '', date: '', notes: '' }
const EMPTY_PARKING_FORM = { name: '', address: '', dateFrom: '', dateTo: '', cost: '', bookingUrl: '', notes: '' }
const EMPTY_CAR_FORM = { company: '', pickupPlace: '', dropoffPlace: '', pickupDate: '', dropoffDate: '', cost: '', deposit: '', bookingUrl: '', notes: '' }
const EMPTY_DAY_FORM = { date: '', title: '', notes: '' }
const EMPTY_PLACE_FORM = { type: '', name: '', address: '', lat: '', lng: '', url: '', rating: '', reviewNote: '', imageUrl: '', notes: '' }
const EMPTY_MEDIA_FORM = { type: 'guide', title: '', url: '', source: '', thumbnail: '', notes: '' }

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
    addFlightBaggage,
    deleteFlightBaggage,
    addFlightDeadline,
    deleteFlightDeadline,
    addHotel,
    updateHotel,
    deleteHotel,
    addHotelDeadline,
    deleteHotelDeadline,
    addParkingReservation,
    deleteParkingReservation,
    addCarRental,
    deleteCarRental,
    addDiaryDay,
    deleteDiaryDay,
    addDiaryPlace,
    deleteDiaryPlace,
    addDiaryMedia,
    deleteDiaryMedia,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
  } = useAppContext()

  const [selectedTripId, setSelectedTripId] = useState('')
  const [tripForm, setTripForm] = useState(EMPTY_TRIP_FORM)
  const [tripErrors, setTripErrors] = useState({})
  const [flightForm, setFlightForm] = useState(EMPTY_FLIGHT_FORM)
  const [baggageForms, setBaggageForms] = useState({})
  const [flightDeadlineForms, setFlightDeadlineForms] = useState({})
  const [hotelForm, setHotelForm] = useState(EMPTY_HOTEL_FORM)
  const [hotelErrors, setHotelErrors] = useState({})
  const [hotelDeadlineForms, setHotelDeadlineForms] = useState({})
  const [hotelDeadlineErrors, setHotelDeadlineErrors] = useState({})
  const [parkingForm, setParkingForm] = useState(EMPTY_PARKING_FORM)
  const [carForm, setCarForm] = useState(EMPTY_CAR_FORM)
  const [dayForm, setDayForm] = useState(EMPTY_DAY_FORM)
  const [placeForm, setPlaceForm] = useState(EMPTY_PLACE_FORM)
  const [mediaForm, setMediaForm] = useState(EMPTY_MEDIA_FORM)
  const [newChecklistLabels, setNewChecklistLabels] = useState({})

  useEffect(() => {
    if (!selectedTripId && trips[0]?.id) {
      setSelectedTripId(trips[0].id)
      return
    }
    if (selectedTripId && !trips.some((trip) => trip.id === selectedTripId)) {
      setSelectedTripId(trips[0]?.id || '')
    }
  }, [selectedTripId, trips])

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) || trips[0] || null,
    [trips, selectedTripId],
  )

  const tripStats = useMemo(() => {
    if (!selectedTrip) return { flights: 0, hotels: 0, days: 0, media: 0 }
    return {
      flights: selectedTrip.flights?.length || 0,
      hotels: selectedTrip.hotels?.length || 0,
      days: selectedTrip.travelDiary?.days?.length || 0,
      media: selectedTrip.travelDiary?.mediaLinks?.length || 0,
    }
  }, [selectedTrip])

  const validateTrip = () => {
    const errors = {}
    if (!tripForm.name.trim()) errors.name = 'Inserisci il nome del viaggio.'
    if (!tripForm.dateFrom) errors.dateFrom = 'Inserisci la data di inizio.'
    setTripErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateHotel = () => {
    const errors = {}
    if (!hotelForm.name.trim()) errors.name = 'Inserisci il nome hotel.'
    setHotelErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateTrip = (e) => {
    e.preventDefault()
    if (!validateTrip()) return
    addTrip({ name: tripForm.name.trim(), status: tripForm.status, dateFrom: tripForm.dateFrom, dateTo: tripForm.dateTo })
    setTripForm(EMPTY_TRIP_FORM)
    setTripErrors({})
  }

  const handleAddFlight = (e) => {
    e.preventDefault()
    if (!selectedTrip || !flightForm.company.trim()) return
    addFlight(selectedTrip.id, { ...flightForm, company: flightForm.company.trim(), companyUrl: AIRLINE_DIRECTORY[flightForm.company.trim()] || '' })
    setFlightForm(EMPTY_FLIGHT_FORM)
  }

  const handleAddFlightBaggage = (flightId) => {
    if (!selectedTrip) return
    const form = baggageForms[flightId] || EMPTY_BAGGAGE_FORM
    if (!form.label?.trim()) return
    addFlightBaggage(selectedTrip.id, flightId, { label: form.label.trim(), qty: form.qty || '1', cost: form.cost || '' })
    setBaggageForms((prev) => ({ ...prev, [flightId]: EMPTY_BAGGAGE_FORM }))
  }

  const handleAddFlightDeadline = (flightId) => {
    if (!selectedTrip) return
    const form = flightDeadlineForms[flightId] || EMPTY_FLIGHT_DEADLINE_FORM
    if (!form.title?.trim()) return
    addFlightDeadline(selectedTrip.id, flightId, { title: form.title.trim(), date: form.date || '', notes: form.notes?.trim() || '' })
    setFlightDeadlineForms((prev) => ({ ...prev, [flightId]: EMPTY_FLIGHT_DEADLINE_FORM }))
  }

  const handleAddHotel = (e) => {
    e.preventDefault()
    if (!selectedTrip || !validateHotel()) return
    addHotel(selectedTrip.id, {
      ...hotelForm,
      name: hotelForm.name.trim(),
      address: hotelForm.address.trim(),
      bookingUrl: hotelForm.bookingUrl.trim(),
      alternateUrl: hotelForm.alternateUrl.trim(),
      phone: hotelForm.phone.trim(),
      paymentMethod: hotelForm.paymentMethod.trim(),
      paidAmount: hotelForm.paidAmount.trim(),
      dueAmount: hotelForm.dueAmount.trim(),
    })
    setHotelForm(EMPTY_HOTEL_FORM)
    setHotelErrors({})
  }

  const handleAddHotelDeadline = (hotelId) => {
    if (!selectedTrip) return
    const form = hotelDeadlineForms[hotelId] || EMPTY_HOTEL_DEADLINE_FORM
    const errors = {}
    if (!form.title?.trim()) errors.title = 'Inserisci il titolo della scadenza.'
    if (!form.date) errors.date = 'Inserisci la data della scadenza.'
    if (Object.keys(errors).length) {
      setHotelDeadlineErrors((prev) => ({ ...prev, [hotelId]: errors }))
      return
    }
    addHotelDeadline(selectedTrip.id, hotelId, { title: form.title.trim(), date: form.date, notes: form.notes?.trim() || '' })
    setHotelDeadlineForms((prev) => ({ ...prev, [hotelId]: EMPTY_HOTEL_DEADLINE_FORM }))
    setHotelDeadlineErrors((prev) => ({ ...prev, [hotelId]: {} }))
  }

  const handleAddParking = (e) => {
    e.preventDefault()
    if (!selectedTrip || !parkingForm.name.trim()) return
    addParkingReservation(selectedTrip.id, {
      ...parkingForm,
      name: parkingForm.name.trim(),
      address: parkingForm.address.trim(),
      bookingUrl: parkingForm.bookingUrl.trim(),
      notes: parkingForm.notes.trim(),
    })
    setParkingForm(EMPTY_PARKING_FORM)
  }

  const handleAddCar = (e) => {
    e.preventDefault()
    if (!selectedTrip || !carForm.company.trim()) return
    addCarRental(selectedTrip.id, {
      ...carForm,
      company: carForm.company.trim(),
      pickupPlace: carForm.pickupPlace.trim(),
      dropoffPlace: carForm.dropoffPlace.trim(),
      bookingUrl: carForm.bookingUrl.trim(),
      notes: carForm.notes.trim(),
    })
    setCarForm(EMPTY_CAR_FORM)
  }

  const handleAddDay = (e) => {
    e.preventDefault()
    if (!selectedTrip || !dayForm.title.trim()) return
    addDiaryDay(selectedTrip.id, { date: dayForm.date, title: dayForm.title.trim(), notes: dayForm.notes.trim() })
    setDayForm(EMPTY_DAY_FORM)
  }

  const handleAddPlace = (e) => {
    e.preventDefault()
    if (!selectedTrip || !placeForm.name.trim()) return
    addDiaryPlace(selectedTrip.id, {
      ...placeForm,
      name: placeForm.name.trim(),
      address: placeForm.address.trim(),
      url: placeForm.url.trim(),
      rating: placeForm.rating.trim(),
      reviewNote: placeForm.reviewNote.trim(),
      imageUrl: placeForm.imageUrl.trim(),
      notes: placeForm.notes.trim(),
    })
    setPlaceForm(EMPTY_PLACE_FORM)
  }

  const handleAddMedia = (e) => {
    e.preventDefault()
    if (!selectedTrip || !mediaForm.title.trim() || !mediaForm.url.trim()) return
    addDiaryMedia(selectedTrip.id, {
      ...mediaForm,
      title: mediaForm.title.trim(),
      url: mediaForm.url.trim(),
      source: mediaForm.source.trim(),
      thumbnail: mediaForm.thumbnail.trim(),
      notes: mediaForm.notes.trim(),
    })
    setMediaForm(EMPTY_MEDIA_FORM)
  }

  const handleAddChecklistItem = (groupId) => {
    if (!selectedTrip) return
    const label = (newChecklistLabels[groupId] || '').trim()
    if (!label) return
    addChecklistItem(selectedTrip.id, groupId, label)
    setNewChecklistLabels((prev) => ({ ...prev, [groupId]: '' }))
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Viaggi</div>
          <h1>Caricamento viaggi in corso...</h1>
          <p>Sto caricando tratte, hotel, logistica, diario e checklist.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Viaggi</div>
        <h1>Pannello viaggi completo e coerente</h1>
        <p>Partecipanti cliccabili, parcheggi e auto inseribili, diario e media salvabili, checklist visibile.</p>
        {syncError ? <div className="app-status" style={{ marginTop: 14 }}>{syncError}</div> : null}
        <div className="hero-meta" style={{ marginTop: 14 }}>
          <span className="meta-chip">{trips.length} viaggi</span>
          <span className="meta-chip">{tripStats.flights} voli</span>
          <span className="meta-chip">{tripStats.hotels} hotel</span>
          <span className="meta-chip">{tripStats.days} giorni diario</span>
          <span className="meta-chip">{tripStats.media} media</span>
        </div>
      </section>

      <section className="card stack-card">
        <div className="card-title">1. Crea o scegli il viaggio</div>

        <form className="form-shell form-grid" onSubmit={handleCreateTrip}>
          <div className="grid-cards responsive-3">
            <label>
              <Label required>Nome viaggio</Label>
              <input className={fieldClass(tripForm.name, Boolean(tripErrors.name))} value={tripForm.name} onChange={(e) => setTripForm((prev) => ({ ...prev, name: e.target.value }))} />
              <ErrorLine text={tripErrors.name} />
            </label>

            <label>
              <Label>Stato</Label>
              <select className={fieldClass(tripForm.status)} value={tripForm.status} onChange={(e) => setTripForm((prev) => ({ ...prev, status: e.target.value }))}>
                {TRIP_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label>
              <Label required>Data inizio</Label>
              <input type="date" className={fieldClass(tripForm.dateFrom, Boolean(tripErrors.dateFrom))} value={tripForm.dateFrom} onChange={(e) => setTripForm((prev) => ({ ...prev, dateFrom: e.target.value }))} />
              <ErrorLine text={tripErrors.dateFrom} />
            </label>

            <label>
              <Label>Data fine</Label>
              <input type="date" className={fieldClass(tripForm.dateTo)} value={tripForm.dateTo} onChange={(e) => setTripForm((prev) => ({ ...prev, dateTo: e.target.value }))} />
            </label>
          </div>

          <div><button type="submit" className="btn btn-p">Crea viaggio</button></div>
        </form>

        {trips.length === 0 ? (
          <EmptyState text="Nessun viaggio creato." />
        ) : (
          <div className="family-switcher">
            {trips.map((trip) => {
              const active = selectedTrip?.id === trip.id
              return (
                <button key={trip.id} type="button" className={`member-chip ${active ? 'active' : ''}`} onClick={() => setSelectedTripId(trip.id)}>
                  <strong>{trip.name || 'Viaggio'}</strong> — {labelStatus(trip.status)} {trip.dateFrom ? `(${fmt(trip.dateFrom)})` : ''}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {selectedTrip ? (
        <>
          <section className="card stack-card">
            <div className="between">
              <div>
                <div className="card-title">2. Scheda viaggio</div>
                <div className="muted">Dati principali, stato del viaggio e partecipanti.</div>
              </div>
              <div className="actions-row">
                <span className={`badge ${badgeClass(selectedTrip.status)}`}>{labelStatus(selectedTrip.status)}</span>
                <button type="button" className="btn btn-d btn-s" onClick={() => deleteTrip(selectedTrip.id)}>Elimina viaggio</button>
              </div>
            </div>

            <div className="form-shell">
              <div className="grid-cards responsive-3">
                <label>
                  <Label>Nome viaggio</Label>
                  <input className={fieldClass(selectedTrip.name)} value={selectedTrip.name || ''} onChange={(e) => updateTrip(selectedTrip.id, { name: e.target.value })} />
                </label>
                <label>
                  <Label>Stato</Label>
                  <select className={fieldClass(selectedTrip.status)} value={selectedTrip.status || 'planning'} onChange={(e) => updateTrip(selectedTrip.id, { status: e.target.value })}>
                    {TRIP_STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label>
                  <Label>Inizio</Label>
                  <input type="date" className={fieldClass(selectedTrip.dateFrom)} value={selectedTrip.dateFrom || ''} onChange={(e) => updateTrip(selectedTrip.id, { dateFrom: e.target.value })} />
                </label>
                <label>
                  <Label>Fine</Label>
                  <input type="date" className={fieldClass(selectedTrip.dateTo)} value={selectedTrip.dateTo || ''} onChange={(e) => updateTrip(selectedTrip.id, { dateTo: e.target.value })} />
                </label>
                <label className="responsive-full">
                  <Label>Note viaggio</Label>
                  <textarea className={fieldClass(selectedTrip.notes || '')} value={selectedTrip.notes || ''} onChange={(e) => updateTrip(selectedTrip.id, { notes: e.target.value })} />
                </label>
              </div>

              <div className="section-divider" />
              <div className="form-section-title">Partecipanti</div>
              <div className="family-switcher">
                {familyMembers.map((member) => {
                  const included = (selectedTrip.persons || []).includes(member.id)
                  return (
                    <button key={member.id} type="button" className={`member-chip ${included ? 'active' : ''}`} onClick={() => toggleTripMember(selectedTrip.id, member.id)}>
                      <span>{member.initials}</span>
                      <span>{member.name || member.role || 'Membro'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="grid-cards cols-2">
            <article className="card stack-card">
              <div className="card-title">3. Volo</div>
              <form className="form-shell form-grid" onSubmit={handleAddFlight}>
                <div className="grid-cards responsive-3">
                  <label><Label required>Compagnia</Label><input className={fieldClass(flightForm.company)} value={flightForm.company} onChange={(e) => setFlightForm((prev) => ({ ...prev, company: e.target.value }))} /></label>
                  <label><Label>Aeroporto partenza</Label><input className={fieldClass(flightForm.from)} value={flightForm.from} onChange={(e) => setFlightForm((prev) => ({ ...prev, from: e.target.value }))} /></label>
                  <label><Label>Aeroporto arrivo</Label><input className={fieldClass(flightForm.to)} value={flightForm.to} onChange={(e) => setFlightForm((prev) => ({ ...prev, to: e.target.value }))} /></label>
                  <label><Label>Data</Label><input type="date" className={fieldClass(flightForm.date)} value={flightForm.date} onChange={(e) => setFlightForm((prev) => ({ ...prev, date: e.target.value }))} /></label>
                  <label><Label>Ora partenza</Label><input type="time" className={fieldClass(flightForm.departureTime)} value={flightForm.departureTime} onChange={(e) => setFlightForm((prev) => ({ ...prev, departureTime: e.target.value }))} /></label>
                  <label><Label>Ora arrivo</Label><input type="time" className={fieldClass(flightForm.arrivalTime)} value={flightForm.arrivalTime} onChange={(e) => setFlightForm((prev) => ({ ...prev, arrivalTime: e.target.value }))} /></label>
                  <label><Label>Numero volo</Label><input className={fieldClass(flightForm.flightNumber)} value={flightForm.flightNumber} onChange={(e) => setFlightForm((prev) => ({ ...prev, flightNumber: e.target.value }))} /></label>
                  <label><Label>PNR / prenotazione</Label><input className={fieldClass(flightForm.bookingRef)} value={flightForm.bookingRef} onChange={(e) => setFlightForm((prev) => ({ ...prev, bookingRef: e.target.value }))} /></label>
                  <label><Label>Costo</Label><input className={fieldClass(flightForm.purchaseCost)} value={flightForm.purchaseCost} onChange={(e) => setFlightForm((prev) => ({ ...prev, purchaseCost: e.target.value }))} /></label>
                </div>
                <div><button type="submit" className="btn btn-p">Aggiungi volo</button></div>
              </form>

              {selectedTrip.flights?.length ? (
                <div className="timeline-list">
                  {selectedTrip.flights.map((flight) => {
                    const baggageForm = baggageForms[flight.id] || EMPTY_BAGGAGE_FORM
                    const flightDeadlineForm = flightDeadlineForms[flight.id] || EMPTY_FLIGHT_DEADLINE_FORM

                    return (
                      <div key={flight.id} className="timeline-item">
                        <div className="between">
                          <div>
                            <div className="card-subtitle">{flight.company || 'Volo'} {flight.flightNumber ? `• ${flight.flightNumber}` : ''}</div>
                            <div className="muted">{flight.from || '—'} → {flight.to || '—'} • {fmt(flight.date)}</div>
                          </div>
                          <div className="actions-row">
                            <button type="button" className="btn btn-s" onClick={() => invertFlightRoute(selectedTrip.id, flight.id)}>Inverti tratta</button>
                            <button type="button" className="btn btn-d btn-s" onClick={() => deleteFlight(selectedTrip.id, flight.id)}>Elimina</button>
                          </div>
                        </div>

                        <div className="subsection-box">
                          <div className="card-subtitle">Bagagli</div>
                          <div className="inline-form">
                            <input className={fieldClass(baggageForm.label)} value={baggageForm.label} onChange={(e) => setBaggageForms((prev) => ({ ...prev, [flight.id]: { ...baggageForm, label: e.target.value } }))} placeholder="Tipo bagaglio" />
                            <input className={fieldClass(baggageForm.qty)} value={baggageForm.qty} onChange={(e) => setBaggageForms((prev) => ({ ...prev, [flight.id]: { ...baggageForm, qty: e.target.value } }))} placeholder="Q.tà" />
                            <input className={fieldClass(baggageForm.cost)} value={baggageForm.cost} onChange={(e) => setBaggageForms((prev) => ({ ...prev, [flight.id]: { ...baggageForm, cost: e.target.value } }))} placeholder="Costo" />
                            <button type="button" className="btn btn-p" onClick={() => handleAddFlightBaggage(flight.id)}>Aggiungi</button>
                          </div>

                          <div className="timeline-list" style={{ marginTop: 10 }}>
                            {(flight.baggage || []).map((item) => (
                              <div key={item.id} className="timeline-item compact between">
                                <div>{item.label} · Q.tà {item.qty || 1} {item.cost ? `· ${item.cost}` : ''}</div>
                                <button type="button" className="btn btn-d btn-s" onClick={() => deleteFlightBaggage(selectedTrip.id, flight.id, item.id)}>Elimina</button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="subsection-box">
                          <div className="card-subtitle">Scadenze volo</div>
                          <div className="inline-form">
                            <input className={fieldClass(flightDeadlineForm.title)} value={flightDeadlineForm.title} onChange={(e) => setFlightDeadlineForms((prev) => ({ ...prev, [flight.id]: { ...flightDeadlineForm, title: e.target.value } }))} placeholder="Titolo scadenza" />
                            <input type="date" className={fieldClass(flightDeadlineForm.date)} value={flightDeadlineForm.date} onChange={(e) => setFlightDeadlineForms((prev) => ({ ...prev, [flight.id]: { ...flightDeadlineForm, date: e.target.value } }))} />
                            <input className={fieldClass(flightDeadlineForm.notes)} value={flightDeadlineForm.notes} onChange={(e) => setFlightDeadlineForms((prev) => ({ ...prev, [flight.id]: { ...flightDeadlineForm, notes: e.target.value } }))} placeholder="Note" />
                            <button type="button" className="btn btn-p" onClick={() => handleAddFlightDeadline(flight.id)}>Aggiungi</button>
                          </div>

                          <div className="timeline-list" style={{ marginTop: 10 }}>
                            {(flight.deadlines || []).map((item) => (
                              <div key={item.id} className="timeline-item compact between">
                                <div>{item.title} · {fmt(item.date)} {item.notes ? `· ${item.notes}` : ''}</div>
                                <div className="actions-row">
                                  {item.date ? <a className="btn btn-s" href={googleCalendarLink({ title: item.title, startDate: item.date, details: item.notes })} target="_blank" rel="noopener noreferrer">Calendar</a> : null}
                                  <button type="button" className="btn btn-d btn-s" onClick={() => deleteFlightDeadline(selectedTrip.id, flight.id, item.id)}>Elimina</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <EmptyState text="Nessun volo inserito." />}
            </article>

            <article className="card stack-card">
              <div className="card-title">4. Hotel</div>
              <form className="form-shell form-grid" onSubmit={handleAddHotel}>
                <div className="grid-cards responsive-3">
                  <label><Label required>Nome hotel</Label><input className={fieldClass(hotelForm.name, Boolean(hotelErrors.name))} value={hotelForm.name} onChange={(e) => setHotelForm((prev) => ({ ...prev, name: e.target.value }))} /><ErrorLine text={hotelErrors.name} /></label>
                  <label><Label>Telefono</Label><input className={fieldClass(hotelForm.phone)} value={hotelForm.phone} onChange={(e) => setHotelForm((prev) => ({ ...prev, phone: e.target.value }))} /></label>
                  <label><Label>Metodo pagamento</Label><input className={fieldClass(hotelForm.paymentMethod)} value={hotelForm.paymentMethod} onChange={(e) => setHotelForm((prev) => ({ ...prev, paymentMethod: e.target.value }))} /></label>
                  <label className="responsive-full"><Label>Indirizzo</Label><input className={fieldClass(hotelForm.address)} value={hotelForm.address} onChange={(e) => setHotelForm((prev) => ({ ...prev, address: e.target.value }))} /></label>
                  <label><Label>Latitudine</Label><input className={fieldClass(hotelForm.lat)} value={hotelForm.lat} onChange={(e) => setHotelForm((prev) => ({ ...prev, lat: e.target.value }))} /></label>
                  <label><Label>Longitudine</Label><input className={fieldClass(hotelForm.lng)} value={hotelForm.lng} onChange={(e) => setHotelForm((prev) => ({ ...prev, lng: e.target.value }))} /></label>
                  <label><Label>Check-in</Label><input type="date" className={fieldClass(hotelForm.checkIn)} value={hotelForm.checkIn} onChange={(e) => setHotelForm((prev) => ({ ...prev, checkIn: e.target.value }))} /></label>
                  <label><Label>Check-out</Label><input type="date" className={fieldClass(hotelForm.checkOut)} value={hotelForm.checkOut} onChange={(e) => setHotelForm((prev) => ({ ...prev, checkOut: e.target.value }))} /></label>
                  <label><Label>Pagato</Label><input className={fieldClass(hotelForm.paidAmount)} value={hotelForm.paidAmount} onChange={(e) => setHotelForm((prev) => ({ ...prev, paidAmount: e.target.value }))} /></label>
                  <label><Label>Da pagare</Label><input className={fieldClass(hotelForm.dueAmount)} value={hotelForm.dueAmount} onChange={(e) => setHotelForm((prev) => ({ ...prev, dueAmount: e.target.value }))} /></label>
                  <label><Label>Link prenotazione</Label><input className={fieldClass(hotelForm.bookingUrl)} value={hotelForm.bookingUrl} onChange={(e) => setHotelForm((prev) => ({ ...prev, bookingUrl: e.target.value }))} /></label>
                  <label><Label>Link alternativo</Label><input className={fieldClass(hotelForm.alternateUrl)} value={hotelForm.alternateUrl} onChange={(e) => setHotelForm((prev) => ({ ...prev, alternateUrl: e.target.value }))} /></label>
                  <label><Label>Data cancellazione gratuita</Label><input type="date" className={fieldClass(hotelForm.cancellationDate)} value={hotelForm.cancellationDate} onChange={(e) => setHotelForm((prev) => ({ ...prev, cancellationDate: e.target.value }))} /></label>
                </div>
                <div><button type="submit" className="btn btn-p">Aggiungi hotel</button></div>
              </form>

              {selectedTrip.hotels?.length ? (
                <div className="timeline-list">
                  {selectedTrip.hotels.map((hotel) => {
                    const deadlineForm = hotelDeadlineForms[hotel.id] || EMPTY_HOTEL_DEADLINE_FORM
                    const deadlineErrors = hotelDeadlineErrors[hotel.id] || {}
                    const mapUrl = mapsLink(hotel.address, hotel.lat, hotel.lng)
                    const dirUrl = directionsLink(hotel.address, hotel.lat, hotel.lng)

                    return (
                      <div key={hotel.id} className="timeline-item">
                        <div className="between">
                          <div>
                            <div className="card-subtitle">{hotel.name || 'Hotel'}</div>
                            <div className="muted">{hotel.address || 'Indirizzo non indicato'}</div>
                          </div>
                          <div className="actions-row">
                            {hotel.bookingUrl ? <a className="btn btn-s" href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer">Prenotazione</a> : null}
                            {mapUrl ? <a className="btn btn-s" href={mapUrl} target="_blank" rel="noopener noreferrer">Maps</a> : null}
                            {dirUrl ? <a className="btn btn-s" href={dirUrl} target="_blank" rel="noopener noreferrer">Itinerario</a> : null}
                            <button type="button" className="btn btn-d btn-s" onClick={() => deleteHotel(selectedTrip.id, hotel.id)}>Elimina</button>
                          </div>
                        </div>

                        <div className="subsection-box">
                          <div className="card-subtitle">Scadenze hotel</div>
                          <div className="inline-form">
                            <div>
                              <input className={fieldClass(deadlineForm.title, Boolean(deadlineErrors.title))} value={deadlineForm.title} onChange={(e) => setHotelDeadlineForms((prev) => ({ ...prev, [hotel.id]: { ...deadlineForm, title: e.target.value } }))} placeholder="Titolo scadenza" />
                              <ErrorLine text={deadlineErrors.title} />
                            </div>
                            <div>
                              <input type="date" className={fieldClass(deadlineForm.date, Boolean(deadlineErrors.date))} value={deadlineForm.date} onChange={(e) => setHotelDeadlineForms((prev) => ({ ...prev, [hotel.id]: { ...deadlineForm, date: e.target.value } }))} />
                              <ErrorLine text={deadlineErrors.date} />
                            </div>
                            <input className={fieldClass(deadlineForm.notes)} value={deadlineForm.notes} onChange={(e) => setHotelDeadlineForms((prev) => ({ ...prev, [hotel.id]: { ...deadlineForm, notes: e.target.value } }))} placeholder="Note" />
                            <button type="button" className="btn btn-p" onClick={() => handleAddHotelDeadline(hotel.id)}>Aggiungi scadenza</button>
                          </div>

                          <div className="timeline-list" style={{ marginTop: 10 }}>
                            {(hotel.deadlines || []).map((item) => (
                              <div key={item.id} className="timeline-item compact between">
                                <div>{item.title} · {fmt(item.date)} {item.notes ? `· ${item.notes}` : ''}</div>
                                <div className="actions-row">
                                  {item.date ? <a className="btn btn-s" href={googleCalendarLink({ title: item.title, startDate: item.date, details: item.notes, location: hotel.address })} target="_blank" rel="noopener noreferrer">Calendar</a> : null}
                                  <button type="button" className="btn btn-d btn-s" onClick={() => deleteHotelDeadline(selectedTrip.id, hotel.id, item.id)}>Elimina</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : <EmptyState text="Nessun hotel inserito." />}
            </article>
          </section>

          <section className="grid-cards cols-2">
            <article className="card stack-card">
              <div className="card-title">5. Parcheggi e auto</div>

              <div className="form-shell">
                <form className="form-grid" onSubmit={handleAddParking}>
                  <div className="form-section-title">Parcheggio</div>
                  <div className="grid-cards responsive-2">
                    <label><Label required>Nome parcheggio</Label><input className={fieldClass(parkingForm.name)} value={parkingForm.name} onChange={(e) => setParkingForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
                    <label><Label>Indirizzo</Label><input className={fieldClass(parkingForm.address)} value={parkingForm.address} onChange={(e) => setParkingForm((prev) => ({ ...prev, address: e.target.value }))} /></label>
                    <label><Label>Dal</Label><input type="date" className={fieldClass(parkingForm.dateFrom)} value={parkingForm.dateFrom} onChange={(e) => setParkingForm((prev) => ({ ...prev, dateFrom: e.target.value }))} /></label>
                    <label><Label>Al</Label><input type="date" className={fieldClass(parkingForm.dateTo)} value={parkingForm.dateTo} onChange={(e) => setParkingForm((prev) => ({ ...prev, dateTo: e.target.value }))} /></label>
                    <label><Label>Costo</Label><input className={fieldClass(parkingForm.cost)} value={parkingForm.cost} onChange={(e) => setParkingForm((prev) => ({ ...prev, cost: e.target.value }))} /></label>
                    <label><Label>Link prenotazione</Label><input className={fieldClass(parkingForm.bookingUrl)} value={parkingForm.bookingUrl} onChange={(e) => setParkingForm((prev) => ({ ...prev, bookingUrl: e.target.value }))} /></label>
                    <label className="responsive-full"><Label>Note</Label><textarea className={fieldClass(parkingForm.notes)} value={parkingForm.notes} onChange={(e) => setParkingForm((prev) => ({ ...prev, notes: e.target.value }))} /></label>
                  </div>
                  <div><button type="submit" className="btn btn-p">Aggiungi parcheggio</button></div>
                </form>

                <div className="timeline-list">
                  {(selectedTrip.parkingReservations || []).map((item) => (
                    <div key={item.id} className="timeline-item compact between">
                      <div>{item.name} · {fmt(item.dateFrom)} → {fmt(item.dateTo)} {item.cost ? `· ${item.cost}` : ''}</div>
                      <div className="actions-row">
                        {item.bookingUrl ? <a className="btn btn-s" href={item.bookingUrl} target="_blank" rel="noopener noreferrer">Apri</a> : null}
                        <button type="button" className="btn btn-d btn-s" onClick={() => deleteParkingReservation(selectedTrip.id, item.id)}>Elimina</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-shell">
                <form className="form-grid" onSubmit={handleAddCar}>
                  <div className="form-section-title">Auto a noleggio</div>
                  <div className="grid-cards responsive-2">
                    <label><Label required>Compagnia</Label><input className={fieldClass(carForm.company)} value={carForm.company} onChange={(e) => setCarForm((prev) => ({ ...prev, company: e.target.value }))} /></label>
                    <label><Label>Costo</Label><input className={fieldClass(carForm.cost)} value={carForm.cost} onChange={(e) => setCarForm((prev) => ({ ...prev, cost: e.target.value }))} /></label>
                    <label><Label>Ritiro</Label><input className={fieldClass(carForm.pickupPlace)} value={carForm.pickupPlace} onChange={(e) => setCarForm((prev) => ({ ...prev, pickupPlace: e.target.value }))} /></label>
                    <label><Label>Riconsegna</Label><input className={fieldClass(carForm.dropoffPlace)} value={carForm.dropoffPlace} onChange={(e) => setCarForm((prev) => ({ ...prev, dropoffPlace: e.target.value }))} /></label>
                    <label><Label>Data ritiro</Label><input type="date" className={fieldClass(carForm.pickupDate)} value={carForm.pickupDate} onChange={(e) => setCarForm((prev) => ({ ...prev, pickupDate: e.target.value }))} /></label>
                    <label><Label>Data riconsegna</Label><input type="date" className={fieldClass(carForm.dropoffDate)} value={carForm.dropoffDate} onChange={(e) => setCarForm((prev) => ({ ...prev, dropoffDate: e.target.value }))} /></label>
                    <label><Label>Deposito</Label><input className={fieldClass(carForm.deposit)} value={carForm.deposit} onChange={(e) => setCarForm((prev) => ({ ...prev, deposit: e.target.value }))} /></label>
                    <label><Label>Link prenotazione</Label><input className={fieldClass(carForm.bookingUrl)} value={carForm.bookingUrl} onChange={(e) => setCarForm((prev) => ({ ...prev, bookingUrl: e.target.value }))} /></label>
                    <label className="responsive-full"><Label>Note</Label><textarea className={fieldClass(carForm.notes)} value={carForm.notes} onChange={(e) => setCarForm((prev) => ({ ...prev, notes: e.target.value }))} /></label>
                  </div>
                  <div><button type="submit" className="btn btn-p">Aggiungi auto</button></div>
                </form>

                <div className="timeline-list">
                  {(selectedTrip.carRentals || []).map((item) => (
                    <div key={item.id} className="timeline-item compact between">
                      <div>{item.company} · {fmt(item.pickupDate)} → {fmt(item.dropoffDate)} {item.cost ? `· ${item.cost}` : ''}</div>
                      <div className="actions-row">
                        {item.bookingUrl ? <a className="btn btn-s" href={item.bookingUrl} target="_blank" rel="noopener noreferrer">Apri</a> : null}
                        <button type="button" className="btn btn-d btn-s" onClick={() => deleteCarRental(selectedTrip.id, item.id)}>Elimina</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="card stack-card">
              <div className="card-title">6. Diario, luoghi e media</div>

              <div className="form-shell">
                <form className="form-grid" onSubmit={handleAddDay}>
                  <div className="form-section-title">Giorno di viaggio</div>
                  <div className="grid-cards responsive-2">
                    <label><Label>Data</Label><input type="date" className={fieldClass(dayForm.date)} value={dayForm.date} onChange={(e) => setDayForm((prev) => ({ ...prev, date: e.target.value }))} /></label>
                    <label><Label required>Titolo</Label><input className={fieldClass(dayForm.title)} value={dayForm.title} onChange={(e) => setDayForm((prev) => ({ ...prev, title: e.target.value }))} /></label>
                    <label className="responsive-full"><Label>Note</Label><textarea className={fieldClass(dayForm.notes)} value={dayForm.notes} onChange={(e) => setDayForm((prev) => ({ ...prev, notes: e.target.value }))} /></label>
                  </div>
                  <div><button type="submit" className="btn btn-p">Aggiungi giorno</button></div>
                </form>

                <div className="timeline-list">
                  {(selectedTrip.travelDiary?.days || []).map((day) => (
                    <div key={day.id} className="timeline-item compact between">
                      <div>{fmt(day.date)} · {day.title} {day.notes ? `· ${day.notes}` : ''}</div>
                      <button type="button" className="btn btn-d btn-s" onClick={() => deleteDiaryDay(selectedTrip.id, day.id)}>Elimina</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-shell">
                <form className="form-grid" onSubmit={handleAddPlace}>
                  <div className="form-section-title">Luogo / ristorante / punto utile</div>
                  <div className="grid-cards responsive-2">
                    <label><Label>Tipo</Label><input className={fieldClass(placeForm.type)} value={placeForm.type} onChange={(e) => setPlaceForm((prev) => ({ ...prev, type: e.target.value }))} /></label>
                    <label><Label required>Nome</Label><input className={fieldClass(placeForm.name)} value={placeForm.name} onChange={(e) => setPlaceForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
                    <label className="responsive-full"><Label>Indirizzo</Label><input className={fieldClass(placeForm.address)} value={placeForm.address} onChange={(e) => setPlaceForm((prev) => ({ ...prev, address: e.target.value }))} /></label>
                    <label><Label>Link</Label><input className={fieldClass(placeForm.url)} value={placeForm.url} onChange={(e) => setPlaceForm((prev) => ({ ...prev, url: e.target.value }))} /></label>
                    <label><Label>Voto</Label><input className={fieldClass(placeForm.rating)} value={placeForm.rating} onChange={(e) => setPlaceForm((prev) => ({ ...prev, rating: e.target.value }))} /></label>
                    <label className="responsive-full"><Label>Nota recensione</Label><textarea className={fieldClass(placeForm.reviewNote)} value={placeForm.reviewNote} onChange={(e) => setPlaceForm((prev) => ({ ...prev, reviewNote: e.target.value }))} /></label>
                    <label><Label>Immagine URL</Label><input className={fieldClass(placeForm.imageUrl)} value={placeForm.imageUrl} onChange={(e) => setPlaceForm((prev) => ({ ...prev, imageUrl: e.target.value }))} /></label>
                    <label className="responsive-full"><Label>Note</Label><textarea className={fieldClass(placeForm.notes)} value={placeForm.notes} onChange={(e) => setPlaceForm((prev) => ({ ...prev, notes: e.target.value }))} /></label>
                  </div>
                  <div><button type="submit" className="btn btn-p">Aggiungi luogo</button></div>
                </form>

                <div className="timeline-list">
                  {(selectedTrip.travelDiary?.places || []).map((place) => (
                    <div key={place.id} className="timeline-item">
                      <div className="between">
                        <div>
                          <div className="card-subtitle">{place.name}</div>
                          <div className="muted">{place.type || 'Luogo'} {place.rating ? `· ${place.rating}` : ''}</div>
                        </div>
                        <div className="actions-row">
                          {place.url ? <a className="btn btn-s" href={place.url} target="_blank" rel="noopener noreferrer">Apri</a> : null}
                          {mapsLink(place.address, place.lat, place.lng) ? <a className="btn btn-s" href={mapsLink(place.address, place.lat, place.lng)} target="_blank" rel="noopener noreferrer">Maps</a> : null}
                          <button type="button" className="btn btn-d btn-s" onClick={() => deleteDiaryPlace(selectedTrip.id, place.id)}>Elimina</button>
                        </div>
                      </div>
                      {place.reviewNote ? <div className="muted" style={{ marginTop: 8 }}>{place.reviewNote}</div> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-shell">
                <form className="form-grid" onSubmit={handleAddMedia}>
                  <div className="form-section-title">Media e link utili</div>
                  <div className="grid-cards responsive-2">
                    <label>
                      <Label>Tipo contenuto</Label>
                      <select className={fieldClass(mediaForm.type)} value={mediaForm.type} onChange={(e) => setMediaForm((prev) => ({ ...prev, type: e.target.value }))}>
                        {MEDIA_TYPE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </label>
                    <label><Label required>Titolo</Label><input className={fieldClass(mediaForm.title)} value={mediaForm.title} onChange={(e) => setMediaForm((prev) => ({ ...prev, title: e.target.value }))} /></label>
                    <label className="responsive-full"><Label required>URL</Label><input className={fieldClass(mediaForm.url)} value={mediaForm.url} onChange={(e) => setMediaForm((prev) => ({ ...prev, url: e.target.value, thumbnail: mediaForm.type === 'youtube' ? youtubeThumb(e.target.value) : prev.thumbnail }))} /></label>
                    <label><Label>Fonte</Label><input className={fieldClass(mediaForm.source)} value={mediaForm.source} onChange={(e) => setMediaForm((prev) => ({ ...prev, source: e.target.value }))} /></label>
                    <label><Label>Thumbnail</Label><input className={fieldClass(mediaForm.thumbnail)} value={mediaForm.thumbnail} onChange={(e) => setMediaForm((prev) => ({ ...prev, thumbnail: e.target.value }))} /></label>
                    <label className="responsive-full"><Label>Note</Label><textarea className={fieldClass(mediaForm.notes)} value={mediaForm.notes} onChange={(e) => setMediaForm((prev) => ({ ...prev, notes: e.target.value }))} /></label>
                  </div>
                  <div><button type="submit" className="btn btn-p">Aggiungi media</button></div>
                </form>

                {(selectedTrip.travelDiary?.mediaLinks || []).length ? (
                  <div className="media-grid">
                    {selectedTrip.travelDiary.mediaLinks.map((item) => {
                      const thumb = guessMediaThumb(item.type, item.url, item.thumbnail)
                      return (
                        <div key={item.id} className="media-card">
                          {thumb ? <img src={thumb} alt={item.title} className="media-thumb" loading="lazy" /> : <div className="media-thumb" />}
                          <div className="media-body">
                            <div className="card-subtitle">{item.title}</div>
                            <div className="muted">{item.source || item.type}</div>
                            {item.notes ? <div className="muted">{item.notes}</div> : null}
                            <div className="actions-row">
                              <a className="btn btn-s" href={item.url} target="_blank" rel="noopener noreferrer">Apri</a>
                              <button type="button" className="btn btn-d btn-s" onClick={() => deleteDiaryMedia(selectedTrip.id, item.id)}>Elimina</button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : <EmptyState text="Nessun media o link utile inserito." />}
              </div>
            </article>
          </section>

          <section className="card stack-card">
            <div className="card-title">7. Checklist</div>

            {!selectedTrip.packingChecklist?.length ? (
              <EmptyState text="Nessuna checklist disponibile per questo viaggio." />
            ) : (
              <div className="grid-cards cols-2">
                {selectedTrip.packingChecklist.map((group) => (
                  <div key={group.id} className="subsection-box">
                    <div className="between">
                      <div>
                        <div className="card-subtitle">{group.category}</div>
                        <div className="muted">Spunte rapide e nuove voci aggiungibili.</div>
                      </div>
                    </div>

                    <div className="checklist-list" style={{ marginTop: 12 }}>
                      {(group.items || []).map((item) => (
                        <div key={item.id} className={`check-item ${item.done ? 'done' : ''}`}>
                          <input type="checkbox" checked={Boolean(item.done)} onChange={() => toggleChecklistItem(selectedTrip.id, group.id, item.id)} />
                          <span>{item.label}</span>
                          <button type="button" className="btn btn-d btn-s" onClick={() => removeChecklistItem(selectedTrip.id, group.id, item.id)}>Elimina</button>
                        </div>
                      ))}
                    </div>

                    <div className="inline-form" style={{ marginTop: 12 }}>
                      <input className={fieldClass(newChecklistLabels[group.id] || '')} value={newChecklistLabels[group.id] || ''} onChange={(e) => setNewChecklistLabels((prev) => ({ ...prev, [group.id]: e.target.value }))} placeholder={`Nuova voce per ${group.category}`} />
                      <button type="button" className="btn btn-p" onClick={() => handleAddChecklistItem(group.id)}>Aggiungi voce</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
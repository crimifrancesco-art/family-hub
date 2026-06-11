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
  return 'muted'
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

function tripChipLabel(trip) {
  const name = (trip?.name || 'Viaggio').trim()
  const status = labelStatus(trip?.status)
  const date = trip?.dateFrom ? fmt(trip.dateFrom) : ''
  return [name, status, date].filter(Boolean).join(' · ')
}

function makeRequiredErrors(entries) {
  const errors = {}
  entries.forEach(({ key, value, message }) => {
    if (!String(value ?? '').trim()) errors[key] = message
  })
  return errors
}

function countTripDeadlines(trip) {
  if (!trip) return 0

  const tripDateCount = trip.dateFrom ? 1 : 0
  const flightDateCount = (trip.flights || []).reduce((sum, flight) => {
    const base = flight.date ? 1 : 0
    const deadlines = (flight.deadlines || []).filter((item) => item?.date).length
    return sum + base + deadlines
  }, 0)

  const hotelDateCount = (trip.hotels || []).reduce((sum, hotel) => {
    const checkIn = hotel.checkIn ? 1 : 0
    const cancellation = hotel.cancellationDate ? 1 : 0
    const deadlines = (hotel.deadlines || []).filter((item) => item?.date).length
    return sum + checkIn + cancellation + deadlines
  }, 0)

  const parkingDateCount = (trip.parkingReservations || []).reduce((sum, item) => sum + (item.dateFrom ? 1 : 0), 0)
  const carDateCount = (trip.carRentals || []).reduce((sum, item) => sum + (item.pickupDate ? 1 : 0), 0)
  const dayDateCount = (trip.travelDiary?.days || []).filter((item) => item?.date).length

  return tripDateCount + flightDateCount + hotelDateCount + parkingDateCount + carDateCount + dayDateCount
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

function fieldClass(value, invalid = false, variant = '') {
  return `fi ${variant} ${isFilled(value) ? 'field-active' : ''} ${invalid ? 'field-invalid' : ''}`.trim()
}

function ErrorLine({ text }) {
  if (!text) return null
  return <div className="field-error">{text}</div>
}

const EMPTY_TRIP_FORM = {
  name: '',
  status: 'planning',
  dateFrom: '',
  dateTo: '',
}

const EMPTY_SELECTED_TRIP_EDIT = {
  name: '',
  status: 'planning',
  dateFrom: '',
  dateTo: '',
  notes: '',
}

const EMPTY_FLIGHT_FORM = {
  company: '',
  from: '',
  to: '',
  date: '',
  departureTime: '',
  arrivalTime: '',
  flightNumber: '',
  bookingRef: '',
  purchaseCost: '',
}

const EMPTY_BAGGAGE_FORM = {
  label: '',
  qty: 1,
  cost: '',
}

const EMPTY_DEADLINE_FORM = {
  title: '',
  date: '',
  notes: '',
}

const EMPTY_HOTEL_FORM = {
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
}

const EMPTY_PARKING_FORM = {
  name: '',
  address: '',
  dateFrom: '',
  dateTo: '',
  cost: '',
  bookingUrl: '',
  notes: '',
}

const EMPTY_CAR_FORM = {
  company: '',
  pickupPlace: '',
  dropoffPlace: '',
  pickupDate: '',
  dropoffDate: '',
  cost: '',
  deposit: '',
  bookingUrl: '',
  notes: '',
}

const EMPTY_DAY_FORM = {
  date: '',
  title: '',
  notes: '',
}

const EMPTY_PLACE_FORM = {
  type: '',
  name: '',
  address: '',
  lat: '',
  lng: '',
  url: '',
  rating: '',
  reviewNote: '',
  imageUrl: '',
  notes: '',
}

const EMPTY_MEDIA_FORM = {
  type: 'link',
  title: '',
  url: '',
  source: '',
  thumbnail: '',
  notes: '',
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
  const [selectedTripEdit, setSelectedTripEdit] = useState(EMPTY_SELECTED_TRIP_EDIT)

  const [flightForm, setFlightForm] = useState(EMPTY_FLIGHT_FORM)
  const [flightErrors, setFlightErrors] = useState({})
  const [baggageForms, setBaggageForms] = useState({})
  const [flightDeadlineForms, setFlightDeadlineForms] = useState({})

  const [hotelForm, setHotelForm] = useState(EMPTY_HOTEL_FORM)
  const [hotelErrors, setHotelErrors] = useState({})
  const [hotelDeadlineForms, setHotelDeadlineForms] = useState({})

  const [parkingForm, setParkingForm] = useState(EMPTY_PARKING_FORM)
  const [parkingErrors, setParkingErrors] = useState({})

  const [carForm, setCarForm] = useState(EMPTY_CAR_FORM)
  const [carErrors, setCarErrors] = useState({})

  const [dayForm, setDayForm] = useState(EMPTY_DAY_FORM)
  const [dayErrors, setDayErrors] = useState({})

  const [placeForm, setPlaceForm] = useState(EMPTY_PLACE_FORM)
  const [placeErrors, setPlaceErrors] = useState({})

  const [mediaForm, setMediaForm] = useState(EMPTY_MEDIA_FORM)
  const [mediaErrors, setMediaErrors] = useState({})

  const [newChecklistLabels, setNewChecklistLabels] = useState({})
  const [flightDrafts, setFlightDrafts] = useState({})
  const [hotelDrafts, setHotelDrafts] = useState({})

  useEffect(() => {
    if (!selectedTripId && trips[0]?.id) {
      setSelectedTripId(trips[0].id)
      return
    }

    if (selectedTripId && !trips.some((trip) => trip.id === selectedTripId)) {
      setSelectedTripId(trips[0]?.id || '')
    }
  }, [selectedTripId, trips])

  const selectedTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId) || trips[0] || null, [trips, selectedTripId])

  useEffect(() => {
    if (!selectedTrip) {
      setSelectedTripEdit(EMPTY_SELECTED_TRIP_EDIT)
      return
    }

    setSelectedTripEdit({
      name: selectedTrip.name || '',
      status: selectedTrip.status || 'planning',
      dateFrom: selectedTrip.dateFrom || '',
      dateTo: selectedTrip.dateTo || '',
      notes: selectedTrip.notes || '',
    })
  }, [selectedTrip?.id])

  useEffect(() => {
    if (!selectedTrip) {
      setFlightDrafts({})
      setHotelDrafts({})
      return
    }

    const nextFlightDrafts = {}
    ;(selectedTrip.flights || []).forEach((flight) => {
      nextFlightDrafts[flight.id] = {
        company: flight.company || '',
        from: flight.from || '',
        to: flight.to || '',
        date: flight.date || '',
        departureTime: flight.departureTime || '',
        arrivalTime: flight.arrivalTime || '',
        flightNumber: flight.flightNumber || '',
        bookingRef: flight.bookingRef || '',
        purchaseCost: flight.purchaseCost || '',
      }
    })
    setFlightDrafts(nextFlightDrafts)

    const nextHotelDrafts = {}
    ;(selectedTrip.hotels || []).forEach((hotel) => {
      nextHotelDrafts[hotel.id] = {
        name: hotel.name || '',
        phone: hotel.phone || '',
        address: hotel.address || '',
        checkIn: hotel.checkIn || '',
        checkOut: hotel.checkOut || '',
        bookingUrl: hotel.bookingUrl || '',
        paidAmount: hotel.paidAmount || '',
        dueAmount: hotel.dueAmount || '',
        cancellationDate: hotel.cancellationDate || '',
      }
    })
    setHotelDrafts(nextHotelDrafts)
  }, [selectedTrip?.id])

  const tripStats = useMemo(() => {
    const totalTripDeadlines = trips.reduce((sum, trip) => sum + countTripDeadlines(trip), 0)

    if (!selectedTrip) {
      return { trips: trips.length, tripDeadlines: totalTripDeadlines, flights: 0, hotels: 0, persons: 0, media: 0 }
    }

    return {
      trips: trips.length,
      tripDeadlines: totalTripDeadlines,
      flights: selectedTrip.flights?.length || 0,
      hotels: selectedTrip.hotels?.length || 0,
      persons: selectedTrip.persons?.length || 0,
      media: selectedTrip.travelDiary?.mediaLinks?.length || 0,
    }
  }, [selectedTrip, trips])

  const validateTrip = () => {
    const errors = {}
    if (!tripForm.name.trim()) errors.name = 'Inserisci il nome del viaggio.'
    if (!tripForm.dateFrom) errors.dateFrom = 'Inserisci la data di inizio.'
    setTripErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateTrip = (e) => {
    e.preventDefault()
    if (!validateTrip()) return

    const createdTrip = addTrip({
      name: tripForm.name.trim(),
      status: tripForm.status,
      dateFrom: tripForm.dateFrom,
      dateTo: tripForm.dateTo,
      notes: '',
    })

    if (createdTrip?.id) setSelectedTripId(createdTrip.id)
    setTripForm(EMPTY_TRIP_FORM)
    setTripErrors({})
  }

  const commitSelectedTripField = (field, rawValue) => {
    if (!selectedTrip) return
    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue
    updateTrip(selectedTrip.id, { [field]: value })
  }

  const handleAddFlight = (e) => {
    e.preventDefault()
    if (!selectedTrip) return

    const errors = makeRequiredErrors([
      { key: 'company', value: flightForm.company, message: 'Inserisci la compagnia aerea.' },
    ])
    setFlightErrors(errors)
    if (Object.keys(errors).length) return

    addFlight(selectedTrip.id, {
      ...flightForm,
      company: flightForm.company.trim(),
      companyUrl: AIRLINE_DIRECTORY[flightForm.company.trim()] || '',
    })

    setFlightForm(EMPTY_FLIGHT_FORM)
    setFlightErrors({})
  }

  const setFlightDraftField = (flightId, field, value) => {
    setFlightDrafts((prev) => ({
      ...prev,
      [flightId]: {
        ...(prev[flightId] || {}),
        [field]: value,
      },
    }))
  }

  const commitFlightField = (flightId, field, rawValue) => {
    if (!selectedTrip) return
    const value = typeof rawValue === 'string' ? rawValue : rawValue
    const payload =
      field === 'company'
        ? { company: value, companyUrl: AIRLINE_DIRECTORY[value] || '' }
        : { [field]: value }
    updateFlight(selectedTrip.id, flightId, payload)
  }

  const handleAddFlightBaggage = (flightId) => {
    if (!selectedTrip) return
    const form = baggageForms[flightId] || EMPTY_BAGGAGE_FORM
    if (!form.label.trim()) return

    addFlightBaggage(selectedTrip.id, flightId, {
      label: form.label.trim(),
      qty: Number(form.qty) || 1,
      cost: form.cost,
    })

    setBaggageForms((prev) => ({ ...prev, [flightId]: { ...EMPTY_BAGGAGE_FORM } }))
  }

  const handleAddFlightDeadline = (flightId) => {
    if (!selectedTrip) return
    const form = flightDeadlineForms[flightId] || EMPTY_DEADLINE_FORM
    if (!form.title.trim()) return

    addFlightDeadline(selectedTrip.id, flightId, {
      title: form.title.trim(),
      date: form.date,
      notes: form.notes,
    })

    setFlightDeadlineForms((prev) => ({ ...prev, [flightId]: { ...EMPTY_DEADLINE_FORM } }))
  }

  const handleAddHotel = (e) => {
    e.preventDefault()
    if (!selectedTrip) return

    const errors = makeRequiredErrors([
      { key: 'name', value: hotelForm.name, message: 'Inserisci il nome hotel.' },
    ])
    setHotelErrors(errors)
    if (Object.keys(errors).length) return

    addHotel(selectedTrip.id, {
      ...hotelForm,
      name: hotelForm.name.trim(),
      address: hotelForm.address.trim(),
    })

    setHotelForm(EMPTY_HOTEL_FORM)
    setHotelErrors({})
  }

  const setHotelDraftField = (hotelId, field, value) => {
    setHotelDrafts((prev) => ({
      ...prev,
      [hotelId]: {
        ...(prev[hotelId] || {}),
        [field]: value,
      },
    }))
  }

  const commitHotelField = (hotelId, field, rawValue) => {
    if (!selectedTrip) return
    updateHotel(selectedTrip.id, hotelId, { [field]: rawValue })
  }

  const handleAddHotelDeadline = (hotelId) => {
    if (!selectedTrip) return
    const form = hotelDeadlineForms[hotelId] || EMPTY_DEADLINE_FORM
    if (!form.title.trim()) return

    addHotelDeadline(selectedTrip.id, hotelId, {
      title: form.title.trim(),
      date: form.date,
      notes: form.notes,
    })

    setHotelDeadlineForms((prev) => ({ ...prev, [hotelId]: { ...EMPTY_DEADLINE_FORM } }))
  }

  const handleAddParking = (e) => {
    e.preventDefault()
    if (!selectedTrip) return

    const errors = makeRequiredErrors([
      { key: 'name', value: parkingForm.name, message: 'Inserisci il nome del parcheggio.' },
    ])
    setParkingErrors(errors)
    if (Object.keys(errors).length) return

    addParkingReservation(selectedTrip.id, {
      ...parkingForm,
      name: parkingForm.name.trim(),
    })

    setParkingForm(EMPTY_PARKING_FORM)
    setParkingErrors({})
  }

  const handleAddCar = (e) => {
    e.preventDefault()
    if (!selectedTrip) return

    const errors = makeRequiredErrors([
      { key: 'company', value: carForm.company, message: 'Inserisci la compagnia di noleggio.' },
    ])
    setCarErrors(errors)
    if (Object.keys(errors).length) return

    addCarRental(selectedTrip.id, {
      ...carForm,
      company: carForm.company.trim(),
    })

    setCarForm(EMPTY_CAR_FORM)
    setCarErrors({})
  }

  const handleAddDay = (e) => {
    e.preventDefault()
    if (!selectedTrip) return

    const errors = makeRequiredErrors([
      { key: 'title', value: dayForm.title, message: 'Inserisci il titolo del giorno.' },
    ])
    setDayErrors(errors)
    if (Object.keys(errors).length) return

    addDiaryDay(selectedTrip.id, {
      ...dayForm,
      title: dayForm.title.trim(),
    })

    setDayForm(EMPTY_DAY_FORM)
    setDayErrors({})
  }

  const handleAddPlace = (e) => {
    e.preventDefault()
    if (!selectedTrip) return

    const errors = makeRequiredErrors([
      { key: 'name', value: placeForm.name, message: 'Inserisci il nome del luogo.' },
    ])
    setPlaceErrors(errors)
    if (Object.keys(errors).length) return

    const payload = {
      ...placeForm,
      type: placeForm.type.trim(),
      name: placeForm.name.trim(),
      address: placeForm.address.trim(),
      lat: placeForm.lat.trim(),
      lng: placeForm.lng.trim(),
      url: placeForm.url.trim(),
      rating: placeForm.rating.trim(),
      reviewNote: placeForm.reviewNote.trim(),
      imageUrl: placeForm.imageUrl.trim(),
      notes: placeForm.notes.trim(),
    }

    addDiaryPlace(selectedTrip.id, payload)
    setPlaceForm(EMPTY_PLACE_FORM)
    setPlaceErrors({})
  }

  const handleAddMedia = (e) => {
    e.preventDefault()
    if (!selectedTrip) return

    const errors = makeRequiredErrors([
      { key: 'url', value: mediaForm.url, message: 'Inserisci il link del media.' },
    ])
    setMediaErrors(errors)
    if (Object.keys(errors).length) return

    addDiaryMedia(selectedTrip.id, {
      ...mediaForm,
      url: mediaForm.url.trim(),
      title: mediaForm.title.trim(),
      thumbnail: guessMediaThumb(mediaForm.type, mediaForm.url, mediaForm.thumbnail),
    })

    setMediaForm(EMPTY_MEDIA_FORM)
    setMediaErrors({})
  }

  const handleToggleChecklistItem = (groupId, itemId) => {
    if (!selectedTrip) return
    toggleChecklistItem(selectedTrip.id, groupId, itemId)
  }

  const handleRemoveChecklistItem = (groupId, itemId) => {
    if (!selectedTrip) return
    removeChecklistItem(selectedTrip.id, groupId, itemId)
  }

  const handleAddChecklistItem = (groupId) => {
    if (!selectedTrip) return
    const value = (newChecklistLabels[groupId] || '').trim()
    if (!value) return
    addChecklistItem(selectedTrip.id, groupId, value)
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
        <h1>Pianificazione viaggi completa</h1>
        <p>Partecipanti cliccabili, parcheggi e auto inseribili, diario e media salvabili, checklist visibile.</p>

        {syncError ? <div className="app-status" style={{ marginTop: 14 }}>{syncError}</div> : null}

        <div className="hero-meta" style={{ marginTop: 14 }}>
          <span className="meta-chip">{tripStats.trips} viaggi</span>
          <span className="meta-chip">{tripStats.tripDeadlines} scadenze viaggio</span>
          <span className="meta-chip">{tripStats.flights} voli</span>
          <span className="meta-chip">{tripStats.hotels} hotel</span>
          <span className="meta-chip">{tripStats.persons} partecipanti</span>
          <span className="meta-chip">{tripStats.media} media</span>
        </div>
      </section>

      <section className="card stack-card">
        <div className="card-title">1. Crea o scegli il viaggio</div>

        <form className="form-shell form-grid" onSubmit={handleCreateTrip}>
          <div className="grid-cards responsive-3">
            <label>
              <Label required>Nome viaggio</Label>
              <input
                className={fieldClass(tripForm.name, Boolean(tripErrors.name))}
                value={tripForm.name}
                onChange={(e) => setTripForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <ErrorLine text={tripErrors.name} />
            </label>

            <label>
              <Label>Stato</Label>
              <select
                className={fieldClass(tripForm.status)}
                value={tripForm.status}
                onChange={(e) => setTripForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {TRIP_STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <Label required>Data inizio</Label>
              <input
                type="date"
                className={fieldClass(tripForm.dateFrom, Boolean(tripErrors.dateFrom))}
                value={tripForm.dateFrom}
                onChange={(e) => setTripForm((prev) => ({ ...prev, dateFrom: e.target.value }))}
              />
              <ErrorLine text={tripErrors.dateFrom} />
            </label>

            <label>
              <Label>Data fine</Label>
              <input
                type="date"
                className={fieldClass(tripForm.dateTo)}
                value={tripForm.dateTo}
                onChange={(e) => setTripForm((prev) => ({ ...prev, dateTo: e.target.value }))}
              />
            </label>
          </div>

          <div>
            <button type="submit" className="btn btn-p">
              Crea viaggio
            </button>
          </div>
        </form>

        {trips.length === 0 ? (
          <EmptyState text="Nessun viaggio creato." />
        ) : (
          <div className="family-switcher">
            {trips.map((trip) => {
              const active = selectedTrip?.id === trip.id
              return (
                <button
                  key={trip.id}
                  type="button"
                  className={`member-chip ${active ? 'active' : ''}`}
                  onClick={() => setSelectedTripId(trip.id)}
                >
                  <span>{tripChipLabel(trip)}</span>
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
                <div className="muted">Dati principali, stato, date e partecipanti.</div>
              </div>

              <div className="actions-row">
                <span className={`badge badge-${badgeClass(selectedTrip.status)}`}>{labelStatus(selectedTrip.status)}</span>
                <button type="button" className="btn btn-d btn-s" onClick={() => deleteTrip(selectedTrip.id)}>
                  Elimina viaggio
                </button>
              </div>
            </div>

            <div className="form-shell">
              <div className="grid-cards responsive-3">
                <label>
                  <Label>Nome viaggio</Label>
                  <input
                    className={fieldClass(selectedTripEdit.name)}
                    value={selectedTripEdit.name}
                    onChange={(e) => setSelectedTripEdit((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={(e) => commitSelectedTripField('name', e.target.value)}
                  />
                </label>

                <label>
                  <Label>Stato</Label>
                  <select
                    className={fieldClass(selectedTripEdit.status)}
                    value={selectedTripEdit.status}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedTripEdit((prev) => ({ ...prev, status: value }))
                      updateTrip(selectedTrip.id, { status: value })
                    }}
                  >
                    {TRIP_STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <Label>Inizio</Label>
                  <input
                    type="date"
                    className={fieldClass(selectedTripEdit.dateFrom)}
                    value={selectedTripEdit.dateFrom}
                    onChange={(e) => setSelectedTripEdit((prev) => ({ ...prev, dateFrom: e.target.value }))}
                    onBlur={(e) => commitSelectedTripField('dateFrom', e.target.value)}
                  />
                </label>

                <label>
                  <Label>Fine</Label>
                  <input
                    type="date"
                    className={fieldClass(selectedTripEdit.dateTo)}
                    value={selectedTripEdit.dateTo}
                    onChange={(e) => setSelectedTripEdit((prev) => ({ ...prev, dateTo: e.target.value }))}
                    onBlur={(e) => commitSelectedTripField('dateTo', e.target.value)}
                  />
                </label>

                <label className="responsive-full">
                  <Label>Note viaggio</Label>
                  <textarea
                    className={fieldClass(selectedTripEdit.notes)}
                    value={selectedTripEdit.notes}
                    onChange={(e) => setSelectedTripEdit((prev) => ({ ...prev, notes: e.target.value }))}
                    onBlur={(e) => commitSelectedTripField('notes', e.target.value)}
                  />
                </label>
              </div>

              <div className="section-divider" />
              <div className="form-section-title">Partecipanti</div>

              <div className="family-switcher">
                {familyMembers.map((member) => {
                  const included = selectedTrip.persons?.includes(member.id)
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`member-chip ${included ? 'active' : ''}`}
                      onClick={() => toggleTripMember(selectedTrip.id, member.id)}
                    >
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
              <div className="card-title">3. Voli</div>

              <form className="form-shell form-grid" onSubmit={handleAddFlight}>
                <div className="grid-cards responsive-3">
                  <label>
                    <Label required>Compagnia</Label>
                    <input
                      className={fieldClass(flightForm.company, Boolean(flightErrors.company), 'fi-travel')}
                      value={flightForm.company}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, company: e.target.value }))}
                    />
                    <ErrorLine text={flightErrors.company} />
                  </label>

                  <label>
                    <Label>Da</Label>
                    <input
                      className={fieldClass(flightForm.from, false, 'fi-travel')}
                      value={flightForm.from}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, from: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>A</Label>
                    <input
                      className={fieldClass(flightForm.to, false, 'fi-travel')}
                      value={flightForm.to}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, to: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Data</Label>
                    <input
                      type="date"
                      className={fieldClass(flightForm.date, false, 'fi-travel')}
                      value={flightForm.date}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Ora partenza</Label>
                    <input
                      type="time"
                      className={fieldClass(flightForm.departureTime, false, 'fi-travel')}
                      value={flightForm.departureTime}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, departureTime: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Ora arrivo</Label>
                    <input
                      type="time"
                      className={fieldClass(flightForm.arrivalTime, false, 'fi-travel')}
                      value={flightForm.arrivalTime}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, arrivalTime: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Numero volo</Label>
                    <input
                      className={fieldClass(flightForm.flightNumber, false, 'fi-travel')}
                      value={flightForm.flightNumber}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, flightNumber: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Booking ref</Label>
                    <input
                      className={fieldClass(flightForm.bookingRef, false, 'fi-travel')}
                      value={flightForm.bookingRef}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, bookingRef: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Costo acquisto</Label>
                    <input
                      className={fieldClass(flightForm.purchaseCost, false, 'fi-travel')}
                      value={flightForm.purchaseCost}
                      onChange={(e) => setFlightForm((prev) => ({ ...prev, purchaseCost: e.target.value }))}
                    />
                  </label>
                </div>

                <div>
                  <button type="submit" className="btn btn-travel">
                    Aggiungi volo
                  </button>
                </div>
              </form>

              {selectedTrip.flights?.length ? (
                <div className="timeline-list">
                  {selectedTrip.flights.map((flight) => {
                    const baggageForm = baggageForms[flight.id] || EMPTY_BAGGAGE_FORM
                    const deadlineForm = flightDeadlineForms[flight.id] || EMPTY_DEADLINE_FORM
                    const draft = flightDrafts[flight.id] || {}

                    return (
                      <div key={flight.id} className="timeline-item tl-travel">
                        <div className="between">
                          <div>
                            <div className="strong">
                              {flight.company || 'Compagnia'} · {flight.from || '—'} → {flight.to || '—'}
                            </div>
                            <div className="small muted">
                              {fmt(flight.date)} · {flight.departureTime || '--:--'} / {flight.arrivalTime || '--:--'}
                            </div>
                            <div className="small muted">
                              {flight.flightNumber ? `Volo ${flight.flightNumber}` : 'Numero volo non indicato'}
                              {flight.bookingRef ? ` · Ref ${flight.bookingRef}` : ''}
                              {flight.purchaseCost ? ` · ${flight.purchaseCost}` : ''}
                            </div>
                          </div>

                          <div className="actions-row">
                            {flight.companyUrl ? (
                              <a className="btn btn-s" href={flight.companyUrl} target="_blank" rel="noopener noreferrer">
                                Sito compagnia
                              </a>
                            ) : null}
                            <button type="button" className="btn btn-s" onClick={() => invertFlightRoute(selectedTrip.id, flight.id)}>
                              Inverti
                            </button>
                            <button type="button" className="btn btn-d btn-s" onClick={() => deleteFlight(selectedTrip.id, flight.id)}>
                              Elimina
                            </button>
                          </div>
                        </div>

                        <div className="grid-cards responsive-3" style={{ marginTop: 12 }}>
                          <label>
                            <Label>Compagnia</Label>
                            <input
                              className={fieldClass(draft.company, false, 'fi-travel')}
                              value={draft.company}
                              onChange={(e) => setFlightDraftField(flight.id, 'company', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'company', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Da</Label>
                            <input
                              className={fieldClass(draft.from, false, 'fi-travel')}
                              value={draft.from}
                              onChange={(e) => setFlightDraftField(flight.id, 'from', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'from', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>A</Label>
                            <input
                              className={fieldClass(draft.to, false, 'fi-travel')}
                              value={draft.to}
                              onChange={(e) => setFlightDraftField(flight.id, 'to', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'to', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Data</Label>
                            <input
                              type="date"
                              className={fieldClass(draft.date, false, 'fi-travel')}
                              value={draft.date}
                              onChange={(e) => setFlightDraftField(flight.id, 'date', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'date', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Ora partenza</Label>
                            <input
                              type="time"
                              className={fieldClass(draft.departureTime, false, 'fi-travel')}
                              value={draft.departureTime}
                              onChange={(e) => setFlightDraftField(flight.id, 'departureTime', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'departureTime', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Ora arrivo</Label>
                            <input
                              type="time"
                              className={fieldClass(draft.arrivalTime, false, 'fi-travel')}
                              value={draft.arrivalTime}
                              onChange={(e) => setFlightDraftField(flight.id, 'arrivalTime', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'arrivalTime', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Numero volo</Label>
                            <input
                              className={fieldClass(draft.flightNumber, false, 'fi-travel')}
                              value={draft.flightNumber}
                              onChange={(e) => setFlightDraftField(flight.id, 'flightNumber', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'flightNumber', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Booking ref</Label>
                            <input
                              className={fieldClass(draft.bookingRef, false, 'fi-travel')}
                              value={draft.bookingRef}
                              onChange={(e) => setFlightDraftField(flight.id, 'bookingRef', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'bookingRef', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Costo</Label>
                            <input
                              className={fieldClass(draft.purchaseCost, false, 'fi-travel')}
                              value={draft.purchaseCost}
                              onChange={(e) => setFlightDraftField(flight.id, 'purchaseCost', e.target.value)}
                              onBlur={(e) => commitFlightField(flight.id, 'purchaseCost', e.target.value)}
                            />
                          </label>
                        </div>

                        <div className="subsection-box" style={{ marginTop: 12 }}>
                          <div className="card-title">Bagagli</div>
                          <div className="grid-cards responsive-3" style={{ marginTop: 12 }}>
                            <label>
                              <Label>Etichetta</Label>
                              <input
                                className={fieldClass(baggageForm.label, false, 'fi-travel')}
                                value={baggageForm.label}
                                onChange={(e) =>
                                  setBaggageForms((prev) => ({
                                    ...prev,
                                    [flight.id]: { ...baggageForm, label: e.target.value },
                                  }))
                                }
                              />
                            </label>

                            <label>
                              <Label>Quantità</Label>
                              <input
                                type="number"
                                min="1"
                                className={fieldClass(baggageForm.qty, false, 'fi-travel')}
                                value={baggageForm.qty}
                                onChange={(e) =>
                                  setBaggageForms((prev) => ({
                                    ...prev,
                                    [flight.id]: { ...baggageForm, qty: e.target.value },
                                  }))
                                }
                              />
                            </label>

                            <label>
                              <Label>Costo</Label>
                              <input
                                className={fieldClass(baggageForm.cost, false, 'fi-travel')}
                                value={baggageForm.cost}
                                onChange={(e) =>
                                  setBaggageForms((prev) => ({
                                    ...prev,
                                    [flight.id]: { ...baggageForm, cost: e.target.value },
                                  }))
                                }
                              />
                            </label>
                          </div>

                          <div className="actions-row" style={{ marginTop: 12 }}>
                            <button type="button" className="btn btn-travel btn-s" onClick={() => handleAddFlightBaggage(flight.id)}>
                              Aggiungi bagaglio
                            </button>
                          </div>

                          {flight.baggage?.length ? (
                            <div className="timeline-list" style={{ marginTop: 12 }}>
                              {flight.baggage.map((bag) => (
                                <div key={bag.id} className="timeline-item compact">
                                  <div className="between">
                                    <div>
                                      <div className="strong">{bag.label || 'Bagaglio'}</div>
                                      <div className="small muted">
                                        Qty {bag.qty || 1}
                                        {bag.cost ? ` · ${bag.cost}` : ''}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-d btn-s"
                                      onClick={() => deleteFlightBaggage(selectedTrip.id, flight.id, bag.id)}
                                    >
                                      Elimina
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState text="Nessun bagaglio registrato." />
                          )}
                        </div>

                        <div className="subsection-box" style={{ marginTop: 12 }}>
                          <div className="between">
                            <div className="card-title">Scadenze volo</div>
                            {flight.date ? (
                              <a
                                className="btn btn-s"
                                href={googleCalendarLink({
                                  title: `Volo ${flight.company || ''} ${flight.from || ''} → ${flight.to || ''}`.trim(),
                                  startDate: flight.date,
                                  endDate: flight.date,
                                  details: `Numero volo: ${flight.flightNumber || 'n/d'} · Ref: ${flight.bookingRef || 'n/d'}`,
                                  location: `${flight.from || ''} → ${flight.to || ''}`,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Aggiungi al calendario
                              </a>
                            ) : null}
                          </div>

                          <div className="grid-cards responsive-3" style={{ marginTop: 12 }}>
                            <label>
                              <Label>Titolo</Label>
                              <input
                                className={fieldClass(deadlineForm.title, false, 'fi-travel')}
                                value={deadlineForm.title}
                                onChange={(e) =>
                                  setFlightDeadlineForms((prev) => ({
                                    ...prev,
                                    [flight.id]: { ...deadlineForm, title: e.target.value },
                                  }))
                                }
                              />
                            </label>

                            <label>
                              <Label>Data</Label>
                              <input
                                type="date"
                                className={fieldClass(deadlineForm.date, false, 'fi-travel')}
                                value={deadlineForm.date}
                                onChange={(e) =>
                                  setFlightDeadlineForms((prev) => ({
                                    ...prev,
                                    [flight.id]: { ...deadlineForm, date: e.target.value },
                                  }))
                                }
                              />
                            </label>

                            <label>
                              <Label>Note</Label>
                              <input
                                className={fieldClass(deadlineForm.notes, false, 'fi-travel')}
                                value={deadlineForm.notes}
                                onChange={(e) =>
                                  setFlightDeadlineForms((prev) => ({
                                    ...prev,
                                    [flight.id]: { ...deadlineForm, notes: e.target.value },
                                  }))
                                }
                              />
                            </label>
                          </div>

                          <div className="actions-row" style={{ marginTop: 12 }}>
                            <button type="button" className="btn btn-travel btn-s" onClick={() => handleAddFlightDeadline(flight.id)}>
                              Aggiungi scadenza
                            </button>
                          </div>

                          {flight.deadlines?.length ? (
                            <div className="timeline-list" style={{ marginTop: 12 }}>
                              {flight.deadlines.map((item) => (
                                <div key={item.id} className="timeline-item compact">
                                  <div className="between">
                                    <div>
                                      <div className="strong">{item.title || 'Scadenza'}</div>
                                      <div className="small muted">
                                        {fmt(item.date)}
                                        {item.notes ? ` · ${item.notes}` : ''}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-d btn-s"
                                      onClick={() => deleteFlightDeadline(selectedTrip.id, flight.id, item.id)}
                                    >
                                      Elimina
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState text="Nessuna scadenza volo." />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState text="Nessun volo inserito." />
              )}
            </article>

            <article className="card stack-card">
              <div className="card-title">4. Hotel</div>

              <form className="form-shell form-grid" onSubmit={handleAddHotel}>
                <div className="grid-cards responsive-3">
                  <label>
                    <Label required>Nome hotel</Label>
                    <input
                      className={fieldClass(hotelForm.name, Boolean(hotelErrors.name), 'fi-travel')}
                      value={hotelForm.name}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <ErrorLine text={hotelErrors.name} />
                  </label>

                  <label>
                    <Label>Telefono</Label>
                    <input
                      className={fieldClass(hotelForm.phone, false, 'fi-travel')}
                      value={hotelForm.phone}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Indirizzo</Label>
                    <input
                      className={fieldClass(hotelForm.address, false, 'fi-travel')}
                      value={hotelForm.address}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Lat</Label>
                    <input
                      className={fieldClass(hotelForm.lat, false, 'fi-travel')}
                      value={hotelForm.lat}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, lat: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Lng</Label>
                    <input
                      className={fieldClass(hotelForm.lng, false, 'fi-travel')}
                      value={hotelForm.lng}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, lng: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Prenotazione</Label>
                    <input
                      className={fieldClass(hotelForm.bookingUrl, false, 'fi-travel')}
                      value={hotelForm.bookingUrl}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, bookingUrl: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Link alternativo</Label>
                    <input
                      className={fieldClass(hotelForm.alternateUrl, false, 'fi-travel')}
                      value={hotelForm.alternateUrl}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, alternateUrl: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Check-in</Label>
                    <input
                      type="date"
                      className={fieldClass(hotelForm.checkIn, false, 'fi-travel')}
                      value={hotelForm.checkIn}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, checkIn: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Check-out</Label>
                    <input
                      type="date"
                      className={fieldClass(hotelForm.checkOut, false, 'fi-travel')}
                      value={hotelForm.checkOut}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, checkOut: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Pagato</Label>
                    <input
                      className={fieldClass(hotelForm.paidAmount, false, 'fi-travel')}
                      value={hotelForm.paidAmount}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Da pagare</Label>
                    <input
                      className={fieldClass(hotelForm.dueAmount, false, 'fi-travel')}
                      value={hotelForm.dueAmount}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, dueAmount: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Metodo pagamento</Label>
                    <input
                      className={fieldClass(hotelForm.paymentMethod, false, 'fi-travel')}
                      value={hotelForm.paymentMethod}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Cancellazione entro</Label>
                    <input
                      type="date"
                      className={fieldClass(hotelForm.cancellationDate, false, 'fi-travel')}
                      value={hotelForm.cancellationDate}
                      onChange={(e) => setHotelForm((prev) => ({ ...prev, cancellationDate: e.target.value }))}
                    />
                  </label>
                </div>

                <div>
                  <button type="submit" className="btn btn-travel">
                    Aggiungi hotel
                  </button>
                </div>
              </form>

              {selectedTrip.hotels?.length ? (
                <div className="timeline-list">
                  {selectedTrip.hotels.map((hotel) => {
                    const mapUrl = mapsLink(hotel.address, hotel.lat, hotel.lng)
                    const dirUrl = directionsLink(hotel.address, hotel.lat, hotel.lng)
                    const hotelDeadlineForm = hotelDeadlineForms[hotel.id] || EMPTY_DEADLINE_FORM
                    const draft = hotelDrafts[hotel.id] || {}

                    return (
                      <div key={hotel.id} className="timeline-item tl-travel">
                        <div className="between">
                          <div>
                            <div className="strong">{hotel.name || 'Hotel'}</div>
                            <div className="small muted">{hotel.address || 'Indirizzo non disponibile'}</div>
                            <div className="small muted">
                              {hotel.checkIn ? `Check-in ${fmt(hotel.checkIn)}` : 'Check-in —'}
                              {hotel.checkOut ? ` · Check-out ${fmt(hotel.checkOut)}` : ''}
                            </div>
                            <div className="small muted">
                              {hotel.paidAmount ? `Pagato ${hotel.paidAmount}` : ''}
                              {hotel.dueAmount ? ` · Da pagare ${hotel.dueAmount}` : ''}
                              {hotel.paymentMethod ? ` · ${hotel.paymentMethod}` : ''}
                            </div>
                          </div>

                          <div className="actions-row">
                            {hotel.bookingUrl ? (
                              <a className="btn btn-s" href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer">
                                Prenotazione
                              </a>
                            ) : null}
                            {hotel.alternateUrl ? (
                              <a className="btn btn-s" href={hotel.alternateUrl} target="_blank" rel="noopener noreferrer">
                                Link 2
                              </a>
                            ) : null}
                            {mapUrl ? (
                              <a className="btn btn-s" href={mapUrl} target="_blank" rel="noopener noreferrer">
                                Maps
                              </a>
                            ) : null}
                            {dirUrl ? (
                              <a className="btn btn-s" href={dirUrl} target="_blank" rel="noopener noreferrer">
                                Itinerario
                              </a>
                            ) : null}
                            <button type="button" className="btn btn-d btn-s" onClick={() => deleteHotel(selectedTrip.id, hotel.id)}>
                              Elimina
                            </button>
                          </div>
                        </div>

                        <div className="grid-cards responsive-3" style={{ marginTop: 12 }}>
                          <label>
                            <Label>Nome</Label>
                            <input
                              className={fieldClass(draft.name, false, 'fi-travel')}
                              value={draft.name}
                              onChange={(e) => setHotelDraftField(hotel.id, 'name', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'name', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Telefono</Label>
                            <input
                              className={fieldClass(draft.phone, false, 'fi-travel')}
                              value={draft.phone}
                              onChange={(e) => setHotelDraftField(hotel.id, 'phone', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'phone', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Indirizzo</Label>
                            <input
                              className={fieldClass(draft.address, false, 'fi-travel')}
                              value={draft.address}
                              onChange={(e) => setHotelDraftField(hotel.id, 'address', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'address', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Check-in</Label>
                            <input
                              type="date"
                              className={fieldClass(draft.checkIn, false, 'fi-travel')}
                              value={draft.checkIn}
                              onChange={(e) => setHotelDraftField(hotel.id, 'checkIn', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'checkIn', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Check-out</Label>
                            <input
                              type="date"
                              className={fieldClass(draft.checkOut, false, 'fi-travel')}
                              value={draft.checkOut}
                              onChange={(e) => setHotelDraftField(hotel.id, 'checkOut', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'checkOut', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Prenotazione</Label>
                            <input
                              className={fieldClass(draft.bookingUrl, false, 'fi-travel')}
                              value={draft.bookingUrl}
                              onChange={(e) => setHotelDraftField(hotel.id, 'bookingUrl', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'bookingUrl', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Pagato</Label>
                            <input
                              className={fieldClass(draft.paidAmount, false, 'fi-travel')}
                              value={draft.paidAmount}
                              onChange={(e) => setHotelDraftField(hotel.id, 'paidAmount', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'paidAmount', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Da pagare</Label>
                            <input
                              className={fieldClass(draft.dueAmount, false, 'fi-travel')}
                              value={draft.dueAmount}
                              onChange={(e) => setHotelDraftField(hotel.id, 'dueAmount', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'dueAmount', e.target.value)}
                            />
                          </label>

                          <label>
                            <Label>Cancellazione</Label>
                            <input
                              type="date"
                              className={fieldClass(draft.cancellationDate, false, 'fi-travel')}
                              value={draft.cancellationDate}
                              onChange={(e) => setHotelDraftField(hotel.id, 'cancellationDate', e.target.value)}
                              onBlur={(e) => commitHotelField(hotel.id, 'cancellationDate', e.target.value)}
                            />
                          </label>
                        </div>

                        <div className="subsection-box" style={{ marginTop: 12 }}>
                          <div className="between">
                            <div className="card-title">Scadenze hotel</div>
                            {hotel.checkIn ? (
                              <a
                                className="btn btn-s"
                                href={googleCalendarLink({
                                  title: `Check-in ${hotel.name || 'Hotel'}`,
                                  startDate: hotel.checkIn,
                                  endDate: hotel.checkOut || hotel.checkIn,
                                  details: hotel.address || '',
                                  location: hotel.address || '',
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Calendario
                              </a>
                            ) : null}
                          </div>

                          <div className="grid-cards responsive-3" style={{ marginTop: 12 }}>
                            <label>
                              <Label>Titolo</Label>
                              <input
                                className={fieldClass(hotelDeadlineForm.title, false, 'fi-travel')}
                                value={hotelDeadlineForm.title}
                                onChange={(e) =>
                                  setHotelDeadlineForms((prev) => ({
                                    ...prev,
                                    [hotel.id]: { ...hotelDeadlineForm, title: e.target.value },
                                  }))
                                }
                              />
                            </label>

                            <label>
                              <Label>Data</Label>
                              <input
                                type="date"
                                className={fieldClass(hotelDeadlineForm.date, false, 'fi-travel')}
                                value={hotelDeadlineForm.date}
                                onChange={(e) =>
                                  setHotelDeadlineForms((prev) => ({
                                    ...prev,
                                    [hotel.id]: { ...hotelDeadlineForm, date: e.target.value },
                                  }))
                                }
                              />
                            </label>

                            <label>
                              <Label>Note</Label>
                              <input
                                className={fieldClass(hotelDeadlineForm.notes, false, 'fi-travel')}
                                value={hotelDeadlineForm.notes}
                                onChange={(e) =>
                                  setHotelDeadlineForms((prev) => ({
                                    ...prev,
                                    [hotel.id]: { ...hotelDeadlineForm, notes: e.target.value },
                                  }))
                                }
                              />
                            </label>
                          </div>

                          <div className="actions-row" style={{ marginTop: 12 }}>
                            <button type="button" className="btn btn-travel btn-s" onClick={() => handleAddHotelDeadline(hotel.id)}>
                              Aggiungi scadenza
                            </button>
                          </div>

                          {hotel.deadlines?.length ? (
                            <div className="timeline-list" style={{ marginTop: 12 }}>
                              {hotel.deadlines.map((item) => (
                                <div key={item.id} className="timeline-item compact">
                                  <div className="between">
                                    <div>
                                      <div className="strong">{item.title || 'Scadenza'}</div>
                                      <div className="small muted">
                                        {fmt(item.date)}
                                        {item.notes ? ` · ${item.notes}` : ''}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-d btn-s"
                                      onClick={() => deleteHotelDeadline(selectedTrip.id, hotel.id, item.id)}
                                    >
                                      Elimina
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState text="Nessuna scadenza hotel." />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState text="Nessun hotel presente nel viaggio selezionato." />
              )}
            </article>
          </section>

          <section className="grid-cards cols-2">
            <article className="card stack-card">
              <div className="card-title">5. Parcheggi</div>

              <form className="form-shell form-grid" onSubmit={handleAddParking}>
                <div className="grid-cards responsive-3">
                  <label>
                    <Label required>Nome parcheggio</Label>
                    <input
                      className={fieldClass(parkingForm.name, Boolean(parkingErrors.name), 'fi-travel')}
                      value={parkingForm.name}
                      onChange={(e) => setParkingForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <ErrorLine text={parkingErrors.name} />
                  </label>

                  <label>
                    <Label>Indirizzo</Label>
                    <input
                      className={fieldClass(parkingForm.address, false, 'fi-travel')}
                      value={parkingForm.address}
                      onChange={(e) => setParkingForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Da</Label>
                    <input
                      type="date"
                      className={fieldClass(parkingForm.dateFrom, false, 'fi-travel')}
                      value={parkingForm.dateFrom}
                      onChange={(e) => setParkingForm((prev) => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>A</Label>
                    <input
                      type="date"
                      className={fieldClass(parkingForm.dateTo, false, 'fi-travel')}
                      value={parkingForm.dateTo}
                      onChange={(e) => setParkingForm((prev) => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Costo</Label>
                    <input
                      className={fieldClass(parkingForm.cost, false, 'fi-travel')}
                      value={parkingForm.cost}
                      onChange={(e) => setParkingForm((prev) => ({ ...prev, cost: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Link prenotazione</Label>
                    <input
                      className={fieldClass(parkingForm.bookingUrl, false, 'fi-travel')}
                      value={parkingForm.bookingUrl}
                      onChange={(e) => setParkingForm((prev) => ({ ...prev, bookingUrl: e.target.value }))}
                    />
                  </label>

                  <label className="responsive-full">
                    <Label>Note</Label>
                    <textarea
                      className={fieldClass(parkingForm.notes, false, 'fi-travel')}
                      value={parkingForm.notes}
                      onChange={(e) => setParkingForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </label>
                </div>

                <div>
                  <button type="submit" className="btn btn-travel">
                    Aggiungi parcheggio
                  </button>
                </div>
              </form>

              {selectedTrip.parkingReservations?.length ? (
                <div className="timeline-list">
                  {selectedTrip.parkingReservations.map((item) => (
                    <div key={item.id} className="timeline-item tl-travel">
                      <div className="between">
                        <div>
                          <div className="strong">{item.name || 'Parcheggio'}</div>
                          <div className="small muted">{item.address || 'Indirizzo non disponibile'}</div>
                          <div className="small muted">
                            {item.dateFrom ? fmt(item.dateFrom) : '—'}
                            {item.dateTo ? ` → ${fmt(item.dateTo)}` : ''}
                            {item.cost ? ` · ${item.cost}` : ''}
                          </div>
                          {item.notes ? <div className="small muted">{item.notes}</div> : null}
                        </div>

                        <div className="actions-row">
                          {item.bookingUrl ? (
                            <a className="btn btn-s" href={item.bookingUrl} target="_blank" rel="noopener noreferrer">
                              Prenotazione
                            </a>
                          ) : null}
                          <button type="button" className="btn btn-d btn-s" onClick={() => deleteParkingReservation(selectedTrip.id, item.id)}>
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Nessun parcheggio registrato." />
              )}
            </article>

            <article className="card stack-card">
              <div className="card-title">6. Auto a noleggio</div>

              <form className="form-shell form-grid" onSubmit={handleAddCar}>
                <div className="grid-cards responsive-3">
                  <label>
                    <Label required>Compagnia</Label>
                    <input
                      className={fieldClass(carForm.company, Boolean(carErrors.company), 'fi-travel')}
                      value={carForm.company}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, company: e.target.value }))}
                    />
                    <ErrorLine text={carErrors.company} />
                  </label>

                  <label>
                    <Label>Ritiro</Label>
                    <input
                      className={fieldClass(carForm.pickupPlace, false, 'fi-travel')}
                      value={carForm.pickupPlace}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, pickupPlace: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Riconsegna</Label>
                    <input
                      className={fieldClass(carForm.dropoffPlace, false, 'fi-travel')}
                      value={carForm.dropoffPlace}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, dropoffPlace: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Data ritiro</Label>
                    <input
                      type="date"
                      className={fieldClass(carForm.pickupDate, false, 'fi-travel')}
                      value={carForm.pickupDate}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, pickupDate: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Data riconsegna</Label>
                    <input
                      type="date"
                      className={fieldClass(carForm.dropoffDate, false, 'fi-travel')}
                      value={carForm.dropoffDate}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, dropoffDate: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Costo</Label>
                    <input
                      className={fieldClass(carForm.cost, false, 'fi-travel')}
                      value={carForm.cost}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, cost: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Deposito</Label>
                    <input
                      className={fieldClass(carForm.deposit, false, 'fi-travel')}
                      value={carForm.deposit}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, deposit: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Link prenotazione</Label>
                    <input
                      className={fieldClass(carForm.bookingUrl, false, 'fi-travel')}
                      value={carForm.bookingUrl}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, bookingUrl: e.target.value }))}
                    />
                  </label>

                  <label className="responsive-full">
                    <Label>Note</Label>
                    <textarea
                      className={fieldClass(carForm.notes, false, 'fi-travel')}
                      value={carForm.notes}
                      onChange={(e) => setCarForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </label>
                </div>

                <div>
                  <button type="submit" className="btn btn-travel">
                    Aggiungi auto
                  </button>
                </div>
              </form>

              {selectedTrip.carRentals?.length ? (
                <div className="timeline-list">
                  {selectedTrip.carRentals.map((item) => (
                    <div key={item.id} className="timeline-item tl-travel">
                      <div className="between">
                        <div>
                          <div className="strong">{item.company || 'Noleggio auto'}</div>
                          <div className="small muted">
                            {item.pickupPlace || 'Ritiro —'} → {item.dropoffPlace || 'Riconsegna —'}
                          </div>
                          <div className="small muted">
                            {item.pickupDate ? fmt(item.pickupDate) : '—'}
                            {item.dropoffDate ? ` → ${fmt(item.dropoffDate)}` : ''}
                            {item.cost ? ` · ${item.cost}` : ''}
                            {item.deposit ? ` · Deposito ${item.deposit}` : ''}
                          </div>
                          {item.notes ? <div className="small muted">{item.notes}</div> : null}
                        </div>

                        <div className="actions-row">
                          {item.bookingUrl ? (
                            <a className="btn btn-s" href={item.bookingUrl} target="_blank" rel="noopener noreferrer">
                              Prenotazione
                            </a>
                          ) : null}
                          <button type="button" className="btn btn-d btn-s" onClick={() => deleteCarRental(selectedTrip.id, item.id)}>
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Nessuna auto a noleggio salvata." />
              )}
            </article>
          </section>

          <section className="grid-cards cols-2">
            <article className="card stack-card">
              <div className="card-title">7. Diario viaggio</div>

              <form className="form-shell form-grid" onSubmit={handleAddDay}>
                <div className="grid-cards responsive-3">
                  <label>
                    <Label>Data</Label>
                    <input
                      type="date"
                      className={fieldClass(dayForm.date, false, 'fi-travel')}
                      value={dayForm.date}
                      onChange={(e) => setDayForm((prev) => ({ ...prev, date: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label required>Titolo</Label>
                    <input
                      className={fieldClass(dayForm.title, Boolean(dayErrors.title), 'fi-travel')}
                      value={dayForm.title}
                      onChange={(e) => setDayForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <ErrorLine text={dayErrors.title} />
                  </label>

                  <label className="responsive-full">
                    <Label>Note</Label>
                    <textarea
                      className={fieldClass(dayForm.notes, false, 'fi-travel')}
                      value={dayForm.notes}
                      onChange={(e) => setDayForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </label>
                </div>

                <div>
                  <button type="submit" className="btn btn-travel">
                    Aggiungi giorno
                  </button>
                </div>
              </form>

              {selectedTrip.travelDiary?.days?.length ? (
                <div className="timeline-list">
                  {selectedTrip.travelDiary.days.map((day) => (
                    <div key={day.id} className="timeline-item tl-travel">
                      <div className="between">
                        <div>
                          <div className="strong">{day.title || 'Giorno di viaggio'}</div>
                          <div className="small muted">{fmt(day.date)}</div>
                          {day.notes ? <div className="small muted">{day.notes}</div> : null}
                        </div>
                        <button type="button" className="btn btn-d btn-s" onClick={() => deleteDiaryDay(selectedTrip.id, day.id)}>
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Nessun giorno di diario inserito." />
              )}
            </article>

            <article className="card stack-card">
              <div className="card-title">8. Luoghi</div>

              <form className="form-shell form-grid" onSubmit={handleAddPlace}>
                <div className="grid-cards responsive-3">
                  <label>
                    <Label>Tipo</Label>
                    <input
                      className={fieldClass(placeForm.type, false, 'fi-travel')}
                      value={placeForm.type}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, type: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label required>Nome luogo</Label>
                    <input
                      className={fieldClass(placeForm.name, Boolean(placeErrors.name), 'fi-travel')}
                      value={placeForm.name}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                    <ErrorLine text={placeErrors.name} />
                  </label>

                  <label>
                    <Label>Indirizzo</Label>
                    <input
                      className={fieldClass(placeForm.address, false, 'fi-travel')}
                      value={placeForm.address}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, address: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Lat</Label>
                    <input
                      className={fieldClass(placeForm.lat, false, 'fi-travel')}
                      value={placeForm.lat}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, lat: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Lng</Label>
                    <input
                      className={fieldClass(placeForm.lng, false, 'fi-travel')}
                      value={placeForm.lng}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, lng: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>URL</Label>
                    <input
                      className={fieldClass(placeForm.url, false, 'fi-travel')}
                      value={placeForm.url}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, url: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Voto</Label>
                    <input
                      className={fieldClass(placeForm.rating, false, 'fi-travel')}
                      value={placeForm.rating}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, rating: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Nota recensione</Label>
                    <input
                      className={fieldClass(placeForm.reviewNote, false, 'fi-travel')}
                      value={placeForm.reviewNote}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, reviewNote: e.target.value }))}
                    />
                  </label>

                  <label>
                    <Label>Immagine</Label>
                    <input
                      className={fieldClass(placeForm.imageUrl, false, 'fi-travel')}
                      value={placeForm.imageUrl}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    />
                  </label>

                  <label className="responsive-full">
                    <Label>Note</Label>
                    <textarea
                      className={fieldClass(placeForm.notes, false, 'fi-travel')}
                      value={placeForm.notes}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </label>
                </div>

                <div>
                  <button type="submit" className="btn btn-travel">
                    Aggiungi luogo
                  </button>
                </div>
              </form>

              {selectedTrip.travelDiary?.places?.length ? (
                <div className="timeline-list">
                  {selectedTrip.travelDiary.places.map((place) => (
                    <div key={place.id} className="timeline-item tl-travel">
                      <div className="between">
                        <div>
                          <div className="strong">{place.name || 'Luogo'}</div>
                          <div className="small muted">{place.type || 'Punto di interesse'}</div>
                          {place.address ? <div className="small muted">{place.address}</div> : null}
                          <div className="small muted">
                            {place.rating ? `Voto ${place.rating}` : ''}
                            {place.reviewNote ? ` · ${place.reviewNote}` : ''}
                          </div>
                          {place.notes ? <div className="small muted">{place.notes}</div> : null}
                        </div>

                        <div className="actions-row">
                          {place.url ? (
                            <a className="btn btn-s" href={place.url} target="_blank" rel="noopener noreferrer">
                              Apri
                            </a>
                          ) : null}
                          {mapsLink(place.address, place.lat, place.lng) ? (
                            <a
                              className="btn btn-s"
                              href={mapsLink(place.address, place.lat, place.lng)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Maps
                            </a>
                          ) : null}
                          <button type="button" className="btn btn-d btn-s" onClick={() => deleteDiaryPlace(selectedTrip.id, place.id)}>
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Nessun luogo salvato." />
              )}
            </article>
          </section>

          <section className="card stack-card">
            <div className="card-title">9. Media viaggio</div>

            <form className="form-shell form-grid" onSubmit={handleAddMedia}>
              <div className="grid-cards responsive-3">
                <label>
                  <Label>Tipo</Label>
                  <select
                    className={fieldClass(mediaForm.type, false, 'fi-travel')}
                    value={mediaForm.type}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="link">Link</option>
                    <option value="youtube">YouTube</option>
                    <option value="drive">Drive</option>
                    <option value="article">Articolo</option>
                  </select>
                </label>

                <label>
                  <Label>Titolo</Label>
                  <input
                    className={fieldClass(mediaForm.title, false, 'fi-travel')}
                    value={mediaForm.title}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </label>

                <label>
                  <Label required>URL</Label>
                  <input
                    className={fieldClass(mediaForm.url, Boolean(mediaErrors.url), 'fi-travel')}
                    value={mediaForm.url}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, url: e.target.value }))}
                  />
                  <ErrorLine text={mediaErrors.url} />
                </label>

                <label>
                  <Label>Sorgente</Label>
                  <input
                    className={fieldClass(mediaForm.source, false, 'fi-travel')}
                    value={mediaForm.source}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, source: e.target.value }))}
                  />
                </label>

                <label>
                  <Label>Thumbnail</Label>
                  <input
                    className={fieldClass(mediaForm.thumbnail, false, 'fi-travel')}
                    value={mediaForm.thumbnail}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
                  />
                </label>

                <label className="responsive-full">
                  <Label>Note</Label>
                  <textarea
                    className={fieldClass(mediaForm.notes, false, 'fi-travel')}
                    value={mediaForm.notes}
                    onChange={(e) => setMediaForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </label>
              </div>

              <div>
                <button type="submit" className="btn btn-travel">
                  Aggiungi media
                </button>
              </div>
            </form>

            {selectedTrip.travelDiary?.mediaLinks?.length ? (
              <div className="media-grid">
                {selectedTrip.travelDiary.mediaLinks.map((item) => {
                  const thumb = guessMediaThumb(item.type, item.url, item.thumbnail)
                  return (
                    <div key={item.id} className="media-card">
                      {thumb ? <img src={thumb} alt={item.title || 'Media'} className="media-thumb" /> : <div className="media-thumb" />}
                      <div className="media-body">
                        <div className="strong">{item.title || 'Media'}</div>
                        <div className="small muted">{item.source || item.type || 'Link'}</div>
                        {item.notes ? <div className="small muted">{item.notes}</div> : null}
                        <div className="actions-row">
                          {item.url ? (
                            <a className="drive-link" href={item.url} target="_blank" rel="noopener noreferrer">
                              Apri link
                            </a>
                          ) : null}
                          <button type="button" className="btn btn-d btn-s" onClick={() => deleteDiaryMedia(selectedTrip.id, item.id)}>
                            Elimina
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState text="Nessun media salvato." />
            )}
          </section>

          <section className="card stack-card">
            <div className="card-title">10. Checklist valigia</div>

            {selectedTrip.packingChecklist?.length ? (
              <div className="grid-cards cols-2">
                {selectedTrip.packingChecklist.map((group) => (
                  <div key={group.id} className="subsection-box">
                    <div className="between">
                      <div>
                        <div className="strong">{group.category || 'Checklist'}</div>
                        <div className={`badge badge-${group.color === 'green' ? 'success' : group.color === 'orange' ? 'warning' : 'dash'}`}>
                          {group.items.filter((item) => item.done).length}/{group.items.length} completati
                        </div>
                      </div>
                    </div>

                    <div className="timeline-list" style={{ marginTop: 12 }}>
                      {(group.items || []).map((item) => (
                        <div key={item.id} className="timeline-item compact">
                          <div className="between">
                            <button
                              type="button"
                              className={`member-chip ${item.done ? 'active' : ''}`}
                              onClick={() => handleToggleChecklistItem(group.id, item.id)}
                            >
                              <span>{item.done ? '✓' : '○'}</span>
                              <span>{item.label}</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-d btn-s"
                              onClick={() => handleRemoveChecklistItem(group.id, item.id)}
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="inline-form" style={{ marginTop: 12 }}>
                      <input
                        className={fieldClass(newChecklistLabels[group.id] || '', false, 'fi-travel')}
                        placeholder="Nuovo elemento checklist"
                        value={newChecklistLabels[group.id] || ''}
                        onChange={(e) => setNewChecklistLabels((prev) => ({ ...prev, [group.id]: e.target.value }))}
                      />
                      <button type="button" className="btn btn-travel btn-s" onClick={() => handleAddChecklistItem(group.id)}>
                        Aggiungi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Nessuna checklist disponibile." />
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
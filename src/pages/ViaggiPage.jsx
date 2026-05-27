import { useMemo, useState } from 'react'
import { AIRLINE_DIRECTORY, TRIP_STATUS_OPTIONS, useAppContext } from '../context/AppContext'

function labelStatus(value) {
  return TRIP_STATUS_OPTIONS.find((item) => item.value === value)?.label || value
}

function mapsLink(address, lat, lng) {
  if (lat && lng) return `https://www.google.com/maps?q=${encodeURIComponent(`${lat},${lng}`)}`
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''
}

function googleCalendarLink({ title, startDate, endDate, details = '', location = '' }) {
  if (!startDate) return ''
  const start = `${startDate.replaceAll('-', '')}T090000`
  const end = `${(endDate || startDate).replaceAll('-', '')}T100000`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
}

function EmptyState({ icon, text }) {
  return <div className="empty"><i className={icon} /> <p>{text}</p></div>
}

function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-t">{title}</div>
        {children}
      </div>
    </div>
  )
}

function CardActions({ children }) {
  return <div className="actions-row">{children}</div>
}

export default function ViaggiPage() {
  const {
    trips,
    addTrip,
    updateTrip,
    deleteTrip,
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
    addDiaryDay,
    deleteDiaryDay,
    addDiaryPlace,
    deleteDiaryPlace,
  } = useAppContext()

  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || null)
  const [activeTab, setActiveTab] = useState('flights')
  const [modal, setModal] = useState(null)

  const selectedTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId) || trips[0] || null, [trips, selectedTripId])

  const openModal = (type, item = null, parentId = null) => setModal({ type, item, parentId })
  const closeModal = () => setModal(null)

  const submitTrip = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name'),
      status: fd.get('status'),
      dateFrom: fd.get('dateFrom'),
      dateTo: fd.get('dateTo'),
    }
    if (modal?.item) updateTrip(modal.item.id, payload)
    else addTrip(payload)
    closeModal()
  }

  const submitFlight = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      company: fd.get('company'),
      from: fd.get('from'),
      to: fd.get('to'),
      date: fd.get('date'),
      departureTime: fd.get('departureTime'),
      arrivalTime: fd.get('arrivalTime'),
      flightNumber: fd.get('flightNumber'),
      bookingRef: fd.get('bookingRef'),
      purchaseCost: fd.get('purchaseCost'),
      companyUrl: AIRLINE_DIRECTORY[fd.get('company')] || '',
    }
    if (modal?.item) updateFlight(selectedTrip.id, modal.item.id, payload)
    else addFlight(selectedTrip.id, payload)
    closeModal()
  }

  const submitFlightBag = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addFlightBaggage(selectedTrip.id, modal.parentId, {
      label: fd.get('label'),
      qty: fd.get('qty'),
      cost: fd.get('cost'),
    })
    closeModal()
  }

  const submitFlightDeadline = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addFlightDeadline(selectedTrip.id, modal.parentId, {
      title: fd.get('title'),
      date: fd.get('date'),
      notes: fd.get('notes'),
    })
    closeModal()
  }

  const submitHotel = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      address: fd.get('address'),
      lat: fd.get('lat'),
      lng: fd.get('lng'),
      bookingUrl: fd.get('bookingUrl'),
      alternateUrl: fd.get('alternateUrl'),
      checkIn: fd.get('checkIn'),
      checkOut: fd.get('checkOut'),
    }
    if (modal?.item) updateHotel(selectedTrip.id, modal.item.id, payload)
    else addHotel(selectedTrip.id, payload)
    closeModal()
  }

  const submitHotelDeadline = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addHotelDeadline(selectedTrip.id, modal.parentId, {
      title: fd.get('title'),
      date: fd.get('date'),
      notes: fd.get('notes'),
    })
    closeModal()
  }

  const submitDiaryDay = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addDiaryDay(selectedTrip.id, {
      date: fd.get('date'),
      title: fd.get('title'),
      notes: fd.get('notes'),
    })
    closeModal()
  }

  const submitPlace = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    addDiaryPlace(selectedTrip.id, {
      type: fd.get('type'),
      name: fd.get('name'),
      address: fd.get('address'),
      notes: fd.get('notes'),
      url: fd.get('url'),
    })
    closeModal()
  }

  return (
    <div className="viaggi-page">
      <div className="sh wrap">
        <div className="st"><i className="ti ti-plane" /> Viaggi</div>
        <button className="btn btn-p" onClick={() => openModal('trip')}>+ Aggiungi viaggio</button>
      </div>

      <div className="trip-grid">
        {trips.map((trip) => (
          <article key={trip.id} className={`trip ${selectedTrip?.id === trip.id ? 'trip-selected' : ''}`}>
            <div className="trip-h clickable" onClick={() => setSelectedTripId(trip.id)}>
              <div className="trip-nm">{trip.name}</div>
              <div className="meta-line">{trip.dateFrom} → {trip.dateTo}</div>
              <div className="pill-row"><span className="pill pill-a">{labelStatus(trip.status)}</span></div>
            </div>
            <div className="trip-ft">
              <button className="btn btn-s" onClick={() => openModal('trip', trip)}>Modifica</button>
              <button className="btn btn-s btn-d" onClick={() => deleteTrip(trip.id)}>Elimina</button>
            </div>
          </article>
        ))}
      </div>

      {selectedTrip && (
        <>
          <section className="card trip-summary-card">
            <div className="summary-top">
              <div>
                <div className="trip-nm">{selectedTrip.name}</div>
                <div className="meta-line">{selectedTrip.dateFrom} → {selectedTrip.dateTo}</div>
              </div>
              <span className="pill pill-g">{labelStatus(selectedTrip.status)}</span>
            </div>
            <div className="itabs scroll-tabs">
              <button className={`itab ${activeTab === 'flights' ? 'active' : ''}`} onClick={() => setActiveTab('flights')}>Voli</button>
              <button className={`itab ${activeTab === 'hotels' ? 'active' : ''}`} onClick={() => setActiveTab('hotels')}>Hotel</button>
              <button className={`itab ${activeTab === 'diary' ? 'active' : ''}`} onClick={() => setActiveTab('diary')}>Diario del viaggio</button>
            </div>
          </section>

          {activeTab === 'flights' && (
            <section>
              <div className="sh wrap">
                <div className="st">Voli</div>
                <button className="btn btn-p" onClick={() => openModal('flight')}>+ Aggiungi volo</button>
              </div>

              {!selectedTrip.flights.length && <EmptyState icon="ti ti-plane-off" text="Nessun volo — clicca Aggiungi" />}

              <div className="grid-cards cols-1">
                {selectedTrip.flights.map((flight) => (
                  <div key={flight.id} className="card stack-card">
                    <div className="card-head between wrap">
                      <div>
                        <div className="trip-nm small">{flight.company || 'Volo'}</div>
                        <div className="meta-line">{flight.from} → {flight.to}</div>
                      </div>
                      <div className="meta-group">
                        <span>{flight.date}</span>
                        <span>{flight.departureTime} - {flight.arrivalTime}</span>
                      </div>
                    </div>

                    <div className="detail-grid cols-3">
                      <div><strong>Numero</strong><span>{flight.flightNumber || '—'}</span></div>
                      <div><strong>Prenotazione</strong><span>{flight.bookingRef || '—'}</span></div>
                      <div><strong>Costo</strong><span>{flight.purchaseCost ? `€ ${flight.purchaseCost}` : '—'}</span></div>
                    </div>

                    <CardActions>
                      <button className="btn btn-s" onClick={() => openModal('flight', flight)}>Modifica</button>
                      <button className="btn btn-s" onClick={() => invertFlightRoute(selectedTrip.id, flight.id)}>Inverti tratta</button>
                      {flight.companyUrl && <a className="btn btn-s" href={flight.companyUrl} target="_blank" rel="noreferrer">Compagnia</a>}
                      <button className="btn btn-s btn-d" onClick={() => deleteFlight(selectedTrip.id, flight.id)}>Elimina</button>
                    </CardActions>

                    <div className="subsection">
                      <div className="subsection-head between wrap">
                        <h4>Bagagli</h4>
                        <button className="btn btn-s" onClick={() => openModal('flight-bag', null, flight.id)}>+ Aggiungi bagaglio</button>
                      </div>
                      {!flight.baggage?.length && <p className="muted">Nessun bagaglio registrato.</p>}
                      <div className="chips-list">
                        {(flight.baggage || []).map((bag) => (
                          <div key={bag.id} className="chip-card">
                            <span>{bag.label} · Qty {bag.qty} · {bag.cost ? `€ ${bag.cost}` : 'senza costo'}</span>
                            <button className="btn-icon danger" onClick={() => deleteFlightBaggage(selectedTrip.id, flight.id, bag.id)}><i className="ti ti-trash" /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="subsection">
                      <div className="subsection-head between wrap">
                        <h4>Scadenze volo</h4>
                        <button className="btn btn-s" onClick={() => openModal('flight-deadline', null, flight.id)}>+ Aggiungi scadenza</button>
                      </div>
                      {!flight.deadlines?.length && <p className="muted">Nessuna scadenza.</p>}
                      <div className="timeline-list">
                        {(flight.deadlines || []).map((deadline) => (
                          <div key={deadline.id} className="timeline-item">
                            <div>
                              <strong>{deadline.title}</strong>
                              <div className="meta-line">{deadline.date}</div>
                              <div className="muted">{deadline.notes}</div>
                            </div>
                            <div className="actions-row">
                              <a
                                className="btn btn-s"
                                href={googleCalendarLink({
                                  title: `${selectedTrip.name} · ${deadline.title}`,
                                  startDate: deadline.date,
                                  endDate: deadline.date,
                                  details: deadline.notes,
                                  location: `${flight.from} → ${flight.to}`,
                                })}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Google Calendar
                              </a>
                              <button className="btn btn-s btn-d" onClick={() => deleteFlightDeadline(selectedTrip.id, flight.id, deadline.id)}>Elimina</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'hotels' && (
            <section>
              <div className="sh wrap">
                <div className="st">Hotel</div>
                <button className="btn btn-p" onClick={() => openModal('hotel')}>+ Aggiungi hotel</button>
              </div>

              {!selectedTrip.hotels.length && <EmptyState icon="ti ti-building-skyscraper" text="Nessun hotel — clicca Aggiungi" />}

              <div className="grid-cards cols-1">
                {selectedTrip.hotels.map((hotel) => (
                  <div key={hotel.id} className="card stack-card">
                    <div className="card-head between wrap">
                      <div>
                        <div className="trip-nm small">{hotel.name || 'Hotel'}</div>
                        <div className="meta-line">{hotel.address}</div>
                      </div>
                      <div className="meta-group">
                        <span>{hotel.checkIn}</span>
                        <span>{hotel.checkOut}</span>
                      </div>
                    </div>

                    <div className="detail-grid cols-3">
                      <div><strong>Telefono</strong><span>{hotel.phone || '—'}</span></div>
                      <div><strong>Lat</strong><span>{hotel.lat || '—'}</span></div>
                      <div><strong>Lng</strong><span>{hotel.lng || '—'}</span></div>
                    </div>

                    <CardActions>
                      <button className="btn btn-s" onClick={() => openModal('hotel', hotel)}>Modifica</button>
                      {hotel.bookingUrl && <a className="btn btn-s" href={hotel.bookingUrl} target="_blank" rel="noreferrer">Booking</a>}
                      {hotel.alternateUrl && <a className="btn btn-s" href={hotel.alternateUrl} target="_blank" rel="noreferrer">Altro link</a>}
                      {mapsLink(hotel.address, hotel.lat, hotel.lng) && <a className="btn btn-s" href={mapsLink(hotel.address, hotel.lat, hotel.lng)} target="_blank" rel="noreferrer">Maps</a>}
                      <button className="btn btn-s btn-d" onClick={() => deleteHotel(selectedTrip.id, hotel.id)}>Elimina</button>
                    </CardActions>

                    <div className="subsection">
                      <div className="subsection-head between wrap">
                        <h4>Scadenze hotel</h4>
                        <button className="btn btn-s" onClick={() => openModal('hotel-deadline', null, hotel.id)}>+ Aggiungi scadenza</button>
                      </div>
                      {!hotel.deadlines?.length && <p className="muted">Nessuna scadenza hotel.</p>}
                      <div className="timeline-list">
                        {(hotel.deadlines || []).map((deadline) => (
                          <div key={deadline.id} className="timeline-item">
                            <div>
                              <strong>{deadline.title}</strong>
                              <div className="meta-line">{deadline.date}</div>
                              <div className="muted">{deadline.notes}</div>
                            </div>
                            <div className="actions-row">
                              <a
                                className="btn btn-s"
                                href={googleCalendarLink({
                                  title: `${selectedTrip.name} · ${deadline.title}`,
                                  startDate: deadline.date,
                                  endDate: deadline.date,
                                  details: deadline.notes,
                                  location: hotel.address,
                                })}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Google Calendar
                              </a>
                              <button className="btn btn-s btn-d" onClick={() => deleteHotelDeadline(selectedTrip.id, hotel.id, deadline.id)}>Elimina</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'diary' && (
            <section>
              <div className="sh wrap">
                <div className="st">Diario del viaggio</div>
                <div className="actions-row">
                  <button className="btn btn-p" onClick={() => openModal('diary-day')}>+ Giorno</button>
                  <button className="btn" onClick={() => openModal('diary-place')}>+ Luogo</button>
                </div>
              </div>

              <div className="grid-cards cols-2">
                <div className="card stack-card">
                  <div className="card-title">Giorni</div>
                  {!selectedTrip.travelDiary?.days?.length && <EmptyState icon="ti ti-calendar-event" text="Nessun giorno inserito." />}
                  <div className="timeline-list">
                    {(selectedTrip.travelDiary?.days || []).map((day) => (
                      <div key={day.id} className="timeline-item">
                        <div>
                          <strong>{day.title || 'Giorno di viaggio'}</strong>
                          <div className="meta-line">{day.date}</div>
                          <div className="muted">{day.notes}</div>
                        </div>
                        <button className="btn btn-s btn-d" onClick={() => deleteDiaryDay(selectedTrip.id, day.id)}>Elimina</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card stack-card">
                  <div className="card-title">Luoghi salvati</div>
                  {!selectedTrip.travelDiary?.places?.length && <EmptyState icon="ti ti-map-pin" text="Nessun luogo salvato." />}
                  <div className="timeline-list">
                    {(selectedTrip.travelDiary?.places || []).map((place) => (
                      <div key={place.id} className="timeline-item">
                        <div>
                          <strong>{place.name}</strong>
                          <div className="meta-line">{place.type}</div>
                          <div className="muted">{place.address}</div>
                          <div className="muted">{place.notes}</div>
                        </div>
                        <div className="actions-row">
                          {place.url && <a className="btn btn-s" href={place.url} target="_blank" rel="noreferrer">Apri</a>}
                          <button className="btn btn-s btn-d" onClick={() => deleteDiaryPlace(selectedTrip.id, place.id)}>Elimina</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {modal?.type === 'trip' && (
        <Modal title={modal.item ? 'Modifica viaggio' : 'Aggiungi viaggio'} onClose={closeModal}>
          <form onSubmit={submitTrip}>
            <div className="fg"><label className="fl">Nome</label><input className="fi" name="name" defaultValue={modal.item?.name || ''} required /></div>
            <div className="fg"><label className="fl">Stato</label><select className="fi" name="status" defaultValue={modal.item?.status || 'planning'}>{TRIP_STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></div>
            <div className="fr responsive-2">
              <div className="fg"><label className="fl">Dal</label><input className="fi" type="date" name="dateFrom" defaultValue={modal.item?.dateFrom || ''} /></div>
              <div className="fg"><label className="fl">Al</label><input className="fi" type="date" name="dateTo" defaultValue={modal.item?.dateTo || ''} /></div>
            </div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'flight' && (
        <Modal title={modal.item ? 'Modifica volo' : 'Aggiungi volo'} onClose={closeModal}>
          <form onSubmit={submitFlight}>
            <div className="fg"><label className="fl">Compagnia</label><select className="fi" name="company" defaultValue={modal.item?.company || 'Ryanair'}>{Object.keys(AIRLINE_DIRECTORY).map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
            <div className="fr responsive-2">
              <div className="fg"><label className="fl">Da</label><input className="fi" name="from" defaultValue={modal.item?.from || ''} /></div>
              <div className="fg"><label className="fl">A</label><input className="fi" name="to" defaultValue={modal.item?.to || ''} /></div>
            </div>
            <div className="fr responsive-3">
              <div className="fg"><label className="fl">Data</label><input className="fi" type="date" name="date" defaultValue={modal.item?.date || ''} /></div>
              <div className="fg"><label className="fl">Partenza</label><input className="fi" type="time" name="departureTime" defaultValue={modal.item?.departureTime || ''} /></div>
              <div className="fg"><label className="fl">Arrivo</label><input className="fi" type="time" name="arrivalTime" defaultValue={modal.item?.arrivalTime || ''} /></div>
            </div>
            <div className="fr responsive-3">
              <div className="fg"><label className="fl">Numero volo</label><input className="fi" name="flightNumber" defaultValue={modal.item?.flightNumber || ''} /></div>
              <div className="fg"><label className="fl">Booking ref</label><input className="fi" name="bookingRef" defaultValue={modal.item?.bookingRef || ''} /></div>
              <div className="fg"><label className="fl">Costo acquisto</label><input className="fi" name="purchaseCost" defaultValue={modal.item?.purchaseCost || ''} /></div>
            </div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'flight-bag' && (
        <Modal title="Aggiungi bagaglio al volo" onClose={closeModal}>
          <form onSubmit={submitFlightBag}>
            <div className="fg"><label className="fl">Bagaglio</label><input className="fi" name="label" placeholder="Cabina 10kg, Stiva 20kg..." /></div>
            <div className="fr responsive-2">
              <div className="fg"><label className="fl">Quantità</label><input className="fi" name="qty" defaultValue="1" /></div>
              <div className="fg"><label className="fl">Costo acquisto</label><input className="fi" name="cost" /></div>
            </div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'flight-deadline' && (
        <Modal title="Aggiungi scadenza volo" onClose={closeModal}>
          <form onSubmit={submitFlightDeadline}>
            <div className="fg"><label className="fl">Titolo</label><input className="fi" name="title" /></div>
            <div className="fg"><label className="fl">Data</label><input className="fi" type="date" name="date" /></div>
            <div className="fg"><label className="fl">Note</label><textarea className="fi" rows="4" name="notes" /></div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'hotel' && (
        <Modal title={modal.item ? 'Modifica hotel' : 'Aggiungi hotel'} onClose={closeModal}>
          <form onSubmit={submitHotel}>
            <div className="fg"><label className="fl">Nome</label><input className="fi" name="name" defaultValue={modal.item?.name || ''} /></div>
            <div className="fr responsive-2">
              <div className="fg"><label className="fl">Telefono</label><input className="fi" name="phone" defaultValue={modal.item?.phone || ''} /></div>
              <div className="fg"><label className="fl">Indirizzo</label><input className="fi" name="address" defaultValue={modal.item?.address || ''} /></div>
            </div>
            <div className="fr responsive-2">
              <div className="fg"><label className="fl">Latitudine</label><input className="fi" name="lat" defaultValue={modal.item?.lat || ''} /></div>
              <div className="fg"><label className="fl">Longitudine</label><input className="fi" name="lng" defaultValue={modal.item?.lng || ''} /></div>
            </div>
            <div className="fr responsive-2">
              <div className="fg"><label className="fl">Link Booking</label><input className="fi" name="bookingUrl" defaultValue={modal.item?.bookingUrl || ''} /></div>
              <div className="fg"><label className="fl">Altro link</label><input className="fi" name="alternateUrl" defaultValue={modal.item?.alternateUrl || ''} /></div>
            </div>
            <div className="fr responsive-2">
              <div className="fg"><label className="fl">Check-in</label><input className="fi" type="date" name="checkIn" defaultValue={modal.item?.checkIn || ''} /></div>
              <div className="fg"><label className="fl">Check-out</label><input className="fi" type="date" name="checkOut" defaultValue={modal.item?.checkOut || ''} /></div>
            </div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'hotel-deadline' && (
        <Modal title="Aggiungi scadenza hotel" onClose={closeModal}>
          <form onSubmit={submitHotelDeadline}>
            <div className="fg"><label className="fl">Titolo</label><input className="fi" name="title" /></div>
            <div className="fg"><label className="fl">Data</label><input className="fi" type="date" name="date" /></div>
            <div className="fg"><label className="fl">Note</label><textarea className="fi" rows="4" name="notes" /></div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'diary-day' && (
        <Modal title="Aggiungi giorno al diario" onClose={closeModal}>
          <form onSubmit={submitDiaryDay}>
            <div className="fg"><label className="fl">Data</label><input className="fi" type="date" name="date" /></div>
            <div className="fg"><label className="fl">Titolo</label><input className="fi" name="title" /></div>
            <div className="fg"><label className="fl">Note giornata</label><textarea className="fi" rows="4" name="notes" /></div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'diary-place' && (
        <Modal title="Aggiungi luogo al diario" onClose={closeModal}>
          <form onSubmit={submitPlace}>
            <div className="fg"><label className="fl">Tipo luogo</label><select className="fi" name="type" defaultValue="attrazione"><option value="museo">Museo</option><option value="attrazione">Attrazione</option><option value="bar">Bar</option><option value="ristorante">Ristorante</option><option value="shop">Shopping</option><option value="altro">Altro</option></select></div>
            <div className="fg"><label className="fl">Nome</label><input className="fi" name="name" /></div>
            <div className="fg"><label className="fl">Indirizzo</label><input className="fi" name="address" /></div>
            <div className="fg"><label className="fl">URL</label><input className="fi" name="url" /></div>
            <div className="fg"><label className="fl">Note</label><textarea className="fi" rows="4" name="notes" /></div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}
    </div>
  )
}

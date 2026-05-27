import { useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'

function EmptyState({ icon, text }) {
  return (
    <div className="empty">
      <i className={icon} />
      <p>{text}</p>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-t">{title}</div>
        {children}
      </div>
    </div>
  )
}

function SectionHeader({ title, buttonLabel, onAdd }) {
  return (
    <div className="sh">
      <div className="st">{title}</div>
      <button className="btn btn-p" onClick={onAdd}>{buttonLabel}</button>
    </div>
  )
}

function CrudList({ items, renderItem, emptyText }) {
  if (!items.length) return <EmptyState icon="ti ti-mood-empty" text={emptyText} />
  return <div className="g2">{items.map(renderItem)}</div>
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
    addHotel,
    updateHotel,
    deleteHotel,
    addItineraryDay,
    updateItineraryDay,
    deleteItineraryDay,
    addBaggageItem,
    updateBaggageItem,
    deleteBaggageItem,
    addDeadline,
    updateDeadline,
    deleteDeadline,
  } = useAppContext()

  const [selectedTripId, setSelectedTripId] = useState(trips[0]?.id || null)
  const [activeTab, setActiveTab] = useState('flights')
  const [modal, setModal] = useState(null)
  const selectedTrip = useMemo(() => trips.find((trip) => trip.id === selectedTripId) || trips[0] || null, [trips, selectedTripId])

  const openModal = (type, item = null) => setModal({ type, item })
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
      time: fd.get('time'),
    }
    if (modal?.item) updateFlight(selectedTrip.id, modal.item.id, payload)
    else addFlight(selectedTrip.id, payload)
    closeModal()
  }

  const submitHotel = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name'),
      address: fd.get('address'),
      checkIn: fd.get('checkIn'),
      checkOut: fd.get('checkOut'),
    }
    if (modal?.item) updateHotel(selectedTrip.id, modal.item.id, payload)
    else addHotel(selectedTrip.id, payload)
    closeModal()
  }

  const submitDay = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      day: fd.get('day'),
      title: fd.get('title'),
      notes: fd.get('notes'),
    }
    if (modal?.item) updateItineraryDay(selectedTrip.id, modal.item.id, payload)
    else addItineraryDay(selectedTrip.id, payload)
    closeModal()
  }

  const submitBaggage = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: fd.get('name'),
      qty: fd.get('qty'),
      owner: fd.get('owner'),
    }
    if (modal?.item) updateBaggageItem(selectedTrip.id, modal.item.id, payload)
    else addBaggageItem(selectedTrip.id, payload)
    closeModal()
  }

  const submitDeadline = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      title: fd.get('title'),
      date: fd.get('date'),
      notes: fd.get('notes'),
    }
    if (modal?.item) updateDeadline(selectedTrip.id, modal.item.id, payload)
    else addDeadline(selectedTrip.id, payload)
    closeModal()
  }

  return (
    <div>
      <div className="sh">
        <div className="st"><i className="ti ti-plane" /> Viaggi</div>
        <button className="btn btn-p" onClick={() => openModal('trip')}>+ Aggiungi viaggio</button>
      </div>

      <div className="g2">
        {trips.map((trip) => (
          <div key={trip.id} className={`trip ${selectedTrip?.id === trip.id ? 'trip-selected' : ''}`}>
            <div className="trip-h" onClick={() => setSelectedTripId(trip.id)}>
              <div className="trip-nm">{trip.name}</div>
              <div className="vi-sub">{trip.dateFrom} → {trip.dateTo}</div>
            </div>
            <div className="trip-ft">
              <span className="pill pill-a">{trip.status}</span>
              <div className="hdr-spacer" />
              <button className="btn btn-s" onClick={() => openModal('trip', trip)}>Modifica</button>
              <button className="btn btn-s btn-d" onClick={() => deleteTrip(trip.id)}>Elimina</button>
            </div>
          </div>
        ))}
      </div>

      {selectedTrip && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="trip-nm">{selectedTrip.name}</div>
            <div className="vi-sub">{selectedTrip.dateFrom} → {selectedTrip.dateTo}</div>
            <div className="itabs" style={{ marginTop: '1rem' }}>
              <button className={`itab ${activeTab === 'flights' ? 'active' : ''}`} onClick={() => setActiveTab('flights')}>Voli</button>
              <button className={`itab ${activeTab === 'hotels' ? 'active' : ''}`} onClick={() => setActiveTab('hotels')}>Hotel</button>
              <button className={`itab ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}>Itinerario</button>
              <button className={`itab ${activeTab === 'baggage' ? 'active' : ''}`} onClick={() => setActiveTab('baggage')}>Bagaglio</button>
              <button className={`itab ${activeTab === 'deadlines' ? 'active' : ''}`} onClick={() => setActiveTab('deadlines')}>Scadenze</button>
            </div>
          </div>

          {activeTab === 'flights' && (
            <div>
              <SectionHeader title="Voli & trasporti" buttonLabel="+ Aggiungi volo" onAdd={() => openModal('flight')} />
              <CrudList
                items={selectedTrip.flights}
                emptyText="Nessun volo — clicca Aggiungi"
                renderItem={(item) => (
                  <div key={item.id} className="card">
                    <div className="trip-nm">{item.company || 'Volo'}</div>
                    <p>{item.from} → {item.to}</p>
                    <p>{item.date} {item.time}</p>
                    <div className="fa">
                      <button className="btn btn-s" onClick={() => openModal('flight', item)}>Modifica</button>
                      <button className="btn btn-s btn-d" onClick={() => deleteFlight(selectedTrip.id, item.id)}>Elimina</button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'hotels' && (
            <div>
              <SectionHeader title="Hotel" buttonLabel="+ Aggiungi hotel" onAdd={() => openModal('hotel')} />
              <CrudList
                items={selectedTrip.hotels}
                emptyText="Nessun hotel — clicca Aggiungi"
                renderItem={(item) => (
                  <div key={item.id} className="card">
                    <div className="trip-nm">{item.name || 'Hotel'}</div>
                    <p>{item.address}</p>
                    <p>{item.checkIn} → {item.checkOut}</p>
                    <div className="fa">
                      <button className="btn btn-s" onClick={() => openModal('hotel', item)}>Modifica</button>
                      <button className="btn btn-s btn-d" onClick={() => deleteHotel(selectedTrip.id, item.id)}>Elimina</button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'itinerary' && (
            <div>
              <SectionHeader title="Itinerario" buttonLabel="+ Aggiungi giorno" onAdd={() => openModal('day')} />
              <CrudList
                items={selectedTrip.itinerary}
                emptyText="Itinerario vuoto — aggiungi i giorni del viaggio"
                renderItem={(item) => (
                  <div key={item.id} className="card">
                    <div className="trip-nm">{item.title || 'Giorno'}</div>
                    <p>{item.day}</p>
                    <p>{item.notes}</p>
                    <div className="fa">
                      <button className="btn btn-s" onClick={() => openModal('day', item)}>Modifica</button>
                      <button className="btn btn-s btn-d" onClick={() => deleteItineraryDay(selectedTrip.id, item.id)}>Elimina</button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'baggage' && (
            <div>
              <SectionHeader title="Bagaglio" buttonLabel="+ Aggiungi voce" onAdd={() => openModal('baggage')} />
              <CrudList
                items={selectedTrip.baggage}
                emptyText="Nessuna voce bagaglio — clicca Aggiungi"
                renderItem={(item) => (
                  <div key={item.id} className="card">
                    <div className="trip-nm">{item.name || 'Oggetto'}</div>
                    <p>Quantità: {item.qty}</p>
                    <p>Per: {item.owner}</p>
                    <div className="fa">
                      <button className="btn btn-s" onClick={() => openModal('baggage', item)}>Modifica</button>
                      <button className="btn btn-s btn-d" onClick={() => deleteBaggageItem(selectedTrip.id, item.id)}>Elimina</button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}

          {activeTab === 'deadlines' && (
            <div>
              <SectionHeader title="Scadenze" buttonLabel="+ Aggiungi scadenza" onAdd={() => openModal('deadline')} />
              <CrudList
                items={selectedTrip.deadlines}
                emptyText="Nessuna scadenza"
                renderItem={(item) => (
                  <div key={item.id} className="card">
                    <div className="trip-nm">{item.title || 'Scadenza'}</div>
                    <p>{item.date}</p>
                    <p>{item.notes}</p>
                    <div className="fa">
                      <button className="btn btn-s" onClick={() => openModal('deadline', item)}>Modifica</button>
                      <button className="btn btn-s btn-d" onClick={() => deleteDeadline(selectedTrip.id, item.id)}>Elimina</button>
                    </div>
                  </div>
                )}
              />
            </div>
          )}
        </>
      )}

      {modal?.type === 'trip' && (
        <Modal title={modal.item ? 'Modifica viaggio' : 'Aggiungi viaggio'} onClose={closeModal}>
          <form onSubmit={submitTrip}>
            <div className="fg"><label className="fl">Nome</label><input className="fi" name="name" defaultValue={modal.item?.name || ''} required /></div>
            <div className="fg"><label className="fl">Stato</label><input className="fi" name="status" defaultValue={modal.item?.status || ''} /></div>
            <div className="fr">
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
            <div className="fg"><label className="fl">Compagnia</label><input className="fi" name="company" defaultValue={modal.item?.company || ''} /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Da</label><input className="fi" name="from" defaultValue={modal.item?.from || ''} /></div>
              <div className="fg"><label className="fl">A</label><input className="fi" name="to" defaultValue={modal.item?.to || ''} /></div>
            </div>
            <div className="fr">
              <div className="fg"><label className="fl">Data</label><input className="fi" type="date" name="date" defaultValue={modal.item?.date || ''} /></div>
              <div className="fg"><label className="fl">Ora</label><input className="fi" type="time" name="time" defaultValue={modal.item?.time || ''} /></div>
            </div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'hotel' && (
        <Modal title={modal.item ? 'Modifica hotel' : 'Aggiungi hotel'} onClose={closeModal}>
          <form onSubmit={submitHotel}>
            <div className="fg"><label className="fl">Nome hotel</label><input className="fi" name="name" defaultValue={modal.item?.name || ''} /></div>
            <div className="fg"><label className="fl">Indirizzo</label><input className="fi" name="address" defaultValue={modal.item?.address || ''} /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Check-in</label><input className="fi" type="date" name="checkIn" defaultValue={modal.item?.checkIn || ''} /></div>
              <div className="fg"><label className="fl">Check-out</label><input className="fi" type="date" name="checkOut" defaultValue={modal.item?.checkOut || ''} /></div>
            </div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'day' && (
        <Modal title={modal.item ? 'Modifica giorno' : 'Aggiungi giorno'} onClose={closeModal}>
          <form onSubmit={submitDay}>
            <div className="fg"><label className="fl">Data</label><input className="fi" type="date" name="day" defaultValue={modal.item?.day || ''} /></div>
            <div className="fg"><label className="fl">Titolo</label><input className="fi" name="title" defaultValue={modal.item?.title || ''} /></div>
            <div className="fg"><label className="fl">Note</label><textarea className="fi" name="notes" defaultValue={modal.item?.notes || ''} rows="4" /></div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'baggage' && (
        <Modal title={modal.item ? 'Modifica voce bagaglio' : 'Aggiungi voce bagaglio'} onClose={closeModal}>
          <form onSubmit={submitBaggage}>
            <div className="fg"><label className="fl">Voce</label><input className="fi" name="name" defaultValue={modal.item?.name || ''} /></div>
            <div className="fr">
              <div className="fg"><label className="fl">Quantità</label><input className="fi" name="qty" defaultValue={modal.item?.qty || '1'} /></div>
              <div className="fg"><label className="fl">Persona</label><input className="fi" name="owner" defaultValue={modal.item?.owner || ''} /></div>
            </div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}

      {modal?.type === 'deadline' && (
        <Modal title={modal.item ? 'Modifica scadenza' : 'Aggiungi scadenza'} onClose={closeModal}>
          <form onSubmit={submitDeadline}>
            <div className="fg"><label className="fl">Titolo</label><input className="fi" name="title" defaultValue={modal.item?.title || ''} /></div>
            <div className="fg"><label className="fl">Data</label><input className="fi" type="date" name="date" defaultValue={modal.item?.date || ''} /></div>
            <div className="fg"><label className="fl">Note</label><textarea className="fi" name="notes" defaultValue={modal.item?.notes || ''} rows="4" /></div>
            <div className="fa"><button type="button" className="btn" onClick={closeModal}>Annulla</button><button type="submit" className="btn btn-p">Salva</button></div>
          </form>
        </Modal>
      )}
    </div>
  )
}

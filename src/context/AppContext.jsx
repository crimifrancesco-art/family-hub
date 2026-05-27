import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)
const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const TRIP_STATUS_OPTIONS = [
  { value: 'planning', label: 'Pianificato' },
  { value: 'incoming', label: 'In arrivo' },
  { value: 'ongoing', label: 'In corso' },
  { value: 'done', label: 'Concluso' },
  { value: 'cancelled', label: 'Annullato' },
]

export const FAMILY_DEFAULT = [
  {
    id: 'member_fc', initials: 'FC', name: 'Francesco', role: 'Papà', birthDate: '', bloodGroup: '', fiscalCode: '', phone: '', email: '',
    doctor: '', pediatrician: '', allergies: '', chronicConditions: '', currentTherapies: '', emergencyNotes: '',
    medications: [{ id: 'med_fc_1', name: 'Allopurinolo', dosage: '', schedule: '', indication: '', notes: '' }],
    documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
  {
    id: 'member_bp', initials: 'BP', name: 'BP', role: 'Mamma', birthDate: '', bloodGroup: '', fiscalCode: '', phone: '', email: '',
    doctor: '', pediatrician: '', allergies: '', chronicConditions: '', currentTherapies: '', emergencyNotes: '',
    medications: [], documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
  {
    id: 'member_dc', initials: 'DC', name: 'DC', role: 'Figlio/a', birthDate: '', bloodGroup: '', fiscalCode: '', phone: '', email: '',
    doctor: '', pediatrician: '', allergies: '', chronicConditions: '', currentTherapies: '', emergencyNotes: '',
    medications: [], documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
  {
    id: 'member_oc', initials: 'OC', name: 'OC', role: 'Figlio/a', birthDate: '', bloodGroup: '', fiscalCode: '', phone: '', email: '',
    doctor: '', pediatrician: '', allergies: '', chronicConditions: '', currentTherapies: '', emergencyNotes: '',
    medications: [], documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
  {
    id: 'member_md', initials: 'MD', name: 'MD', role: 'Altro', birthDate: '', bloodGroup: '', fiscalCode: '', phone: '', email: '',
    doctor: '', pediatrician: '', allergies: '', chronicConditions: '', currentTherapies: '', emergencyNotes: '',
    medications: [], documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
]

export const TRAVEL_CHECKLIST_TEMPLATE = [
  { category: 'Documenti & Salute', color: 'blue', items: [
    'Carta d’identità / Passaporto','Patente','Biglietti / Check-in / QR code','Carte / Bancomat / Contanti',
    'Tessera sanitaria','Assicurazione viaggio','Farmaci personali','Mini kit primo soccorso','Gel mani / Mascherine','Copie documenti su cloud','Prenotazioni salvate offline'
  ]},
  { category: 'Elettronica', color: 'green', items: ['Smartphone','Tablet / Kindle','Laptop','Action cam / GoPro','Powerbank','Caricabatterie + Cavi','Adattatore universale','Auricolari / Cuffie','Pendrive / Hard Disk']},
  { category: 'Abbigliamento', color: 'orange', items: ['T-shirt / Polo','Intimo / Calze','Jeans / Pantaloni corti','Costumi','Pigiama / Accappatoio','Scarpe comode','Ciabatte','Felpa / Giacca leggera','Occhiali da sole','Cappello / Bandana','Sacchetto indumenti sporchi']},
  { category: 'Accessori & Igiene', color: 'blue', items: ['Beauty case completo','Spazzolino / Dentifricio','Deodorante','Shampoo / Bagnoschiuma travel size','Rasoio / Forbicine','Lentine + Soluzione','Ombrello / K-way','Salviette umidificate','Cuscino da viaggio','Asciugamano microfibra']},
  { category: 'Spiaggia / Outdoor', color: 'green', items: ['Telo mare','Crema solare','Occhialini / Maschera','Ciabatte acqua','Borraccia','Spray antizanzare']},
  { category: 'Cibo & Bevande', color: 'orange', items: ['Snack / Barrette','Bottiglia d’acqua','Sali minerali','Posate da viaggio','Caffè solubile / zucchero']},
  { category: 'Organizzazione digitale', color: 'blue', items: ['Prenotazioni hotel','Mappe offline','Itinerario salvato','Numeri utili','Backup foto attivo','App utili']},
  { category: 'Extra', color: 'green', items: ['Mini kit cucito','Nastro adesivo','Penna / Taccuino','Sacchetti sottovuoto','Lucchetto valigia','Mini-ventilatore USB','Zainetto pieghevole']},
]

const DEFAULT_ARCHIVE_TABLES = {
  documents: [
    { id: 'doc_1', category: 'Identità', owner: 'FC', title: 'Carta identità', number: '', issueDate: '', expiryDate: '', storage: '', notes: '' },
    { id: 'doc_2', category: 'Casa', owner: 'Famiglia', title: 'Assicurazione casa', number: '', issueDate: '', expiryDate: '', storage: '', notes: '' },
  ],
  warranties: [
    { id: 'war_1', item: 'Elettrodomestico', brand: '', purchaseDate: '', expiryDate: '', invoiceRef: '', notes: '' },
  ],
}

const DEFAULT_HEALTH_TABLES = {
  therapies: [
    { id: 'th_1', memberId: 'member_fc', medication: 'Allopurinolo', dosage: '', frequency: '', timeSlots: '', startDate: '', endDate: '', prescribingDoctor: '', notes: '' },
  ],
  appointments: [
    { id: 'app_1', memberId: 'member_fc', type: 'Controllo', date: '', doctor: '', location: '', notes: '' },
  ],
}

export const AIRLINE_DIRECTORY = {
  Ryanair: 'https://www.ryanair.com/gb/en/', easyJet: 'https://www.easyjet.com', Lufthansa: 'https://www.lufthansa.com', ITA: 'https://www.ita-airways.com', Wizzair: 'https://www.wizzair.com',
}

const DEFAULT_TRIPS = [{
  id: 'trip_torino', name: 'Torino', status: 'incoming', dateFrom: '2026-05-29', dateTo: '2026-06-02', persons: ['member_fc','member_bp'],
  flights: [], hotels: [], parkingReservations: [], carRentals: [],
  travelDiary: { days: [], places: [], mediaLinks: [], notes: '' },
  packingChecklist: TRAVEL_CHECKLIST_TEMPLATE.map((group) => ({ ...group, id: uid('grp'), items: group.items.map((label) => ({ id: uid('chk'), label, done: False if False else False })) })),
  generalDeadlines: [],
}]

function useLocalState(key, fallback) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
  })
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)) }, [key, value])
  return [value, setValue]
}

const ensureTrip = (trip) => ({
  id: uid('trip'), name: '', status: 'planning', dateFrom: '', dateTo: '', persons: [], flights: [], hotels: [], parkingReservations: [], carRentals: [],
  travelDiary: { days: [], places: [], mediaLinks: [], notes: '' },
  packingChecklist: [], generalDeadlines: [], ...trip,
  travelDiary: { days: [], places: [], mediaLinks: [], notes: '', ...(trip?.travelDiary || {}) },
  packingChecklist: (trip?.packingChecklist || []).map((group) => ({ ...group, items: (group.items || []).map((item) => ({ id: uid('chk'), done: false, ...item })) })),
})

const ensureFlight = (flight = {}) => ({ id: uid('flight'), company: '', companyUrl: '', from: '', to: '', date: '', departureTime: '', arrivalTime: '', flightNumber: '', bookingRef: '', purchaseCost: '', baggage: [], deadlines: [], ...flight })
const ensureHotel = (hotel = {}) => ({ id: uid('hotel'), name: '', phone: '', address: '', lat: '', lng: '', bookingUrl: '', alternateUrl: '', checkIn: '', checkOut: '', paidAmount: '', dueAmount: '', paymentMethod: '', cancellationDate: '', deadlines: [], ...hotel })
function airlineUrl(name) { return AIRLINE_DIRECTORY[name] || '' }
function updateTripInList(list, tripId, updater) { return list.map((trip) => (trip.id === tripId ? ensureTrip(updater(ensureTrip(trip))) : ensureTrip(trip))) }

export function AppProvider({ children }) {
  const [trips, setTrips] = useLocalState('fh_trips_v4', DEFAULT_TRIPS)
  const [familyMembers, setFamilyMembers] = useLocalState('fh_family_v4', FAMILY_DEFAULT)
  const [archiveTables, setArchiveTables] = useLocalState('fh_archive_v4', DEFAULT_ARCHIVE_TABLES)
  const [healthTables, setHealthTables] = useLocalState('fh_health_v4', DEFAULT_HEALTH_TABLES)

  const addTrip = (payload) => setTrips((prev) => [...prev, ensureTrip({ ...payload, id: uid('trip'), packingChecklist: TRAVEL_CHECKLIST_TEMPLATE.map((group) => ({ ...group, id: uid('grp'), items: group.items.map((label) => ({ id: uid('chk'), label, done: false })) })) })])
  const updateTrip = (tripId, payload) => setTrips((prev) => prev.map((trip) => (trip.id === tripId ? ensureTrip({ ...trip, ...payload }) : ensureTrip(trip))))
  const deleteTrip = (tripId) => setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
  const toggleTripMember = (tripId, memberId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, persons: trip.persons.includes(memberId) ? trip.persons.filter((id) => id !== memberId) : [...trip.persons, memberId] })))

  const addFlight = (tripId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, flights: [...trip.flights, ensureFlight({ ...payload, companyUrl: payload.companyUrl || airlineUrl(payload.company) })] })))
  const updateFlight = (tripId, flightId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, flights: trip.flights.map((flight) => flight.id === flightId ? ensureFlight({ ...flight, ...payload, companyUrl: payload.company ? airlineUrl(payload.company) : flight.companyUrl }) : ensureFlight(flight)) })))
  const deleteFlight = (tripId, flightId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, flights: trip.flights.filter((flight) => flight.id !== flightId) })))
  const invertFlightRoute = (tripId, flightId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, flights: trip.flights.map((flight) => flight.id === flightId ? ensureFlight({ ...flight, from: flight.to, to: flight.from }) : ensureFlight(flight)) })))
  const addFlightBaggage = (tripId, flightId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, flights: trip.flights.map((flight) => flight.id === flightId ? ensureFlight({ ...flight, baggage: [...(flight.baggage || []), { id: uid('bag'), label: '', qty: '1', cost: '', ...payload }] }) : ensureFlight(flight)) })))
  const deleteFlightBaggage = (tripId, flightId, bagId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, flights: trip.flights.map((flight) => flight.id === flightId ? ensureFlight({ ...flight, baggage: (flight.baggage || []).filter((bag) => bag.id !== bagId) }) : ensureFlight(flight)) })))
  const addFlightDeadline = (tripId, flightId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, flights: trip.flights.map((flight) => flight.id === flightId ? ensureFlight({ ...flight, deadlines: [...(flight.deadlines || []), { id: uid('fdeadline'), title: '', date: '', notes: '', ...payload }] }) : ensureFlight(flight)) })))
  const deleteFlightDeadline = (tripId, flightId, deadlineId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, flights: trip.flights.map((flight) => flight.id === flightId ? ensureFlight({ ...flight, deadlines: (flight.deadlines || []).filter((deadline) => deadline.id !== deadlineId) }) : ensureFlight(flight)) })))

  const addHotel = (tripId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, hotels: [...trip.hotels, ensureHotel(payload)] })))
  const updateHotel = (tripId, hotelId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, hotels: trip.hotels.map((hotel) => hotel.id === hotelId ? ensureHotel({ ...hotel, ...payload }) : ensureHotel(hotel)) })))
  const deleteHotel = (tripId, hotelId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, hotels: trip.hotels.filter((hotel) => hotel.id !== hotelId) })))
  const addHotelDeadline = (tripId, hotelId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, hotels: trip.hotels.map((hotel) => hotel.id === hotelId ? ensureHotel({ ...hotel, deadlines: [...(hotel.deadlines || []), { id: uid('hdeadline'), title: '', date: '', notes: '', ...payload }] }) : ensureHotel(hotel)) })))
  const deleteHotelDeadline = (tripId, hotelId, deadlineId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, hotels: trip.hotels.map((hotel) => hotel.id === hotelId ? ensureHotel({ ...hotel, deadlines: (hotel.deadlines || []).filter((deadline) => deadline.id !== deadlineId) }) : ensureHotel(hotel)) })))

  const addParkingReservation = (tripId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, parkingReservations: [...(trip.parkingReservations || []), { id: uid('park'), name: '', address: '', dateFrom: '', dateTo: '', cost: '', bookingUrl: '', notes: '', ...payload }] })))
  const deleteParkingReservation = (tripId, parkingId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, parkingReservations: (trip.parkingReservations || []).filter((item) => item.id !== parkingId) })))
  const addCarRental = (tripId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, carRentals: [...(trip.carRentals || []), { id: uid('car'), company: '', pickupPlace: '', dropoffPlace: '', pickupDate: '', dropoffDate: '', cost: '', deposit: '', bookingUrl: '', notes: '', ...payload }] })))
  const deleteCarRental = (tripId, carId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, carRentals: (trip.carRentals || []).filter((item) => item.id !== carId) })))

  const addDiaryDay = (tripId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, travelDiary: { ...trip.travelDiary, days: [...trip.travelDiary.days, { id: uid('day'), date: '', title: '', notes: '', ...payload }] } })))
  const deleteDiaryDay = (tripId, dayId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, travelDiary: { ...trip.travelDiary, days: trip.travelDiary.days.filter((day) => day.id !== dayId) } })))
  const addDiaryPlace = (tripId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, travelDiary: { ...trip.travelDiary, places: [...trip.travelDiary.places, { id: uid('place'), type: 'attrazione', name: '', address: '', lat: '', lng: '', url: '', rating: '', reviewNote: '', imageUrl: '', notes: '', ...payload }] } })))
  const deleteDiaryPlace = (tripId, placeId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, travelDiary: { ...trip.travelDiary, places: trip.travelDiary.places.filter((place) => place.id !== placeId) } })))
  const addDiaryMedia = (tripId, payload) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, travelDiary: { ...trip.travelDiary, mediaLinks: [...(trip.travelDiary.mediaLinks || []), { id: uid('media'), type: 'link', title: '', url: '', thumbnail: '', source: '', notes: '', ...payload }] } })))
  const deleteDiaryMedia = (tripId, mediaId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, travelDiary: { ...trip.travelDiary, mediaLinks: (trip.travelDiary.mediaLinks || []).filter((item) => item.id !== mediaId) } })))

  const toggleChecklistItem = (tripId, groupId, itemId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, packingChecklist: trip.packingChecklist.map((group) => group.id !== groupId ? group : ({ ...group, items: group.items.map((item) => item.id !== itemId ? item : ({ ...item, done: !item.done })) })) })))
  const addChecklistItem = (tripId, groupId, label) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, packingChecklist: trip.packingChecklist.map((group) => group.id !== groupId ? group : ({ ...group, items: [...group.items, { id: uid('chk'), label, done: false }] })) })))
  const removeChecklistItem = (tripId, groupId, itemId) => setTrips((prev) => updateTripInList(prev, tripId, (trip) => ({ ...trip, packingChecklist: trip.packingChecklist.map((group) => group.id !== groupId ? group : ({ ...group, items: group.items.filter((item) => item.id !== itemId) })) })))

  const updateFamilyMember = (memberId, payload) => setFamilyMembers((prev) => prev.map((member) => member.id === memberId ? { ...member, ...payload } : member))
  const addMedicationToMember = (memberId, payload) => setFamilyMembers((prev) => prev.map((member) => member.id === memberId ? { ...member, medications: [...(member.medications || []), { id: uid('med'), name: '', dosage: '', schedule: '', indication: '', notes: '', ...payload }] } : member))
  const deleteMedicationFromMember = (memberId, medId) => setFamilyMembers((prev) => prev.map((member) => member.id === memberId ? { ...member, medications: (member.medications || []).filter((med) => med.id !== medId) } : member))

  const value = useMemo(() => ({
    trips, familyMembers, archiveTables, healthTables,
    addTrip, updateTrip, deleteTrip, toggleTripMember,
    addFlight, updateFlight, deleteFlight, invertFlightRoute, addFlightBaggage, deleteFlightBaggage, addFlightDeadline, deleteFlightDeadline,
    addHotel, updateHotel, deleteHotel, addHotelDeadline, deleteHotelDeadline,
    addParkingReservation, deleteParkingReservation, addCarRental, deleteCarRental,
    addDiaryDay, deleteDiaryDay, addDiaryPlace, deleteDiaryPlace, addDiaryMedia, deleteDiaryMedia,
    toggleChecklistItem, addChecklistItem, removeChecklistItem,
    updateFamilyMember, addMedicationToMember, deleteMedicationFromMember,
    airlineUrl,
  }), [trips, familyMembers, archiveTables, healthTables])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used inside AppProvider')
  return context
}

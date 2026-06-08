import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext(null)

const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const TRIP_STATUS_OPTIONS = [
  { value: 'planning', label: 'Pianificato' },
  { value: 'incoming', label: 'In arrivo' },
  { value: 'ongoing', label: 'In corso' },
  { value: 'done', label: 'Concluso' },
  { value: 'cancelled', label: 'Annullato' },
]

export const AIRLINE_DIRECTORY = {
  Ryanair: 'https://www.ryanair.com/gb/en/',
  easyJet: 'https://www.easyjet.com',
  Lufthansa: 'https://www.lufthansa.com',
  ITA: 'https://www.ita-airways.com',
  Wizzair: 'https://www.wizzair.com',
}

export const FAMILY_DEFAULT = [
  {
    id: 'member_fc',
    initials: 'FC',
    name: 'Francesco',
    role: 'Papà',
    birthDate: '',
    bloodGroup: '',
    fiscalCode: '',
    phone: '',
    email: '',
    doctor: '',
    pediatrician: '',
    allergies: '',
    chronicConditions: '',
    currentTherapies: '',
    emergencyNotes: '',
    medications: [
      { id: 'med_fc_1', name: 'Allopurinolo', dosage: '', schedule: '', indication: '', notes: '' },
    ],
    documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
  {
    id: 'member_bp',
    initials: 'BP',
    name: 'BP',
    role: 'Mamma',
    birthDate: '',
    bloodGroup: '',
    fiscalCode: '',
    phone: '',
    email: '',
    doctor: '',
    pediatrician: '',
    allergies: '',
    chronicConditions: '',
    currentTherapies: '',
    emergencyNotes: '',
    medications: [],
    documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
  {
    id: 'member_dc',
    initials: 'DC',
    name: 'DC',
    role: 'Figlio/a',
    birthDate: '',
    bloodGroup: '',
    fiscalCode: '',
    phone: '',
    email: '',
    doctor: '',
    pediatrician: '',
    allergies: '',
    chronicConditions: '',
    currentTherapies: '',
    emergencyNotes: '',
    medications: [],
    documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
  {
    id: 'member_oc',
    initials: 'OC',
    name: 'OC',
    role: 'Figlio/a',
    birthDate: '',
    bloodGroup: '',
    fiscalCode: '',
    phone: '',
    email: '',
    doctor: '',
    pediatrician: '',
    allergies: '',
    chronicConditions: '',
    currentTherapies: '',
    emergencyNotes: '',
    medications: [],
    documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
  {
    id: 'member_md',
    initials: 'MD',
    name: 'MD',
    role: 'Altro',
    birthDate: '',
    bloodGroup: '',
    fiscalCode: '',
    phone: '',
    email: '',
    doctor: '',
    pediatrician: '',
    allergies: '',
    chronicConditions: '',
    currentTherapies: '',
    emergencyNotes: '',
    medications: [],
    documents: { idCard: '', passport: '', healthCard: '', drivingLicense: '' },
  },
]

export const TRAVEL_CHECKLIST_TEMPLATE = [
  {
    category: 'Documenti & Salute',
    color: 'blue',
    items: [
      "Carta d'identità / Passaporto",
      'Patente',
      'Biglietti / Check-in / QR code',
      'Carte / Bancomat / Contanti',
      'Tessera sanitaria',
      'Assicurazione viaggio',
      'Farmaci personali',
      'Mini kit primo soccorso',
      'Gel mani / Mascherine',
      'Copie documenti su cloud',
      'Prenotazioni salvate offline',
    ],
  },
  {
    category: 'Elettronica',
    color: 'green',
    items: [
      'Smartphone',
      'Tablet / Kindle',
      'Laptop',
      'Action cam / GoPro',
      'Powerbank',
      'Caricabatterie + Cavi',
      'Adattatore universale',
      'Auricolari / Cuffie',
      'Pendrive / Hard Disk',
    ],
  },
  {
    category: 'Abbigliamento',
    color: 'orange',
    items: [
      'T-shirt / Polo',
      'Intimo / Calze',
      'Jeans / Pantaloni corti',
      'Costumi',
      'Pigiama / Accappatoio',
      'Scarpe comode',
      'Ciabatte',
      'Felpa / Giacca leggera',
      'Occhiali da sole',
      'Cappello / Bandana',
      'Sacchetto indumenti sporchi',
    ],
  },
  {
    category: 'Accessori & Igiene',
    color: 'blue',
    items: [
      'Beauty case completo',
      'Spazzolino / Dentifricio',
      'Deodorante',
      'Shampoo / Bagnoschiuma travel size',
      'Rasoio / Forbicine',
      'Lentine + Soluzione',
      'Ombrello / K-way',
      'Salviette umidificate',
      'Cuscino da viaggio',
      'Asciugamano microfibra',
    ],
  },
  {
    category: 'Spiaggia / Outdoor',
    color: 'green',
    items: ['Telo mare', 'Crema solare', 'Occhialini / Maschera', 'Ciabatte acqua', 'Borraccia', 'Spray antizanzare'],
  },
  {
    category: 'Cibo & Bevande',
    color: 'orange',
    items: ["Snack / Barrette", "Bottiglia d'acqua", 'Sali minerali', 'Posate da viaggio', 'Caffè solubile / zucchero'],
  },
  {
    category: 'Organizzazione digitale',
    color: 'blue',
    items: ['Prenotazioni hotel', 'Mappe offline', 'Itinerario salvato', 'Numeri utili', 'Backup foto attivo', 'App utili'],
  },
  {
    category: 'Extra',
    color: 'green',
    items: ['Mini kit cucito', 'Nastro adesivo', 'Penna / Taccuino', 'Sacchetti sottovuoto', 'Lucchetto valigia', 'Mini-ventilatore USB', 'Zainetto pieghevole'],
  },
]

const DEFAULT_ARCHIVE_TABLES = {
  documents: [
    {
      id: 'doc_1',
      category: 'Identità',
      categoryId: '',
      owner: 'FC',
      ownerId: '',
      title: 'Carta identità',
      number: '',
      issueDate: '',
      expiryDate: '',
      storage: '',
      driveLinks: [],
      notes: '',
    },
    {
      id: 'doc_2',
      category: 'Casa',
      categoryId: '',
      owner: 'Famiglia',
      ownerId: '',
      title: 'Assicurazione casa',
      number: '',
      issueDate: '',
      expiryDate: '',
      storage: '',
      driveLinks: [],
      notes: '',
    },
  ],
  warranties: [
    {
      id: 'war_1',
      item: 'Elettrodomestico',
      brand: '',
      purchaseDate: '',
      expiryDate: '',
      invoiceRef: '',
      driveLinks: [],
      notes: '',
    },
  ],
}

const DEFAULT_HEALTH_TABLES = {
  therapies: [
    {
      id: 'th_1',
      memberId: 'member_fc',
      medication: 'Allopurinolo',
      dosage: '',
      frequency: '',
      timeSlots: '',
      startDate: '',
      endDate: '',
      prescribingDoctor: '',
      driveLinks: [],
      notes: '',
    },
  ],
  appointments: [
    {
      id: 'app_1',
      memberId: 'member_fc',
      type: 'Controllo',
      date: '',
      doctor: '',
      location: '',
      googleCalendarUrl: '',
      driveLinks: [],
      notes: '',
    },
  ],
}

function makeDefaultState() {
  return {
    trips: DEFAULT_TRIPS,
    familyMembers: FAMILY_DEFAULT,
    archiveTables: DEFAULT_ARCHIVE_TABLES,
    healthTables: DEFAULT_HEALTH_TABLES,
  }
}

// ─── Normalizzatori primitivi ─────────────────────────────────────────────────

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const ensureDriveLinks = (links = []) =>
  ensureArray(links)
    .map((entry) => {
      if (typeof entry === 'string') {
        return { id: uid('lnk'), label: '', url: entry }
      }
      return {
        id: entry?.id || uid('lnk'),
        label: entry?.label ?? '',
        url: entry?.url ?? '',
      }
    })
    .filter((entry) => entry.url || entry.label)

const ensureChecklistGroups = (groups = []) =>
  ensureArray(groups).map((group) => ({
    id: group.id || uid('grp'),
    category: group.category || '',
    color: group.color || 'blue',
    items: ensureArray(group.items).map((item) =>
      typeof item === 'string'
        ? { id: uid('chk'), label: item, done: false }
        : {
            id: item?.id || uid('chk'),
            label: item?.label ?? '',
            done: Boolean(item?.done),
          }
    ),
  }))

// ─── Normalizzatori shape completi ───────────────────────────────────────────

const normalizeMember = (member = {}) => ({
  id: member?.id || uid('member'),
  initials: '',
  name: '',
  role: '',
  birthDate: '',
  bloodGroup: '',
  fiscalCode: '',
  phone: '',
  email: '',
  doctor: '',
  pediatrician: '',
  allergies: '',
  chronicConditions: '',
  currentTherapies: '',
  emergencyNotes: '',
  ...member,
  medications: ensureArray(member?.medications).map((med) => ({
    id: med?.id || uid('med'),
    name: '',
    dosage: '',
    schedule: '',
    indication: '',
    notes: '',
    ...med,
  })),
  documents: {
    idCard: '',
    passport: '',
    healthCard: '',
    drivingLicense: '',
    ...(member?.documents || {}),
  },
})

const normalizeTherapy = (row = {}) => ({
  id: row?.id || uid('th'),
  memberId: '',
  medication: '',
  dosage: '',
  frequency: '',
  timeSlots: '',
  startDate: '',
  endDate: '',
  prescribingDoctor: '',
  notes: '',
  ...row,
  driveLinks: ensureDriveLinks(row?.driveLinks),
})

const normalizeAppointment = (row = {}) => ({
  id: row?.id || uid('app'),
  memberId: '',
  type: '',
  date: '',
  doctor: '',
  location: '',
  googleCalendarUrl: '',
  notes: '',
  ...row,
  driveLinks: ensureDriveLinks(row?.driveLinks),
})

const normalizeDocument = (row = {}) => ({
  id: row?.id || uid('doc'),
  category: '',
  categoryId: '',
  owner: '',
  ownerId: '',
  title: '',
  number: '',
  issueDate: '',
  expiryDate: '',
  storage: '',
  notes: '',
  ...row,
  driveLinks: ensureDriveLinks(row?.driveLinks),
})

const normalizeWarranty = (row = {}) => ({
  id: row?.id || uid('war'),
  item: '',
  brand: '',
  purchaseDate: '',
  expiryDate: '',
  invoiceRef: '',
  notes: '',
  ...row,
  driveLinks: ensureDriveLinks(row?.driveLinks),
})

const normalizeHealthTables = (tables = {}) => ({
  therapies: ensureArray(tables?.therapies).map(normalizeTherapy),
  appointments: ensureArray(tables?.appointments).map(normalizeAppointment),
})

const normalizeArchiveTables = (tables = {}) => ({
  documents: ensureArray(tables?.documents).map(normalizeDocument),
  warranties: ensureArray(tables?.warranties).map(normalizeWarranty),
})

const ensureFlight = (flight = {}) => ({
  id: flight.id || uid('flight'),
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
  ...flight,
  baggage: ensureArray(flight.baggage).map((bag) => ({
    id: bag?.id || uid('bag'),
    label: '',
    qty: '1',
    cost: '',
    ...bag,
  })),
  deadlines: ensureArray(flight.deadlines).map((deadline) => ({
    id: deadline?.id || uid('fdeadline'),
    title: '',
    date: '',
    notes: '',
    ...deadline,
  })),
})

const ensureHotel = (hotel = {}) => ({
  id: hotel.id || uid('hotel'),
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
  ...hotel,
  deadlines: ensureArray(hotel.deadlines).map((deadline) => ({
    id: deadline?.id || uid('hdeadline'),
    title: '',
    date: '',
    notes: '',
    ...deadline,
  })),
})

const ensureTrip = (trip = {}) => {
  return {
    id: uid('trip'),
    name: '',
    status: 'planning',
    dateFrom: '',
    dateTo: '',
    persons: [],
    flights: [],
    hotels: [],
    parkingReservations: [],
    carRentals: [],
    travelDiary: { days: [], places: [], mediaLinks: [], notes: '' },
    packingChecklist: [],
    generalDeadlines: [],
    ...trip,
    persons: ensureArray(trip.persons),
    travelDiary: {
      days: [],
      places: [],
      mediaLinks: [],
      notes: '',
      ...(trip.travelDiary || {}),
      days: ensureArray(trip.travelDiary?.days).map((day) => ({
        id: day?.id || uid('day'),
        date: '',
        title: '',
        notes: '',
        ...day,
      })),
      places: ensureArray(trip.travelDiary?.places).map((place) => ({
        id: place?.id || uid('place'),
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
        ...place,
      })),
      mediaLinks: ensureArray(trip.travelDiary?.mediaLinks).map((media) => ({
        id: media?.id || uid('media'),
        type: 'link',
        title: '',
        url: '',
        source: '',
        thumbnail: '',
        notes: '',
        ...media,
      })),
    },
    flights: ensureArray(trip.flights).map(ensureFlight),
    hotels: ensureArray(trip.hotels).map(ensureHotel),
    parkingReservations: ensureArray(trip.parkingReservations).map((item) => ({
      id: item?.id || uid('park'),
      name: '',
      address: '',
      dateFrom: '',
      dateTo: '',
      cost: '',
      bookingUrl: '',
      notes: '',
      ...item,
    })),
    carRentals: ensureArray(trip.carRentals).map((item) => ({
      id: item?.id || uid('car'),
      company: '',
      pickupPlace: '',
      dropoffPlace: '',
      pickupDate: '',
      dropoffDate: '',
      cost: '',
      deposit: '',
      bookingUrl: '',
      notes: '',
      ...item,
    })),
    packingChecklist:
      trip.packingChecklist && trip.packingChecklist.length
        ? ensureChecklistGroups(trip.packingChecklist)
        : ensureChecklistGroups(
            TRAVEL_CHECKLIST_TEMPLATE.map((group) => ({
              ...group,
              items: group.items.map((label) => ({ label, done: false })),
            }))
          ),
    generalDeadlines: ensureArray(trip.generalDeadlines).map((item) => ({
      id: item?.id || uid('deadline'),
      title: '',
      date: '',
      notes: '',
      ...item,
    })),
  }
}

const normalizeState = (raw) => {
  const fallback = makeDefaultState()
  const source = raw && typeof raw === 'object' ? raw : fallback

  return {
    trips: ensureArray(source.trips || fallback.trips).map(ensureTrip),
    familyMembers: ensureArray(source.familyMembers || fallback.familyMembers).map(normalizeMember),
    archiveTables: normalizeArchiveTables(source.archiveTables || fallback.archiveTables),
    healthTables: normalizeHealthTables(source.healthTables || fallback.healthTables),
  }
}

function airlineUrl(name) {
  return AIRLINE_DIRECTORY[name] || ''
}

function updateTripInList(list, tripId, updater) {
  return list.map((trip) => (trip.id === tripId ? ensureTrip(updater(ensureTrip(trip))) : ensureTrip(trip)))
}

// ─── DEFAULT_TRIPS usa uid → deve stare dopo le funzioni helper ───────────────
const DEFAULT_TRIPS = [
  {
    id: 'trip_torino',
    name: 'Torino',
    status: 'incoming',
    dateFrom: '2026-05-29',
    dateTo: '2026-06-02',
    persons: ['member_fc', 'member_bp'],
    flights: [],
    hotels: [],
    parkingReservations: [],
    carRentals: [],
    travelDiary: { days: [], places: [], mediaLinks: [], notes: '' },
    packingChecklist: TRAVEL_CHECKLIST_TEMPLATE.map((group) => ({
      ...group,
      id: uid('grp'),
      items: group.items.map((label) => ({ id: uid('chk'), label, done: false })),
    })),
    generalDeadlines: [],
  },
]

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }) {
  const [trips, setTrips] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [archiveTables, setArchiveTables] = useState({ documents: [], warranties: [] })
  const [healthTables, setHealthTables] = useState({ therapies: [], appointments: [] })
  const [loadingData, setLoadingData] = useState(true)
  const [syncError, setSyncError] = useState('')
  const saveTimerRef = useRef(null)
  const hasLoadedRef = useRef(false)

  const hydrate = useCallback((payload) => {
    const normalized = normalizeState(payload)
    setTrips(normalized.trips)
    setFamilyMembers(normalized.familyMembers)
    setArchiveTables(normalized.archiveTables)
    setHealthTables(normalized.healthTables)
  }, [])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoadingData(true)
      setSyncError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const userId = user?.id

      if (!userId) {
        if (!mounted) return
        hydrate(makeDefaultState())
        setLoadingData(false)
        hasLoadedRef.current = true
        return
      }

      const { data, error } = await supabase
        .from('app_state')
        .select('id, payload')
        .eq('user_id', userId)
        .maybeSingle()

      if (!mounted) return

      if (error) {
        hydrate(makeDefaultState())
        setSyncError(`Errore caricamento Supabase: ${error.message}`)
        setLoadingData(false)
        hasLoadedRef.current = true
        return
      }

      if (data?.payload) {
        hydrate(data.payload)
      } else {
        const initial = normalizeState(makeDefaultState())
        hydrate(initial)

        const { error: insertError } = await supabase.from('app_state').upsert(
          {
            user_id: userId,
            payload: initial,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

        if (insertError) {
          setSyncError(`Errore inizializzazione Supabase: ${insertError.message}`)
        }
      }

      setLoadingData(false)
      hasLoadedRef.current = true
    }

    load()

    return () => {
      mounted = false
    }
  }, [hydrate])

  const saveToSupabase = useCallback(async (payload) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id
    if (!userId) return

    const { error } = await supabase.from('app_state').upsert(
      {
        user_id: userId,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      setSyncError(`Errore salvataggio Supabase: ${error.message}`)
    } else {
      setSyncError('')
    }
  }, [])

  const payloadForSave = useMemo(
    () => ({ trips, familyMembers, archiveTables, healthTables }),
    [trips, familyMembers, archiveTables, healthTables]
  )

  useEffect(() => {
    if (!hasLoadedRef.current) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToSupabase(payloadForSave)
    }, 500)
    return () => clearTimeout(saveTimerRef.current)
  }, [payloadForSave, saveToSupabase])

  // ─── Trip actions ────────────────────────────────────────────────────────────

  const addTrip = useCallback((payload) => {
    setTrips((prev) => [
      ...prev,
      ensureTrip({
        ...payload,
        id: uid('trip'),
        packingChecklist: TRAVEL_CHECKLIST_TEMPLATE.map((group) => ({
          ...group,
          id: uid('grp'),
          items: group.items.map((label) => ({ id: uid('chk'), label, done: false })),
        })),
      }),
    ])
  }, [])

  const updateTrip = useCallback((tripId, payload) => {
    setTrips((prev) => prev.map((trip) => (trip.id === tripId ? ensureTrip({ ...trip, ...payload }) : ensureTrip(trip))))
  }, [])

  const deleteTrip = useCallback((tripId) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
  }, [])

  const toggleTripMember = useCallback((tripId, memberId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        persons: trip.persons.includes(memberId)
          ? trip.persons.filter((id) => id !== memberId)
          : [...trip.persons, memberId],
      }))
    )
  }, [])

  // ─── Flight actions ──────────────────────────────────────────────────────────

  const addFlight = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: [...trip.flights, ensureFlight({ ...payload, companyUrl: payload.companyUrl || airlineUrl(payload.company) })],
      }))
    )
  }, [])

  const updateFlight = useCallback((tripId, flightId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                ...payload,
                companyUrl: payload.company ? airlineUrl(payload.company) : flight.companyUrl,
              })
            : ensureFlight(flight)
        ),
      }))
    )
  }, [])

  const deleteFlight = useCallback((tripId, flightId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.filter((flight) => flight.id !== flightId),
      }))
    )
  }, [])

  const invertFlightRoute = useCallback((tripId, flightId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId ? ensureFlight({ ...flight, from: flight.to, to: flight.from }) : ensureFlight(flight)
        ),
      }))
    )
  }, [])

  const addFlightBaggage = useCallback((tripId, flightId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                baggage: [...ensureArray(flight.baggage), { id: uid('bag'), label: '', qty: '1', cost: '', ...payload }],
              })
            : ensureFlight(flight)
        ),
      }))
    )
  }, [])

  const updateFlightBaggage = useCallback((tripId, flightId, bagId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                baggage: ensureArray(flight.baggage).map((bag) => (bag.id === bagId ? { ...bag, ...payload } : bag)),
              })
            : ensureFlight(flight)
        ),
      }))
    )
  }, [])

  const deleteFlightBaggage = useCallback((tripId, flightId, bagId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                baggage: ensureArray(flight.baggage).filter((bag) => bag.id !== bagId),
              })
            : ensureFlight(flight)
        ),
      }))
    )
  }, [])

  const addFlightDeadline = useCallback((tripId, flightId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                deadlines: [...ensureArray(flight.deadlines), { id: uid('fdeadline'), title: '', date: '', notes: '', ...payload }],
              })
            : ensureFlight(flight)
        ),
      }))
    )
  }, [])

  const updateFlightDeadline = useCallback((tripId, flightId, deadlineId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                deadlines: ensureArray(flight.deadlines).map((d) => (d.id === deadlineId ? { ...d, ...payload } : d)),
              })
            : ensureFlight(flight)
        ),
      }))
    )
  }, [])

  const deleteFlightDeadline = useCallback((tripId, flightId, deadlineId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                deadlines: ensureArray(flight.deadlines).filter((d) => d.id !== deadlineId),
              })
            : ensureFlight(flight)
        ),
      }))
    )
  }, [])

  // ─── Hotel actions ───────────────────────────────────────────────────────────

  const addHotel = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: [...trip.hotels, ensureHotel(payload)],
      }))
    )
  }, [])

  const updateHotel = useCallback((tripId, hotelId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) => (hotel.id === hotelId ? ensureHotel({ ...hotel, ...payload }) : ensureHotel(hotel))),
      }))
    )
  }, [])

  const deleteHotel = useCallback((tripId, hotelId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.filter((hotel) => hotel.id !== hotelId),
      }))
    )
  }, [])

  const addHotelDeadline = useCallback((tripId, hotelId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) =>
          hotel.id === hotelId
            ? ensureHotel({
                ...hotel,
                deadlines: [...ensureArray(hotel.deadlines), { id: uid('hdeadline'), title: '', date: '', notes: '', ...payload }],
              })
            : ensureHotel(hotel)
        ),
      }))
    )
  }, [])

  const updateHotelDeadline = useCallback((tripId, hotelId, deadlineId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) =>
          hotel.id === hotelId
            ? ensureHotel({
                ...hotel,
                deadlines: ensureArray(hotel.deadlines).map((d) => (d.id === deadlineId ? { ...d, ...payload } : d)),
              })
            : ensureHotel(hotel)
        ),
      }))
    )
  }, [])

  const deleteHotelDeadline = useCallback((tripId, hotelId, deadlineId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) =>
          hotel.id === hotelId
            ? ensureHotel({
                ...hotel,
                deadlines: ensureArray(hotel.deadlines).filter((d) => d.id !== deadlineId),
              })
            : ensureHotel(hotel)
        ),
      }))
    )
  }, [])

  // ─── Parking & Car actions ───────────────────────────────────────────────────

  const addParkingReservation = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        parkingReservations: [
          ...ensureArray(trip.parkingReservations),
          { id: uid('park'), name: '', address: '', dateFrom: '', dateTo: '', cost: '', bookingUrl: '', notes: '', ...payload },
        ],
      }))
    )
  }, [])

  const updateParkingReservation = useCallback((tripId, parkingId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        parkingReservations: ensureArray(trip.parkingReservations).map((item) =>
          item.id === parkingId ? { ...item, ...payload } : item
        ),
      }))
    )
  }, [])

  const deleteParkingReservation = useCallback((tripId, parkingId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        parkingReservations: ensureArray(trip.parkingReservations).filter((item) => item.id !== parkingId),
      }))
    )
  }, [])

  const addCarRental = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        carRentals: [
          ...ensureArray(trip.carRentals),
          { id: uid('car'), company: '', pickupPlace: '', dropoffPlace: '', pickupDate: '', dropoffDate: '', cost: '', deposit: '', bookingUrl: '', notes: '', ...payload },
        ],
      }))
    )
  }, [])

  const updateCarRental = useCallback((tripId, carId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        carRentals: ensureArray(trip.carRentals).map((item) => (item.id === carId ? { ...item, ...payload } : item)),
      }))
    )
  }, [])

  const deleteCarRental = useCallback((tripId, carId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        carRentals: ensureArray(trip.carRentals).filter((item) => item.id !== carId),
      }))
    )
  }, [])

  // ─── Diary actions ───────────────────────────────────────────────────────────

  const addDiaryDay = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          days: [...ensureArray(trip.travelDiary?.days), { id: uid('day'), date: '', title: '', notes: '', ...payload }],
        },
      }))
    )
  }, [])

  const updateDiaryDay = useCallback((tripId, dayId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          days: ensureArray(trip.travelDiary?.days).map((day) => (day.id === dayId ? { ...day, ...payload } : day)),
        },
      }))
    )
  }, [])

  const deleteDiaryDay = useCallback((tripId, dayId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          days: ensureArray(trip.travelDiary?.days).filter((day) => day.id !== dayId),
        },
      }))
    )
  }, [])

  const addDiaryPlace = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          places: [
            ...ensureArray(trip.travelDiary?.places),
            { id: uid('place'), type: '', name: '', address: '', lat: '', lng: '', url: '', rating: '', reviewNote: '', imageUrl: '', notes: '', ...payload },
          ],
        },
      }))
    )
  }, [])

  const updateDiaryPlace = useCallback((tripId, placeId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          places: ensureArray(trip.travelDiary?.places).map((place) => (place.id === placeId ? { ...place, ...payload } : place)),
        },
      }))
    )
  }, [])

  const deleteDiaryPlace = useCallback((tripId, placeId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          places: ensureArray(trip.travelDiary?.places).filter((place) => place.id !== placeId),
        },
      }))
    )
  }, [])

  const addDiaryMedia = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          mediaLinks: [
            ...ensureArray(trip.travelDiary?.mediaLinks),
            { id: uid('media'), type: 'link', title: '', url: '', source: '', thumbnail: '', notes: '', ...payload },
          ],
        },
      }))
    )
  }, [])

  const updateDiaryMedia = useCallback((tripId, mediaId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          mediaLinks: ensureArray(trip.travelDiary?.mediaLinks).map((media) => (media.id === mediaId ? { ...media, ...payload } : media)),
        },
      }))
    )
  }, [])

  const deleteDiaryMedia = useCallback((tripId, mediaId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          mediaLinks: ensureArray(trip.travelDiary?.mediaLinks).filter((media) => media.id !== mediaId),
        },
      }))
    )
  }, [])

  // ─── Checklist actions ───────────────────────────────────────────────────────

  const toggleChecklistItem = useCallback((tripId, groupId, itemId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        packingChecklist: trip.packingChecklist.map((group) =>
          group.id !== groupId
            ? group
            : { ...group, items: group.items.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)) }
        ),
      }))
    )
  }, [])

  const addChecklistItem = useCallback((tripId, groupId, label) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        packingChecklist: trip.packingChecklist.map((group) =>
          group.id !== groupId ? group : { ...group, items: [...group.items, { id: uid('chk'), label, done: false }] }
        ),
      }))
    )
  }, [])

  const updateChecklistItem = useCallback((tripId, groupId, itemId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        packingChecklist: trip.packingChecklist.map((group) =>
          group.id !== groupId
            ? group
            : { ...group, items: group.items.map((item) => (item.id === itemId ? { ...item, ...payload } : item)) }
        ),
      }))
    )
  }, [])

  const removeChecklistItem = useCallback((tripId, groupId, itemId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        packingChecklist: trip.packingChecklist.map((group) =>
          group.id !== groupId ? group : { ...group, items: group.items.filter((item) => item.id !== itemId) }
        ),
      }))
    )
  }, [])

  // ─── General deadline actions ────────────────────────────────────────────────

  const addGeneralDeadline = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        generalDeadlines: [...ensureArray(trip.generalDeadlines), { id: uid('deadline'), title: '', date: '', notes: '', ...payload }],
      }))
    )
  }, [])

  const updateGeneralDeadline = useCallback((tripId, deadlineId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        generalDeadlines: ensureArray(trip.generalDeadlines).map((item) => (item.id === deadlineId ? { ...item, ...payload } : item)),
      }))
    )
  }, [])

  const deleteGeneralDeadline = useCallback((tripId, deadlineId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        generalDeadlines: ensureArray(trip.generalDeadlines).filter((item) => item.id !== deadlineId),
      }))
    )
  }, [])

  // ─── Family actions ──────────────────────────────────────────────────────────

  const updateFamilyMember = useCallback((memberId, payload) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? normalizeMember({ ...member, ...payload })
          : member
      )
    )
  }, [])

  const addMedicationToMember = useCallback((memberId, label = 'Nuovo farmaco') => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? {
              ...member,
              medications: [
                ...ensureArray(member.medications),
                { id: uid('med'), name: label, dosage: '', schedule: '', indication: '', notes: '' },
              ],
            }
          : member
      )
    )
  }, [])

  const updateMedicationFromMember = useCallback((memberId, medicationId, payload) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? {
              ...member,
              medications: ensureArray(member.medications).map((med) =>
                med.id === medicationId ? { ...med, ...payload } : med
              ),
            }
          : member
      )
    )
  }, [])

  const deleteMedicationFromMember = useCallback((memberId, medicationId) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, medications: ensureArray(member.medications).filter((med) => med.id !== medicationId) }
          : member
      )
    )
  }, [])

  // ─── Archive actions — normalizzazione completa garantita ────────────────────

  const updateArchive = useCallback((updater) => {
    setArchiveTables((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return normalizeArchiveTables(next)
    })
  }, [])

  // ─── Health actions — normalizzazione completa garantita ─────────────────────

  const updateHealth = useCallback((updater) => {
    setHealthTables((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return normalizeHealthTables(next)
    })
  }, [])

  // ─── Context value ───────────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      trips,
      familyMembers,
      archiveTables,
      healthTables,
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
      updateFlightBaggage,
      deleteFlightBaggage,
      addFlightDeadline,
      updateFlightDeadline,
      deleteFlightDeadline,
      addHotel,
      updateHotel,
      deleteHotel,
      addHotelDeadline,
      updateHotelDeadline,
      deleteHotelDeadline,
      addParkingReservation,
      updateParkingReservation,
      deleteParkingReservation,
      addCarRental,
      updateCarRental,
      deleteCarRental,
      addDiaryDay,
      updateDiaryDay,
      deleteDiaryDay,
      addDiaryPlace,
      updateDiaryPlace,
      deleteDiaryPlace,
      addDiaryMedia,
      updateDiaryMedia,
      deleteDiaryMedia,
      toggleChecklistItem,
      addChecklistItem,
      updateChecklistItem,
      removeChecklistItem,
      addGeneralDeadline,
      updateGeneralDeadline,
      deleteGeneralDeadline,
      updateFamilyMember,
      addMedicationToMember,
      updateMedicationFromMember,
      deleteMedicationFromMember,
      updateArchive,
      updateHealth,
    }),
    [
      trips, familyMembers, archiveTables, healthTables, loadingData, syncError,
      addTrip, updateTrip, deleteTrip, toggleTripMember,
      addFlight, updateFlight, deleteFlight, invertFlightRoute,
      addFlightBaggage, updateFlightBaggage, deleteFlightBaggage,
      addFlightDeadline, updateFlightDeadline, deleteFlightDeadline,
      addHotel, updateHotel, deleteHotel,
      addHotelDeadline, updateHotelDeadline, deleteHotelDeadline,
      addParkingReservation, updateParkingReservation, deleteParkingReservation,
      addCarRental, updateCarRental, deleteCarRental,
      addDiaryDay, updateDiaryDay, deleteDiaryDay,
      addDiaryPlace, updateDiaryPlace, deleteDiaryPlace,
      addDiaryMedia, updateDiaryMedia, deleteDiaryMedia,
      toggleChecklistItem, addChecklistItem, updateChecklistItem, removeChecklistItem,
      addGeneralDeadline, updateGeneralDeadline, deleteGeneralDeadline,
      updateFamilyMember, addMedicationToMember, updateMedicationFromMember, deleteMedicationFromMember,
      updateArchive, updateHealth,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used inside AppProvider')
  return context
}


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
    medications: [{ id: 'med_fc_1', name: 'Allopurinolo', dosage: '', schedule: '', indication: '', notes: '' }],
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
      'Carta d’identità / Passaporto',
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
]

const DEFAULT_ARCHIVE_TABLES = {
  categories: [
    { id: 'cat_identity', name: 'Identità', kind: 'standard' },
    { id: 'cat_house', name: 'Casa', kind: 'standard' },
    { id: 'cat_auto', name: 'Auto', kind: 'standard' },
    { id: 'cat_work', name: 'Lavoro', kind: 'standard' },
    { id: 'cat_school', name: 'Scuola', kind: 'standard' },
    { id: 'cat_health', name: 'Sanità', kind: 'standard' },
    { id: 'cat_reference', name: 'Documenti di riferimento', kind: 'table' },
  ],
  documents: [
    {
      id: 'doc_1',
      category: 'Identità',
      categoryId: 'cat_identity',
      owner: 'Francesco',
      ownerId: 'member_fc',
      title: 'Carta identità',
      number: '',
      issueDate: '',
      expiryDate: '',
      storage: '',
      driveLinks: [],
      notes: '',
    },
  ],
  warranties: [],
}

const DEFAULT_HEALTH_TABLES = {
  specialistVisits: [
    {
      id: 'visit_1',
      memberId: 'member_fc',
      title: 'Visita specialistica 1',
      specialty: 'Controllo',
      date: '',
      doctor: '',
      location: '',
      googleCalendarUrl: '',
      driveLinks: [],
      notes: '',
    },
  ],
  visitTherapies: [
    {
      id: 'therapy_1',
      memberId: 'member_fc',
      visitId: 'visit_1',
      title: 'Terapia 1',
      startDate: '',
      endDate: '',
      prescribingDoctor: '',
      driveLinks: [],
      notes: '',
    },
  ],
  therapyMedications: [
    {
      id: 'tmed_1',
      memberId: 'member_fc',
      visitId: 'visit_1',
      therapyId: 'therapy_1',
      medication: 'Allopurinolo',
      dosage: '',
      frequency: '',
      timeSlots: '',
      notes: '',
    },
  ],
  legacyAppointments: [],
  legacyTherapies: [],
}

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

function makeDefaultState() {
  return {
    trips: DEFAULT_TRIPS,
    familyMembers: FAMILY_DEFAULT,
    archiveTables: DEFAULT_ARCHIVE_TABLES,
    healthTables: DEFAULT_HEALTH_TABLES,
  }
}

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const ensureDriveLinks = (links = []) =>
  ensureArray(links)
    .map((entry) => {
      if (typeof entry === 'string') return { id: uid('lnk'), label: '', url: entry }
      return { id: entry?.id || uid('lnk'), label: entry?.label || '', url: entry?.url || '' }
    })
    .filter((entry) => entry.url || entry.label)

const ensureArchiveCategory = (row = {}) => ({
  id: row.id || uid('cat'),
  name: row.name || 'Nuova categoria',
  kind: row.kind || 'standard',
})

const ensureVisit = (row = {}) => ({
  id: row.id || uid('visit'),
  memberId: row.memberId || '',
  title: row.title || 'Visita specialistica',
  specialty: row.specialty || '',
  date: row.date || '',
  doctor: row.doctor || '',
  location: row.location || '',
  googleCalendarUrl: row.googleCalendarUrl || '',
  driveLinks: ensureDriveLinks(row.driveLinks),
  notes: row.notes || '',
})

const ensureVisitTherapy = (row = {}) => ({
  id: row.id || uid('therapy'),
  memberId: row.memberId || '',
  visitId: row.visitId || '',
  title: row.title || 'Terapia',
  startDate: row.startDate || '',
  endDate: row.endDate || '',
  prescribingDoctor: row.prescribingDoctor || '',
  driveLinks: ensureDriveLinks(row.driveLinks),
  notes: row.notes || '',
})

const ensureTherapyMedication = (row = {}) => ({
  id: row.id || uid('tmed'),
  memberId: row.memberId || '',
  visitId: row.visitId || '',
  therapyId: row.therapyId || '',
  medication: row.medication || '',
  dosage: row.dosage || '',
  frequency: row.frequency || '',
  timeSlots: row.timeSlots || '',
  notes: row.notes || '',
})

const ensureFlight = (flight = {}) => ({
  id: flight.id || uid('flight'),
  company: flight.company || '',
  companyUrl: flight.companyUrl || '',
  from: flight.from || '',
  to: flight.to || '',
  date: flight.date || '',
  departureTime: flight.departureTime || '',
  arrivalTime: flight.arrivalTime || '',
  flightNumber: flight.flightNumber || '',
  bookingRef: flight.bookingRef || '',
  purchaseCost: flight.purchaseCost || '',
  baggage: ensureArray(flight.baggage),
  deadlines: ensureArray(flight.deadlines),
})

const ensureHotel = (hotel = {}) => ({
  id: hotel.id || uid('hotel'),
  name: hotel.name || '',
  phone: hotel.phone || '',
  address: hotel.address || '',
  lat: hotel.lat || '',
  lng: hotel.lng || '',
  bookingUrl: hotel.bookingUrl || '',
  alternateUrl: hotel.alternateUrl || '',
  checkIn: hotel.checkIn || '',
  checkOut: hotel.checkOut || '',
  paidAmount: hotel.paidAmount || '',
  dueAmount: hotel.dueAmount || '',
  paymentMethod: hotel.paymentMethod || '',
  cancellationDate: hotel.cancellationDate || '',
  deadlines: ensureArray(hotel.deadlines),
})

const ensureTrip = (trip = {}) => ({
  id: trip.id || uid('trip'),
  name: trip.name || '',
  status: trip.status || 'planning',
  dateFrom: trip.dateFrom || '',
  dateTo: trip.dateTo || '',
  persons: ensureArray(trip.persons),
  flights: ensureArray(trip.flights).map(ensureFlight),
  hotels: ensureArray(trip.hotels).map(ensureHotel),
  parkingReservations: ensureArray(trip.parkingReservations),
  carRentals: ensureArray(trip.carRentals),
  travelDiary: {
    days: ensureArray(trip.travelDiary?.days),
    places: ensureArray(trip.travelDiary?.places),
    mediaLinks: ensureArray(trip.travelDiary?.mediaLinks),
    notes: trip.travelDiary?.notes || '',
  },
  packingChecklist: ensureArray(trip.packingChecklist),
  generalDeadlines: ensureArray(trip.generalDeadlines),
})

function normalizeState(raw) {
  const fallback = makeDefaultState()
  const source = raw && typeof raw === 'object' ? raw : fallback

  return {
    trips: ensureArray(source.trips).map(ensureTrip),
    familyMembers: ensureArray(source.familyMembers).map((member) => ({
      id: member?.id || uid('member'),
      initials: member?.initials || '',
      name: member?.name || '',
      role: member?.role || '',
      birthDate: member?.birthDate || '',
      bloodGroup: member?.bloodGroup || '',
      fiscalCode: member?.fiscalCode || '',
      phone: member?.phone || '',
      email: member?.email || '',
      doctor: member?.doctor || '',
      pediatrician: member?.pediatrician || '',
      allergies: member?.allergies || '',
      chronicConditions: member?.chronicConditions || '',
      currentTherapies: member?.currentTherapies || '',
      emergencyNotes: member?.emergencyNotes || '',
      medications: ensureArray(member?.medications).map((med) => ({
        id: med?.id || uid('med'),
        name: med?.name || '',
        dosage: med?.dosage || '',
        schedule: med?.schedule || '',
        indication: med?.indication || '',
        notes: med?.notes || '',
      })),
      documents: {
        idCard: member?.documents?.idCard || '',
        passport: member?.documents?.passport || '',
        healthCard: member?.documents?.healthCard || '',
        drivingLicense: member?.documents?.drivingLicense || '',
      },
    })),
    archiveTables: {
      categories: ensureArray(source.archiveTables?.categories || fallback.archiveTables.categories).map(ensureArchiveCategory),
      documents: ensureArray(source.archiveTables?.documents || fallback.archiveTables.documents).map((row) => ({
        id: row?.id || uid('doc'),
        category: row?.category || '',
        categoryId: row?.categoryId || '',
        owner: row?.owner || '',
        ownerId: row?.ownerId || '',
        title: row?.title || '',
        number: row?.number || '',
        issueDate: row?.issueDate || '',
        expiryDate: row?.expiryDate || '',
        storage: row?.storage || '',
        driveLinks: ensureDriveLinks(row?.driveLinks),
        notes: row?.notes || '',
      })),
      warranties: ensureArray(source.archiveTables?.warranties || fallback.archiveTables.warranties).map((row) => ({
        id: row?.id || uid('war'),
        item: row?.item || '',
        brand: row?.brand || '',
        purchaseDate: row?.purchaseDate || '',
        expiryDate: row?.expiryDate || '',
        invoiceRef: row?.invoiceRef || '',
        driveLinks: ensureDriveLinks(row?.driveLinks),
        notes: row?.notes || '',
      })),
    },
    healthTables: {
      specialistVisits: ensureArray(source.healthTables?.specialistVisits || fallback.healthTables.specialistVisits).map(ensureVisit),
      visitTherapies: ensureArray(source.healthTables?.visitTherapies || fallback.healthTables.visitTherapies).map(ensureVisitTherapy),
      therapyMedications: ensureArray(source.healthTables?.therapyMedications || fallback.healthTables.therapyMedications).map(ensureTherapyMedication),
      legacyAppointments: ensureArray(source.healthTables?.legacyAppointments || source.healthTables?.appointments || []),
      legacyTherapies: ensureArray(source.healthTables?.legacyTherapies || source.healthTables?.therapies || []),
    },
  }
}

function airlineUrl(name) {
  return AIRLINE_DIRECTORY[name] || ''
}

function updateTripInList(list, tripId, updater) {
  return list.map((trip) => (trip.id === tripId ? ensureTrip(updater(ensureTrip(trip))) : ensureTrip(trip)))
}

export function AppProvider({ children }) {
  const [trips, setTrips] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [archiveTables, setArchiveTables] = useState({ categories: [], documents: [], warranties: [] })
  const [healthTables, setHealthTables] = useState({
    specialistVisits: [],
    visitTherapies: [],
    therapyMedications: [],
    legacyAppointments: [],
    legacyTherapies: [],
  })
  const [loadingData, setLoadingData] = useState(true)
  const [syncError, setSyncError] = useState('')
  const saveTimerRef = useRef(null)
  const hasLoadedRef = useRef(false)
  const realtimeChannelRef = useRef(null)
  const lastSavedAtRef = useRef('')

  const hydrate = useCallback((payload) => {
    const normalized = normalizeState(payload)
    setTrips(normalized.trips)
    setFamilyMembers(normalized.familyMembers)
    setArchiveTables(normalized.archiveTables)
    setHealthTables(normalized.healthTables)
  }, [])

  const loadRemoteState = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id
    if (!userId) {
      hydrate(makeDefaultState())
      return
    }

    const { data, error } = await supabase
      .from('app_state')
      .select('payload, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      setSyncError(`Errore caricamento Supabase: ${error.message}`)
      hydrate(makeDefaultState())
      return
    }

    if (data?.payload) {
      lastSavedAtRef.current = data.updated_at || ''
      hydrate(data.payload)
      setSyncError('')
      return
    }

    const initial = normalizeState(makeDefaultState())
    hydrate(initial)

    const nowIso = new Date().toISOString()
    const { error: insertError } = await supabase.from('app_state').upsert(
      {
        user_id: userId,
        payload: initial,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' },
    )

    if (insertError) {
      setSyncError(`Errore inizializzazione Supabase: ${insertError.message}`)
      return
    }

    lastSavedAtRef.current = nowIso
    setSyncError('')
  }, [hydrate])

  const saveToSupabase = useCallback(async (payload) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id
    if (!userId) return

    const nowIso = new Date().toISOString()
    const { error } = await supabase.from('app_state').upsert(
      {
        user_id: userId,
        payload,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      setSyncError(`Errore salvataggio Supabase: ${error.message}`)
      return
    }

    lastSavedAtRef.current = nowIso
    setSyncError('')
  }, [])

  useEffect(() => {
    let mounted = true

    const boot = async () => {
      setLoadingData(true)
      setSyncError('')
      await loadRemoteState()
      if (!mounted) return

      setLoadingData(false)
      hasLoadedRef.current = true

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const userId = user?.id
      if (!userId) return

      realtimeChannelRef.current = supabase
        .channel(`app_state_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_state',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const nextUpdatedAt = payload.new?.updated_at || ''
            if (nextUpdatedAt && nextUpdatedAt === lastSavedAtRef.current) return
            if (payload.new?.payload) {
              lastSavedAtRef.current = nextUpdatedAt
              hydrate(payload.new.payload)
              setSyncError('')
            }
          },
        )
        .subscribe()
    }

    boot()

    return () => {
      mounted = false
      clearTimeout(saveTimerRef.current)
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current)
        realtimeChannelRef.current = null
      }
    }
  }, [hydrate, loadRemoteState, saveToSupabase])

  const payloadForSave = useMemo(
    () => ({ trips, familyMembers, archiveTables, healthTables }),
    [trips, familyMembers, archiveTables, healthTables],
  )

  useEffect(() => {
    if (!hasLoadedRef.current) return
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToSupabase(payloadForSave)
    }, 500)

    return () => clearTimeout(saveTimerRef.current)
  }, [payloadForSave, saveToSupabase])

  const updateFamilyMember = useCallback((memberId, payload) => {
    setFamilyMembers((prev) => prev.map((member) => (member.id === memberId ? { ...member, ...payload } : member)))
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
          : member,
      ),
    )
  }, [])

  const updateMedicationFromMember = useCallback((memberId, medicationId, payload) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? {
              ...member,
              medications: ensureArray(member.medications).map((med) =>
                med.id === medicationId ? { ...med, ...payload } : med,
              ),
            }
          : member,
      ),
    )
  }, [])

  const deleteMedicationFromMember = useCallback((memberId, medicationId) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, medications: ensureArray(member.medications).filter((med) => med.id !== medicationId) }
          : member,
      ),
    )
  }, [])

  const updateArchive = useCallback((updater) => {
    setArchiveTables((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return {
        categories: ensureArray(next.categories).map(ensureArchiveCategory),
        documents: ensureArray(next.documents),
        warranties: ensureArray(next.warranties),
      }
    })
  }, [])

  const updateHealth = useCallback((updater) => {
    setHealthTables((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return {
        specialistVisits: ensureArray(next.specialistVisits).map(ensureVisit),
        visitTherapies: ensureArray(next.visitTherapies).map(ensureVisitTherapy),
        therapyMedications: ensureArray(next.therapyMedications).map(ensureTherapyMedication),
        legacyAppointments: ensureArray(next.legacyAppointments),
        legacyTherapies: ensureArray(next.legacyTherapies),
      }
    })
  }, [])

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
      })),
    )
  }, [])

  const addFlight = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: [...trip.flights, ensureFlight({ ...payload, companyUrl: payload.companyUrl || airlineUrl(payload.company) })],
      })),
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
            : ensureFlight(flight),
        ),
      })),
    )
  }, [])

  const deleteFlight = useCallback((tripId, flightId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.filter((flight) => flight.id !== flightId),
      })),
    )
  }, [])

  const invertFlightRoute = useCallback((tripId, flightId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId ? ensureFlight({ ...flight, from: flight.to, to: flight.from }) : ensureFlight(flight),
        ),
      })),
    )
  }, [])

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
      updateFamilyMember,
      addMedicationToMember,
      updateMedicationFromMember,
      deleteMedicationFromMember,
      updateArchive,
      updateHealth,
    }),
    [
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
      updateFamilyMember,
      addMedicationToMember,
      updateMedicationFromMember,
      deleteMedicationFromMember,
      updateArchive,
      updateHealth,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used inside AppProvider')
  return context
}
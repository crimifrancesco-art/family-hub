import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

const AppContext = createContext(null);

const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

export const TRIP_STATUS_OPTIONS = [
  { value: "planning", label: "Pianificato" },
  { value: "incoming", label: "In arrivo" },
  { value: "ongoing", label: "In corso" },
  { value: "done", label: "Concluso" },
  { value: "cancelled", label: "Annullato" },
];

export const AIRLINE_DIRECTORY = {
  Ryanair: "https://www.ryanair.com/gb/en/",
  easyJet: "https://www.easyjet.com",
  Lufthansa: "https://www.lufthansa.com",
  ITA: "https://www.ita-airways.com",
  Wizzair: "https://www.wizzair.com",
};

export const FAMILY_DEFAULT = [
  {
    id: "member_fc",
    initials: "FC",
    name: "Francesco",
    role: "Papà",
    relationship: "",
    birthDate: "",
    bloodGroup: "",
    fiscalCode: "",
    phone: "",
    email: "",
    doctor: "",
    pediatrician: "",
    allergies: "",
    chronicConditions: "",
    currentTherapies: "",
    emergencyNotes: "",
    conditions: "",
    emergencyContact: "",
    healthId: "",
    healthNotes: "",
    medications: [
      {
        id: "med_fc_1",
        name: "Allopurinolo",
        dosage: "",
        schedule: "",
        indication: "",
        route: "",
        reminderEnabled: false,
        reminderTime: "",
        notes: "",
        createdAt: "",
      },
    ],
    documents: {
      idCard: "",
      passport: "",
      healthCard: "",
      drivingLicense: "",
    },
  },
  {
    id: "member_bp",
    initials: "BP",
    name: "BP",
    role: "Mamma",
    relationship: "",
    birthDate: "",
    bloodGroup: "",
    fiscalCode: "",
    phone: "",
    email: "",
    doctor: "",
    pediatrician: "",
    allergies: "",
    chronicConditions: "",
    currentTherapies: "",
    emergencyNotes: "",
    conditions: "",
    emergencyContact: "",
    healthId: "",
    healthNotes: "",
    medications: [],
    documents: {
      idCard: "",
      passport: "",
      healthCard: "",
      drivingLicense: "",
    },
  },
  {
    id: "member_dc",
    initials: "DC",
    name: "DC",
    role: "Figlio/a",
    relationship: "",
    birthDate: "",
    bloodGroup: "",
    fiscalCode: "",
    phone: "",
    email: "",
    doctor: "",
    pediatrician: "",
    allergies: "",
    chronicConditions: "",
    currentTherapies: "",
    emergencyNotes: "",
    conditions: "",
    emergencyContact: "",
    healthId: "",
    healthNotes: "",
    medications: [],
    documents: {
      idCard: "",
      passport: "",
      healthCard: "",
      drivingLicense: "",
    },
  },
  {
    id: "member_oc",
    initials: "OC",
    name: "OC",
    role: "Figlio/a",
    relationship: "",
    birthDate: "",
    bloodGroup: "",
    fiscalCode: "",
    phone: "",
    email: "",
    doctor: "",
    pediatrician: "",
    allergies: "",
    chronicConditions: "",
    currentTherapies: "",
    emergencyNotes: "",
    conditions: "",
    emergencyContact: "",
    healthId: "",
    healthNotes: "",
    medications: [],
    documents: {
      idCard: "",
      passport: "",
      healthCard: "",
      drivingLicense: "",
    },
  },
  {
    id: "member_md",
    initials: "MD",
    name: "MD",
    role: "Altro",
    relationship: "",
    birthDate: "",
    bloodGroup: "",
    fiscalCode: "",
    phone: "",
    email: "",
    doctor: "",
    pediatrician: "",
    allergies: "",
    chronicConditions: "",
    currentTherapies: "",
    emergencyNotes: "",
    conditions: "",
    emergencyContact: "",
    healthId: "",
    healthNotes: "",
    medications: [],
    documents: {
      idCard: "",
      passport: "",
      healthCard: "",
      drivingLicense: "",
    },
  },
];

export const TRAVEL_CHECKLIST_TEMPLATE = [
  {
    category: "Documenti & Salute",
    color: "blue",
    items: [
      "Carta d’identità / Passaporto",
      "Patente",
      "Biglietti / Check-in / QR code",
      "Carte / Bancomat / Contanti",
      "Tessera sanitaria",
      "Assicurazione viaggio",
      "Farmaci personali",
      "Mini kit primo soccorso",
      "Gel mani / Mascherine",
      "Copie documenti su cloud",
      "Prenotazioni salvate offline",
    ],
  },
  {
    category: "Elettronica",
    color: "green",
    items: [
      "Smartphone",
      "Tablet / Kindle",
      "Laptop",
      "Action cam / GoPro",
      "Powerbank",
      "Caricabatterie + Cavi",
      "Adattatore universale",
      "Auricolari / Cuffie",
      "Pendrive / Hard Disk",
    ],
  },
  {
    category: "Abbigliamento",
    color: "orange",
    items: [
      "Magliette",
      "Pantaloni / Shorts",
      "Biancheria",
      "Calze",
      "Pigiama",
      "Felpa / Giacca",
      "Scarpe comode",
      "Costume",
      "Ciabatte",
    ],
  },
];

const DEFAULT_ARCHIVE_TABLES = {
  categories: [
    { id: "cat_identity", name: "Identità", kind: "standard" },
    { id: "cat_house", name: "Casa", kind: "standard" },
    { id: "cat_auto", name: "Auto", kind: "standard" },
    { id: "cat_work", name: "Lavoro", kind: "standard" },
    { id: "cat_school", name: "Scuola", kind: "standard" },
    { id: "cat_health", name: "Sanità", kind: "standard" },
    { id: "cat_reference", name: "Documenti di riferimento", kind: "table" },
  ],
  documents: [
    {
      id: "doc_1",
      category: "Identità",
      categoryId: "cat_identity",
      owner: "Francesco",
      ownerId: "member_fc",
      title: "Carta identità",
      number: "",
      issueDate: "",
      expiryDate: "",
      storage: "",
      driveLinks: [],
      notes: "",
    },
  ],
  warranties: [],
};

const DEFAULT_HEALTH_TABLES = {
  specialistVisits: [],
  visitTherapies: [],
  therapyMedications: [],
  legacyAppointments: [],
  legacyTherapies: [],
};

const DEFAULT_TRIPS = [
  {
    id: "trip_torino",
    name: "Torino",
    status: "incoming",
    dateFrom: "2026-05-29",
    dateTo: "2026-06-02",
    persons: ["member_fc", "member_bp"],
    flights: [],
    hotels: [],
    parkingReservations: [],
    carRentals: [],
    travelDiary: {
      days: [],
      places: [],
      mediaLinks: [],
      notes: "",
    },
    packingChecklist: TRAVEL_CHECKLIST_TEMPLATE.map((group) => ({
      ...group,
      id: uid("grp"),
      items: group.items.map((label) => ({
        id: uid("chk"),
        label,
        done: false,
      })),
    })),
    generalDeadlines: [],
    notes: "",
  },
];

function makeDefaultState() {
  return {
    trips: DEFAULT_TRIPS,
    familyMembers: FAMILY_DEFAULT,
    archiveTables: DEFAULT_ARCHIVE_TABLES,
    healthTables: DEFAULT_HEALTH_TABLES,
  };
}

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const ensureDriveLinks = (links = []) =>
  ensureArray(links)
    .map((entry) => {
      if (typeof entry === "string") {
        return { id: uid("lnk"), label: "", url: entry };
      }
      return {
        id: entry?.id || uid("lnk"),
        label: entry?.label || "",
        url: entry?.url || "",
      };
    })
    .filter((entry) => entry.url || entry.label);

const ensureArchiveCategory = (row = {}) => ({
  id: row.id || uid("cat"),
  name: row.name || "Nuova categoria",
  kind: row.kind || "standard",
});

const ensureMedication = (med = {}) => ({
  id: med?.id || uid("med"),
  name: med?.name || "",
  dosage: med?.dosage || "",
  schedule: med?.schedule || "",
  indication: med?.indication || "",
  route: med?.route || "",
  reminderEnabled: Boolean(med?.reminderEnabled),
  reminderTime: med?.reminderTime || "",
  notes: med?.notes || "",
  createdAt: med?.createdAt || "",
});

const ensureVisit = (row = {}) => ({
  id: row.id || uid("visit"),
  memberId: row.memberId || "",
  category: row.category || "specialistica",
  title: row.title || "Visita specialistica",
  specialty: row.specialty || "",
  priority: row.priority || "media",
  status: row.status || "programmata",
  date: row.date || "",
  time: row.time || "",
  durationMinutes: Number(row.durationMinutes || 60),
  doctor: row.doctor || "",
  structure: row.structure || "",
  location: row.location || "",
  city: row.city || "",
  bookingCode: row.bookingCode || "",
  preparation: row.preparation || "",
  symptoms: row.symptoms || "",
  outcome: row.outcome || "",
  followUpDate: row.followUpDate || "",
  reminderDaysBefore: Number(row.reminderDaysBefore || 0),
  reminderNotes: row.reminderNotes || "",
  googleCalendarUrl: row.googleCalendarUrl || "",
  driveLinks: ensureDriveLinks(row.driveLinks),
  reportSummary: row.reportSummary || "",
  notes: row.notes || "",
  createdAt: row.createdAt || "",
});

const ensureVisitTherapy = (row = {}) => ({
  id: row.id || uid("therapy"),
  memberId: row.memberId || "",
  visitId: row.visitId || "",
  title: row.title || "Terapia",
  type: row.type || "",
  startDate: row.startDate || "",
  endDate: row.endDate || "",
  prescribingDoctor: row.prescribingDoctor || "",
  reminderEnabled: Boolean(row.reminderEnabled),
  reminderTime: row.reminderTime || "",
  driveLinks: ensureDriveLinks(row.driveLinks),
  prescriptionNotes: row.prescriptionNotes || "",
  notes: row.notes || "",
  createdAt: row.createdAt || "",
});

const ensureTherapyMedication = (row = {}) => ({
  id: row.id || uid("tmed"),
  memberId: row.memberId || "",
  visitId: row.visitId || "",
  therapyId: row.therapyId || "",
  medication: row.medication || "",
  dosage: row.dosage || "",
  frequency: row.frequency || "",
  timeSlots: row.timeSlots || "",
  duration: row.duration || "",
  route: row.route || "",
  reminderEnabled: Boolean(row.reminderEnabled),
  reminderTime: row.reminderTime || "",
  notes: row.notes || "",
  createdAt: row.createdAt || "",
});

const ensureFlight = (flight = {}) => ({
  id: flight.id || uid("flight"),
  company: flight.company || "",
  companyUrl: flight.companyUrl || "",
  from: flight.from || "",
  to: flight.to || "",
  date: flight.date || "",
  departureTime: flight.departureTime || "",
  arrivalTime: flight.arrivalTime || "",
  flightNumber: flight.flightNumber || "",
  bookingRef: flight.bookingRef || "",
  purchaseCost: flight.purchaseCost || "",
  baggage: ensureArray(flight.baggage).map((bag) => ({
    id: bag?.id || uid("bag"),
    label: bag?.label || "",
    qty: bag?.qty || 1,
    cost: bag?.cost || "",
  })),
  deadlines: ensureArray(flight.deadlines).map((item) => ({
    id: item?.id || uid("deadline"),
    title: item?.title || "",
    date: item?.date || "",
    notes: item?.notes || "",
  })),
});

const ensureHotel = (hotel = {}) => ({
  id: hotel.id || uid("hotel"),
  name: hotel.name || "",
  phone: hotel.phone || "",
  address: hotel.address || "",
  lat: hotel.lat || "",
  lng: hotel.lng || "",
  bookingUrl: hotel.bookingUrl || "",
  alternateUrl: hotel.alternateUrl || "",
  checkIn: hotel.checkIn || "",
  checkOut: hotel.checkOut || "",
  paidAmount: hotel.paidAmount || "",
  dueAmount: hotel.dueAmount || "",
  paymentMethod: hotel.paymentMethod || "",
  cancellationDate: hotel.cancellationDate || "",
  deadlines: ensureArray(hotel.deadlines).map((item) => ({
    id: item?.id || uid("deadline"),
    title: item?.title || "",
    date: item?.date || "",
    notes: item?.notes || "",
  })),
});

const ensureParkingReservation = (row = {}) => ({
  id: row.id || uid("park"),
  name: row.name || "",
  address: row.address || "",
  dateFrom: row.dateFrom || "",
  dateTo: row.dateTo || "",
  cost: row.cost || "",
  bookingUrl: row.bookingUrl || "",
  notes: row.notes || "",
});

const ensureCarRental = (row = {}) => ({
  id: row.id || uid("car"),
  company: row.company || "",
  pickupPlace: row.pickupPlace || "",
  dropoffPlace: row.dropoffPlace || "",
  pickupDate: row.pickupDate || "",
  dropoffDate: row.dropoffDate || "",
  cost: row.cost || "",
  deposit: row.deposit || "",
  bookingUrl: row.bookingUrl || "",
  notes: row.notes || "",
});

const ensureDiaryDay = (row = {}) => ({
  id: row.id || uid("day"),
  date: row.date || "",
  title: row.title || "",
  notes: row.notes || "",
});

const ensureDiaryPlace = (row = {}) => ({
  id: row.id || uid("place"),
  type: row.type || "",
  name: row.name || "",
  address: row.address || "",
  lat: row.lat || "",
  lng: row.lng || "",
  url: row.url || "",
  rating: row.rating || "",
  reviewNote: row.reviewNote || "",
  imageUrl: row.imageUrl || "",
  notes: row.notes || "",
});

const ensureDiaryMedia = (row = {}) => ({
  id: row.id || uid("media"),
  type: row.type || "link",
  title: row.title || "",
  url: row.url || "",
  source: row.source || "",
  thumbnail: row.thumbnail || "",
  notes: row.notes || "",
});

const ensureChecklistGroup = (group = {}) => ({
  id: group.id || uid("grp"),
  category: group.category || "Checklist",
  color: group.color || "blue",
  items: ensureArray(group.items).map((item) => {
    if (typeof item === "string") {
      return { id: uid("chk"), label: item, done: false };
    }
    return {
      id: item?.id || uid("chk"),
      label: item?.label || "",
      done: Boolean(item?.done),
    };
  }),
});

const ensureTrip = (trip = {}) => ({
  id: trip.id || uid("trip"),
  name: trip.name || "",
  status: trip.status || "planning",
  dateFrom: trip.dateFrom || "",
  dateTo: trip.dateTo || "",
  persons: ensureArray(trip.persons),
  flights: ensureArray(trip.flights).map(ensureFlight),
  hotels: ensureArray(trip.hotels).map(ensureHotel),
  parkingReservations: ensureArray(trip.parkingReservations).map(
    ensureParkingReservation,
  ),
  carRentals: ensureArray(trip.carRentals).map(ensureCarRental),
  travelDiary: {
    days: ensureArray(trip.travelDiary?.days).map(ensureDiaryDay),
    places: ensureArray(trip.travelDiary?.places).map(ensureDiaryPlace),
    mediaLinks: ensureArray(trip.travelDiary?.mediaLinks).map(ensureDiaryMedia),
    notes: trip.travelDiary?.notes || "",
  },
  packingChecklist: ensureArray(trip.packingChecklist).map(ensureChecklistGroup),
  generalDeadlines: ensureArray(trip.generalDeadlines),
  notes: trip.notes || "",
});

const ensureFamilyMember = (member = {}) => ({
  id: member?.id || uid("member"),
  initials: member?.initials || "",
  name: member?.name || "",
  role: member?.role || "",
  relationship: member?.relationship || "",
  birthDate: member?.birthDate || "",
  bloodGroup: member?.bloodGroup || "",
  fiscalCode: member?.fiscalCode || "",
  phone: member?.phone || "",
  email: member?.email || "",
  doctor: member?.doctor || "",
  pediatrician: member?.pediatrician || "",
  allergies: member?.allergies || "",
  chronicConditions: member?.chronicConditions || "",
  currentTherapies: member?.currentTherapies || "",
  emergencyNotes: member?.emergencyNotes || "",
  conditions: member?.conditions || "",
  emergencyContact: member?.emergencyContact || "",
  healthId: member?.healthId || "",
  healthNotes: member?.healthNotes || "",
  medications: ensureArray(member?.medications).map(ensureMedication),
  documents: {
    idCard: member?.documents?.idCard || "",
    passport: member?.documents?.passport || "",
    healthCard: member?.documents?.healthCard || "",
    drivingLicense: member?.documents?.drivingLicense || "",
  },
});

function mergeById(defaultRows, currentRows, ensureFn) {
  const map = new Map();
  ensureArray(defaultRows).forEach((row) => map.set(row.id, ensureFn(row)));
  ensureArray(currentRows).forEach((row) => {
    map.set(row.id, ensureFn({ ...map.get(row.id), ...row }));
  });
  return Array.from(map.values());
}

function normalizeState(raw) {
  const fallback = makeDefaultState();
  const source = raw && typeof raw === "object" ? raw : fallback;

  return {
    trips: ensureArray(source.trips).length
      ? ensureArray(source.trips).map(ensureTrip)
      : fallback.trips.map(ensureTrip),

    familyMembers: mergeById(
      fallback.familyMembers,
      source.familyMembers,
      ensureFamilyMember,
    ),

    archiveTables: {
      categories: mergeById(
        fallback.archiveTables.categories,
        source.archiveTables?.categories,
        ensureArchiveCategory,
      ),
      documents: ensureArray(
        source.archiveTables?.documents ?? fallback.archiveTables.documents,
      ).map((row) => ({
        id: row?.id || uid("doc"),
        category: row?.category || "",
        categoryId: row?.categoryId || "",
        owner: row?.owner || "",
        ownerId: row?.ownerId || "",
        title: row?.title || "",
        number: row?.number || "",
        issueDate: row?.issueDate || "",
        expiryDate: row?.expiryDate || "",
        storage: row?.storage || "",
        driveLinks: ensureDriveLinks(row?.driveLinks),
        notes: row?.notes || "",
      })),
      warranties: ensureArray(
        source.archiveTables?.warranties ?? fallback.archiveTables.warranties,
      ).map((row) => ({
        id: row?.id || uid("war"),
        item: row?.item || "",
        brand: row?.brand || "",
        purchaseDate: row?.purchaseDate || "",
        expiryDate: row?.expiryDate || "",
        invoiceRef: row?.invoiceRef || "",
        driveLinks: ensureDriveLinks(row?.driveLinks),
        notes: row?.notes || "",
      })),
    },

    healthTables: {
      specialistVisits: ensureArray(
        source.healthTables?.specialistVisits ??
          fallback.healthTables.specialistVisits,
      ).map(ensureVisit),
      visitTherapies: ensureArray(
        source.healthTables?.visitTherapies ??
          fallback.healthTables.visitTherapies,
      ).map(ensureVisitTherapy),
      therapyMedications: ensureArray(
        source.healthTables?.therapyMedications ??
          fallback.healthTables.therapyMedications,
      ).map(ensureTherapyMedication),
      legacyAppointments: ensureArray(
        source.healthTables?.legacyAppointments ??
          source.healthTables?.appointments ??
          [],
      ),
      legacyTherapies: ensureArray(
        source.healthTables?.legacyTherapies ??
          source.healthTables?.therapies ??
          [],
      ),
    },
  };
}

function airlineUrl(name) {
  return AIRLINE_DIRECTORY[name] || "";
}

function updateTripInList(list, tripId, updater) {
  return list.map((trip) =>
    trip.id === tripId ? ensureTrip(updater(ensureTrip(trip))) : ensureTrip(trip),
  );
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [trips, setTrips] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [archiveTables, setArchiveTables] = useState({
    categories: [],
    documents: [],
    warranties: [],
  });
  const [healthTables, setHealthTables] = useState({
    specialistVisits: [],
    visitTherapies: [],
    therapyMedications: [],
    legacyAppointments: [],
    legacyTherapies: [],
  });
  const [loadingData, setLoadingData] = useState(true);
  const [syncError, setSyncError] = useState("");

  const saveTimerRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const realtimeChannelRef = useRef(null);
  const lastSavedAtRef = useRef("");
  const lastRemoteAppliedAtRef = useRef("");
  const isSavingRef = useRef(false);
  const bootingRef = useRef(false);

  const clearLocalState = useCallback(() => {
    const normalized = normalizeState(makeDefaultState());
    setTrips(normalized.trips);
    setFamilyMembers(normalized.familyMembers);
    setArchiveTables(normalized.archiveTables);
    setHealthTables(normalized.healthTables);
    setLoadingData(false);
    setSyncError("");
    hasLoadedRef.current = false;
    bootingRef.current = false;
    lastSavedAtRef.current = "";
    lastRemoteAppliedAtRef.current = "";
    isSavingRef.current = false;
    clearTimeout(saveTimerRef.current);
  }, []);

  const cleanupRealtimeChannel = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  const hydrate = useCallback((payload) => {
    const normalized = normalizeState(payload);
    setTrips(normalized.trips);
    setFamilyMembers(normalized.familyMembers);
    setArchiveTables(normalized.archiveTables);
    setHealthTables(normalized.healthTables);
  }, []);

  const getCurrentPayload = useCallback(() => {
    return normalizeState({
      trips,
      familyMembers,
      archiveTables,
      healthTables,
    });
  }, [trips, familyMembers, archiveTables, healthTables]);

  const loadRemoteState = useCallback(
    async (currentUserId) => {
      if (!currentUserId) {
        hydrate(makeDefaultState());
        return;
      }

      const { data, error } = await supabase
        .from("app_state")
        .select("payload, updated_at")
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (error) {
        setSyncError(`Errore caricamento Supabase: ${error.message}`);
        hydrate(makeDefaultState());
        return;
      }

      if (data?.payload) {
        const normalized = normalizeState(data.payload);
        hydrate(normalized);
        lastSavedAtRef.current = data.updated_at || "";
        lastRemoteAppliedAtRef.current = data.updated_at || "";
        setSyncError("");
        return;
      }

      const initial = normalizeState(makeDefaultState());
      hydrate(initial);

      const nowIso = new Date().toISOString();
      const { error: insertError } = await supabase.from("app_state").upsert(
        {
          user_id: currentUserId,
          payload: initial,
          updated_at: nowIso,
        },
        { onConflict: "user_id" },
      );

      if (insertError) {
        setSyncError(`Errore inizializzazione Supabase: ${insertError.message}`);
        return;
      }

      lastSavedAtRef.current = nowIso;
      lastRemoteAppliedAtRef.current = nowIso;
      setSyncError("");
    },
    [hydrate],
  );

  const attachRealtimeChannel = useCallback(
    (currentUserId) => {
      if (!currentUserId) return;

      cleanupRealtimeChannel();

      realtimeChannelRef.current = supabase
        .channel(`app_state_${currentUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "app_state",
            filter: `user_id=eq.${currentUserId}`,
          },
          (payload) => {
            const remotePayload = payload.new?.payload;
            const remoteUpdatedAt = payload.new?.updated_at || "";

            if (!remotePayload) return;
            if (bootingRef.current) return;
            if (isSavingRef.current) return;
            if (remoteUpdatedAt && remoteUpdatedAt === lastSavedAtRef.current) return;
            if (
              remoteUpdatedAt &&
              remoteUpdatedAt === lastRemoteAppliedAtRef.current
            )
              return;

            lastRemoteAppliedAtRef.current = remoteUpdatedAt;
            hydrate(remotePayload);
            setSyncError("");
          },
        )
        .subscribe();
    },
    [cleanupRealtimeChannel, hydrate],
  );

  const bootstrapForUser = useCallback(
    async (currentUser) => {
      const currentUserId = currentUser?.id || "";

      cleanupRealtimeChannel();
      clearTimeout(saveTimerRef.current);

      if (!currentUserId) {
        clearLocalState();
        return;
      }

      bootingRef.current = true;
      setLoadingData(true);
      setSyncError("");
      hasLoadedRef.current = false;

      await loadRemoteState(currentUserId);

      bootingRef.current = false;
      hasLoadedRef.current = true;
      setLoadingData(false);

      attachRealtimeChannel(currentUserId);
    },
    [attachRealtimeChannel, cleanupRealtimeChannel, clearLocalState, loadRemoteState],
  );

  const saveToSupabase = useCallback(
    async (payload) => {
      if (!user?.id) return;

      isSavingRef.current = true;

      const nowIso = new Date().toISOString();
      const { error } = await supabase.from("app_state").upsert(
        {
          user_id: user.id,
          payload: normalizeState(payload),
          updated_at: nowIso,
        },
        { onConflict: "user_id" },
      );

      if (error) {
        setSyncError(`Errore salvataggio Supabase: ${error.message}`);
        isSavingRef.current = false;
        return;
      }

      lastSavedAtRef.current = nowIso;
      setSyncError("");
      isSavingRef.current = false;
    },
    [user],
  );

  const signOut = useCallback(async () => {
    cleanupRealtimeChannel();
    clearTimeout(saveTimerRef.current);
    await supabase.auth.signOut();
  }, [cleanupRealtimeChannel]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(initialSession || null);
      setUser(initialSession?.user || null);
      setAuthReady(true);

      await bootstrapForUser(initialSession?.user || null);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession || null);
      setUser(nextSession?.user || null);
      setAuthReady(true);

      await bootstrapForUser(nextSession?.user || null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      clearTimeout(saveTimerRef.current);
      cleanupRealtimeChannel();
    };
  }, [bootstrapForUser, cleanupRealtimeChannel]);

  const payloadForSave = useMemo(
    () => normalizeState({ trips, familyMembers, archiveTables, healthTables }),
    [trips, familyMembers, archiveTables, healthTables],
  );

  useEffect(() => {
    if (!authReady) return;
    if (!user?.id) return;
    if (!hasLoadedRef.current || bootingRef.current) return;

    clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      saveToSupabase(payloadForSave);
    }, 250);

    return () => clearTimeout(saveTimerRef.current);
  }, [authReady, user, payloadForSave, saveToSupabase]);

  const addFamilyMember = useCallback((payload = {}) => {
    const created = ensureFamilyMember({
      id: uid("member"),
      initials: payload.initials || "",
      name: payload.name || "",
      role: payload.role || "",
      relationship: payload.relationship || "",
      birthDate: payload.birthDate || "",
      bloodGroup: payload.bloodGroup || "",
      fiscalCode: payload.fiscalCode || "",
      phone: payload.phone || "",
      email: payload.email || "",
      doctor: payload.doctor || "",
      pediatrician: payload.pediatrician || "",
      allergies: payload.allergies || "",
      chronicConditions: payload.chronicConditions || "",
      currentTherapies: payload.currentTherapies || "",
      emergencyNotes: payload.emergencyNotes || "",
      conditions: payload.conditions || "",
      emergencyContact: payload.emergencyContact || "",
      healthId: payload.healthId || "",
      healthNotes: payload.healthNotes || "",
      medications: ensureArray(payload.medications).map(ensureMedication),
      documents: {
        idCard: payload.documents?.idCard || "",
        passport: payload.documents?.passport || "",
        healthCard: payload.documents?.healthCard || "",
        drivingLicense: payload.documents?.drivingLicense || "",
      },
    });

    setFamilyMembers((prev) => [...prev, created]);
    return created;
  }, []);

  const updateFamilyMember = useCallback((memberId, payload) => {
    setFamilyMembers((prev) =>
      prev.map((member) => {
        if (member.id !== memberId) return ensureFamilyMember(member);

        const nextDocuments =
          payload?.documents && typeof payload.documents === "object"
            ? {
                ...member.documents,
                ...payload.documents,
              }
            : member.documents;

        const nextMedications =
          payload?.medications !== undefined
            ? ensureArray(payload.medications).map(ensureMedication)
            : ensureArray(member.medications).map(ensureMedication);

        return ensureFamilyMember({
          ...member,
          ...payload,
          documents: nextDocuments,
          medications: nextMedications,
        });
      }),
    );
  }, []);

  const deleteFamilyMember = useCallback((memberId) => {
    setFamilyMembers((prev) => prev.filter((member) => member.id !== memberId));

    setHealthTables((prev) => ({
      ...prev,
      specialistVisits: ensureArray(prev.specialistVisits).filter(
        (item) => item.memberId !== memberId,
      ),
      visitTherapies: ensureArray(prev.visitTherapies).filter(
        (item) => item.memberId !== memberId,
      ),
      therapyMedications: ensureArray(prev.therapyMedications).filter(
        (item) => item.memberId !== memberId,
      ),
    }));

    setArchiveTables((prev) => ({
      ...prev,
      documents: ensureArray(prev.documents).filter(
        (doc) => doc.ownerId !== memberId,
      ),
    }));

    setTrips((prev) =>
      ensureArray(prev).map((trip) =>
        ensureTrip({
          ...trip,
          persons: ensureArray(trip.persons).filter((id) => id !== memberId),
        }),
      ),
    );
  }, []);

  const addMedicationToMember = useCallback(
    (memberId, label = "Nuovo farmaco") => {
      setFamilyMembers((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? ensureFamilyMember({
                ...member,
                medications: [
                  ...ensureArray(member.medications),
                  ensureMedication({
                    id: uid("med"),
                    name: label,
                  }),
                ],
              })
            : ensureFamilyMember(member),
        ),
      );
    },
    [],
  );

  const updateMedicationFromMember = useCallback((memberId, medicationId, payload) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? ensureFamilyMember({
              ...member,
              medications: ensureArray(member.medications).map((med) =>
                med.id === medicationId
                  ? ensureMedication({ ...med, ...payload })
                  : ensureMedication(med),
              ),
            })
          : ensureFamilyMember(member),
      ),
    );
  }, []);

  const deleteMedicationFromMember = useCallback((memberId, medicationId) => {
    setFamilyMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? ensureFamilyMember({
              ...member,
              medications: ensureArray(member.medications).filter(
                (med) => med.id !== medicationId,
              ),
            })
          : ensureFamilyMember(member),
      ),
    );
  }, []);

  const updateArchive = useCallback((updater) => {
    setArchiveTables((prev) => {
      const current = {
        categories: ensureArray(prev.categories).map(ensureArchiveCategory),
        documents: ensureArray(prev.documents).map((row) => ({
          ...row,
          driveLinks: ensureDriveLinks(row?.driveLinks),
        })),
        warranties: ensureArray(prev.warranties).map((row) => ({
          ...row,
          driveLinks: ensureDriveLinks(row?.driveLinks),
        })),
      };

      const next = typeof updater === "function" ? updater(current) : updater;

      return {
        categories: ensureArray(next?.categories).map(ensureArchiveCategory),
        documents: ensureArray(next?.documents).map((row) => ({
          ...row,
          driveLinks: ensureDriveLinks(row?.driveLinks),
        })),
        warranties: ensureArray(next?.warranties).map((row) => ({
          ...row,
          driveLinks: ensureDriveLinks(row?.driveLinks),
        })),
      };
    });
  }, []);

  const updateHealth = useCallback((updater) => {
    setHealthTables((prev) => {
      const current = {
        specialistVisits: ensureArray(prev.specialistVisits).map(ensureVisit),
        visitTherapies: ensureArray(prev.visitTherapies).map(ensureVisitTherapy),
        therapyMedications: ensureArray(prev.therapyMedications).map(
          ensureTherapyMedication,
        ),
        legacyAppointments: ensureArray(prev.legacyAppointments),
        legacyTherapies: ensureArray(prev.legacyTherapies),
      };

      const next = typeof updater === "function" ? updater(current) : updater;

      return {
        specialistVisits: ensureArray(next?.specialistVisits).map(ensureVisit),
        visitTherapies: ensureArray(next?.visitTherapies).map(ensureVisitTherapy),
        therapyMedications: ensureArray(next?.therapyMedications).map(
          ensureTherapyMedication,
        ),
        legacyAppointments: ensureArray(next?.legacyAppointments),
        legacyTherapies: ensureArray(next?.legacyTherapies),
      };
    });
  }, []);

  const addTrip = useCallback((payload) => {
    const created = ensureTrip({
      ...payload,
      id: uid("trip"),
      packingChecklist: TRAVEL_CHECKLIST_TEMPLATE.map((group) => ({
        ...group,
        id: uid("grp"),
        items: group.items.map((label) => ({
          id: uid("chk"),
          label,
          done: false,
        })),
      })),
    });

    setTrips((prev) => [...prev, created]);
    return created;
  }, []);

  const updateTrip = useCallback((tripId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? ensureTrip({ ...trip, ...payload }) : ensureTrip(trip),
      ),
    );
  }, []);

  const deleteTrip = useCallback((tripId) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  }, []);

  const toggleTripMember = useCallback((tripId, memberId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        persons: trip.persons.includes(memberId)
          ? trip.persons.filter((id) => id !== memberId)
          : [...trip.persons, memberId],
      })),
    );
  }, []);

  const addFlight = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: [
          ...trip.flights,
          ensureFlight({
            ...payload,
            id: uid("flight"),
            companyUrl: payload.companyUrl || airlineUrl(payload.company),
          }),
        ],
      })),
    );
  }, []);

  const updateFlight = useCallback((tripId, flightId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                ...payload,
                companyUrl: payload.company
                  ? airlineUrl(payload.company)
                  : flight.companyUrl,
              })
            : ensureFlight(flight),
        ),
      })),
    );
  }, []);

  const deleteFlight = useCallback((tripId, flightId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.filter((flight) => flight.id !== flightId),
      })),
    );
  }, []);

  const invertFlightRoute = useCallback((tripId, flightId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({ ...flight, from: flight.to, to: flight.from })
            : ensureFlight(flight),
        ),
      })),
    );
  }, []);

  const addFlightBaggage = useCallback((tripId, flightId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                baggage: [
                  ...ensureArray(flight.baggage),
                  {
                    id: uid("bag"),
                    label: payload.label || "",
                    qty: payload.qty || 1,
                    cost: payload.cost || "",
                  },
                ],
              })
            : ensureFlight(flight),
        ),
      })),
    );
  }, []);

  const deleteFlightBaggage = useCallback((tripId, flightId, baggageId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                baggage: ensureArray(flight.baggage).filter(
                  (bag) => bag.id !== baggageId,
                ),
              })
            : ensureFlight(flight),
        ),
      })),
    );
  }, []);

  const addFlightDeadline = useCallback((tripId, flightId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                deadlines: [
                  ...ensureArray(flight.deadlines),
                  {
                    id: uid("deadline"),
                    title: payload.title || "",
                    date: payload.date || "",
                    notes: payload.notes || "",
                  },
                ],
              })
            : ensureFlight(flight),
        ),
      })),
    );
  }, []);

  const deleteFlightDeadline = useCallback((tripId, flightId, deadlineId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                deadlines: ensureArray(flight.deadlines).filter(
                  (item) => item.id !== deadlineId,
                ),
              })
            : ensureFlight(flight),
        ),
      })),
    );
  }, []);

  const addHotel = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: [...trip.hotels, ensureHotel({ ...payload, id: uid("hotel") })],
      })),
    );
  }, []);

  const updateHotel = useCallback((tripId, hotelId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) =>
          hotel.id === hotelId
            ? ensureHotel({ ...hotel, ...payload })
            : ensureHotel(hotel),
        ),
      })),
    );
  }, []);

  const deleteHotel = useCallback((tripId, hotelId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.filter((hotel) => hotel.id !== hotelId),
      })),
    );
  }, []);

  const addHotelDeadline = useCallback((tripId, hotelId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) =>
          hotel.id === hotelId
            ? ensureHotel({
                ...hotel,
                deadlines: [
                  ...ensureArray(hotel.deadlines),
                  {
                    id: uid("deadline"),
                    title: payload.title || "",
                    date: payload.date || "",
                    notes: payload.notes || "",
                  },
                ],
              })
            : ensureHotel(hotel),
        ),
      })),
    );
  }, []);

  const deleteHotelDeadline = useCallback((tripId, hotelId, deadlineId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) =>
          hotel.id === hotelId
            ? ensureHotel({
                ...hotel,
                deadlines: ensureArray(hotel.deadlines).filter(
                  (item) => item.id !== deadlineId,
                ),
              })
            : ensureHotel(hotel),
        ),
      })),
    );
  }, []);

  const addParkingReservation = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        parkingReservations: [
          ...trip.parkingReservations,
          ensureParkingReservation({ ...payload, id: uid("park") }),
        ],
      })),
    );
  }, []);

  const deleteParkingReservation = useCallback((tripId, parkingId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        parkingReservations: trip.parkingReservations.filter(
          (item) => item.id !== parkingId,
        ),
      })),
    );
  }, []);

  const addCarRental = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        carRentals: [
          ...trip.carRentals,
          ensureCarRental({ ...payload, id: uid("car") }),
        ],
      })),
    );
  }, []);

  const deleteCarRental = useCallback((tripId, carId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        carRentals: trip.carRentals.filter((item) => item.id !== carId),
      })),
    );
  }, []);

  const addDiaryDay = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          days: [
            ...ensureArray(trip.travelDiary?.days),
            ensureDiaryDay({ ...payload, id: uid("day") }),
          ],
        },
      })),
    );
  }, []);

  const deleteDiaryDay = useCallback((tripId, dayId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          days: ensureArray(trip.travelDiary?.days).filter(
            (item) => item.id !== dayId,
          ),
        },
      })),
    );
  }, []);

  const addDiaryPlace = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          places: [
            ...ensureArray(trip.travelDiary?.places),
            ensureDiaryPlace({ ...payload, id: uid("place") }),
          ],
        },
      })),
    );
  }, []);

  const deleteDiaryPlace = useCallback((tripId, placeId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          places: ensureArray(trip.travelDiary?.places).filter(
            (item) => item.id !== placeId,
          ),
        },
      })),
    );
  }, []);

  const addDiaryMedia = useCallback((tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          mediaLinks: [
            ...ensureArray(trip.travelDiary?.mediaLinks),
            ensureDiaryMedia({ ...payload, id: uid("media") }),
          ],
        },
      })),
    );
  }, []);

  const deleteDiaryMedia = useCallback((tripId, mediaId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          mediaLinks: ensureArray(trip.travelDiary?.mediaLinks).filter(
            (item) => item.id !== mediaId,
          ),
        },
      })),
    );
  }, []);

  const toggleChecklistItem = useCallback((tripId, groupId, itemId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        packingChecklist: ensureArray(trip.packingChecklist).map((group) =>
          group.id === groupId
            ? ensureChecklistGroup({
                ...group,
                items: ensureArray(group.items).map((item) =>
                  item.id === itemId ? { ...item, done: !item.done } : item,
                ),
              })
            : ensureChecklistGroup(group),
        ),
      })),
    );
  }, []);

  const addChecklistItem = useCallback((tripId, groupId, label) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        packingChecklist: ensureArray(trip.packingChecklist).map((group) =>
          group.id === groupId
            ? ensureChecklistGroup({
                ...group,
                items: [
                  ...ensureArray(group.items),
                  { id: uid("chk"), label, done: false },
                ],
              })
            : ensureChecklistGroup(group),
        ),
      })),
    );
  }, []);

  const removeChecklistItem = useCallback((tripId, groupId, itemId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        packingChecklist: ensureArray(trip.packingChecklist).map((group) =>
          group.id === groupId
            ? ensureChecklistGroup({
                ...group,
                items: ensureArray(group.items).filter(
                  (item) => item.id !== itemId,
                ),
              })
            : ensureChecklistGroup(group),
        ),
      })),
    );
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      authReady,
      signOut,
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
      addFamilyMember,
      updateFamilyMember,
      deleteFamilyMember,
      addMedicationToMember,
      updateMedicationFromMember,
      deleteMedicationFromMember,
      updateArchive,
      updateHealth,
      getCurrentPayload,
    }),
    [
      session,
      user,
      authReady,
      signOut,
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
      addFamilyMember,
      updateFamilyMember,
      deleteFamilyMember,
      addMedicationToMember,
      updateMedicationFromMember,
      deleteMedicationFromMember,
      updateArchive,
      updateHealth,
      getCurrentPayload,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return context;
}
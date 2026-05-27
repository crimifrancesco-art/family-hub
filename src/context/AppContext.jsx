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

export const AIRLINE_DIRECTORY = {
  Ryanair: 'https://www.ryanair.com/gb/en/',
  easyJet: 'https://www.easyjet.com',
  Lufthansa: 'https://www.lufthansa.com',
  ITA: 'https://www.ita-airways.com',
  Wizzair: 'https://www.wizzair.com',
}

const DEFAULT_TRIPS = [
  {
    id: 'trip_torino',
    name: 'Torino',
    status: 'incoming',
    dateFrom: '2026-05-29',
    dateTo: '2026-06-02',
    persons: ['FC', 'BP'],
    flights: [],
    hotels: [],
    travelDiary: {
      days: [],
      places: [],
      notes: '',
    },
    generalDeadlines: [],
  },
]

function useLocalState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

const ensureTrip = (trip) => ({
  id: uid('trip'),
  name: '',
  status: 'planning',
  dateFrom: '',
  dateTo: '',
  persons: [],
  flights: [],
  hotels: [],
  travelDiary: { days: [], places: [], notes: '' },
  generalDeadlines: [],
  ...trip,
  travelDiary: {
    days: [],
    places: [],
    notes: '',
    ...(trip?.travelDiary || {}),
  },
})

const ensureFlight = (flight = {}) => ({
  id: uid('flight'),
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
})

const ensureHotel = (hotel = {}) => ({
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
  deadlines: [],
  ...hotel,
})

function airlineUrl(name) {
  return AIRLINE_DIRECTORY[name] || ''
}

function updateTripInList(list, tripId, updater) {
  return list.map((trip) => (trip.id === tripId ? ensureTrip(updater(ensureTrip(trip))) : ensureTrip(trip)))
}

export function AppProvider({ children }) {
  const [trips, setTrips] = useLocalState('fh_trips_v2', DEFAULT_TRIPS)

  const addTrip = (payload) => {
    setTrips((prev) => [...prev, ensureTrip({ ...payload, id: uid('trip') })])
  }

  const updateTrip = (tripId, payload) => {
    setTrips((prev) => prev.map((trip) => (trip.id === tripId ? ensureTrip({ ...trip, ...payload }) : ensureTrip(trip))))
  }

  const deleteTrip = (tripId) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
  }

  const addFlight = (tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: [...trip.flights, ensureFlight({ ...payload, companyUrl: payload.companyUrl || airlineUrl(payload.company) })],
      })),
    )
  }

  const updateFlight = (tripId, flightId, payload) => {
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
  }

  const deleteFlight = (tripId, flightId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.filter((flight) => flight.id !== flightId),
      })),
    )
  }

  const invertFlightRoute = (tripId, flightId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId ? ensureFlight({ ...flight, from: flight.to, to: flight.from }) : ensureFlight(flight),
        ),
      })),
    )
  }

  const addFlightBaggage = (tripId, flightId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                baggage: [...(flight.baggage || []), { id: uid('bag'), label: '', qty: '1', cost: '', ...payload }],
              })
            : ensureFlight(flight),
        ),
      })),
    )
  }

  const deleteFlightBaggage = (tripId, flightId, bagId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({ ...flight, baggage: (flight.baggage || []).filter((bag) => bag.id !== bagId) })
            : ensureFlight(flight),
        ),
      })),
    )
  }

  const addFlightDeadline = (tripId, flightId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                deadlines: [...(flight.deadlines || []), { id: uid('fdeadline'), title: '', date: '', notes: '', ...payload }],
              })
            : ensureFlight(flight),
        ),
      })),
    )
  }

  const deleteFlightDeadline = (tripId, flightId, deadlineId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        flights: trip.flights.map((flight) =>
          flight.id === flightId
            ? ensureFlight({
                ...flight,
                deadlines: (flight.deadlines || []).filter((deadline) => deadline.id !== deadlineId),
              })
            : ensureFlight(flight),
        ),
      })),
    )
  }

  const addHotel = (tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: [...trip.hotels, ensureHotel(payload)],
      })),
    )
  }

  const updateHotel = (tripId, hotelId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) => (hotel.id === hotelId ? ensureHotel({ ...hotel, ...payload }) : ensureHotel(hotel))),
      })),
    )
  }

  const deleteHotel = (tripId, hotelId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.filter((hotel) => hotel.id !== hotelId),
      })),
    )
  }

  const addHotelDeadline = (tripId, hotelId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) =>
          hotel.id === hotelId
            ? ensureHotel({ ...hotel, deadlines: [...(hotel.deadlines || []), { id: uid('hdeadline'), title: '', date: '', notes: '', ...payload }] })
            : ensureHotel(hotel),
        ),
      })),
    )
  }

  const deleteHotelDeadline = (tripId, hotelId, deadlineId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        hotels: trip.hotels.map((hotel) =>
          hotel.id === hotelId
            ? ensureHotel({ ...hotel, deadlines: (hotel.deadlines || []).filter((deadline) => deadline.id !== deadlineId) })
            : ensureHotel(hotel),
        ),
      })),
    )
  }

  const addDiaryDay = (tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          days: [...trip.travelDiary.days, { id: uid('day'), date: '', title: '', notes: '', ...payload }],
        },
      })),
    )
  }

  const deleteDiaryDay = (tripId, dayId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          days: trip.travelDiary.days.filter((day) => day.id !== dayId),
        },
      })),
    )
  }

  const addDiaryPlace = (tripId, payload) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          places: [
            ...trip.travelDiary.places,
            { id: uid('place'), type: 'attrazione', name: '', address: '', notes: '', url: '', ...payload },
          ],
        },
      })),
    )
  }

  const deleteDiaryPlace = (tripId, placeId) => {
    setTrips((prev) =>
      updateTripInList(prev, tripId, (trip) => ({
        ...trip,
        travelDiary: {
          ...trip.travelDiary,
          places: trip.travelDiary.places.filter((place) => place.id !== placeId),
        },
      })),
    )
  }

  const value = useMemo(
    () => ({
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
      airlineUrl,
    }),
    [trips],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppContext must be used inside AppProvider')
  return context
}

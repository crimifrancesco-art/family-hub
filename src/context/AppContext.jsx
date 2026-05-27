import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppContext = createContext(null)

const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

const DEFAULT_TRIPS = [
  {
    id: 'trip_torino',
    name: 'Torino',
    status: 'In arrivo',
    dateFrom: '2026-05-29',
    dateTo: '2026-06-02',
    persons: ['FC', 'BP'],
    flights: [],
    hotels: [],
    itinerary: [],
    baggage: [],
    deadlines: [],
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

export function AppProvider({ children }) {
  const [trips, setTrips] = useLocalState('fh_trips', DEFAULT_TRIPS)

  const addTrip = (payload) => {
    setTrips((prev) => [
      ...prev,
      {
        id: uid('trip'),
        name: payload.name || 'Nuovo viaggio',
        status: payload.status || 'Pianificato',
        dateFrom: payload.dateFrom || '',
        dateTo: payload.dateTo || '',
        persons: payload.persons || [],
        flights: [],
        hotels: [],
        itinerary: [],
        baggage: [],
        deadlines: [],
      },
    ])
  }

  const updateTrip = (tripId, payload) => {
    setTrips((prev) => prev.map((trip) => (trip.id === tripId ? { ...trip, ...payload } : trip)))
  }

  const deleteTrip = (tripId) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId))
  }

  const addFlight = (tripId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              flights: [
                ...trip.flights,
                {
                  id: uid('flight'),
                  company: payload.company || '',
                  from: payload.from || '',
                  to: payload.to || '',
                  date: payload.date || '',
                  time: payload.time || '',
                },
              ],
            }
          : trip,
      ),
    )
  }

  const updateFlight = (tripId, itemId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              flights: trip.flights.map((item) => (item.id === itemId ? { ...item, ...payload } : item)),
            }
          : trip,
      ),
    )
  }

  const deleteFlight = (tripId, itemId) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, flights: trip.flights.filter((item) => item.id !== itemId) } : trip,
      ),
    )
  }

  const addHotel = (tripId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              hotels: [
                ...trip.hotels,
                {
                  id: uid('hotel'),
                  name: payload.name || '',
                  address: payload.address || '',
                  checkIn: payload.checkIn || '',
                  checkOut: payload.checkOut || '',
                },
              ],
            }
          : trip,
      ),
    )
  }

  const updateHotel = (tripId, itemId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              hotels: trip.hotels.map((item) => (item.id === itemId ? { ...item, ...payload } : item)),
            }
          : trip,
      ),
    )
  }

  const deleteHotel = (tripId, itemId) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId ? { ...trip, hotels: trip.hotels.filter((item) => item.id !== itemId) } : trip,
      ),
    )
  }

  const addItineraryDay = (tripId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              itinerary: [
                ...trip.itinerary,
                {
                  id: uid('day'),
                  day: payload.day || '',
                  title: payload.title || '',
                  notes: payload.notes || '',
                },
              ],
            }
          : trip,
      ),
    )
  }

  const updateItineraryDay = (tripId, itemId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              itinerary: trip.itinerary.map((item) => (item.id === itemId ? { ...item, ...payload } : item)),
            }
          : trip,
      ),
    )
  }

  const deleteItineraryDay = (tripId, itemId) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, itinerary: trip.itinerary.filter((item) => item.id !== itemId) }
          : trip,
      ),
    )
  }

  const addBaggageItem = (tripId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              baggage: [
                ...trip.baggage,
                {
                  id: uid('bag'),
                  name: payload.name || '',
                  qty: payload.qty || '1',
                  owner: payload.owner || '',
                },
              ],
            }
          : trip,
      ),
    )
  }

  const updateBaggageItem = (tripId, itemId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              baggage: trip.baggage.map((item) => (item.id === itemId ? { ...item, ...payload } : item)),
            }
          : trip,
      ),
    )
  }

  const deleteBaggageItem = (tripId, itemId) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, baggage: trip.baggage.filter((item) => item.id !== itemId) }
          : trip,
      ),
    )
  }

  const addDeadline = (tripId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              deadlines: [
                ...trip.deadlines,
                {
                  id: uid('deadline'),
                  title: payload.title || '',
                  date: payload.date || '',
                  notes: payload.notes || '',
                },
              ],
            }
          : trip,
      ),
    )
  }

  const updateDeadline = (tripId, itemId, payload) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              deadlines: trip.deadlines.map((item) => (item.id === itemId ? { ...item, ...payload } : item)),
            }
          : trip,
      ),
    )
  }

  const deleteDeadline = (tripId, itemId) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === tripId
          ? { ...trip, deadlines: trip.deadlines.filter((item) => item.id !== itemId) }
          : trip,
      ),
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

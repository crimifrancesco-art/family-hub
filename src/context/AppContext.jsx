import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const Ctx = createContext(null)
const COLORS = [
  { c: '#1D9E75', bg: '#E1F5EE' },
  { c: '#185FA5', bg: '#E6F1FB' },
  { c: '#854F0B', bg: '#FAEEDA' },
  { c: '#993556', bg: '#FBEAF0' },
  { c: '#D85A30', bg: '#FAECE7' },
  { c: '#7C4DCC', bg: '#F0EBFF' },
]
const DEFFAMILY = [
  { id: 'marco', name: 'Marco', initials: 'MA', role: 'Padre', bday: '1983-04-15', blood: 'A+', cf: 'MRCVRD83D15H501X', phone: '333 1234567', color: COLORS[0].c, bg: COLORS[0].bg },
  { id: 'sofia', name: 'Sofia', initials: 'SO', role: 'Madre', bday: '1986-07-22', blood: 'B+', cf: 'SFAVRD86L62H501K', phone: '333 7654321', color: COLORS[2].c, bg: COLORS[2].bg },
  { id: 'luca', name: 'Luca', initials: 'LU', role: 'Figlio', bday: '2016-11-03', blood: 'A+', cf: 'LCAVRD16S03H501Z', phone: '', color: COLORS[1].c, bg: COLORS[1].bg },
]
const DEFDOCS = [
  { id: 'd1', name: 'Tessera sanitaria Marco', type: 'pdf', category: 'Identità', person: 'marco', date: '2025-05-12', expiry: '', size: '210 KB' },
  { id: 'd2', name: 'Vaccinazioni Luca 2025', type: 'img', category: 'Salute', person: 'luca', date: '2025-05-03', expiry: '', size: '1.2 MB' },
  { id: 'd3', name: 'Passaporto Sofia', type: 'pdf', category: 'Identità', person: 'sofia', date: '2019-09-14', expiry: '2026-09-14', size: '380 KB' },
]
const DEFMEDS = [
  { id: 'm1', name: 'Amoxicillina 500mg', person: 'luca', category: 'Antibiotico', times: ['08:00', '13:00', '20:00'], notes: 'Con cibo', startDate: '2026-05-19', endDate: '2026-05-26', active: true },
  { id: 'm2', name: 'Vitamina D 1000 UI', person: 'sofia', category: 'Integratore', times: ['20:00'], notes: 'Con pasto serale', startDate: '2026-01-01', endDate: '', active: true },
]
const DEFVISITS = [
  { id: 'v1', title: 'Pediatra', person: 'luca', doctor: 'Dott. Ferrara', location: 'Via Roma 4', date: '2026-06-03', time: '15:30', status: 'confirmed' },
  { id: 'v2', title: 'Cardiologo', person: 'marco', doctor: 'Dott. Bianchi', location: 'Spoleto', date: '2026-06-12', time: '10:00', status: 'new' },
]
const DEFTHERAPIES = [
  { id: 't1', title: 'Fisioterapia', person: 'marco', doctor: 'Dott. Bianchi', total: 8, done: 3, schedule: 'Martedì 10:00' },
  { id: 't2', title: 'Logopedia', person: 'luca', doctor: 'Dott.ssa Verde', total: 10, done: 4, schedule: 'Giovedì 16:30' },
]
const DEFTRIPS = [{ id: 'tr1', name: 'Torino', emoji: '✈️', dateFrom: '2026-05-29', dateTo: '2026-06-02', status: 'imminent', budget: 1200, notes: 'Weekend lungo in centro.', persons: ['marco', 'sofia'], flights: [], hotels: [], itinerary: [], packing: [], reminders: [], checklist: [{ id: 'c1', text: 'Trasporto prenotato', done: false }, { id: 'c2', text: 'Alloggio confermato', done: false }], expenses: [], diary: [] }]
function load(key, fallback) { try { const v = localStorage.getItem(`fh_${key}`); return v ? JSON.parse(v) : fallback } catch { return fallback } }
function usePersist(key, fallback) { const [state, setState] = useState(() => load(key, fallback)); useEffect(() => { localStorage.setItem(`fh_${key}`, JSON.stringify(state)) }, [key, state]); return [state, setState] }
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
const ensureTrip = (trip) => ({ flights: [], hotels: [], itinerary: [], packing: [], reminders: [], checklist: [], expenses: [], diary: [], persons: [], notes: '', status: 'planning', budget: 0, ...trip })
export function AppProvider({ children }) {
  const [family, setFamily] = usePersist('family', DEFFAMILY)
  const [docs, setDocs] = usePersist('docs', DEFDOCS)
  const [meds, setMeds] = usePersist('meds', DEFMEDS)
  const [visits, setVisits] = usePersist('visits', DEFVISITS)
  const [therapies] = usePersist('therapies', DEFTHERAPIES)
  const [trips, setTrips] = usePersist('trips', DEFTRIPS)
  const mapTrip = (tripId, fn) => setTrips((prev) => prev.map((t) => t.id === tripId ? ensureTrip(fn(ensureTrip(t))) : ensureTrip(t)))
  const api = useMemo(() => ({
    family, docs, meds, visits, therapies, trips,
    addDoc: (doc) => setDocs((p) => [...p, { id: uid('doc'), ...doc }]), removeDoc: (id) => setDocs((p) => p.filter((x) => x.id !== id)),
    addMed: (med) => setMeds((p) => [...p, { id: uid('med'), ...med }]), removeMed: (id) => setMeds((p) => p.filter((x) => x.id !== id)),
    addVisit: (visit) => setVisits((p) => [...p, { id: uid('vis'), ...visit }]), removeVisit: (id) => setVisits((p) => p.filter((x) => x.id !== id)),
    addTrip: (trip) => setTrips((p) => [...p, ensureTrip({ id: uid('trip'), ...trip })]), updateTrip: (tripId, data) => setTrips((p) => p.map((t) => t.id === tripId ? ensureTrip({ ...t, ...data }) : ensureTrip(t))), removeTrip: (tripId) => setTrips((p) => p.filter((t) => t.id !== tripId)),
    addFlight: (tripId, data) => mapTrip(tripId, (t) => ({ ...t, flights: [...t.flights, { id: uid('flt'), type: 'andata', company: '', from: '', to: '', date: '', time: '', arrival: '', bookingRef: '', ...data }] })),
    updateFlight: (tripId, itemId, data) => mapTrip(tripId, (t) => ({ ...t, flights: t.flights.map((x) => x.id === itemId ? { ...x, ...data } : x) })),
    removeFlight: (tripId, itemId) => mapTrip(tripId, (t) => ({ ...t, flights: t.flights.filter((x) => x.id !== itemId) })),
    addHotel: (tripId, data) => mapTrip(tripId, (t) => ({ ...t, hotels: [...t.hotels, { id: uid('hot'), name: '', stars: 3, address: '', checkIn: '', checkOut: '', bookingRef: '', ...data }] })),
    updateHotel: (tripId, itemId, data) => mapTrip(tripId, (t) => ({ ...t, hotels: t.hotels.map((x) => x.id === itemId ? { ...x, ...data } : x) })),
    removeHotel: (tripId, itemId) => mapTrip(tripId, (t) => ({ ...t, hotels: t.hotels.filter((x) => x.id !== itemId) })),
    addItineraryDay: (tripId, data) => mapTrip(tripId, (t) => ({ ...t, itinerary: [...t.itinerary, { id: uid('day'), day: '', title: '', items: [], ...data, items: Array.isArray(data.items) ? data.items : [] }] })),
    updateItineraryDay: (tripId, itemId, data) => mapTrip(tripId, (t) => ({ ...t, itinerary: t.itinerary.map((x) => x.id === itemId ? { ...x, ...data } : x) })),
    removeItineraryDay: (tripId, itemId) => mapTrip(tripId, (t) => ({ ...t, itinerary: t.itinerary.filter((x) => x.id !== itemId) })),
    addPackingItem: (tripId, category, text) => mapTrip(tripId, (t) => { const packing = [...t.packing]; const idx = packing.findIndex((x) => x.id === category || x.cat === category); if (idx >= 0) packing[idx] = { ...packing[idx], items: [...packing[idx].items, { t: text, done: false }] }; else packing.push({ id: uid('bag'), cat: category, items: [{ t: text, done: false }] }); return { ...t, packing } }),
    updatePackingItem: (tripId, categoryId, itemIndex, data) => mapTrip(tripId, (t) => ({ ...t, packing: t.packing.map((cat) => cat.id === categoryId ? { ...cat, items: cat.items.map((it, i) => i === itemIndex ? { ...it, ...data } : it) } : cat) })),
    removePackingItem: (tripId, categoryId, itemIndex) => mapTrip(tripId, (t) => ({ ...t, packing: t.packing.map((cat) => cat.id === categoryId ? { ...cat, items: cat.items.filter((_, i) => i !== itemIndex) } : cat).filter((cat) => cat.items.length > 0) })),
    togglePackingItem: (tripId, categoryId, itemIndex) => mapTrip(tripId, (t) => ({ ...t, packing: t.packing.map((cat) => cat.id === categoryId ? { ...cat, items: cat.items.map((it, i) => i === itemIndex ? { ...it, done: !it.done } : it) } : cat) })),
    addReminder: (tripId, data) => mapTrip(tripId, (t) => ({ ...t, reminders: [...t.reminders, { id: uid('rem'), text: '', when: '', color: '#378ADD', ...data }] })),
    updateReminder: (tripId, itemId, data) => mapTrip(tripId, (t) => ({ ...t, reminders: t.reminders.map((x) => x.id === itemId ? { ...x, ...data } : x) })),
    removeReminder: (tripId, itemId) => mapTrip(tripId, (t) => ({ ...t, reminders: t.reminders.filter((x) => x.id !== itemId) })),
  }), [family, docs, meds, visits, therapies, trips])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export const useApp = () => useContext(Ctx)

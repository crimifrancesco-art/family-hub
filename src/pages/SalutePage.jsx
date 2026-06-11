import { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'

const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const emptyVisitForm = {
  category: 'specialistica',
  title: '',
  specialty: '',
  priority: 'media',
  status: 'programmata',
  date: '',
  time: '',
  durationMinutes: '60',
  doctor: '',
  structure: '',
  location: '',
  city: '',
  bookingCode: '',
  preparation: '',
  symptoms: '',
  outcome: '',
  followUpDate: '',
  reminderDaysBefore: '2',
  reminderNotes: '',
  driveLinksText: '',
  reportSummary: '',
  notes: '',
}

const emptyTherapyForm = {
  visitId: '',
  title: '',
  type: '',
  startDate: '',
  endDate: '',
  prescribingDoctor: '',
  reminderEnabled: true,
  reminderTime: '08:00',
  driveLinksText: '',
  prescriptionNotes: '',
  notes: '',
}

const emptyTherapyMedicationForm = {
  therapyId: '',
  medication: '',
  dosage: '',
  frequency: '',
  timeSlots: '',
  duration: '',
  route: '',
  reminderEnabled: true,
  reminderTime: '08:00',
  notes: '',
}

const emptyPersonalMedicationForm = {
  name: '',
  dosage: '',
  schedule: '',
  indication: '',
  route: '',
  reminderEnabled: true,
  reminderTime: '08:00',
  notes: '',
}

const emptyMemberProfileForm = {
  doctor: '',
  healthId: '',
  allergies: '',
  conditions: '',
  emergencyContact: '',
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function fmtDate(value) {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function fmtDateTime(date, time) {
  if (!date && !time) return '—'
  if (date && time) return `${fmtDate(date)} · ${time}`
  if (date) return fmtDate(date)
  return time
}

function memberLabel(member) {
  return member?.name || member?.role || member?.initials || member?.id || 'Membro'
}

function normalizeUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function parseLinks(text) {
  return String(text || '')
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row, index) => ({
      id: uid('lnk'),
      label: `Documento ${index + 1}`,
      url: normalizeUrl(row),
    }))
}

function linksToText(links) {
  return ensureArray(links)
    .map((item) => item?.url || '')
    .filter(Boolean)
    .join('\n')
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function buildCalendarLink({
  title,
  date,
  time = '09:00',
  durationMinutes = 60,
  details = '',
  location = '',
}) {
  if (!date) return ''

  const [hours = '09', minutes = '00'] = String(time || '09:00').split(':')
  const start = new Date(
    `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
  )
  if (Number.isNaN(start.getTime())) return ''

  const end = new Date(start.getTime() + Number(durationMinutes || 60) * 60000)

  const toCalendarDate = (d) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}`
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Promemoria salute',
    dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`,
    details,
    location,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function daysUntil(dateValue) {
  if (!dateValue) return null
  const target = new Date(`${dateValue}T09:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function badgeToneByDays(days) {
  if (days === null) return 'badge-muted'
  if (days < 0) return 'badge-danger'
  if (days <= 7) return 'badge-warning'
  return 'badge-success'
}

function badgeLabelByDays(days) {
  if (days === null) return 'Senza data'
  if (days < 0) return 'Scaduta'
  if (days === 0) return 'Oggi'
  if (days === 1) return 'Domani'
  return `${days} gg`
}

function categoryLabel(value) {
  if (value === 'controllo') return 'Controllo'
  if (value === 'esame') return 'Esame'
  if (value === 'varia') return 'Visita varia'
  return 'Visita specialistica'
}

function priorityLabel(value) {
  if (value === 'alta') return 'Alta'
  if (value === 'bassa') return 'Bassa'
  return 'Media'
}

function SectionHeader({ badge, title, subtitle }) {
  return (
    <div className="section-head compact-head">
      {badge ? <div className="badge badge-dash">{badge}</div> : null}
      <h2 className="page-title" style={{ marginTop: 8 }}>{title}</h2>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </div>
  )
}

function FieldError({ text }) {
  if (!text) return null
  return <div className="error-msg" style={{ marginTop: 8 }}>{text}</div>
}

function MetaPills({ items }) {
  const visible = items.filter((item) => item?.value)
  if (!visible.length) return null

  return (
    <div className="tree-meta compact-meta">
      {visible.map((item) => (
        <div key={`${item.label}_${item.value}`} className="meta-pill">
          <span className="meta-label">{item.label}:</span> {item.value}
        </div>
      ))}
    </div>
  )
}

export default function SalutePage() {
  const {
    familyMembers,
    healthTables,
    loadingData,
    syncError,
    updateFamilyMember,
    deleteMedicationFromMember,
    updateHealth,
  } = useAppContext()

  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [memberProfileForm, setMemberProfileForm] = useState(emptyMemberProfileForm)

  const [visitForm, setVisitForm] = useState(emptyVisitForm)
  const [therapyForm, setTherapyForm] = useState(emptyTherapyForm)
  const [therapyMedicationForm, setTherapyMedicationForm] = useState(emptyTherapyMedicationForm)
  const [personalMedicationForm, setPersonalMedicationForm] = useState(emptyPersonalMedicationForm)

  const [visitError, setVisitError] = useState('')
  const [therapyError, setTherapyError] = useState('')
  const [therapyMedicationError, setTherapyMedicationError] = useState('')
  const [personalMedicationError, setPersonalMedicationError] = useState('')

  const [editingVisitId, setEditingVisitId] = useState('')
  const [editingTherapyId, setEditingTherapyId] = useState('')
  const [editingTherapyMedicationId, setEditingTherapyMedicationId] = useState('')
  const [editingPersonalMedicationId, setEditingPersonalMedicationId] = useState('')

  const [editVisitForm, setEditVisitForm] = useState(emptyVisitForm)
  const [editTherapyForm, setEditTherapyForm] = useState(emptyTherapyForm)
  const [editTherapyMedicationForm, setEditTherapyMedicationForm] = useState(emptyTherapyMedicationForm)
  const [editPersonalMedicationForm, setEditPersonalMedicationForm] = useState(emptyPersonalMedicationForm)

  useEffect(() => {
    if (!familyMembers.length) {
      setSelectedMemberId('')
      return
    }

    const exists = familyMembers.some((member) => member.id === selectedMemberId)
    if (!selectedMemberId || !exists) {
      setSelectedMemberId(familyMembers[0].id)
    }
  }, [familyMembers, selectedMemberId])

  const selectedMember =
    familyMembers.find((member) => member.id === selectedMemberId) || familyMembers[0] || null

  useEffect(() => {
    setMemberProfileForm({
      doctor: selectedMember?.doctor || '',
      healthId: selectedMember?.healthId || '',
      allergies: selectedMember?.allergies || '',
      conditions: selectedMember?.conditions || selectedMember?.chronicConditions || '',
      emergencyContact: selectedMember?.emergencyContact || '',
    })
  }, [selectedMemberId, selectedMember])

  useEffect(() => {
    if (!selectedMember?.id) return

    const timer = setTimeout(() => {
      updateFamilyMember(selectedMember.id, {
        doctor: memberProfileForm.doctor,
        healthId: memberProfileForm.healthId,
        allergies: memberProfileForm.allergies,
        conditions: memberProfileForm.conditions,
        emergencyContact: memberProfileForm.emergencyContact,
      })
    }, 350)

    return () => clearTimeout(timer)
  }, [memberProfileForm, selectedMember?.id, updateFamilyMember])

  const memberVisits = useMemo(() => {
    return ensureArray(healthTables?.specialistVisits)
      .filter((visit) => visit.memberId === selectedMemberId)
      .sort((a, b) => {
        const left = `${a.date || '9999-99-99'}_${a.time || '99:99'}`
        const right = `${b.date || '9999-99-99'}_${b.time || '99:99'}`
        return left.localeCompare(right)
      })
  }, [healthTables, selectedMemberId])

  const memberTherapies = useMemo(() => {
    return ensureArray(healthTables?.visitTherapies)
      .filter((therapy) => therapy.memberId === selectedMemberId)
      .sort((a, b) => `${a.startDate || ''}`.localeCompare(`${b.startDate || ''}`))
  }, [healthTables, selectedMemberId])

  const memberTherapyMedications = useMemo(() => {
    return ensureArray(healthTables?.therapyMedications).filter(
      (item) => item.memberId === selectedMemberId,
    )
  }, [healthTables, selectedMemberId])

  const personalMedications = ensureArray(selectedMember?.medications)

  const treeVisits = useMemo(() => {
    return memberVisits.map((visit) => {
      const therapies = memberTherapies
        .filter((therapy) => therapy.visitId === visit.id)
        .map((therapy) => ({
          ...therapy,
          medications: memberTherapyMedications.filter((med) => med.therapyId === therapy.id),
        }))

      return {
        ...visit,
        therapies,
      }
    })
  }, [memberVisits, memberTherapies, memberTherapyMedications])

  const summary = useMemo(() => {
    const nextVisit = memberVisits.find((visit) => {
      const days = daysUntil(visit.date)
      return days !== null && days >= 0
    })

    return {
      visits: memberVisits.length,
      therapies: memberTherapies.length,
      therapyMedications: memberTherapyMedications.length,
      personalMedications: personalMedications.length,
      nextVisit,
    }
  }, [memberVisits, memberTherapies, memberTherapyMedications, personalMedications])

  const buildVisitPayload = (form, memberId, oldRow = null) => {
    const driveLinks = parseLinks(form.driveLinksText)
    const invalid = driveLinks.some((item) => !isValidHttpUrl(item.url))
    if (invalid) {
      throw new Error('Uno o più link documenti non sono validi.')
    }

    const details = [
      form.specialty ? `Specialità: ${form.specialty}` : '',
      form.doctor ? `Medico: ${form.doctor}` : '',
      form.structure ? `Struttura: ${form.structure}` : '',
      form.bookingCode ? `Prenotazione: ${form.bookingCode}` : '',
      form.preparation ? `Preparazione: ${form.preparation}` : '',
      form.reminderNotes ? `Reminder: ${form.reminderNotes}` : '',
      form.notes ? `Note: ${form.notes}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const location = [form.location, form.city].filter(Boolean).join(', ')

    return {
      id: oldRow?.id || uid('visit'),
      memberId,
      category: form.category,
      title: form.title.trim(),
      specialty: form.specialty.trim(),
      priority: form.priority,
      status: form.status,
      date: form.date,
      time: form.time,
      durationMinutes: Number(form.durationMinutes || 60),
      doctor: form.doctor.trim(),
      structure: form.structure.trim(),
      location: form.location.trim(),
      city: form.city.trim(),
      bookingCode: form.bookingCode.trim(),
      preparation: form.preparation.trim(),
      symptoms: form.symptoms.trim(),
      outcome: form.outcome.trim(),
      followUpDate: form.followUpDate,
      reminderDaysBefore: Number(form.reminderDaysBefore || 0),
      reminderNotes: form.reminderNotes.trim(),
      driveLinks,
      reportSummary: form.reportSummary.trim(),
      notes: form.notes.trim(),
      googleCalendarUrl: buildCalendarLink({
        title: form.title.trim(),
        date: form.date,
        time: form.time || '09:00',
        durationMinutes: Number(form.durationMinutes || 60),
        details,
        location,
      }),
      createdAt: oldRow?.createdAt || new Date().toISOString(),
    }
  }

  const buildTherapyPayload = (form, memberId, oldRow = null) => {
    const driveLinks = parseLinks(form.driveLinksText)
    const invalid = driveLinks.some((item) => !isValidHttpUrl(item.url))
    if (invalid) {
      throw new Error('Uno o più link terapia non sono validi.')
    }

    return {
      id: oldRow?.id || uid('therapy'),
      memberId,
      visitId: form.visitId,
      title: form.title.trim(),
      type: form.type.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      prescribingDoctor: form.prescribingDoctor.trim(),
      reminderEnabled: Boolean(form.reminderEnabled),
      reminderTime: form.reminderTime,
      driveLinks,
      prescriptionNotes: form.prescriptionNotes.trim(),
      notes: form.notes.trim(),
      createdAt: oldRow?.createdAt || new Date().toISOString(),
    }
  }

  const buildTherapyMedicationPayload = (form, memberId, therapyRow, oldRow = null) => {
    return {
      id: oldRow?.id || uid('tmed'),
      memberId,
      visitId: therapyRow.visitId || '',
      therapyId: therapyRow.id,
      medication: form.medication.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency.trim(),
      timeSlots: form.timeSlots.trim(),
      duration: form.duration.trim(),
      route: form.route.trim(),
      reminderEnabled: Boolean(form.reminderEnabled),
      reminderTime: form.reminderTime,
      notes: form.notes.trim(),
      createdAt: oldRow?.createdAt || new Date().toISOString(),
    }
  }

  const buildPersonalMedicationPayload = (form, oldRow = null) => {
    return {
      id: oldRow?.id || uid('med'),
      name: form.name.trim(),
      dosage: form.dosage.trim(),
      schedule: form.schedule.trim(),
      indication: form.indication.trim(),
      route: form.route.trim(),
      reminderEnabled: Boolean(form.reminderEnabled),
      reminderTime: form.reminderTime,
      notes: form.notes.trim(),
      createdAt: oldRow?.createdAt || new Date().toISOString(),
    }
  }

  const handleAddVisit = (event) => {
    event.preventDefault()
    setVisitError('')

    if (!selectedMember) {
      setVisitError('Seleziona un membro della famiglia.')
      return
    }

    if (!visitForm.title.trim() || !visitForm.date) {
      setVisitError('Compila i campi obbligatori: titolo visita e data.')
      return
    }

    try {
      const newVisit = buildVisitPayload(visitForm, selectedMember.id)

      updateHealth((prev) => ({
        ...prev,
        specialistVisits: [...ensureArray(prev.specialistVisits), newVisit],
      }))

      setVisitForm(emptyVisitForm)
    } catch (error) {
      setVisitError(error.message || 'Errore nel salvataggio visita.')
    }
  }

  const handleDeleteVisit = (visitId) => {
    updateHealth((prev) => {
      const linkedTherapies = ensureArray(prev.visitTherapies).filter((row) => row.visitId === visitId)
      const linkedIds = new Set(linkedTherapies.map((row) => row.id))

      return {
        ...prev,
        specialistVisits: ensureArray(prev.specialistVisits).filter((row) => row.id !== visitId),
        visitTherapies: ensureArray(prev.visitTherapies).filter((row) => row.visitId !== visitId),
        therapyMedications: ensureArray(prev.therapyMedications).filter(
          (row) => row.visitId !== visitId && !linkedIds.has(row.therapyId),
        ),
      }
    })

    if (editingVisitId === visitId) {
      setEditingVisitId('')
      setEditVisitForm(emptyVisitForm)
    }
  }

  const startEditVisit = (visit) => {
    setEditingVisitId(visit.id)
    setEditVisitForm({
      category: visit.category || 'specialistica',
      title: visit.title || '',
      specialty: visit.specialty || '',
      priority: visit.priority || 'media',
      status: visit.status || 'programmata',
      date: visit.date || '',
      time: visit.time || '',
      durationMinutes: String(visit.durationMinutes || 60),
      doctor: visit.doctor || '',
      structure: visit.structure || '',
      location: visit.location || '',
      city: visit.city || '',
      bookingCode: visit.bookingCode || '',
      preparation: visit.preparation || '',
      symptoms: visit.symptoms || '',
      outcome: visit.outcome || '',
      followUpDate: visit.followUpDate || '',
      reminderDaysBefore: String(visit.reminderDaysBefore || 0),
      reminderNotes: visit.reminderNotes || '',
      driveLinksText: linksToText(visit.driveLinks),
      reportSummary: visit.reportSummary || '',
      notes: visit.notes || '',
    })
  }

  const saveEditVisit = (visit) => {
    if (!editVisitForm.title.trim() || !editVisitForm.date) return

    try {
      const nextVisit = buildVisitPayload(editVisitForm, visit.memberId, visit)

      updateHealth((prev) => ({
        ...prev,
        specialistVisits: ensureArray(prev.specialistVisits).map((row) =>
          row.id === visit.id ? nextVisit : row,
        ),
      }))

      setEditingVisitId('')
      setEditVisitForm(emptyVisitForm)
    } catch (error) {
      setVisitError(error.message || 'Errore nel salvataggio visita.')
    }
  }

  const handleAddTherapy = (event) => {
    event.preventDefault()
    setTherapyError('')

    if (!selectedMember) {
      setTherapyError('Seleziona un membro della famiglia.')
      return
    }

    if (!therapyForm.visitId || !therapyForm.title.trim() || !therapyForm.startDate) {
      setTherapyError('Compila i campi obbligatori: visita collegata, terapia e data inizio.')
      return
    }

    try {
      const newTherapy = buildTherapyPayload(therapyForm, selectedMember.id)

      updateHealth((prev) => ({
        ...prev,
        visitTherapies: [...ensureArray(prev.visitTherapies), newTherapy],
      }))

      setTherapyForm(emptyTherapyForm)
    } catch (error) {
      setTherapyError(error.message || 'Errore nel salvataggio terapia.')
    }
  }

  const handleDeleteTherapy = (therapyId) => {
    updateHealth((prev) => ({
      ...prev,
      visitTherapies: ensureArray(prev.visitTherapies).filter((row) => row.id !== therapyId),
      therapyMedications: ensureArray(prev.therapyMedications).filter((row) => row.therapyId !== therapyId),
    }))

    if (editingTherapyId === therapyId) {
      setEditingTherapyId('')
      setEditTherapyForm(emptyTherapyForm)
    }
  }

  const startEditTherapy = (therapy) => {
    setEditingTherapyId(therapy.id)
    setEditTherapyForm({
      visitId: therapy.visitId || '',
      title: therapy.title || '',
      type: therapy.type || '',
      startDate: therapy.startDate || '',
      endDate: therapy.endDate || '',
      prescribingDoctor: therapy.prescribingDoctor || '',
      reminderEnabled: Boolean(therapy.reminderEnabled),
      reminderTime: therapy.reminderTime || '08:00',
      driveLinksText: linksToText(therapy.driveLinks),
      prescriptionNotes: therapy.prescriptionNotes || '',
      notes: therapy.notes || '',
    })
  }

  const saveEditTherapy = (therapy) => {
    if (!editTherapyForm.visitId || !editTherapyForm.title.trim() || !editTherapyForm.startDate) return

    try {
      const nextTherapy = buildTherapyPayload(editTherapyForm, therapy.memberId, therapy)

      updateHealth((prev) => ({
        ...prev,
        visitTherapies: ensureArray(prev.visitTherapies).map((row) =>
          row.id === therapy.id ? nextTherapy : row,
        ),
        therapyMedications: ensureArray(prev.therapyMedications).map((row) =>
          row.therapyId === therapy.id
            ? { ...row, visitId: nextTherapy.visitId }
            : row,
        ),
      }))

      setEditingTherapyId('')
      setEditTherapyForm(emptyTherapyForm)
    } catch (error) {
      setTherapyError(error.message || 'Errore nel salvataggio terapia.')
    }
  }

  const handleAddTherapyMedication = (event) => {
    event.preventDefault()
    setTherapyMedicationError('')

    if (!selectedMember) {
      setTherapyMedicationError('Seleziona un membro della famiglia.')
      return
    }

    if (
      !therapyMedicationForm.therapyId ||
      !therapyMedicationForm.medication.trim() ||
      !therapyMedicationForm.dosage.trim() ||
      !therapyMedicationForm.frequency.trim()
    ) {
      setTherapyMedicationError(
        'Compila i campi obbligatori: terapia, farmaco, dosaggio e frequenza.',
      )
      return
    }

    const linkedTherapy = memberTherapies.find((item) => item.id === therapyMedicationForm.therapyId)
    if (!linkedTherapy) {
      setTherapyMedicationError('Terapia non valida.')
      return
    }

    const newMedication = buildTherapyMedicationPayload(
      therapyMedicationForm,
      selectedMember.id,
      linkedTherapy,
    )

    updateHealth((prev) => ({
      ...prev,
      therapyMedications: [...ensureArray(prev.therapyMedications), newMedication],
    }))

    setTherapyMedicationForm(emptyTherapyMedicationForm)
  }

  const handleDeleteTherapyMedication = (medicationId) => {
    updateHealth((prev) => ({
      ...prev,
      therapyMedications: ensureArray(prev.therapyMedications).filter((row) => row.id !== medicationId),
    }))

    if (editingTherapyMedicationId === medicationId) {
      setEditingTherapyMedicationId('')
      setEditTherapyMedicationForm(emptyTherapyMedicationForm)
    }
  }

  const startEditTherapyMedication = (med) => {
    setEditingTherapyMedicationId(med.id)
    setEditTherapyMedicationForm({
      therapyId: med.therapyId || '',
      medication: med.medication || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      timeSlots: med.timeSlots || '',
      duration: med.duration || '',
      route: med.route || '',
      reminderEnabled: Boolean(med.reminderEnabled),
      reminderTime: med.reminderTime || '08:00',
      notes: med.notes || '',
    })
  }

  const saveEditTherapyMedication = (med) => {
    if (
      !editTherapyMedicationForm.therapyId ||
      !editTherapyMedicationForm.medication.trim() ||
      !editTherapyMedicationForm.dosage.trim() ||
      !editTherapyMedicationForm.frequency.trim()
    ) {
      return
    }

    const linkedTherapy = memberTherapies.find((item) => item.id === editTherapyMedicationForm.therapyId)
    if (!linkedTherapy) return

    const nextMedication = buildTherapyMedicationPayload(
      editTherapyMedicationForm,
      med.memberId,
      linkedTherapy,
      med,
    )

    updateHealth((prev) => ({
      ...prev,
      therapyMedications: ensureArray(prev.therapyMedications).map((row) =>
        row.id === med.id ? nextMedication : row,
      ),
    }))

    setEditingTherapyMedicationId('')
    setEditTherapyMedicationForm(emptyTherapyMedicationForm)
  }

  const handleAddPersonalMedication = (event) => {
    event.preventDefault()
    setPersonalMedicationError('')

    if (!selectedMember) {
      setPersonalMedicationError('Seleziona un membro della famiglia.')
      return
    }

    if (!personalMedicationForm.name.trim()) {
      setPersonalMedicationError('Il nome del farmaco è obbligatorio.')
      return
    }

    updateFamilyMember(selectedMember.id, {
      medications: [
        ...ensureArray(selectedMember.medications),
        buildPersonalMedicationPayload(personalMedicationForm),
      ],
    })

    setPersonalMedicationForm(emptyPersonalMedicationForm)
  }

  const startEditPersonalMedication = (med) => {
    setEditingPersonalMedicationId(med.id)
    setEditPersonalMedicationForm({
      name: med.name || '',
      dosage: med.dosage || '',
      schedule: med.schedule || '',
      indication: med.indication || '',
      route: med.route || '',
      reminderEnabled: Boolean(med.reminderEnabled),
      reminderTime: med.reminderTime || '08:00',
      notes: med.notes || '',
    })
  }

  const saveEditPersonalMedication = (med) => {
    if (!selectedMember || !editPersonalMedicationForm.name.trim()) return

    updateFamilyMember(selectedMember.id, {
      medications: ensureArray(selectedMember.medications).map((row) =>
        row.id === med.id ? buildPersonalMedicationPayload(editPersonalMedicationForm, med) : row,
      ),
    })

    setEditingPersonalMedicationId('')
    setEditPersonalMedicationForm(emptyPersonalMedicationForm)
  }

  if (loadingData) {
    return (
      <div className="card">
        <div className="page-title">Salute</div>
        <p className="page-subtitle">Sto caricando visite, terapie, farmaci e documenti sanitari.</p>
      </div>
    )
  }

  return (
    <div className="page-shell salute-page compact-drive">
      <style>{`
        .salute-page {
          display: grid;
          gap: 14px;
        }

        .compact-head .page-title {
          font-size: 24px;
        }

        .compact-drive .card {
          border-radius: 18px;
        }

        .compact-drive .page-subtitle {
          margin-top: 4px;
        }

        .salute-top-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 14px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .summary-card {
          background: var(--panel, #fff);
          border: 1px solid rgba(120, 138, 164, 0.12);
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 4px;
        }

        .summary-label {
          font-size: 11px;
          color: var(--muted, #667085);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .summary-value {
          font-size: 22px;
          font-weight: 800;
          line-height: 1;
        }

        .summary-note {
          font-size: 12px;
          color: var(--muted, #667085);
        }

        .section-stack {
          display: grid;
          gap: 12px;
        }

        .salute-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .salute-form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .salute-form-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .required-mark {
          color: #c62828;
          margin-left: 4px;
        }

        .tree-list {
          display: grid;
          gap: 8px;
        }

        .tree-visit {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(120, 138, 164, 0.12);
          border-radius: 14px;
          padding: 10px 12px;
          display: grid;
          gap: 8px;
        }

        .tree-visit-head,
        .therapy-head,
        .medication-row-top,
        .row-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tree-title {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.2;
        }

        .tree-subtitle {
          color: var(--muted, #667085);
          font-size: 12px;
          margin-top: 2px;
        }

        .tree-meta,
        .tree-links,
        .pill-row,
        .row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .compact-meta .meta-pill {
          padding: 5px 8px;
          font-size: 11px;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(31, 41, 55, 0.05);
          border: 1px solid rgba(120, 138, 164, 0.12);
          font-size: 12px;
          font-weight: 600;
        }

        .meta-label {
          color: var(--muted, #667085);
        }

        .tree-notes {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(248, 250, 252, 0.95);
          border: 1px dashed rgba(120, 138, 164, 0.18);
          color: #4b5563;
          font-size: 12px;
          line-height: 1.45;
        }

        .therapy-tree {
          display: grid;
          gap: 8px;
          padding-left: 14px;
          border-left: 2px solid rgba(120, 138, 164, 0.14);
        }

        .therapy-card {
          background: rgba(250, 251, 253, 0.98);
          border: 1px solid rgba(120, 138, 164, 0.12);
          border-radius: 12px;
          padding: 10px;
          display: grid;
          gap: 8px;
        }

        .therapy-title {
          font-size: 14px;
          font-weight: 800;
        }

        .medication-tree {
          display: grid;
          gap: 6px;
          padding-left: 12px;
          border-left: 2px dashed rgba(120, 138, 164, 0.16);
        }

        .medication-row {
          display: grid;
          gap: 6px;
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(120, 138, 164, 0.12);
          padding: 10px;
        }

        .medication-name {
          font-weight: 800;
          font-size: 13px;
        }

        .medication-detail,
        .small-muted {
          color: var(--muted, #667085);
          font-size: 12px;
        }

        .empty-box {
          border-radius: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px dashed rgba(120, 138, 164, 0.18);
          color: var(--muted, #667085);
          font-size: 12px;
        }

        .btn-inline-danger,
        .btn-inline-soft,
        .btn-inline-ghost {
          min-height: 32px;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .btn-inline-danger {
          border: 1px solid rgba(183, 28, 28, 0.18);
          background: rgba(183, 28, 28, 0.06);
          color: #a61b1b;
        }

        .btn-inline-soft {
          border: 1px solid rgba(21, 101, 192, 0.16);
          background: rgba(21, 101, 192, 0.06);
          color: #1553a2;
        }

        .btn-inline-ghost {
          border: 1px solid rgba(120, 138, 164, 0.16);
          background: rgba(255, 255, 255, 0.9);
          color: #334155;
        }

        .link-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(21, 101, 192, 0.08);
          border: 1px solid rgba(21, 101, 192, 0.16);
          color: #1553a2;
          text-decoration: none;
          font-weight: 700;
          font-size: 12px;
        }

        .edit-box {
          border: 1px solid rgba(21, 101, 192, 0.16);
          background: rgba(248, 251, 255, 0.95);
          border-radius: 12px;
          padding: 10px;
          display: grid;
          gap: 10px;
        }

        .edit-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        @media (max-width: 1100px) {
          .salute-top-grid,
          .summary-grid,
          .salute-form-grid,
          .salute-form-grid-3,
          .salute-form-grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="card">
        <SectionHeader
          badge="Salute"
          title="Visite, terapie, farmaci e documenti"
          subtitle="Vista compatta, editing inline, struttura ad albero."
        />

        {syncError ? (
          <div className="error-msg">Errore di sincronizzazione: {String(syncError)}</div>
        ) : null}

        <div className="salute-top-grid">
          <div className="section-stack">
            <div className="card">
              <div className="page-section-title">Scheda sanitaria familiare</div>

              <div className="salute-form-grid">
                <label className="fg">
                  <span className="fl">Persona</span>
                  <select
                    className="fi"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                  >
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {memberLabel(member)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fg">
                  <span className="fl">Medico di base</span>
                  <input
                    className="fi"
                    value={memberProfileForm.doctor}
                    onChange={(e) =>
                      setMemberProfileForm((prev) => ({ ...prev, doctor: e.target.value }))
                    }
                    placeholder="Es. Dott.ssa Rossi"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Codice sanitario / tessera</span>
                  <input
                    className="fi"
                    value={memberProfileForm.healthId}
                    onChange={(e) =>
                      setMemberProfileForm((prev) => ({ ...prev, healthId: e.target.value }))
                    }
                    placeholder="Riferimento sanitario"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Allergie</span>
                  <input
                    className="fi"
                    value={memberProfileForm.allergies}
                    onChange={(e) =>
                      setMemberProfileForm((prev) => ({ ...prev, allergies: e.target.value }))
                    }
                    placeholder="Es. penicillina"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Patologie / condizioni</span>
                  <input
                    className="fi"
                    value={memberProfileForm.conditions}
                    onChange={(e) =>
                      setMemberProfileForm((prev) => ({ ...prev, conditions: e.target.value }))
                    }
                    placeholder="Condizioni rilevanti"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Contatto emergenza</span>
                  <input
                    className="fi"
                    value={memberProfileForm.emergencyContact}
                    onChange={(e) =>
                      setMemberProfileForm((prev) => ({
                        ...prev,
                        emergencyContact: e.target.value,
                      }))
                    }
                    placeholder="Nome e telefono"
                  />
                </label>
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Visite</div>
                <div className="summary-value">{summary.visits}</div>
                <div className="summary-note">Programmate o concluse</div>
              </div>

              <div className="summary-card">
                <div className="summary-label">Terapie</div>
                <div className="summary-value">{summary.therapies}</div>
                <div className="summary-note">Collegate alle visite</div>
              </div>

              <div className="summary-card">
                <div className="summary-label">Farmaci terapia</div>
                <div className="summary-value">{summary.therapyMedications}</div>
                <div className="summary-note">Con posologia e reminder</div>
              </div>

              <div className="summary-card">
                <div className="summary-label">Prossima visita</div>
                <div className="summary-value" style={{ fontSize: 16 }}>
                  {summary.nextVisit ? fmtDate(summary.nextVisit.date) : '—'}
                </div>
                <div className="summary-note">
                  {summary.nextVisit ? summary.nextVisit.title : 'Nessuna visita futura'}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="page-section-title">Farmaci personali continuativi</div>

            <form onSubmit={handleAddPersonalMedication} className="section-stack">
              <div className="salute-form-grid">
                <label className="fg">
                  <span className="fl">
                    Farmaco<span className="required-mark">*</span>
                  </span>
                  <input
                    className="fi"
                    value={personalMedicationForm.name}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Es. Tachipirina"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Dosaggio</span>
                  <input
                    className="fi"
                    value={personalMedicationForm.dosage}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({ ...prev, dosage: e.target.value }))
                    }
                    placeholder="Es. 500 mg"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Posologia</span>
                  <input
                    className="fi"
                    value={personalMedicationForm.schedule}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({ ...prev, schedule: e.target.value }))
                    }
                    placeholder="Es. 1 compressa sera"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Indicazione</span>
                  <input
                    className="fi"
                    value={personalMedicationForm.indication}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({
                        ...prev,
                        indication: e.target.value,
                      }))
                    }
                    placeholder="A cosa serve"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Via</span>
                  <input
                    className="fi"
                    value={personalMedicationForm.route}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({ ...prev, route: e.target.value }))
                    }
                    placeholder="Es. orale"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Ora reminder</span>
                  <input
                    className="fi"
                    type="time"
                    value={personalMedicationForm.reminderTime}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({
                        ...prev,
                        reminderTime: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="fg">
                <span className="fl">
                  <input
                    type="checkbox"
                    checked={personalMedicationForm.reminderEnabled}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({
                        ...prev,
                        reminderEnabled: e.target.checked,
                      }))
                    }
                    style={{ marginRight: 8 }}
                  />
                  Attiva reminder farmaco
                </span>
              </label>

              <label className="fg">
                <span className="fl">Note</span>
                <textarea
                  className="fi"
                  rows={2}
                  value={personalMedicationForm.notes}
                  onChange={(e) =>
                    setPersonalMedicationForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Indicazioni aggiuntive"
                />
              </label>

              <FieldError text={personalMedicationError} />

              <div>
                <button type="submit" className="btn btn-p">
                  Salva farmaco personale
                </button>
              </div>
            </form>

            <div className="tree-list" style={{ marginTop: 12 }}>
              {personalMedications.length ? (
                personalMedications.map((med) => (
                  <div key={med.id} className="medication-row">
                    {editingPersonalMedicationId === med.id ? (
                      <div className="edit-box">
                        <div className="salute-form-grid">
                          <label className="fg">
                            <span className="fl">Farmaco</span>
                            <input
                              className="fi"
                              value={editPersonalMedicationForm.name}
                              onChange={(e) =>
                                setEditPersonalMedicationForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Dosaggio</span>
                            <input
                              className="fi"
                              value={editPersonalMedicationForm.dosage}
                              onChange={(e) =>
                                setEditPersonalMedicationForm((prev) => ({
                                  ...prev,
                                  dosage: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Posologia</span>
                            <input
                              className="fi"
                              value={editPersonalMedicationForm.schedule}
                              onChange={(e) =>
                                setEditPersonalMedicationForm((prev) => ({
                                  ...prev,
                                  schedule: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Indicazione</span>
                            <input
                              className="fi"
                              value={editPersonalMedicationForm.indication}
                              onChange={(e) =>
                                setEditPersonalMedicationForm((prev) => ({
                                  ...prev,
                                  indication: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Via</span>
                            <input
                              className="fi"
                              value={editPersonalMedicationForm.route}
                              onChange={(e) =>
                                setEditPersonalMedicationForm((prev) => ({
                                  ...prev,
                                  route: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Reminder</span>
                            <input
                              className="fi"
                              type="time"
                              value={editPersonalMedicationForm.reminderTime}
                              onChange={(e) =>
                                setEditPersonalMedicationForm((prev) => ({
                                  ...prev,
                                  reminderTime: e.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>

                        <label className="fg">
                          <span className="fl">
                            <input
                              type="checkbox"
                              checked={editPersonalMedicationForm.reminderEnabled}
                              onChange={(e) =>
                                setEditPersonalMedicationForm((prev) => ({
                                  ...prev,
                                  reminderEnabled: e.target.checked,
                                }))
                              }
                              style={{ marginRight: 8 }}
                            />
                            Reminder attivo
                          </span>
                        </label>

                        <label className="fg">
                          <span className="fl">Note</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editPersonalMedicationForm.notes}
                            onChange={(e) =>
                              setEditPersonalMedicationForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <div className="edit-actions">
                          <button
                            type="button"
                            className="btn btn-inline-soft"
                            onClick={() => saveEditPersonalMedication(med)}
                          >
                            Salva
                          </button>
                          <button
                            type="button"
                            className="btn btn-inline-ghost"
                            onClick={() => {
                              setEditingPersonalMedicationId('')
                              setEditPersonalMedicationForm(emptyPersonalMedicationForm)
                            }}
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="medication-row-top">
                          <div>
                            <div className="medication-name">{med.name || 'Farmaco'}</div>
                            <div className="medication-detail">
                              {med.dosage || 'Dosaggio non indicato'} · {med.schedule || 'Posologia non indicata'}
                            </div>
                          </div>

                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-inline-soft"
                              onClick={() => startEditPersonalMedication(med)}
                            >
                              Modifica
                            </button>
                            <button
                              type="button"
                              className="btn btn-inline-danger"
                              onClick={() => deleteMedicationFromMember(selectedMember.id, med.id)}
                            >
                              Elimina
                            </button>
                          </div>
                        </div>

                        <MetaPills
                          items={[
                            { label: 'Indicazione', value: med.indication || '—' },
                            { label: 'Via', value: med.route || '—' },
                            {
                              label: 'Reminder',
                              value: med.reminderEnabled ? med.reminderTime || 'Attivo' : 'Disattivo',
                            },
                          ]}
                        />

                        {med.notes ? <div className="tree-notes">{med.notes}</div> : null}
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-box">Nessun farmaco personale inserito.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <SectionHeader
          badge="Nuova visita"
          title="1. Registra visita"
          subtitle="Compila e salva. Modifiche successive direttamente dall’albero."
        />

        <form onSubmit={handleAddVisit} className="section-stack">
          <div className="salute-form-grid-4">
            <label className="fg">
              <span className="fl">Categoria</span>
              <select
                className="fi"
                value={visitForm.category}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="specialistica">Visita specialistica</option>
                <option value="controllo">Controllo</option>
                <option value="esame">Esame</option>
                <option value="varia">Visita varia</option>
              </select>
            </label>

            <label className="fg">
              <span className="fl">
                Titolo visita<span className="required-mark">*</span>
              </span>
              <input
                className="fi"
                value={visitForm.title}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Es. Visita cardiologica"
              />
            </label>

            <label className="fg">
              <span className="fl">Specialità</span>
              <input
                className="fi"
                value={visitForm.specialty}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, specialty: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Priorità</span>
              <select
                className="fi"
                value={visitForm.priority}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, priority: e.target.value }))}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="bassa">Bassa</option>
              </select>
            </label>

            <label className="fg">
              <span className="fl">Stato visita</span>
              <select
                className="fi"
                value={visitForm.status}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="programmata">Programmata</option>
                <option value="effettuata">Effettuata</option>
                <option value="rinviata">Rinviata</option>
                <option value="annullata">Annullata</option>
              </select>
            </label>

            <label className="fg">
              <span className="fl">
                Data<span className="required-mark">*</span>
              </span>
              <input
                className="fi"
                type="date"
                value={visitForm.date}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Ora</span>
              <input
                className="fi"
                type="time"
                value={visitForm.time}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, time: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Durata minuti</span>
              <input
                className="fi"
                type="number"
                min="15"
                step="15"
                value={visitForm.durationMinutes}
                onChange={(e) =>
                  setVisitForm((prev) => ({ ...prev, durationMinutes: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Medico</span>
              <input
                className="fi"
                value={visitForm.doctor}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, doctor: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Struttura</span>
              <input
                className="fi"
                value={visitForm.structure}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, structure: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Luogo</span>
              <input
                className="fi"
                value={visitForm.location}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Città</span>
              <input
                className="fi"
                value={visitForm.city}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, city: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Codice prenotazione</span>
              <input
                className="fi"
                value={visitForm.bookingCode}
                onChange={(e) =>
                  setVisitForm((prev) => ({ ...prev, bookingCode: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Reminder giorni prima</span>
              <input
                className="fi"
                type="number"
                min="0"
                value={visitForm.reminderDaysBefore}
                onChange={(e) =>
                  setVisitForm((prev) => ({ ...prev, reminderDaysBefore: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Data follow-up</span>
              <input
                className="fi"
                type="date"
                value={visitForm.followUpDate}
                onChange={(e) =>
                  setVisitForm((prev) => ({ ...prev, followUpDate: e.target.value }))
                }
              />
            </label>
          </div>

          <div className="salute-form-grid">
            <label className="fg">
              <span className="fl">Preparazione visita</span>
              <textarea
                className="fi"
                rows={2}
                value={visitForm.preparation}
                onChange={(e) =>
                  setVisitForm((prev) => ({ ...prev, preparation: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Sintomi / motivo</span>
              <textarea
                className="fi"
                rows={2}
                value={visitForm.symptoms}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, symptoms: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Esito / conclusione</span>
              <textarea
                className="fi"
                rows={2}
                value={visitForm.outcome}
                onChange={(e) => setVisitForm((prev) => ({ ...prev, outcome: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Referti / documenti</span>
              <textarea
                className="fi"
                rows={2}
                value={visitForm.reportSummary}
                onChange={(e) =>
                  setVisitForm((prev) => ({ ...prev, reportSummary: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Reminder visita</span>
              <textarea
                className="fi"
                rows={2}
                value={visitForm.reminderNotes}
                onChange={(e) =>
                  setVisitForm((prev) => ({ ...prev, reminderNotes: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Link Drive referti / radiografie / documenti</span>
              <textarea
                className="fi"
                rows={3}
                value={visitForm.driveLinksText}
                onChange={(e) =>
                  setVisitForm((prev) => ({ ...prev, driveLinksText: e.target.value }))
                }
                placeholder={'Un link per riga\nhttps://drive.google.com/...'}
              />
            </label>
          </div>

          <label className="fg">
            <span className="fl">Note</span>
            <textarea
              className="fi"
              rows={2}
              value={visitForm.notes}
              onChange={(e) => setVisitForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </label>

          <FieldError text={visitError} />

          <div>
            <button type="submit" className="btn btn-p">
              Registra visita
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <SectionHeader
          badge="Nuova terapia"
          title="2. Collega terapia"
          subtitle="Collegata a una visita esistente."
        />

        <form onSubmit={handleAddTherapy} className="section-stack">
          <div className="salute-form-grid-3">
            <label className="fg">
              <span className="fl">Visita collegata*</span>
              <select
                className="fi"
                value={therapyForm.visitId}
                onChange={(e) => setTherapyForm((prev) => ({ ...prev, visitId: e.target.value }))}
              >
                <option value="">Seleziona visita</option>
                {memberVisits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {visit.title} · {fmtDate(visit.date)}
                  </option>
                ))}
              </select>
            </label>

            <label className="fg">
              <span className="fl">Nome terapia*</span>
              <input
                className="fi"
                value={therapyForm.title}
                onChange={(e) => setTherapyForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Tipo</span>
              <input
                className="fi"
                value={therapyForm.type}
                onChange={(e) => setTherapyForm((prev) => ({ ...prev, type: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Data inizio*</span>
              <input
                className="fi"
                type="date"
                value={therapyForm.startDate}
                onChange={(e) => setTherapyForm((prev) => ({ ...prev, startDate: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Data fine</span>
              <input
                className="fi"
                type="date"
                value={therapyForm.endDate}
                onChange={(e) => setTherapyForm((prev) => ({ ...prev, endDate: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Medico prescrittore</span>
              <input
                className="fi"
                value={therapyForm.prescribingDoctor}
                onChange={(e) =>
                  setTherapyForm((prev) => ({ ...prev, prescribingDoctor: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Ora reminder</span>
              <input
                className="fi"
                type="time"
                value={therapyForm.reminderTime}
                onChange={(e) =>
                  setTherapyForm((prev) => ({ ...prev, reminderTime: e.target.value }))
                }
              />
            </label>
          </div>

          <label className="fg">
            <span className="fl">
              <input
                type="checkbox"
                checked={therapyForm.reminderEnabled}
                onChange={(e) =>
                  setTherapyForm((prev) => ({ ...prev, reminderEnabled: e.target.checked }))
                }
                style={{ marginRight: 8 }}
              />
              Attiva reminder terapia
            </span>
          </label>

          <div className="salute-form-grid">
            <label className="fg">
              <span className="fl">Link Drive prescrizioni / documenti</span>
              <textarea
                className="fi"
                rows={3}
                value={therapyForm.driveLinksText}
                onChange={(e) =>
                  setTherapyForm((prev) => ({ ...prev, driveLinksText: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Note prescrizione</span>
              <textarea
                className="fi"
                rows={3}
                value={therapyForm.prescriptionNotes}
                onChange={(e) =>
                  setTherapyForm((prev) => ({ ...prev, prescriptionNotes: e.target.value }))
                }
              />
            </label>
          </div>

          <label className="fg">
            <span className="fl">Note terapia</span>
            <textarea
              className="fi"
              rows={2}
              value={therapyForm.notes}
              onChange={(e) => setTherapyForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </label>

          <FieldError text={therapyError} />

          <div>
            <button type="submit" className="btn btn-p">
              Salva terapia
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <SectionHeader
          badge="Nuovo farmaco terapia"
          title="3. Collega farmaco"
          subtitle="Ogni farmaco viene legato alla terapia giusta."
        />

        <form onSubmit={handleAddTherapyMedication} className="section-stack">
          <div className="salute-form-grid-4">
            <label className="fg">
              <span className="fl">Terapia*</span>
              <select
                className="fi"
                value={therapyMedicationForm.therapyId}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({ ...prev, therapyId: e.target.value }))
                }
              >
                <option value="">Seleziona terapia</option>
                {memberTherapies.map((therapy) => (
                  <option key={therapy.id} value={therapy.id}>
                    {therapy.title} · {fmtDate(therapy.startDate)}
                  </option>
                ))}
              </select>
            </label>

            <label className="fg">
              <span className="fl">Farmaco*</span>
              <input
                className="fi"
                value={therapyMedicationForm.medication}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({ ...prev, medication: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Dosaggio*</span>
              <input
                className="fi"
                value={therapyMedicationForm.dosage}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({ ...prev, dosage: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Frequenza*</span>
              <input
                className="fi"
                value={therapyMedicationForm.frequency}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({ ...prev, frequency: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Orari</span>
              <input
                className="fi"
                value={therapyMedicationForm.timeSlots}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({ ...prev, timeSlots: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Durata</span>
              <input
                className="fi"
                value={therapyMedicationForm.duration}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({ ...prev, duration: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Via</span>
              <input
                className="fi"
                value={therapyMedicationForm.route}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({ ...prev, route: e.target.value }))
                }
              />
            </label>

            <label className="fg">
              <span className="fl">Ora reminder</span>
              <input
                className="fi"
                type="time"
                value={therapyMedicationForm.reminderTime}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({ ...prev, reminderTime: e.target.value }))
                }
              />
            </label>
          </div>

          <label className="fg">
            <span className="fl">
              <input
                type="checkbox"
                checked={therapyMedicationForm.reminderEnabled}
                onChange={(e) =>
                  setTherapyMedicationForm((prev) => ({
                    ...prev,
                    reminderEnabled: e.target.checked,
                  }))
                }
                style={{ marginRight: 8 }}
              />
              Attiva reminder farmaco terapia
            </span>
          </label>

          <label className="fg">
            <span className="fl">Note farmaco</span>
            <textarea
              className="fi"
              rows={2}
              value={therapyMedicationForm.notes}
              onChange={(e) =>
                setTherapyMedicationForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </label>

          <FieldError text={therapyMedicationError} />

          <div>
            <button type="submit" className="btn btn-p">
              Salva farmaco in terapia
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <SectionHeader
          badge="Struttura ad albero"
          title="Storico compatto"
          subtitle="Visita → terapia → farmaci, con modifica ed eliminazione inline."
        />

        {treeVisits.length ? (
          <div className="tree-list">
            {treeVisits.map((visit) => {
              const days = daysUntil(visit.date)

              return (
                <div key={visit.id} className="tree-visit">
                  {editingVisitId === visit.id ? (
                    <div className="edit-box">
                      <div className="salute-form-grid-4">
                        <label className="fg">
                          <span className="fl">Categoria</span>
                          <select
                            className="fi"
                            value={editVisitForm.category}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, category: e.target.value }))
                            }
                          >
                            <option value="specialistica">Visita specialistica</option>
                            <option value="controllo">Controllo</option>
                            <option value="esame">Esame</option>
                            <option value="varia">Visita varia</option>
                          </select>
                        </label>

                        <label className="fg">
                          <span className="fl">Titolo</span>
                          <input
                            className="fi"
                            value={editVisitForm.title}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, title: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Specialità</span>
                          <input
                            className="fi"
                            value={editVisitForm.specialty}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, specialty: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Priorità</span>
                          <select
                            className="fi"
                            value={editVisitForm.priority}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, priority: e.target.value }))
                            }
                          >
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="bassa">Bassa</option>
                          </select>
                        </label>

                        <label className="fg">
                          <span className="fl">Stato</span>
                          <select
                            className="fi"
                            value={editVisitForm.status}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, status: e.target.value }))
                            }
                          >
                            <option value="programmata">Programmata</option>
                            <option value="effettuata">Effettuata</option>
                            <option value="rinviata">Rinviata</option>
                            <option value="annullata">Annullata</option>
                          </select>
                        </label>

                        <label className="fg">
                          <span className="fl">Data</span>
                          <input
                            className="fi"
                            type="date"
                            value={editVisitForm.date}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, date: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Ora</span>
                          <input
                            className="fi"
                            type="time"
                            value={editVisitForm.time}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, time: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Durata</span>
                          <input
                            className="fi"
                            type="number"
                            value={editVisitForm.durationMinutes}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                durationMinutes: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Medico</span>
                          <input
                            className="fi"
                            value={editVisitForm.doctor}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, doctor: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Struttura</span>
                          <input
                            className="fi"
                            value={editVisitForm.structure}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, structure: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Luogo</span>
                          <input
                            className="fi"
                            value={editVisitForm.location}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, location: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Città</span>
                          <input
                            className="fi"
                            value={editVisitForm.city}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({ ...prev, city: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Prenotazione</span>
                          <input
                            className="fi"
                            value={editVisitForm.bookingCode}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                bookingCode: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Reminder giorni prima</span>
                          <input
                            className="fi"
                            type="number"
                            value={editVisitForm.reminderDaysBefore}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                reminderDaysBefore: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Follow-up</span>
                          <input
                            className="fi"
                            type="date"
                            value={editVisitForm.followUpDate}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                followUpDate: e.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="salute-form-grid">
                        <label className="fg">
                          <span className="fl">Preparazione</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editVisitForm.preparation}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                preparation: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Sintomi</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editVisitForm.symptoms}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                symptoms: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Esito</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editVisitForm.outcome}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                outcome: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Referti / documenti</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editVisitForm.reportSummary}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                reportSummary: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Reminder visita</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editVisitForm.reminderNotes}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                reminderNotes: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Link Drive</span>
                          <textarea
                            className="fi"
                            rows={3}
                            value={editVisitForm.driveLinksText}
                            onChange={(e) =>
                              setEditVisitForm((prev) => ({
                                ...prev,
                                driveLinksText: e.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <label className="fg">
                        <span className="fl">Note</span>
                        <textarea
                          className="fi"
                          rows={2}
                          value={editVisitForm.notes}
                          onChange={(e) =>
                            setEditVisitForm((prev) => ({ ...prev, notes: e.target.value }))
                          }
                        />
                      </label>

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn btn-inline-soft"
                          onClick={() => saveEditVisit(visit)}
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          className="btn btn-inline-ghost"
                          onClick={() => {
                            setEditingVisitId('')
                            setEditVisitForm(emptyVisitForm)
                          }}
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="tree-visit-head">
                        <div>
                          <div className="pill-row" style={{ marginBottom: 4 }}>
                            <span className={`badge ${badgeToneByDays(days)}`}>{badgeLabelByDays(days)}</span>
                            <span className="badge badge-dash">{categoryLabel(visit.category)}</span>
                            <span className="badge badge-dash">{priorityLabel(visit.priority)}</span>
                            <span className="badge badge-dash">{visit.status || 'programmata'}</span>
                          </div>

                          <div className="tree-title">{visit.title}</div>
                          <div className="tree-subtitle">
                            {fmtDateTime(visit.date, visit.time)} · {visit.specialty || 'Specialità non indicata'}
                          </div>
                        </div>

                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-inline-soft"
                            onClick={() => startEditVisit(visit)}
                          >
                            Modifica
                          </button>
                          <button
                            type="button"
                            className="btn btn-inline-danger"
                            onClick={() => handleDeleteVisit(visit.id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>

                      <MetaPills
                        items={[
                          { label: 'Medico', value: visit.doctor || '—' },
                          { label: 'Struttura', value: visit.structure || '—' },
                          { label: 'Luogo', value: [visit.location, visit.city].filter(Boolean).join(', ') || '—' },
                          { label: 'Prenotazione', value: visit.bookingCode || '—' },
                          { label: 'Follow-up', value: visit.followUpDate ? fmtDate(visit.followUpDate) : '—' },
                          {
                            label: 'Reminder',
                            value:
                              visit.reminderDaysBefore || visit.reminderNotes
                                ? `${visit.reminderDaysBefore || 0} gg prima`
                                : '—',
                          },
                        ]}
                      />

                      {(visit.preparation || visit.symptoms || visit.outcome || visit.reportSummary || visit.notes) ? (
                        <div className="section-stack">
                          {visit.preparation ? <div className="tree-notes"><strong>Preparazione:</strong> {visit.preparation}</div> : null}
                          {visit.symptoms ? <div className="tree-notes"><strong>Sintomi:</strong> {visit.symptoms}</div> : null}
                          {visit.outcome ? <div className="tree-notes"><strong>Esito:</strong> {visit.outcome}</div> : null}
                          {visit.reportSummary ? <div className="tree-notes"><strong>Referti:</strong> {visit.reportSummary}</div> : null}
                          {visit.notes ? <div className="tree-notes"><strong>Note:</strong> {visit.notes}</div> : null}
                        </div>
                      ) : null}

                      {(ensureArray(visit.driveLinks).length || visit.googleCalendarUrl) ? (
                        <div className="tree-links">
                          {visit.googleCalendarUrl ? (
                            <a
                              className="link-chip"
                              href={visit.googleCalendarUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Calendar
                            </a>
                          ) : null}

                          {ensureArray(visit.driveLinks).map((link) => (
                            <a
                              key={link.id}
                              className="link-chip"
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link.label || 'Documento'}
                            </a>
                          ))}
                        </div>
                      ) : null}

                      {visit.therapies.length ? (
                        <div className="therapy-tree">
                          {visit.therapies.map((therapy) => (
                            <div key={therapy.id} className="therapy-card">
                              {editingTherapyId === therapy.id ? (
                                <div className="edit-box">
                                  <div className="salute-form-grid-3">
                                    <label className="fg">
                                      <span className="fl">Visita</span>
                                      <select
                                        className="fi"
                                        value={editTherapyForm.visitId}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            visitId: e.target.value,
                                          }))
                                        }
                                      >
                                        <option value="">Seleziona visita</option>
                                        {memberVisits.map((v) => (
                                          <option key={v.id} value={v.id}>
                                            {v.title} · {fmtDate(v.date)}
                                          </option>
                                        ))}
                                      </select>
                                    </label>

                                    <label className="fg">
                                      <span className="fl">Terapia</span>
                                      <input
                                        className="fi"
                                        value={editTherapyForm.title}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>

                                    <label className="fg">
                                      <span className="fl">Tipo</span>
                                      <input
                                        className="fi"
                                        value={editTherapyForm.type}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            type: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>

                                    <label className="fg">
                                      <span className="fl">Inizio</span>
                                      <input
                                        className="fi"
                                        type="date"
                                        value={editTherapyForm.startDate}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            startDate: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>

                                    <label className="fg">
                                      <span className="fl">Fine</span>
                                      <input
                                        className="fi"
                                        type="date"
                                        value={editTherapyForm.endDate}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            endDate: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>

                                    <label className="fg">
                                      <span className="fl">Medico</span>
                                      <input
                                        className="fi"
                                        value={editTherapyForm.prescribingDoctor}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            prescribingDoctor: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>

                                    <label className="fg">
                                      <span className="fl">Reminder</span>
                                      <input
                                        className="fi"
                                        type="time"
                                        value={editTherapyForm.reminderTime}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            reminderTime: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>
                                  </div>

                                  <label className="fg">
                                    <span className="fl">
                                      <input
                                        type="checkbox"
                                        checked={editTherapyForm.reminderEnabled}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            reminderEnabled: e.target.checked,
                                          }))
                                        }
                                        style={{ marginRight: 8 }}
                                      />
                                      Reminder attivo
                                    </span>
                                  </label>

                                  <div className="salute-form-grid">
                                    <label className="fg">
                                      <span className="fl">Link Drive</span>
                                      <textarea
                                        className="fi"
                                        rows={2}
                                        value={editTherapyForm.driveLinksText}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            driveLinksText: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>

                                    <label className="fg">
                                      <span className="fl">Prescrizione</span>
                                      <textarea
                                        className="fi"
                                        rows={2}
                                        value={editTherapyForm.prescriptionNotes}
                                        onChange={(e) =>
                                          setEditTherapyForm((prev) => ({
                                            ...prev,
                                            prescriptionNotes: e.target.value,
                                          }))
                                        }
                                      />
                                    </label>
                                  </div>

                                  <label className="fg">
                                    <span className="fl">Note</span>
                                    <textarea
                                      className="fi"
                                      rows={2}
                                      value={editTherapyForm.notes}
                                      onChange={(e) =>
                                        setEditTherapyForm((prev) => ({
                                          ...prev,
                                          notes: e.target.value,
                                        }))
                                      }
                                    />
                                  </label>

                                  <div className="edit-actions">
                                    <button
                                      type="button"
                                      className="btn btn-inline-soft"
                                      onClick={() => saveEditTherapy(therapy)}
                                    >
                                      Salva
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-inline-ghost"
                                      onClick={() => {
                                        setEditingTherapyId('')
                                        setEditTherapyForm(emptyTherapyForm)
                                      }}
                                    >
                                      Annulla
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="therapy-head">
                                    <div>
                                      <div className="therapy-title">{therapy.title}</div>
                                      <div className="tree-subtitle">
                                        {therapy.type || 'Terapia'} · {fmtDate(therapy.startDate)}
                                        {therapy.endDate ? ` → ${fmtDate(therapy.endDate)}` : ''}
                                      </div>
                                    </div>

                                    <div className="row-actions">
                                      <button
                                        type="button"
                                        className="btn btn-inline-soft"
                                        onClick={() => startEditTherapy(therapy)}
                                      >
                                        Modifica
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-inline-danger"
                                        onClick={() => handleDeleteTherapy(therapy.id)}
                                      >
                                        Elimina
                                      </button>
                                    </div>
                                  </div>

                                  <MetaPills
                                    items={[
                                      { label: 'Medico', value: therapy.prescribingDoctor || '—' },
                                      {
                                        label: 'Reminder',
                                        value: therapy.reminderEnabled ? therapy.reminderTime || 'Attivo' : 'Disattivo',
                                      },
                                    ]}
                                  />

                                  {therapy.prescriptionNotes ? (
                                    <div className="tree-notes">
                                      <strong>Prescrizione:</strong> {therapy.prescriptionNotes}
                                    </div>
                                  ) : null}

                                  {therapy.notes ? (
                                    <div className="tree-notes">
                                      <strong>Note:</strong> {therapy.notes}
                                    </div>
                                  ) : null}

                                  {ensureArray(therapy.driveLinks).length ? (
                                    <div className="tree-links">
                                      {therapy.driveLinks.map((link) => (
                                        <a
                                          key={link.id}
                                          className="link-chip"
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          {link.label || 'Documento terapia'}
                                        </a>
                                      ))}
                                    </div>
                                  ) : null}

                                  {therapy.medications.length ? (
                                    <div className="medication-tree">
                                      {therapy.medications.map((med) => (
                                        <div key={med.id} className="medication-row">
                                          {editingTherapyMedicationId === med.id ? (
                                            <div className="edit-box">
                                              <div className="salute-form-grid-4">
                                                <label className="fg">
                                                  <span className="fl">Terapia</span>
                                                  <select
                                                    className="fi"
                                                    value={editTherapyMedicationForm.therapyId}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        therapyId: e.target.value,
                                                      }))
                                                    }
                                                  >
                                                    <option value="">Seleziona terapia</option>
                                                    {memberTherapies.map((th) => (
                                                      <option key={th.id} value={th.id}>
                                                        {th.title} · {fmtDate(th.startDate)}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </label>

                                                <label className="fg">
                                                  <span className="fl">Farmaco</span>
                                                  <input
                                                    className="fi"
                                                    value={editTherapyMedicationForm.medication}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        medication: e.target.value,
                                                      }))
                                                    }
                                                  />
                                                </label>

                                                <label className="fg">
                                                  <span className="fl">Dosaggio</span>
                                                  <input
                                                    className="fi"
                                                    value={editTherapyMedicationForm.dosage}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        dosage: e.target.value,
                                                      }))
                                                    }
                                                  />
                                                </label>

                                                <label className="fg">
                                                  <span className="fl">Frequenza</span>
                                                  <input
                                                    className="fi"
                                                    value={editTherapyMedicationForm.frequency}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        frequency: e.target.value,
                                                      }))
                                                    }
                                                  />
                                                </label>

                                                <label className="fg">
                                                  <span className="fl">Orari</span>
                                                  <input
                                                    className="fi"
                                                    value={editTherapyMedicationForm.timeSlots}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        timeSlots: e.target.value,
                                                      }))
                                                    }
                                                  />
                                                </label>

                                                <label className="fg">
                                                  <span className="fl">Durata</span>
                                                  <input
                                                    className="fi"
                                                    value={editTherapyMedicationForm.duration}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        duration: e.target.value,
                                                      }))
                                                    }
                                                  />
                                                </label>

                                                <label className="fg">
                                                  <span className="fl">Via</span>
                                                  <input
                                                    className="fi"
                                                    value={editTherapyMedicationForm.route}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        route: e.target.value,
                                                      }))
                                                    }
                                                  />
                                                </label>

                                                <label className="fg">
                                                  <span className="fl">Reminder</span>
                                                  <input
                                                    className="fi"
                                                    type="time"
                                                    value={editTherapyMedicationForm.reminderTime}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        reminderTime: e.target.value,
                                                      }))
                                                    }
                                                  />
                                                </label>
                                              </div>

                                              <label className="fg">
                                                <span className="fl">
                                                  <input
                                                    type="checkbox"
                                                    checked={editTherapyMedicationForm.reminderEnabled}
                                                    onChange={(e) =>
                                                      setEditTherapyMedicationForm((prev) => ({
                                                        ...prev,
                                                        reminderEnabled: e.target.checked,
                                                      }))
                                                    }
                                                    style={{ marginRight: 8 }}
                                                  />
                                                  Reminder attivo
                                                </span>
                                              </label>

                                              <label className="fg">
                                                <span className="fl">Note</span>
                                                <textarea
                                                  className="fi"
                                                  rows={2}
                                                  value={editTherapyMedicationForm.notes}
                                                  onChange={(e) =>
                                                    setEditTherapyMedicationForm((prev) => ({
                                                      ...prev,
                                                      notes: e.target.value,
                                                    }))
                                                  }
                                                />
                                              </label>

                                              <div className="edit-actions">
                                                <button
                                                  type="button"
                                                  className="btn btn-inline-soft"
                                                  onClick={() => saveEditTherapyMedication(med)}
                                                >
                                                  Salva
                                                </button>
                                                <button
                                                  type="button"
                                                  className="btn btn-inline-ghost"
                                                  onClick={() => {
                                                    setEditingTherapyMedicationId('')
                                                    setEditTherapyMedicationForm(emptyTherapyMedicationForm)
                                                  }}
                                                >
                                                  Annulla
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="medication-row-top">
                                                <div>
                                                  <div className="medication-name">{med.medication}</div>
                                                  <div className="medication-detail">
                                                    {med.dosage || 'Dosaggio non indicato'} · {med.frequency || 'Frequenza non indicata'}
                                                  </div>
                                                </div>

                                                <div className="row-actions">
                                                  <button
                                                    type="button"
                                                    className="btn btn-inline-soft"
                                                    onClick={() => startEditTherapyMedication(med)}
                                                  >
                                                    Modifica
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="btn btn-inline-danger"
                                                    onClick={() => handleDeleteTherapyMedication(med.id)}
                                                  >
                                                    Elimina
                                                  </button>
                                                </div>
                                              </div>

                                              <MetaPills
                                                items={[
                                                  { label: 'Orari', value: med.timeSlots || '—' },
                                                  { label: 'Durata', value: med.duration || '—' },
                                                  { label: 'Via', value: med.route || '—' },
                                                  {
                                                    label: 'Reminder',
                                                    value: med.reminderEnabled ? med.reminderTime || 'Attivo' : 'Disattivo',
                                                  },
                                                ]}
                                              />

                                              {med.notes ? <div className="tree-notes">{med.notes}</div> : null}
                                            </>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="empty-box">Nessun farmaco collegato.</div>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="empty-box">Nessuna terapia collegata a questa visita.</div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-box">
            Nessuna visita registrata per questo familiare. Compila la parte alta e premi “Registra visita”.
          </div>
        )}
      </div>
    </div>
  )
}
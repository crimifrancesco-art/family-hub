import { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'

const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

function fmt(iso) {
  if (!iso) return '—'
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function memberLabel(member) {
  return member?.name || member?.role || member?.initials || member?.id || 'Membro'
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>
}

function ensureDriveLinks(list) {
  return Array.isArray(list) ? list : []
}

function isFilled(value) {
  return String(value ?? '').trim().length > 0
}

function fieldClass(value, invalid = false) {
  return `fi ${isFilled(value) ? 'field-active' : ''} ${invalid ? 'field-invalid' : ''}`.trim()
}

function Label({ children, required = false }) {
  return (
    <span className="fl">
      {children}
      {required ? <span className="required">*</span> : null}
    </span>
  )
}

function ErrorLine({ text }) {
  if (!text) return null
  return <div className="field-error">{text}</div>
}

function LinkListEditor({ links, onChange, label = 'Link documenti' }) {
  const safeLinks = ensureDriveLinks(links)

  const handleItemChange = (id, field, value) => {
    onChange(safeLinks.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleAdd = () => {
    onChange([...safeLinks, { id: uid('lnk'), label: '', url: '' }])
  }

  const handleDelete = (id) => {
    onChange(safeLinks.filter((item) => item.id !== id))
  }

  return (
    <div className="subsection-box">
      <div className="between">
        <div>
          <div className="card-subtitle">{label}</div>
          <div className="muted">Aggiungi referti TAC, analisi, prescrizioni o altri documenti.</div>
        </div>
        <button type="button" className="btn btn-s" onClick={handleAdd}>Aggiungi link</button>
      </div>

      <div style={{ height: 12 }} />

      {safeLinks.length === 0 ? (
        <div className="muted">Nessun link inserito.</div>
      ) : (
        <div className="timeline-list">
          {safeLinks.map((item) => (
            <div key={item.id} className="timeline-item compact">
              <div className="grid-cards responsive-2">
                <label>
                  <Label>Etichetta</Label>
                  <input className={fieldClass(item.label)} value={item.label} onChange={(e) => handleItemChange(item.id, 'label', e.target.value)} placeholder="Es. TAC torace, Ricetta, Esame sangue" />
                </label>
                <label>
                  <Label>URL Google Drive / Link</Label>
                  <input className={fieldClass(item.url)} value={item.url} onChange={(e) => handleItemChange(item.id, 'url', e.target.value)} placeholder="https://drive.google.com/..." />
                </label>
              </div>
              <div className="actions-row" style={{ marginTop: 10 }}>
                {item.url ? <a className="btn btn-s" href={item.url} target="_blank" rel="noopener noreferrer">Apri</a> : null}
                <button type="button" className="btn btn-d btn-s" onClick={() => handleDelete(item.id)}>Elimina</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const EMPTY_THERAPY_FORM = {
  memberId: '',
  specialist: '',
  medication: '',
  dosage: '',
  frequency: '',
  timeSlots: '',
  startDate: '',
  endDate: '',
  prescribingDoctor: '',
  googleCalendarUrl: '',
  driveLinks: [],
  notes: '',
}

const EMPTY_APPOINTMENT_FORM = {
  memberId: '',
  type: '',
  date: '',
  doctor: '',
  location: '',
  googleCalendarUrl: '',
  driveLinks: [],
  notes: '',
}

export default function SalutePage() {
  const {
    familyMembers,
    healthTables,
    loadingData,
    syncError,
    updateFamilyMember,
    addMedicationToMember,
    deleteMedicationFromMember,
    updateHealth,
  } = useAppContext()

  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [therapyForm, setTherapyForm] = useState(EMPTY_THERAPY_FORM)
  const [appointmentForm, setAppointmentForm] = useState(EMPTY_APPOINTMENT_FORM)
  const [therapyErrors, setTherapyErrors] = useState({})
  const [appointmentErrors, setAppointmentErrors] = useState({})

  useEffect(() => {
    if (!selectedMemberId && familyMembers[0]?.id) {
      setSelectedMemberId(familyMembers[0].id)
      return
    }
    if (selectedMemberId && !familyMembers.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(familyMembers[0]?.id || '')
    }
  }, [selectedMemberId, familyMembers])

  useEffect(() => {
    if (familyMembers[0]?.id && !therapyForm.memberId) {
      setTherapyForm((prev) => ({ ...prev, memberId: familyMembers[0].id }))
    }
    if (familyMembers[0]?.id && !appointmentForm.memberId) {
      setAppointmentForm((prev) => ({ ...prev, memberId: familyMembers[0].id }))
    }
  }, [familyMembers, therapyForm.memberId, appointmentForm.memberId])

  const selectedMember = useMemo(
    () => familyMembers.find((member) => member.id === selectedMemberId) || familyMembers[0] || null,
    [familyMembers, selectedMemberId]
  )

  const therapies = healthTables?.therapies || []
  const appointments = healthTables?.appointments || []

  const memberTherapies = useMemo(() => {
    if (!selectedMember) return []
    return therapies.filter((item) => item.memberId === selectedMember.id)
  }, [therapies, selectedMember])

  const memberAppointments = useMemo(() => {
    if (!selectedMember) return []
    return [...appointments]
      .filter((item) => item.memberId === selectedMember.id)
      .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
  }, [appointments, selectedMember])

  const stats = useMemo(
    () => ({
      members: familyMembers.length,
      therapies: therapies.length,
      appointments: appointments.length,
      medications: familyMembers.reduce((acc, member) => acc + (member.medications?.length || 0), 0),
    }),
    [familyMembers, therapies, appointments]
  )

  const updateTherapies = (nextTherapies) => {
    updateHealth((prev) => ({ ...prev, therapies: nextTherapies, appointments: prev.appointments }))
  }

  const updateAppointments = (nextAppointments) => {
    updateHealth((prev) => ({ ...prev, therapies: prev.therapies, appointments: nextAppointments }))
  }

  const handleMemberField = (field, value) => {
    if (!selectedMember) return
    updateFamilyMember(selectedMember.id, { [field]: value })
  }

  const handleDocumentField = (field, value) => {
    if (!selectedMember) return
    updateFamilyMember(selectedMember.id, {
      documents: {
        ...(selectedMember.documents || {}),
        [field]: value,
      },
    })
  }

  const handleMedicationField = (medicationId, field, value) => {
    if (!selectedMember) return
    const next = (selectedMember.medications || []).map((med) => (med.id === medicationId ? { ...med, [field]: value } : med))
    updateFamilyMember(selectedMember.id, { medications: next })
  }

  const handleAddMedication = () => {
    if (!selectedMember) return
    addMedicationToMember(selectedMember.id, 'Nuovo farmaco')
  }

  const validateTherapy = () => {
    const errors = {}
    if (!therapyForm.memberId) errors.memberId = 'Seleziona il membro della famiglia.'
    if (!therapyForm.specialist.trim()) errors.specialist = 'Indica medico o specialista.'
    if (!therapyForm.medication.trim()) errors.medication = 'Inserisci almeno un farmaco o terapia.'
    if (!therapyForm.startDate) errors.startDate = 'Inserisci la data di inizio.'
    setTherapyErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateAppointment = () => {
    const errors = {}
    if (!appointmentForm.memberId) errors.memberId = 'Seleziona il membro della famiglia.'
    if (!appointmentForm.type.trim()) errors.type = 'Inserisci il tipo di visita.'
    if (!appointmentForm.date) errors.date = 'Inserisci la data della visita.'
    if (!appointmentForm.doctor.trim()) errors.doctor = 'Indica il medico o lo specialista.'
    setAppointmentErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddTherapy = (e) => {
    e.preventDefault()
    if (!validateTherapy()) return

    updateTherapies([
      ...therapies,
      {
        id: uid('th'),
        memberId: therapyForm.memberId,
        specialist: therapyForm.specialist.trim(),
        medication: therapyForm.medication.trim(),
        dosage: therapyForm.dosage.trim(),
        frequency: therapyForm.frequency.trim(),
        timeSlots: therapyForm.timeSlots.trim(),
        startDate: therapyForm.startDate,
        endDate: therapyForm.endDate,
        prescribingDoctor: therapyForm.prescribingDoctor.trim(),
        googleCalendarUrl: therapyForm.googleCalendarUrl.trim(),
        driveLinks: ensureDriveLinks(therapyForm.driveLinks),
        notes: therapyForm.notes.trim(),
      },
    ])

    setTherapyForm({ ...EMPTY_THERAPY_FORM, memberId: selectedMember?.id || familyMembers[0]?.id || '' })
    setTherapyErrors({})
  }

  const handleUpdateTherapy = (therapyId, field, value) => {
    updateTherapies(therapies.map((item) => (item.id === therapyId ? { ...item, [field]: value } : item)))
  }

  const handleDeleteTherapy = (therapyId) => {
    updateTherapies(therapies.filter((item) => item.id !== therapyId))
  }

  const handleAddAppointment = (e) => {
    e.preventDefault()
    if (!validateAppointment()) return

    updateAppointments([
      ...appointments,
      {
        id: uid('app'),
        memberId: appointmentForm.memberId,
        type: appointmentForm.type.trim(),
        date: appointmentForm.date,
        doctor: appointmentForm.doctor.trim(),
        location: appointmentForm.location.trim(),
        googleCalendarUrl: appointmentForm.googleCalendarUrl.trim(),
        driveLinks: ensureDriveLinks(appointmentForm.driveLinks),
        notes: appointmentForm.notes.trim(),
      },
    ])

    setAppointmentForm({ ...EMPTY_APPOINTMENT_FORM, memberId: selectedMember?.id || familyMembers[0]?.id || '' })
    setAppointmentErrors({})
  }

  const handleUpdateAppointment = (appointmentId, field, value) => {
    updateAppointments(appointments.map((item) => (item.id === appointmentId ? { ...item, [field]: value } : item)))
  }

  const handleDeleteAppointment = (appointmentId) => {
    updateAppointments(appointments.filter((item) => item.id !== appointmentId))
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Salute</div>
          <h1>Caricamento salute in corso...</h1>
          <p>Sto caricando anagrafiche, farmaci, visite, terapie e documenti clinici.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Salute & Terapie</div>
        <h1>Profilo salute chiaro, ordinato e facile da compilare</h1>
        <p>
          Prima scegli il componente della famiglia, poi compili i dati personali e medici. Sotto trovi separati visite/specialisti,
          terapie, farmaci personali e documenti collegati con link Drive o Calendar.
        </p>
        {syncError ? <div className="app-status" style={{ marginTop: 14 }}>{syncError}</div> : null}
        <div className="hero-meta" style={{ marginTop: 14 }}>
          <span className="meta-chip">{stats.members} membri</span>
          <span className="meta-chip">{stats.medications} farmaci personali</span>
          <span className="meta-chip">{stats.therapies} terapie</span>
          <span className="meta-chip">{stats.appointments} visite</span>
        </div>
      </section>

      <section className="card stack-card">
        <div className="card-title">1. Scegli il componente della famiglia</div>
        {familyMembers.length === 0 ? (
          <EmptyState text="Nessun membro disponibile." />
        ) : (
          <div className="family-switcher">
            {familyMembers.map((member) => {
              const active = selectedMember?.id === member.id
              return (
                <button key={member.id} type="button" className={`member-chip ${active ? 'active' : ''}`} onClick={() => setSelectedMemberId(member.id)}>
                  <strong>{member.initials || 'FH'}</strong> — {memberLabel(member)}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {selectedMember ? (
        <>
          <section className="card stack-card">
            <div className="between">
              <div>
                <div className="card-title">2. Scheda anagrafica e sanitaria</div>
                <div className="muted">Compila una volta i dati base del familiare. Qui restano sempre visibili e aggiornabili.</div>
              </div>
              <span className="badge">{memberLabel(selectedMember)}</span>
            </div>

            <div className="form-shell">
              <div className="form-section-title">Dati personali</div>
              <div className="grid-cards responsive-3">
                <label>
                  <Label required>Nome</Label>
                  <input className={fieldClass(selectedMember.name)} value={selectedMember.name || ''} onChange={(e) => handleMemberField('name', e.target.value)} placeholder="Es. Francesco" />
                </label>
                <label>
                  <Label>Ruolo</Label>
                  <input className={fieldClass(selectedMember.role)} value={selectedMember.role || ''} onChange={(e) => handleMemberField('role', e.target.value)} placeholder="Es. Papà, Mamma, Figlio/a" />
                </label>
                <label>
                  <Label>Iniziali</Label>
                  <input className={fieldClass(selectedMember.initials)} value={selectedMember.initials || ''} onChange={(e) => handleMemberField('initials', e.target.value)} placeholder="Es. FC" />
                </label>
                <label>
                  <Label>Data di nascita</Label>
                  <input type="date" className={fieldClass(selectedMember.birthDate)} value={selectedMember.birthDate || ''} onChange={(e) => handleMemberField('birthDate', e.target.value)} />
                </label>
                <label>
                  <Label>Gruppo sanguigno</Label>
                  <input className={fieldClass(selectedMember.bloodGroup)} value={selectedMember.bloodGroup || ''} onChange={(e) => handleMemberField('bloodGroup', e.target.value)} placeholder="Es. 0+, A-, AB" />
                </label>
                <label>
                  <Label>Codice fiscale</Label>
                  <input className={fieldClass(selectedMember.fiscalCode)} value={selectedMember.fiscalCode || ''} onChange={(e) => handleMemberField('fiscalCode', e.target.value)} placeholder="Inserisci il codice fiscale" />
                </label>
              </div>

              <div className="section-divider" />
              <div className="form-section-title">Contatti e medici</div>
              <div className="grid-cards responsive-3">
                <label>
                  <Label>Telefono</Label>
                  <input className={fieldClass(selectedMember.phone)} value={selectedMember.phone || ''} onChange={(e) => handleMemberField('phone', e.target.value)} placeholder="Numero di telefono" />
                </label>
                <label>
                  <Label>Email</Label>
                  <input type="email" className={fieldClass(selectedMember.email)} value={selectedMember.email || ''} onChange={(e) => handleMemberField('email', e.target.value)} placeholder="Email" />
                </label>
                <label>
                  <Label>Medico di base</Label>
                  <input className={fieldClass(selectedMember.doctor)} value={selectedMember.doctor || ''} onChange={(e) => handleMemberField('doctor', e.target.value)} placeholder="Nome medico di base" />
                </label>
                <label className="responsive-full">
                  <Label>Pediatra / Specialista di riferimento</Label>
                  <input className={fieldClass(selectedMember.pediatrician)} value={selectedMember.pediatrician || ''} onChange={(e) => handleMemberField('pediatrician', e.target.value)} placeholder="Solo se necessario" />
                </label>
              </div>

              <div className="section-divider" />
              <div className="form-section-title">Informazioni cliniche</div>
              <div className="grid-cards responsive-2">
                <label>
                  <Label>Allergie</Label>
                  <textarea className={fieldClass(selectedMember.allergies)} value={selectedMember.allergies || ''} onChange={(e) => handleMemberField('allergies', e.target.value)} placeholder="Es. Penicillina, pollini, lattosio..." />
                </label>
                <label>
                  <Label>Patologie croniche</Label>
                  <textarea className={fieldClass(selectedMember.chronicConditions)} value={selectedMember.chronicConditions || ''} onChange={(e) => handleMemberField('chronicConditions', e.target.value)} placeholder="Indica patologie o condizioni permanenti" />
                </label>
                <label>
                  <Label>Terapie correnti</Label>
                  <textarea className={fieldClass(selectedMember.currentTherapies)} value={selectedMember.currentTherapies || ''} onChange={(e) => handleMemberField('currentTherapies', e.target.value)} placeholder="Sintesi rapida delle terapie in corso" />
                </label>
                <label>
                  <Label>Note di emergenza</Label>
                  <textarea className={fieldClass(selectedMember.emergencyNotes)} value={selectedMember.emergencyNotes || ''} onChange={(e) => handleMemberField('emergencyNotes', e.target.value)} placeholder="Informazioni utili in caso di emergenza" />
                </label>
              </div>
            </div>
          </section>

          <section className="grid-cards cols-2">
            <article className="card stack-card">
              <div className="card-title">3. Documenti personali</div>
              <div className="muted">Questi documenti si inseriscono una sola volta nella scheda del familiare.</div>
              <div className="form-shell">
                <div className="grid-cards responsive-2">
                  <label>
                    <Label>Carta d'identità</Label>
                    <input className={fieldClass(selectedMember.documents?.idCard)} value={selectedMember.documents?.idCard || ''} onChange={(e) => handleDocumentField('idCard', e.target.value)} placeholder="Numero o riferimento" />
                  </label>
                  <label>
                    <Label>Passaporto</Label>
                    <input className={fieldClass(selectedMember.documents?.passport)} value={selectedMember.documents?.passport || ''} onChange={(e) => handleDocumentField('passport', e.target.value)} placeholder="Numero o riferimento" />
                  </label>
                  <label>
                    <Label>Tessera sanitaria</Label>
                    <input className={fieldClass(selectedMember.documents?.healthCard)} value={selectedMember.documents?.healthCard || ''} onChange={(e) => handleDocumentField('healthCard', e.target.value)} placeholder="Numero o riferimento" />
                  </label>
                  <label>
                    <Label>Patente</Label>
                    <input className={fieldClass(selectedMember.documents?.drivingLicense)} value={selectedMember.documents?.drivingLicense || ''} onChange={(e) => handleDocumentField('drivingLicense', e.target.value)} placeholder="Numero o riferimento" />
                  </label>
                </div>
              </div>
            </article>

            <article className="card stack-card">
              <div className="between">
                <div>
                  <div className="card-title">4. Farmaci personali</div>
                  <div className="muted">Farmaci abituali del familiare, separati da visite e terapie.</div>
                </div>
                <button type="button" className="btn btn-p" onClick={handleAddMedication}>Aggiungi farmaco</button>
              </div>

              {selectedMember.medications?.length ? (
                <div className="timeline-list">
                  {selectedMember.medications.map((med) => (
                    <div key={med.id} className="timeline-item">
                      <div className="between">
                        <div>
                          <div className="card-subtitle">{med.name || 'Farmaco personale'}</div>
                          <div className="muted">Farmaco salvato nella scheda personale del familiare.</div>
                        </div>
                        <button type="button" className="btn btn-d btn-s" onClick={() => deleteMedicationFromMember(selectedMember.id, med.id)}>Elimina</button>
                      </div>

                      <div className="grid-cards responsive-2" style={{ marginTop: 12 }}>
                        <label>
                          <Label required>Nome farmaco</Label>
                          <input className={fieldClass(med.name)} value={med.name || ''} onChange={(e) => handleMedicationField(med.id, 'name', e.target.value)} placeholder="Es. Tachipirina, Allopurinolo" />
                        </label>
                        <label>
                          <Label>Dosaggio</Label>
                          <input className={fieldClass(med.dosage)} value={med.dosage || ''} onChange={(e) => handleMedicationField(med.id, 'dosage', e.target.value)} placeholder="Es. 100 mg" />
                        </label>
                        <label>
                          <Label>Frequenza / Orario</Label>
                          <input className={fieldClass(med.schedule)} value={med.schedule || ''} onChange={(e) => handleMedicationField(med.id, 'schedule', e.target.value)} placeholder="Es. mattina e sera" />
                        </label>
                        <label>
                          <Label>Indicazione</Label>
                          <input className={fieldClass(med.indication)} value={med.indication || ''} onChange={(e) => handleMedicationField(med.id, 'indication', e.target.value)} placeholder="Per cosa viene assunto" />
                        </label>
                        <label className="responsive-full">
                          <Label>Note</Label>
                          <textarea className={fieldClass(med.notes)} value={med.notes || ''} onChange={(e) => handleMedicationField(med.id, 'notes', e.target.value)} placeholder="Indicazioni utili, avvertenze, sospensioni, allergie correlate" />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="Nessun farmaco personale registrato." />
              )}
            </article>
          </section>

          <section className="grid-cards cols-2">
            <article className="card stack-card">
              <div className="card-title">5. Nuova visita / specialista</div>
              <form className="form-shell form-grid" onSubmit={handleAddAppointment}>
                <div className="form-header">
                  <div>
                    <h3 className="form-title">Inserisci visita o appuntamento</h3>
                    <p className="form-intro">Campi obbligatori segnalati con *. Aggiungi anche link Calendar e documenti clinici.</p>
                  </div>
                  <span className="badge">Nuovo inserimento</span>
                </div>

                <div className="grid-cards responsive-2">
                  <label>
                    <Label required>Membro</Label>
                    <select className={fieldClass(appointmentForm.memberId, Boolean(appointmentErrors.memberId))} value={appointmentForm.memberId} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, memberId: e.target.value }))}>
                      <option value="">Seleziona membro</option>
                      {familyMembers.map((member) => <option key={member.id} value={member.id}>{memberLabel(member)}</option>)}
                    </select>
                    <ErrorLine text={appointmentErrors.memberId} />
                  </label>
                  <label>
                    <Label required>Tipo visita</Label>
                    <input className={fieldClass(appointmentForm.type, Boolean(appointmentErrors.type))} value={appointmentForm.type} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, type: e.target.value }))} placeholder="Es. Cardiologo, TAC, Esame sangue, Dentista" />
                    <ErrorLine text={appointmentErrors.type} />
                  </label>
                  <label>
                    <Label required>Data visita</Label>
                    <input type="date" className={fieldClass(appointmentForm.date, Boolean(appointmentErrors.date))} value={appointmentForm.date} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, date: e.target.value }))} />
                    <ErrorLine text={appointmentErrors.date} />
                  </label>
                  <label>
                    <Label required>Medico / Specialista</Label>
                    <input className={fieldClass(appointmentForm.doctor, Boolean(appointmentErrors.doctor))} value={appointmentForm.doctor} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, doctor: e.target.value }))} placeholder="Nome del medico o centro" />
                    <ErrorLine text={appointmentErrors.doctor} />
                  </label>
                  <label className="responsive-full">
                    <Label>Luogo / Struttura</Label>
                    <input className={fieldClass(appointmentForm.location)} value={appointmentForm.location} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Es. Ospedale, clinica, laboratorio analisi" />
                  </label>
                  <label className="responsive-full">
                    <Label>Link Google Calendar</Label>
                    <input className={fieldClass(appointmentForm.googleCalendarUrl)} value={appointmentForm.googleCalendarUrl} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, googleCalendarUrl: e.target.value }))} placeholder="https://calendar.google.com/..." />
                  </label>
                  <label className="responsive-full">
                    <Label>Note visita</Label>
                    <textarea className={fieldClass(appointmentForm.notes)} value={appointmentForm.notes} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Indicazioni utili, preparazione all'esame, promemoria, esito" />
                  </label>
                </div>

                <LinkListEditor links={appointmentForm.driveLinks} onChange={(next) => setAppointmentForm((prev) => ({ ...prev, driveLinks: next }))} label="Documenti visita (Drive / link)" />
                <div><button className="btn btn-p" type="submit">Salva visita</button></div>
              </form>

              {memberAppointments.length === 0 ? (
                <EmptyState text="Nessuna visita per il membro selezionato." />
              ) : (
                <div className="timeline-list">
                  {memberAppointments.map((item) => (
                    <div key={item.id} className="timeline-item">
                      <div className="between">
                        <div>
                          <div className="card-subtitle">{item.type || 'Visita'}</div>
                          <div className="muted">{fmt(item.date)} — {item.doctor || 'Medico non indicato'}</div>
                        </div>
                        <div className="actions-row">
                          {item.googleCalendarUrl ? <a className="btn btn-s" href={item.googleCalendarUrl} target="_blank" rel="noopener noreferrer">Apri Calendar</a> : null}
                          <button type="button" className="btn btn-d btn-s" onClick={() => handleDeleteAppointment(item.id)}>Elimina</button>
                        </div>
                      </div>

                      <div className="grid-cards responsive-2" style={{ marginTop: 12 }}>
                        <label>
                          <Label required>Tipo visita</Label>
                          <input className={fieldClass(item.type)} value={item.type || ''} onChange={(e) => handleUpdateAppointment(item.id, 'type', e.target.value)} />
                        </label>
                        <label>
                          <Label required>Data visita</Label>
                          <input type="date" className={fieldClass(item.date)} value={item.date || ''} onChange={(e) => handleUpdateAppointment(item.id, 'date', e.target.value)} />
                        </label>
                        <label>
                          <Label>Medico / Specialista</Label>
                          <input className={fieldClass(item.doctor)} value={item.doctor || ''} onChange={(e) => handleUpdateAppointment(item.id, 'doctor', e.target.value)} />
                        </label>
                        <label>
                          <Label>Luogo</Label>
                          <input className={fieldClass(item.location)} value={item.location || ''} onChange={(e) => handleUpdateAppointment(item.id, 'location', e.target.value)} />
                        </label>
                        <label className="responsive-full">
                          <Label>Google Calendar</Label>
                          <input className={fieldClass(item.googleCalendarUrl)} value={item.googleCalendarUrl || ''} onChange={(e) => handleUpdateAppointment(item.id, 'googleCalendarUrl', e.target.value)} placeholder="https://calendar.google.com/..." />
                        </label>
                        <label className="responsive-full">
                          <Label>Note</Label>
                          <textarea className={fieldClass(item.notes)} value={item.notes || ''} onChange={(e) => handleUpdateAppointment(item.id, 'notes', e.target.value)} />
                        </label>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <LinkListEditor links={item.driveLinks} onChange={(next) => handleUpdateAppointment(item.id, 'driveLinks', next)} label="Documenti visita" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="card stack-card">
              <div className="card-title">6. Nuova terapia collegata alla visita</div>
              <form className="form-shell form-grid" onSubmit={handleAddTherapy}>
                <div className="form-header">
                  <div>
                    <h3 className="form-title">Inserisci terapia o piano terapeutico</h3>
                    <p className="form-intro">Collega specialista, farmaci, periodo, scadenze e documenti.</p>
                  </div>
                  <span className="badge success">Terapia</span>
                </div>

                <div className="grid-cards responsive-2">
                  <label>
                    <Label required>Membro</Label>
                    <select className={fieldClass(therapyForm.memberId, Boolean(therapyErrors.memberId))} value={therapyForm.memberId} onChange={(e) => setTherapyForm((prev) => ({ ...prev, memberId: e.target.value }))}>
                      <option value="">Seleziona membro</option>
                      {familyMembers.map((member) => <option key={member.id} value={member.id}>{memberLabel(member)}</option>)}
                    </select>
                    <ErrorLine text={therapyErrors.memberId} />
                  </label>
                  <label>
                    <Label required>Medico / Specialista</Label>
                    <input className={fieldClass(therapyForm.specialist, Boolean(therapyErrors.specialist))} value={therapyForm.specialist} onChange={(e) => setTherapyForm((prev) => ({ ...prev, specialist: e.target.value }))} placeholder="Es. Cardiologo, pneumologo, fisiatra" />
                    <ErrorLine text={therapyErrors.specialist} />
                  </label>
                  <label>
                    <Label required>Farmaco / Terapia</Label>
                    <input className={fieldClass(therapyForm.medication, Boolean(therapyErrors.medication))} value={therapyForm.medication} onChange={(e) => setTherapyForm((prev) => ({ ...prev, medication: e.target.value }))} placeholder="Es. Allopurinolo, fisioterapia, aerosol" />
                    <ErrorLine text={therapyErrors.medication} />
                  </label>
                  <label>
                    <Label>Dosaggio</Label>
                    <input className={fieldClass(therapyForm.dosage)} value={therapyForm.dosage} onChange={(e) => setTherapyForm((prev) => ({ ...prev, dosage: e.target.value }))} placeholder="Es. 100 mg" />
                  </label>
                  <label>
                    <Label>Frequenza</Label>
                    <input className={fieldClass(therapyForm.frequency)} value={therapyForm.frequency} onChange={(e) => setTherapyForm((prev) => ({ ...prev, frequency: e.target.value }))} placeholder="Es. 2 volte al giorno" />
                  </label>
                  <label>
                    <Label>Fasce orarie</Label>
                    <input className={fieldClass(therapyForm.timeSlots)} value={therapyForm.timeSlots} onChange={(e) => setTherapyForm((prev) => ({ ...prev, timeSlots: e.target.value }))} placeholder="Es. 08:00 e 20:00" />
                  </label>
                  <label>
                    <Label required>Inizio terapia</Label>
                    <input type="date" className={fieldClass(therapyForm.startDate, Boolean(therapyErrors.startDate))} value={therapyForm.startDate} onChange={(e) => setTherapyForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                    <ErrorLine text={therapyErrors.startDate} />
                  </label>
                  <label>
                    <Label>Fine terapia</Label>
                    <input type="date" className={fieldClass(therapyForm.endDate)} value={therapyForm.endDate} onChange={(e) => setTherapyForm((prev) => ({ ...prev, endDate: e.target.value }))} />
                  </label>
                  <label>
                    <Label>Medico prescrittore</Label>
                    <input className={fieldClass(therapyForm.prescribingDoctor)} value={therapyForm.prescribingDoctor} onChange={(e) => setTherapyForm((prev) => ({ ...prev, prescribingDoctor: e.target.value }))} placeholder="Se diverso dallo specialista" />
                  </label>
                  <label>
                    <Label>Link Google Calendar</Label>
                    <input className={fieldClass(therapyForm.googleCalendarUrl)} value={therapyForm.googleCalendarUrl} onChange={(e) => setTherapyForm((prev) => ({ ...prev, googleCalendarUrl: e.target.value }))} placeholder="Promemoria / scadenza terapia" />
                  </label>
                  <label className="responsive-full">
                    <Label>Note terapia</Label>
                    <textarea className={fieldClass(therapyForm.notes)} value={therapyForm.notes} onChange={(e) => setTherapyForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Esiti, controlli, sospensioni, scadenze, rinnovi" />
                  </label>
                </div>

                <LinkListEditor links={therapyForm.driveLinks} onChange={(next) => setTherapyForm((prev) => ({ ...prev, driveLinks: next }))} label="Documenti terapia (Drive / link)" />
                <div><button className="btn btn-p" type="submit">Salva terapia</button></div>
              </form>

              {memberTherapies.length === 0 ? (
                <EmptyState text="Nessuna terapia per il membro selezionato." />
              ) : (
                <div className="timeline-list">
                  {memberTherapies.map((item) => (
                    <div key={item.id} className="timeline-item">
                      <div className="between">
                        <div>
                          <div className="card-subtitle">{item.medication || 'Terapia'}</div>
                          <div className="muted">{item.specialist || item.prescribingDoctor || 'Specialista non indicato'} — {fmt(item.startDate)} / {fmt(item.endDate)}</div>
                        </div>
                        <div className="actions-row">
                          {item.googleCalendarUrl ? <a className="btn btn-s" href={item.googleCalendarUrl} target="_blank" rel="noopener noreferrer">Apri Calendar</a> : null}
                          <button type="button" className="btn btn-d btn-s" onClick={() => handleDeleteTherapy(item.id)}>Elimina</button>
                        </div>
                      </div>

                      <div className="grid-cards responsive-2" style={{ marginTop: 12 }}>
                        <label>
                          <Label>Medico / Specialista</Label>
                          <input className={fieldClass(item.specialist)} value={item.specialist || ''} onChange={(e) => handleUpdateTherapy(item.id, 'specialist', e.target.value)} />
                        </label>
                        <label>
                          <Label>Farmaco / Terapia</Label>
                          <input className={fieldClass(item.medication)} value={item.medication || ''} onChange={(e) => handleUpdateTherapy(item.id, 'medication', e.target.value)} />
                        </label>
                        <label>
                          <Label>Dosaggio</Label>
                          <input className={fieldClass(item.dosage)} value={item.dosage || ''} onChange={(e) => handleUpdateTherapy(item.id, 'dosage', e.target.value)} />
                        </label>
                        <label>
                          <Label>Frequenza</Label>
                          <input className={fieldClass(item.frequency)} value={item.frequency || ''} onChange={(e) => handleUpdateTherapy(item.id, 'frequency', e.target.value)} />
                        </label>
                        <label>
                          <Label>Fasce orarie</Label>
                          <input className={fieldClass(item.timeSlots)} value={item.timeSlots || ''} onChange={(e) => handleUpdateTherapy(item.id, 'timeSlots', e.target.value)} />
                        </label>
                        <label>
                          <Label>Medico prescrittore</Label>
                          <input className={fieldClass(item.prescribingDoctor)} value={item.prescribingDoctor || ''} onChange={(e) => handleUpdateTherapy(item.id, 'prescribingDoctor', e.target.value)} />
                        </label>
                        <label>
                          <Label>Inizio terapia</Label>
                          <input type="date" className={fieldClass(item.startDate)} value={item.startDate || ''} onChange={(e) => handleUpdateTherapy(item.id, 'startDate', e.target.value)} />
                        </label>
                        <label>
                          <Label>Fine terapia</Label>
                          <input type="date" className={fieldClass(item.endDate)} value={item.endDate || ''} onChange={(e) => handleUpdateTherapy(item.id, 'endDate', e.target.value)} />
                        </label>
                        <label className="responsive-full">
                          <Label>Google Calendar</Label>
                          <input className={fieldClass(item.googleCalendarUrl)} value={item.googleCalendarUrl || ''} onChange={(e) => handleUpdateTherapy(item.id, 'googleCalendarUrl', e.target.value)} />
                        </label>
                        <label className="responsive-full">
                          <Label>Note</Label>
                          <textarea className={fieldClass(item.notes)} value={item.notes || ''} onChange={(e) => handleUpdateTherapy(item.id, 'notes', e.target.value)} />
                        </label>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <LinkListEditor links={item.driveLinks} onChange={(next) => handleUpdateTherapy(item.id, 'driveLinks', next)} label="Documenti terapia" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      ) : null}
    </div>
  )
}


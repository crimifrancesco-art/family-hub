import { useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'

const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

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

function Label({ children, required = false }) {
  return (
    <span className="fl">
      {children}
      {required ? <span className="required">*</span> : null}
    </span>
  )
}

function fieldClass(value) {
  return `fi ${String(value ?? '').trim() ? 'field-active' : ''}`.trim()
}

function LinkListEditor({ links, onChange, label = 'Link clinici / Drive / Calendar' }) {
  const safeLinks = ensureDriveLinks(links)

  const handleChange = (id, field, value) => {
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
          <div className="muted">Allega portali, referti, Drive, prenotazioni o calendario.</div>
        </div>
        <button type="button" className="btn btn-s" onClick={handleAdd}>
          Aggiungi link
        </button>
      </div>

      <div style={{ height: 12 }} />

      {safeLinks.length === 0 ? (
        <div className="muted">Nessun link collegato.</div>
      ) : (
        <div className="timeline-list">
          {safeLinks.map((item) => (
            <div key={item.id} className="timeline-item compact">
              <div className="grid-cards responsive-2">
                <label>
                  <Label>Etichetta</Label>
                  <input
                    className={fieldClass(item.label)}
                    value={item.label}
                    onChange={(e) => handleChange(item.id, 'label', e.target.value)}
                  />
                </label>
                <label>
                  <Label>URL</Label>
                  <input
                    className={fieldClass(item.url)}
                    value={item.url}
                    onChange={(e) => handleChange(item.id, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="actions-row" style={{ marginTop: 10 }}>
                {item.url ? (
                  <a className="btn btn-s" href={item.url} target="_blank" rel="noopener noreferrer">
                    Apri
                  </a>
                ) : null}
                <button type="button" className="btn btn-d btn-s" onClick={() => handleDelete(item.id)}>
                  Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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
    addMedicationToMember,
    updateMedicationFromMember,
    deleteMedicationFromMember,
    updateHealth,
  } = useAppContext()

  const [selectedMemberId, setSelectedMemberId] = useState(familyMembers?.[0]?.id || 'member_fc')

  const selectedMember = useMemo(
    () => familyMembers.find((item) => item.id === selectedMemberId) || familyMembers[0],
    [familyMembers, selectedMemberId],
  )

  const visits = useMemo(
    () => (healthTables?.specialistVisits || []).filter((row) => row.memberId === selectedMember?.id),
    [healthTables, selectedMember],
  )

  const therapies = useMemo(
    () => (healthTables?.visitTherapies || []).filter((row) => row.memberId === selectedMember?.id),
    [healthTables, selectedMember],
  )

  const therapyMedications = useMemo(
    () => (healthTables?.therapyMedications || []).filter((row) => row.memberId === selectedMember?.id),
    [healthTables, selectedMember],
  )

  const saveHealth = (next) =>
    updateHealth((prev) => ({
      ...prev,
      ...next,
    }))

  const handleMemberField = (field, value) => {
    if (!selectedMember?.id) return
    updateFamilyMember(selectedMember.id, { [field]: value })
  }

  const addVisit = () => {
    const memberId = selectedMember?.id
    if (!memberId) return
    const count = (healthTables?.specialistVisits || []).filter((row) => row.memberId === memberId).length + 1

    saveHealth({
      specialistVisits: [
        ...(healthTables?.specialistVisits || []),
        {
          id: uid('visit'),
          memberId,
          title: `Visita specialistica ${count}`,
          specialty: '',
          date: '',
          doctor: '',
          location: '',
          googleCalendarUrl: '',
          driveLinks: [],
          notes: '',
        },
      ],
    })
  }

  const updateVisit = (visitId, field, value) => {
    saveHealth({
      specialistVisits: (healthTables?.specialistVisits || []).map((row) =>
        row.id === visitId ? { ...row, [field]: value } : row,
      ),
    })
  }

  const deleteVisit = (visitId) => {
    saveHealth({
      specialistVisits: (healthTables?.specialistVisits || []).filter((row) => row.id !== visitId),
      visitTherapies: (healthTables?.visitTherapies || []).filter((row) => row.visitId !== visitId),
      therapyMedications: (healthTables?.therapyMedications || []).filter((row) => row.visitId !== visitId),
    })
  }

  const addTherapyToVisit = (visitId) => {
    const memberId = selectedMember?.id
    if (!memberId) return

    const count = (healthTables?.visitTherapies || []).filter((row) => row.visitId === visitId).length + 1

    saveHealth({
      visitTherapies: [
        ...(healthTables?.visitTherapies || []),
        {
          id: uid('therapy'),
          memberId,
          visitId,
          title: `Terapia ${count}`,
          startDate: '',
          endDate: '',
          prescribingDoctor: '',
          driveLinks: [],
          notes: '',
        },
      ],
    })
  }

  const updateTherapy = (therapyId, field, value) => {
    saveHealth({
      visitTherapies: (healthTables?.visitTherapies || []).map((row) =>
        row.id === therapyId ? { ...row, [field]: value } : row,
      ),
    })
  }

  const deleteTherapy = (therapyId) => {
    saveHealth({
      visitTherapies: (healthTables?.visitTherapies || []).filter((row) => row.id !== therapyId),
      therapyMedications: (healthTables?.therapyMedications || []).filter((row) => row.therapyId !== therapyId),
    })
  }

  const addMedicationToTherapy = (visitId, therapyId) => {
    const memberId = selectedMember?.id
    if (!memberId) return

    saveHealth({
      therapyMedications: [
        ...(healthTables?.therapyMedications || []),
        {
          id: uid('tmed'),
          memberId,
          visitId,
          therapyId,
          medication: '',
          dosage: '',
          frequency: '',
          timeSlots: '',
          notes: '',
        },
      ],
    })
  }

  const updateTherapyMedication = (medicationId, field, value) => {
    saveHealth({
      therapyMedications: (healthTables?.therapyMedications || []).map((row) =>
        row.id === medicationId ? { ...row, [field]: value } : row,
      ),
    })
  }

  const deleteTherapyMedication = (medicationId) => {
    saveHealth({
      therapyMedications: (healthTables?.therapyMedications || []).filter((row) => row.id !== medicationId),
    })
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Salute</div>
          <h1>Caricamento dati sanitari in corso...</h1>
          <p>Sto caricando anagrafiche, farmaci, visite, terapie e documenti clinici.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Salute & Terapie</div>
        <h1>Gestione familiare per membro, visite, terapie e farmaci</h1>
        <p>
          La struttura ora segue il criterio richiesto: membro della famiglia → visita specialistica 1, 2, 3 →
          terapia assegnata alla visita → farmaci multipli assegnati alla terapia.
        </p>

        {syncError ? <div className="app-status">{syncError}</div> : null}

        <div className="family-switcher" style={{ marginTop: 14 }}>
          {familyMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`member-chip ${selectedMember?.id === member.id ? 'active' : ''}`}
              onClick={() => setSelectedMemberId(member.id)}
            >
              <span>{member.initials || 'FM'}</span>
              <span>{memberLabel(member)}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedMember ? (
        <>
          <section className="card stack-card">
            <div className="between">
              <div>
                <div className="card-title">Scheda membro famiglia</div>
                <div className="muted">Dati personali, sanitari e terapie correnti del componente selezionato.</div>
              </div>
              <span className="badge success">{memberLabel(selectedMember)}</span>
            </div>

            <div className="grid-cards responsive-3">
              <label>
                <Label>Nome</Label>
                <input className={fieldClass(selectedMember.name)} value={selectedMember.name || ''} onChange={(e) => handleMemberField('name', e.target.value)} />
              </label>
              <label>
                <Label>Ruolo</Label>
                <input className={fieldClass(selectedMember.role)} value={selectedMember.role || ''} onChange={(e) => handleMemberField('role', e.target.value)} />
              </label>
              <label>
                <Label>Data nascita</Label>
                <input type="date" className={fieldClass(selectedMember.birthDate)} value={selectedMember.birthDate || ''} onChange={(e) => handleMemberField('birthDate', e.target.value)} />
              </label>
              <label>
                <Label>Gruppo sanguigno</Label>
                <input className={fieldClass(selectedMember.bloodGroup)} value={selectedMember.bloodGroup || ''} onChange={(e) => handleMemberField('bloodGroup', e.target.value)} />
              </label>
              <label>
                <Label>Medico</Label>
                <input className={fieldClass(selectedMember.doctor)} value={selectedMember.doctor || ''} onChange={(e) => handleMemberField('doctor', e.target.value)} />
              </label>
              <label>
                <Label>Pediatra</Label>
                <input className={fieldClass(selectedMember.pediatrician)} value={selectedMember.pediatrician || ''} onChange={(e) => handleMemberField('pediatrician', e.target.value)} />
              </label>
              <label className="responsive-full">
                <Label>Allergie</Label>
                <textarea className={fieldClass(selectedMember.allergies)} value={selectedMember.allergies || ''} onChange={(e) => handleMemberField('allergies', e.target.value)} />
              </label>
              <label className="responsive-full">
                <Label>Patologie croniche</Label>
                <textarea className={fieldClass(selectedMember.chronicConditions)} value={selectedMember.chronicConditions || ''} onChange={(e) => handleMemberField('chronicConditions', e.target.value)} />
              </label>
              <label className="responsive-full">
                <Label>Terapie correnti</Label>
                <textarea className={fieldClass(selectedMember.currentTherapies)} value={selectedMember.currentTherapies || ''} onChange={(e) => handleMemberField('currentTherapies', e.target.value)} />
              </label>
              <label className="responsive-full">
                <Label>Note emergenza</Label>
                <textarea className={fieldClass(selectedMember.emergencyNotes)} value={selectedMember.emergencyNotes || ''} onChange={(e) => handleMemberField('emergencyNotes', e.target.value)} />
              </label>
            </div>
          </section>

          <section className="card stack-card">
            <div className="between">
              <div>
                <div className="card-title">Farmaci personali del membro</div>
                <div className="muted">Farmaci generali indipendenti dalle visite specialistiche.</div>
              </div>
              <button type="button" className="btn btn-p btn-s" onClick={() => addMedicationToMember(selectedMember.id)}>
                Aggiungi farmaco personale
              </button>
            </div>

            {(selectedMember.medications || []).length === 0 ? (
              <EmptyState text="Nessun farmaco personale registrato." />
            ) : (
              <div className="timeline-list">
                {selectedMember.medications.map((med) => (
                  <div key={med.id} className="timeline-item">
                    <div className="between">
                      <div className="card-subtitle">{med.name || 'Farmaco personale'}</div>
                      <button
                        type="button"
                        className="btn btn-d btn-s"
                        onClick={() => deleteMedicationFromMember(selectedMember.id, med.id)}
                      >
                        Elimina
                      </button>
                    </div>

                    <div className="grid-cards responsive-2" style={{ marginTop: 12 }}>
                      <label>
                        <Label>Farmaco</Label>
                        <input
                          className={fieldClass(med.name)}
                          value={med.name}
                          onChange={(e) => updateMedicationFromMember(selectedMember.id, med.id, { name: e.target.value })}
                        />
                      </label>
                      <label>
                        <Label>Dosaggio</Label>
                        <input
                          className={fieldClass(med.dosage)}
                          value={med.dosage}
                          onChange={(e) => updateMedicationFromMember(selectedMember.id, med.id, { dosage: e.target.value })}
                        />
                      </label>
                      <label>
                        <Label>Schema</Label>
                        <input
                          className={fieldClass(med.schedule)}
                          value={med.schedule}
                          onChange={(e) => updateMedicationFromMember(selectedMember.id, med.id, { schedule: e.target.value })}
                        />
                      </label>
                      <label>
                        <Label>Indicazione</Label>
                        <input
                          className={fieldClass(med.indication)}
                          value={med.indication}
                          onChange={(e) => updateMedicationFromMember(selectedMember.id, med.id, { indication: e.target.value })}
                        />
                      </label>
                      <label className="responsive-full">
                        <Label>Note</Label>
                        <textarea
                          className={fieldClass(med.notes)}
                          value={med.notes}
                          onChange={(e) => updateMedicationFromMember(selectedMember.id, med.id, { notes: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card stack-card">
            <div className="between">
              <div>
                <div className="card-title">Visite specialistiche</div>
                <div className="muted">Per ogni visita puoi collegare una o più terapie, e per ogni terapia più farmaci.</div>
              </div>
              <button type="button" className="btn btn-p btn-s" onClick={addVisit}>
                Aggiungi visita specialistica
              </button>
            </div>

            {visits.length === 0 ? (
              <EmptyState text="Nessuna visita specialistica registrata." />
            ) : (
              <div className="timeline-list">
                {visits.map((visit, visitIndex) => {
                  const visitTherapies = therapies.filter((therapy) => therapy.visitId === visit.id)

                  return (
                    <div key={visit.id} className="timeline-item health-visit-card">
                      <div className="between">
                        <div>
                          <div className="card-subtitle">{visit.title || `Visita specialistica ${visitIndex + 1}`}</div>
                          <div className="muted">
                            {visit.specialty || 'Specialità non indicata'} · {fmt(visit.date)} · {visit.doctor || 'Medico non indicato'}
                          </div>
                        </div>

                        <div className="actions-row">
                          <button type="button" className="btn btn-s" onClick={() => addTherapyToVisit(visit.id)}>
                            Aggiungi terapia
                          </button>
                          <button type="button" className="btn btn-d btn-s" onClick={() => deleteVisit(visit.id)}>
                            Elimina visita
                          </button>
                        </div>
                      </div>

                      <div className="grid-cards responsive-3" style={{ marginTop: 12 }}>
                        <label>
                          <Label>Titolo visita</Label>
                          <input className={fieldClass(visit.title)} value={visit.title} onChange={(e) => updateVisit(visit.id, 'title', e.target.value)} />
                        </label>
                        <label>
                          <Label>Specialità</Label>
                          <input className={fieldClass(visit.specialty)} value={visit.specialty} onChange={(e) => updateVisit(visit.id, 'specialty', e.target.value)} />
                        </label>
                        <label>
                          <Label>Data</Label>
                          <input type="date" className={fieldClass(visit.date)} value={visit.date} onChange={(e) => updateVisit(visit.id, 'date', e.target.value)} />
                        </label>
                        <label>
                          <Label>Medico / Specialista</Label>
                          <input className={fieldClass(visit.doctor)} value={visit.doctor} onChange={(e) => updateVisit(visit.id, 'doctor', e.target.value)} />
                        </label>
                        <label>
                          <Label>Luogo</Label>
                          <input className={fieldClass(visit.location)} value={visit.location} onChange={(e) => updateVisit(visit.id, 'location', e.target.value)} />
                        </label>
                        <label>
                          <Label>Google Calendar</Label>
                          <input className={fieldClass(visit.googleCalendarUrl)} value={visit.googleCalendarUrl} onChange={(e) => updateVisit(visit.id, 'googleCalendarUrl', e.target.value)} />
                        </label>
                        <label className="responsive-full">
                          <Label>Note visita</Label>
                          <textarea className={fieldClass(visit.notes)} value={visit.notes} onChange={(e) => updateVisit(visit.id, 'notes', e.target.value)} />
                        </label>
                      </div>

                      <div style={{ marginTop: 12 }}>
                        <LinkListEditor
                          links={visit.driveLinks}
                          onChange={(next) => updateVisit(visit.id, 'driveLinks', next)}
                          label="Link visita / referti"
                        />
                      </div>

                      <div className="health-therapy-stack" style={{ marginTop: 14 }}>
                        {visitTherapies.length === 0 ? (
                          <EmptyState text="Nessuna terapia collegata a questa visita." />
                        ) : (
                          visitTherapies.map((therapy, therapyIndex) => {
                            const meds = therapyMedications.filter((item) => item.therapyId === therapy.id)

                            return (
                              <div key={therapy.id} className="subsection-box health-therapy-card">
                                <div className="between">
                                  <div>
                                    <div className="card-subtitle">{therapy.title || `Terapia ${therapyIndex + 1}`}</div>
                                    <div className="muted">
                                      {therapy.prescribingDoctor || 'Medico non indicato'} · dal {fmt(therapy.startDate)} al {fmt(therapy.endDate)}
                                    </div>
                                  </div>

                                  <div className="actions-row">
                                    <button
                                      type="button"
                                      className="btn btn-s"
                                      onClick={() => addMedicationToTherapy(visit.id, therapy.id)}
                                    >
                                      Aggiungi farmaco
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-d btn-s"
                                      onClick={() => deleteTherapy(therapy.id)}
                                    >
                                      Elimina terapia
                                    </button>
                                  </div>
                                </div>

                                <div className="grid-cards responsive-3" style={{ marginTop: 12 }}>
                                  <label>
                                    <Label>Titolo terapia</Label>
                                    <input className={fieldClass(therapy.title)} value={therapy.title} onChange={(e) => updateTherapy(therapy.id, 'title', e.target.value)} />
                                  </label>
                                  <label>
                                    <Label>Data inizio</Label>
                                    <input type="date" className={fieldClass(therapy.startDate)} value={therapy.startDate} onChange={(e) => updateTherapy(therapy.id, 'startDate', e.target.value)} />
                                  </label>
                                  <label>
                                    <Label>Data fine</Label>
                                    <input type="date" className={fieldClass(therapy.endDate)} value={therapy.endDate} onChange={(e) => updateTherapy(therapy.id, 'endDate', e.target.value)} />
                                  </label>
                                  <label className="responsive-full">
                                    <Label>Medico prescrittore</Label>
                                    <input className={fieldClass(therapy.prescribingDoctor)} value={therapy.prescribingDoctor} onChange={(e) => updateTherapy(therapy.id, 'prescribingDoctor', e.target.value)} />
                                  </label>
                                  <label className="responsive-full">
                                    <Label>Note terapia</Label>
                                    <textarea className={fieldClass(therapy.notes)} value={therapy.notes} onChange={(e) => updateTherapy(therapy.id, 'notes', e.target.value)} />
                                  </label>
                                </div>

                                <div style={{ marginTop: 12 }}>
                                  <LinkListEditor
                                    links={therapy.driveLinks}
                                    onChange={(next) => updateTherapy(therapy.id, 'driveLinks', next)}
                                    label="Link terapia / piano terapeutico"
                                  />
                                </div>

                                <div className="timeline-list" style={{ marginTop: 12 }}>
                                  {meds.length === 0 ? (
                                    <EmptyState text="Nessun farmaco associato a questa terapia." />
                                  ) : (
                                    meds.map((med) => (
                                      <div key={med.id} className="timeline-item compact">
                                        <div className="between">
                                          <div className="card-subtitle">{med.medication || 'Farmaco terapia'}</div>
                                          <button
                                            type="button"
                                            className="btn btn-d btn-s"
                                            onClick={() => deleteTherapyMedication(med.id)}
                                          >
                                            Elimina
                                          </button>
                                        </div>

                                        <div className="grid-cards responsive-2" style={{ marginTop: 12 }}>
                                          <label>
                                            <Label>Farmaco</Label>
                                            <input className={fieldClass(med.medication)} value={med.medication} onChange={(e) => updateTherapyMedication(med.id, 'medication', e.target.value)} />
                                          </label>
                                          <label>
                                            <Label>Dosaggio</Label>
                                            <input className={fieldClass(med.dosage)} value={med.dosage} onChange={(e) => updateTherapyMedication(med.id, 'dosage', e.target.value)} />
                                          </label>
                                          <label>
                                            <Label>Frequenza</Label>
                                            <input className={fieldClass(med.frequency)} value={med.frequency} onChange={(e) => updateTherapyMedication(med.id, 'frequency', e.target.value)} />
                                          </label>
                                          <label>
                                            <Label>Orari</Label>
                                            <input className={fieldClass(med.timeSlots)} value={med.timeSlots} onChange={(e) => updateTherapyMedication(med.id, 'timeSlots', e.target.value)} />
                                          </label>
                                          <label className="responsive-full">
                                            <Label>Note</Label>
                                            <textarea className={fieldClass(med.notes)} value={med.notes} onChange={(e) => updateTherapyMedication(med.id, 'notes', e.target.value)} />
                                          </label>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <EmptyState text="Nessun membro disponibile." />
      )}
    </div>
  )
}
import { useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'

const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

function fmtDate(value) {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function todayIso() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function memberLabel(member) {
  return member?.name || member?.role || member?.initials || 'Membro'
}

function buildGoogleCalendarUrl({ title, date, location, details }) {
  if (!date) return ''
  const start = `${date.replaceAll('-', '')}T090000`
  const end = `${date.replaceAll('-', '')}T100000`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Visita specialistica',
    dates: `${start}/${end}`,
    details: details || '',
    location: location || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>
}

function HealthMetric({ icon, label, value, sub }) {
  return (
    <div className="widget-card wc-health" style={{ cursor: 'default' }}>
      <div className="widget-icon">{icon}</div>
      <div className="widget-label">{label}</div>
      <div className="widget-value">{value}</div>
      <div className="widget-sub">{sub}</div>
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

  const members = familyMembers || []
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '')
  const [openVisitId, setOpenVisitId] = useState('')
  const [openTherapyId, setOpenTherapyId] = useState('')

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) || members[0] || null,
    [members, selectedMemberId],
  )

  const specialistVisits = healthTables?.specialistVisits || []
  const visitTherapies = healthTables?.visitTherapies || []
  const therapyMedications = healthTables?.therapyMedications || []

  const memberVisits = useMemo(() => {
    if (!selectedMember) return []
    return specialistVisits
      .filter((visit) => visit.memberId === selectedMember.id)
      .sort((a, b) => String(a.date || '9999-99-99').localeCompare(String(b.date || '9999-99-99')))
  }, [selectedMember, specialistVisits])

  const memberTherapies = useMemo(() => {
    if (!selectedMember) return []
    return visitTherapies.filter((therapy) => therapy.memberId === selectedMember.id)
  }, [selectedMember, visitTherapies])

  const memberTherapyMeds = useMemo(() => {
    if (!selectedMember) return []
    return therapyMedications.filter((med) => med.memberId === selectedMember.id)
  }, [selectedMember, therapyMedications])

  const healthSummary = useMemo(() => {
    const memberMedications = selectedMember?.medications || []
    const nextVisit =
      memberVisits.find((visit) => !visit.date || visit.date >= todayIso()) || memberVisits[0] || null

    const activeTherapies = memberTherapies.filter((therapy) => {
      const start = therapy.startDate || ''
      const end = therapy.endDate || ''
      const today = todayIso()
      if (!start && !end) return true
      if (start && start > today) return false
      if (end && end < today) return false
      return true
    })

    return {
      memberMedicationsCount: memberMedications.filter((med) => med.name || med.schedule || med.dosage).length,
      visitsCount: memberVisits.length,
      nextVisit,
      activeTherapiesCount: activeTherapies.length,
      therapyDrugsCount: memberTherapyMeds.length,
    }
  }, [memberTherapies, memberTherapyMeds, memberVisits, selectedMember])

  function patchMember(field, value) {
    if (!selectedMember) return
    updateFamilyMember(selectedMember.id, { [field]: value })
  }

  function updateMemberMedication(medicationId, patch) {
    if (!selectedMember) return
    updateMedicationFromMember(selectedMember.id, medicationId, patch)
  }

  function addVisit() {
    if (!selectedMember) return
    updateHealth((prev) => ({
      ...prev,
      specialistVisits: [
        ...prev.specialistVisits,
        {
          id: uid('visit'),
          memberId: selectedMember.id,
          title: 'Nuova visita specialistica',
          specialty: '',
          date: '',
          doctor: '',
          location: '',
          googleCalendarUrl: '',
          driveLinks: [],
          notes: '',
        },
      ],
    }))
  }

  function updateVisit(visitId, patch) {
    updateHealth((prev) => ({
      ...prev,
      specialistVisits: prev.specialistVisits.map((visit) =>
        visit.id === visitId ? { ...visit, ...patch } : visit,
      ),
    }))
  }

  function deleteVisit(visitId) {
    updateHealth((prev) => ({
      ...prev,
      specialistVisits: prev.specialistVisits.filter((visit) => visit.id !== visitId),
      visitTherapies: prev.visitTherapies.filter((therapy) => therapy.visitId !== visitId),
      therapyMedications: prev.therapyMedications.filter((med) => med.visitId !== visitId),
    }))
    if (openVisitId === visitId) setOpenVisitId('')
  }

  function addVisitDriveLink(visitId) {
    updateHealth((prev) => ({
      ...prev,
      specialistVisits: prev.specialistVisits.map((visit) =>
        visit.id === visitId
          ? {
              ...visit,
              driveLinks: [...(visit.driveLinks || []), { id: uid('lnk'), label: '', url: '' }],
            }
          : visit,
      ),
    }))
  }

  function updateVisitDriveLink(visitId, linkId, patch) {
    updateHealth((prev) => ({
      ...prev,
      specialistVisits: prev.specialistVisits.map((visit) =>
        visit.id === visitId
          ? {
              ...visit,
              driveLinks: (visit.driveLinks || []).map((link) =>
                link.id === linkId ? { ...link, ...patch } : link,
              ),
            }
          : visit,
      ),
    }))
  }

  function removeVisitDriveLink(visitId, linkId) {
    updateHealth((prev) => ({
      ...prev,
      specialistVisits: prev.specialistVisits.map((visit) =>
        visit.id === visitId
          ? {
              ...visit,
              driveLinks: (visit.driveLinks || []).filter((link) => link.id !== linkId),
            }
          : visit,
      ),
    }))
  }

  function addTherapy(visitId) {
    if (!selectedMember) return
    const nextId = uid('therapy')
    updateHealth((prev) => ({
      ...prev,
      visitTherapies: [
        ...prev.visitTherapies,
        {
          id: nextId,
          memberId: selectedMember.id,
          visitId,
          title: 'Nuova terapia',
          startDate: '',
          endDate: '',
          prescribingDoctor: '',
          driveLinks: [],
          notes: '',
        },
      ],
    }))
    setOpenTherapyId(nextId)
  }

  function updateTherapy(therapyId, patch) {
    updateHealth((prev) => ({
      ...prev,
      visitTherapies: prev.visitTherapies.map((therapy) =>
        therapy.id === therapyId ? { ...therapy, ...patch } : therapy,
      ),
    }))
  }

  function deleteTherapy(therapyId) {
    updateHealth((prev) => ({
      ...prev,
      visitTherapies: prev.visitTherapies.filter((therapy) => therapy.id !== therapyId),
      therapyMedications: prev.therapyMedications.filter((med) => med.therapyId !== therapyId),
    }))
    if (openTherapyId === therapyId) setOpenTherapyId('')
  }

  function addTherapyDriveLink(therapyId) {
    updateHealth((prev) => ({
      ...prev,
      visitTherapies: prev.visitTherapies.map((therapy) =>
        therapy.id === therapyId
          ? {
              ...therapy,
              driveLinks: [...(therapy.driveLinks || []), { id: uid('lnk'), label: '', url: '' }],
            }
          : therapy,
      ),
    }))
  }

  function updateTherapyDriveLink(therapyId, linkId, patch) {
    updateHealth((prev) => ({
      ...prev,
      visitTherapies: prev.visitTherapies.map((therapy) =>
        therapy.id === therapyId
          ? {
              ...therapy,
              driveLinks: (therapy.driveLinks || []).map((link) =>
                link.id === linkId ? { ...link, ...patch } : link,
              ),
            }
          : therapy,
      ),
    }))
  }

  function removeTherapyDriveLink(therapyId, linkId) {
    updateHealth((prev) => ({
      ...prev,
      visitTherapies: prev.visitTherapies.map((therapy) =>
        therapy.id === therapyId
          ? {
              ...therapy,
              driveLinks: (therapy.driveLinks || []).filter((link) => link.id !== linkId),
            }
          : therapy,
      ),
    }))
  }

  function addTherapyMedication(visitId, therapyId) {
    if (!selectedMember) return
    updateHealth((prev) => ({
      ...prev,
      therapyMedications: [
        ...prev.therapyMedications,
        {
          id: uid('tmed'),
          memberId: selectedMember.id,
          visitId,
          therapyId,
          medication: '',
          dosage: '',
          frequency: '',
          timeSlots: '',
          notes: '',
        },
      ],
    }))
  }

  function updateTherapyMedication(medicationId, patch) {
    updateHealth((prev) => ({
      ...prev,
      therapyMedications: prev.therapyMedications.map((med) =>
        med.id === medicationId ? { ...med, ...patch } : med,
      ),
    }))
  }

  function deleteTherapyMedication(medicationId) {
    updateHealth((prev) => ({
      ...prev,
      therapyMedications: prev.therapyMedications.filter((med) => med.id !== medicationId),
    }))
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Salute famiglia</div>
          <h1 className="page-title">Sto caricando i dati sanitari</h1>
          <p className="page-subtitle">Visite, terapie, farmaci e documenti clinici.</p>
        </section>
      </div>
    )
  }

  if (!selectedMember) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Salute famiglia</div>
          <h1 className="page-title">Nessun membro disponibile</h1>
          <p className="page-subtitle">Aggiungi o sincronizza i membri della famiglia.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Salute famiglia</div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Salute & Terapie</h1>
            <p className="page-subtitle">
              Un unico spazio per anagrafica sanitaria, visite, terapie farmacologiche e promemoria.
            </p>
          </div>
          <div className="row">
            <span className="badge badge-health">{members.length} membri</span>
            <span className="badge badge-dash">{healthSummary.visitsCount} visite</span>
            <span className="badge badge-health">{healthSummary.activeTherapiesCount} terapie attive</span>
          </div>
        </div>
        {syncError ? <div className="app-status">{syncError}</div> : null}
      </section>

      <section className="card">
        <div className="section-title">Seleziona membro</div>
        <div className="row">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`member-chip ${selectedMember.id === member.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedMemberId(member.id)
                setOpenVisitId('')
                setOpenTherapyId('')
              }}
            >
              <span className="chip-avatar">{member.initials || 'FH'}</span>
              <span>{memberLabel(member)}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">Panoramica {memberLabel(selectedMember)}</div>
        <div className="grid-2 widget-grid">
          <HealthMetric
            icon="💊"
            label="Farmaci personali"
            value={healthSummary.memberMedicationsCount}
            sub="Farmaci salvati nell’anagrafica"
          />
          <HealthMetric
            icon="🩺"
            label="Prossima visita"
            value={healthSummary.nextVisit ? fmtDate(healthSummary.nextVisit.date) : '—'}
            sub={healthSummary.nextVisit ? (healthSummary.nextVisit.title || 'Visita specialistica') : 'Nessuna visita'}
          />
          <HealthMetric
            icon="📋"
            label="Terapie attive"
            value={healthSummary.activeTherapiesCount}
            sub="Terapie attualmente in corso"
          />
          <HealthMetric
            icon="⏰"
            label="Farmaci terapia"
            value={healthSummary.therapyDrugsCount}
            sub="Farmaci legati a terapie mediche"
          />
        </div>
      </section>

      <section className="card">
        <div className="between">
          <div>
            <div className="section-title">Scheda sanitaria</div>
            <p className="page-subtitle">Dati rapidi e informazioni mediche essenziali.</p>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <div className="fg">
            <label className="fl">Nome</label>
            <input className="fi fi-health" value={selectedMember.name || ''} onChange={(e) => patchMember('name', e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Ruolo</label>
            <input className="fi fi-health" value={selectedMember.role || ''} onChange={(e) => patchMember('role', e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Data di nascita</label>
            <input className="fi fi-health" type="date" value={selectedMember.birthDate || ''} onChange={(e) => patchMember('birthDate', e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Gruppo sanguigno</label>
            <input className="fi fi-health" value={selectedMember.bloodGroup || ''} onChange={(e) => patchMember('bloodGroup', e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Codice fiscale</label>
            <input className="fi fi-health" value={selectedMember.fiscalCode || ''} onChange={(e) => patchMember('fiscalCode', e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Telefono</label>
            <input className="fi fi-health" value={selectedMember.phone || ''} onChange={(e) => patchMember('phone', e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Email</label>
            <input className="fi fi-health" value={selectedMember.email || ''} onChange={(e) => patchMember('email', e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Medico</label>
            <input className="fi fi-health" value={selectedMember.doctor || ''} onChange={(e) => patchMember('doctor', e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">Pediatra</label>
            <input className="fi fi-health" value={selectedMember.pediatrician || ''} onChange={(e) => patchMember('pediatrician', e.target.value)} />
          </div>
          <div className="fg col-full">
            <label className="fl">Allergie</label>
            <textarea className="fi fi-health" value={selectedMember.allergies || ''} onChange={(e) => patchMember('allergies', e.target.value)} />
          </div>
          <div className="fg col-full">
            <label className="fl">Patologie croniche</label>
            <textarea className="fi fi-health" value={selectedMember.chronicConditions || ''} onChange={(e) => patchMember('chronicConditions', e.target.value)} />
          </div>
          <div className="fg col-full">
            <label className="fl">Terapie correnti</label>
            <textarea className="fi fi-health" value={selectedMember.currentTherapies || ''} onChange={(e) => patchMember('currentTherapies', e.target.value)} />
          </div>
          <div className="fg col-full">
            <label className="fl">Note emergenza</label>
            <textarea className="fi fi-health" value={selectedMember.emergencyNotes || ''} onChange={(e) => patchMember('emergencyNotes', e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="between">
          <div>
            <div className="section-title">Farmaci personali</div>
            <p className="page-subtitle">Farmaci abituali del membro, indipendenti da una terapia specifica.</p>
          </div>
          <button className="btn btn-health" onClick={() => addMedicationToMember(selectedMember.id, 'Nuovo farmaco')}>
            + Aggiungi farmaco
          </button>
        </div>

        <div className="timeline-list" style={{ marginTop: 12 }}>
          {(selectedMember.medications || []).length === 0 ? (
            <EmptyState text="Nessun farmaco personale registrato." />
          ) : (
            (selectedMember.medications || []).map((medication) => (
              <div key={medication.id} className="subsection-box">
                <div className="form-grid">
                  <div className="fg">
                    <label className="fl">Farmaco</label>
                    <input
                      className="fi fi-health"
                      value={medication.name || ''}
                      onChange={(e) => updateMemberMedication(medication.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="fg">
                    <label className="fl">Dosaggio</label>
                    <input
                      className="fi fi-health"
                      value={medication.dosage || ''}
                      onChange={(e) => updateMemberMedication(medication.id, { dosage: e.target.value })}
                    />
                  </div>
                  <div className="fg">
                    <label className="fl">Orario / schema</label>
                    <input
                      className="fi fi-health"
                      value={medication.schedule || ''}
                      onChange={(e) => updateMemberMedication(medication.id, { schedule: e.target.value })}
                    />
                  </div>
                  <div className="fg col-full">
                    <label className="fl">Indicazione</label>
                    <input
                      className="fi fi-health"
                      value={medication.indication || ''}
                      onChange={(e) => updateMemberMedication(medication.id, { indication: e.target.value })}
                    />
                  </div>
                  <div className="fg col-full">
                    <label className="fl">Note</label>
                    <textarea
                      className="fi fi-health"
                      value={medication.notes || ''}
                      onChange={(e) => updateMemberMedication(medication.id, { notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="row">
                  <button className="btn btn-d btn-sm" onClick={() => deleteMedicationFromMember(selectedMember.id, medication.id)}>
                    Elimina
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <div className="between">
          <div>
            <div className="section-title">Visite specialistiche</div>
            <p className="page-subtitle">Cronologia visite, documenti clinici e collegamento alle terapie.</p>
          </div>
          <button className="btn btn-health" onClick={addVisit}>
            + Nuova visita
          </button>
        </div>

        <div className="timeline-list" style={{ marginTop: 12 }}>
          {memberVisits.length === 0 ? (
            <EmptyState text="Nessuna visita specialistica registrata per questo membro." />
          ) : (
            memberVisits.map((visit) => {
              const isOpen = openVisitId === visit.id
              const relatedTherapies = memberTherapies.filter((therapy) => therapy.visitId === visit.id)
              const googleUrl =
                visit.googleCalendarUrl ||
                buildGoogleCalendarUrl({
                  title: visit.title,
                  date: visit.date,
                  location: visit.location,
                  details: `${visit.specialty || ''} ${visit.doctor ? `· ${visit.doctor}` : ''}`.trim(),
                })

              return (
                <div key={visit.id} className="timeline-item tl-health">
                  <div className="between">
                    <div>
                      <div className="strong">{visit.title || 'Visita specialistica'}</div>
                      <div className="small muted" style={{ marginTop: 4 }}>
                        {visit.specialty || 'Specialistica'} · {fmtDate(visit.date)}
                      </div>
                    </div>
                    <div className="row">
                      <span className="badge badge-health">{relatedTherapies.length} terapie</span>
                      <button className="btn btn-sm" onClick={() => setOpenVisitId(isOpen ? '' : visit.id)}>
                        {isOpen ? 'Chiudi' : 'Apri'}
                      </button>
                    </div>
                  </div>

                  {isOpen ? (
                    <div className="stack-card" style={{ marginTop: 14 }}>
                      <div className="form-grid">
                        <div className="fg">
                          <label className="fl">Titolo visita</label>
                          <input className="fi fi-health" value={visit.title || ''} onChange={(e) => updateVisit(visit.id, { title: e.target.value })} />
                        </div>
                        <div className="fg">
                          <label className="fl">Specialità</label>
                          <input className="fi fi-health" value={visit.specialty || ''} onChange={(e) => updateVisit(visit.id, { specialty: e.target.value })} />
                        </div>
                        <div className="fg">
                          <label className="fl">Data</label>
                          <input className="fi fi-health" type="date" value={visit.date || ''} onChange={(e) => updateVisit(visit.id, { date: e.target.value })} />
                        </div>
                        <div className="fg">
                          <label className="fl">Medico</label>
                          <input className="fi fi-health" value={visit.doctor || ''} onChange={(e) => updateVisit(visit.id, { doctor: e.target.value })} />
                        </div>
                        <div className="fg col-full">
                          <label className="fl">Luogo</label>
                          <input className="fi fi-health" value={visit.location || ''} onChange={(e) => updateVisit(visit.id, { location: e.target.value })} />
                        </div>
                        <div className="fg col-full">
                          <label className="fl">Link Google Calendar</label>
                          <input className="fi fi-health" value={visit.googleCalendarUrl || ''} onChange={(e) => updateVisit(visit.id, { googleCalendarUrl: e.target.value })} placeholder="Incolla link esistente oppure usa il bottone sotto" />
                        </div>
                        <div className="fg col-full">
                          <label className="fl">Note cliniche</label>
                          <textarea className="fi fi-health" value={visit.notes || ''} onChange={(e) => updateVisit(visit.id, { notes: e.target.value })} />
                        </div>
                      </div>

                      <div className="row">
                        {visit.date ? (
                          <a className="btn btn-health btn-sm" href={googleUrl} target="_blank" rel="noreferrer">
                            📅 Apri in Google Calendar
                          </a>
                        ) : null}
                        <button className="btn btn-sm" onClick={() => addTherapy(visit.id)}>
                          + Aggiungi terapia
                        </button>
                        <button className="btn btn-d btn-sm" onClick={() => deleteVisit(visit.id)}>
                          Elimina visita
                        </button>
                      </div>

                      <div className="subsection-box">
                        <div className="between">
                          <div>
                            <div className="section-title">Documenti e link Drive</div>
                            <p className="page-subtitle">Referti, prescrizioni, PDF o foto archiviati su Drive.</p>
                          </div>
                          <button className="btn btn-sm" onClick={() => addVisitDriveLink(visit.id)}>
                            + Link
                          </button>
                        </div>

                        <div className="timeline-list" style={{ marginTop: 12 }}>
                          {(visit.driveLinks || []).length === 0 ? (
                            <EmptyState text="Nessun link Drive associato alla visita." />
                          ) : (
                            (visit.driveLinks || []).map((link) => (
                              <div key={link.id} className="subsection-box">
                                <div className="form-grid">
                                  <div className="fg">
                                    <label className="fl">Etichetta</label>
                                    <input
                                      className="fi fi-health"
                                      value={link.label || ''}
                                      onChange={(e) => updateVisitDriveLink(visit.id, link.id, { label: e.target.value })}
                                    />
                                  </div>
                                  <div className="fg">
                                    <label className="fl">URL Drive</label>
                                    <input
                                      className="fi fi-health"
                                      value={link.url || ''}
                                      onChange={(e) => updateVisitDriveLink(visit.id, link.id, { url: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <div className="row">
                                  {link.url ? (
                                    <a className="drive-link" href={link.url} target="_blank" rel="noreferrer">
                                      🔗 Apri link
                                    </a>
                                  ) : null}
                                  <button className="btn btn-d btn-sm" onClick={() => removeVisitDriveLink(visit.id, link.id)}>
                                    Rimuovi
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="stack-card">
                        <div className="section-title">Terapie collegate</div>
                        {relatedTherapies.length === 0 ? (
                          <EmptyState text="Nessuna terapia collegata a questa visita." />
                        ) : (
                          relatedTherapies.map((therapy) => {
                            const isTherapyOpen = openTherapyId === therapy.id
                            const relatedMeds = memberTherapyMeds.filter((med) => med.therapyId === therapy.id)

                            return (
                              <div key={therapy.id} className="subsection-box">
                                <div className="between">
                                  <div>
                                    <div className="strong">{therapy.title || 'Terapia'}</div>
                                    <div className="small muted" style={{ marginTop: 4 }}>
                                      {fmtDate(therapy.startDate)} → {fmtDate(therapy.endDate)}
                                    </div>
                                  </div>
                                  <div className="row">
                                    <span className="badge badge-health">{relatedMeds.length} farmaci</span>
                                    <button className="btn btn-sm" onClick={() => setOpenTherapyId(isTherapyOpen ? '' : therapy.id)}>
                                      {isTherapyOpen ? 'Chiudi' : 'Apri'}
                                    </button>
                                  </div>
                                </div>

                                {isTherapyOpen ? (
                                  <div className="stack-card" style={{ marginTop: 14 }}>
                                    <div className="form-grid">
                                      <div className="fg">
                                        <label className="fl">Titolo terapia</label>
                                        <input className="fi fi-health" value={therapy.title || ''} onChange={(e) => updateTherapy(therapy.id, { title: e.target.value })} />
                                      </div>
                                      <div className="fg">
                                        <label className="fl">Medico prescrittore</label>
                                        <input className="fi fi-health" value={therapy.prescribingDoctor || ''} onChange={(e) => updateTherapy(therapy.id, { prescribingDoctor: e.target.value })} />
                                      </div>
                                      <div className="fg">
                                        <label className="fl">Inizio</label>
                                        <input className="fi fi-health" type="date" value={therapy.startDate || ''} onChange={(e) => updateTherapy(therapy.id, { startDate: e.target.value })} />
                                      </div>
                                      <div className="fg">
                                        <label className="fl">Fine</label>
                                        <input className="fi fi-health" type="date" value={therapy.endDate || ''} onChange={(e) => updateTherapy(therapy.id, { endDate: e.target.value })} />
                                      </div>
                                      <div className="fg col-full">
                                        <label className="fl">Note terapia</label>
                                        <textarea className="fi fi-health" value={therapy.notes || ''} onChange={(e) => updateTherapy(therapy.id, { notes: e.target.value })} />
                                      </div>
                                    </div>

                                    <div className="subsection-box">
                                      <div className="between">
                                        <div>
                                          <div className="section-title">Allegati terapia</div>
                                          <p className="page-subtitle">Piani terapeutici, referti, prescrizioni.</p>
                                        </div>
                                        <button className="btn btn-sm" onClick={() => addTherapyDriveLink(therapy.id)}>
                                          + Link
                                        </button>
                                      </div>

                                      <div className="timeline-list" style={{ marginTop: 12 }}>
                                        {(therapy.driveLinks || []).length === 0 ? (
                                          <EmptyState text="Nessun allegato Drive associato alla terapia." />
                                        ) : (
                                          (therapy.driveLinks || []).map((link) => (
                                            <div key={link.id} className="subsection-box">
                                              <div className="form-grid">
                                                <div className="fg">
                                                  <label className="fl">Etichetta</label>
                                                  <input
                                                    className="fi fi-health"
                                                    value={link.label || ''}
                                                    onChange={(e) => updateTherapyDriveLink(therapy.id, link.id, { label: e.target.value })}
                                                  />
                                                </div>
                                                <div className="fg">
                                                  <label className="fl">URL Drive</label>
                                                  <input
                                                    className="fi fi-health"
                                                    value={link.url || ''}
                                                    onChange={(e) => updateTherapyDriveLink(therapy.id, link.id, { url: e.target.value })}
                                                  />
                                                </div>
                                              </div>
                                              <div className="row">
                                                {link.url ? (
                                                  <a className="drive-link" href={link.url} target="_blank" rel="noreferrer">
                                                    🔗 Apri link
                                                  </a>
                                                ) : null}
                                                <button className="btn btn-d btn-sm" onClick={() => removeTherapyDriveLink(therapy.id, link.id)}>
                                                  Rimuovi
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>

                                    <div className="subsection-box">
                                      <div className="between">
                                        <div>
                                          <div className="section-title">Farmaci della terapia</div>
                                          <p className="page-subtitle">Medicinali con dosaggio, frequenza e orari.</p>
                                        </div>
                                        <button className="btn btn-health btn-sm" onClick={() => addTherapyMedication(visit.id, therapy.id)}>
                                          + Farmaco terapia
                                        </button>
                                      </div>

                                      <div className="timeline-list" style={{ marginTop: 12 }}>
                                        {relatedMeds.length === 0 ? (
                                          <EmptyState text="Nessun farmaco associato a questa terapia." />
                                        ) : (
                                          relatedMeds.map((med) => (
                                            <div key={med.id} className="subsection-box">
                                              <div className="form-grid">
                                                <div className="fg">
                                                  <label className="fl">Farmaco</label>
                                                  <input className="fi fi-health" value={med.medication || ''} onChange={(e) => updateTherapyMedication(med.id, { medication: e.target.value })} />
                                                </div>
                                                <div className="fg">
                                                  <label className="fl">Dosaggio</label>
                                                  <input className="fi fi-health" value={med.dosage || ''} onChange={(e) => updateTherapyMedication(med.id, { dosage: e.target.value })} />
                                                </div>
                                                <div className="fg">
                                                  <label className="fl">Frequenza</label>
                                                  <input className="fi fi-health" value={med.frequency || ''} onChange={(e) => updateTherapyMedication(med.id, { frequency: e.target.value })} placeholder="es. 2 volte al giorno" />
                                                </div>
                                                <div className="fg">
                                                  <label className="fl">Orari</label>
                                                  <input className="fi fi-health" value={med.timeSlots || ''} onChange={(e) => updateTherapyMedication(med.id, { timeSlots: e.target.value })} placeholder="08:00, 14:00, 20:00" />
                                                </div>
                                                <div className="fg col-full">
                                                  <label className="fl">Note</label>
                                                  <textarea className="fi fi-health" value={med.notes || ''} onChange={(e) => updateTherapyMedication(med.id, { notes: e.target.value })} />
                                                </div>
                                              </div>
                                              <div className="row">
                                                <button className="btn btn-d btn-sm" onClick={() => deleteTherapyMedication(med.id)}>
                                                  Elimina farmaco
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>

                                    <div className="row">
                                      <button className="btn btn-d btn-sm" onClick={() => deleteTherapy(therapy.id)}>
                                        Elimina terapia
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
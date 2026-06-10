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

function daysBetween(from, to = new Date()) {
  if (!from) return null
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const diff = start.getTime() - end.getTime()
  return Math.ceil((start.getTime() - end.getTime()) / (1000 * 60 * 60 * 24))
}

function statusBadge(days) {
  if (days === null) return 'badge-muted'
  if (days < 0) return 'badge-danger'
  if (days <= 7) return 'badge-warning'
  return 'badge-success'
}

function statusText(days) {
  if (days === null) return 'Senza data'
  if (days < 0) return 'Scaduto'
  if (days === 0) return 'Oggi'
  if (days === 1) return 'Domani'
  return `${days} gg`
}

function calendarLink({ title, date, details = '' }) {
  if (!date) return ''
  const start = `${date.replaceAll('-', '')}T090000`
  const end = `${date.replaceAll('-', '')}T100000`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title || 'Promemoria salute',
  )}&dates=${start}/${end}&details=${encodeURIComponent(details)}`
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

  const [selectedMemberId, setSelectedMemberId] = useState(familyMembers[0]?.id || '')
  const [visitForm, setVisitForm] = useState({
    title: '',
    specialty: '',
    date: '',
    doctor: '',
    location: '',
    googleCalendarUrl: '',
    driveUrl: '',
    notes: '',
  })
  const [therapyForm, setTherapyForm] = useState({
    visitId: '',
    title: '',
    startDate: '',
    endDate: '',
    prescribingDoctor: '',
    driveUrl: '',
    notes: '',
  })
  const [therapyMedicationForm, setTherapyMedicationForm] = useState({
    therapyId: '',
    medication: '',
    dosage: '',
    frequency: '',
    timeSlots: '',
    notes: '',
  })
  const [personalMedicationForm, setPersonalMedicationForm] = useState({
    name: '',
    dosage: '',
    schedule: '',
    indication: '',
    notes: '',
  })

  const selectedMember =
    familyMembers.find((member) => member.id === selectedMemberId) || familyMembers[0] || null

  const memberVisits = useMemo(
    () =>
      (healthTables?.specialistVisits || [])
        .filter((visit) => visit.memberId === selectedMemberId)
        .sort((a, b) => (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99')),
    [healthTables, selectedMemberId],
  )

  const memberTherapies = useMemo(
    () =>
      (healthTables?.visitTherapies || [])
        .filter((therapy) => therapy.memberId === selectedMemberId)
        .sort((a, b) => (a.startDate || '9999-99-99').localeCompare(b.startDate || '9999-99-99')),
    [healthTables, selectedMemberId],
  )

  const memberTherapyMedications = useMemo(
    () =>
      (healthTables?.therapyMedications || []).filter(
        (item) => item.memberId === selectedMemberId,
      ),
    [healthTables, selectedMemberId],
  )

  const visitMap = useMemo(
    () => Object.fromEntries(memberVisits.map((visit) => [visit.id, visit])),
    [memberVisits],
  )

  const therapyMap = useMemo(
    () => Object.fromEntries(memberTherapies.map((therapy) => [therapy.id, therapy])),
    [memberTherapies],
  )

  const activePersonalMedications = selectedMember?.medications || []

  const summary = useMemo(() => {
    const nextVisit = memberVisits.find((visit) => visit.date && daysBetween(visit.date) >= 0)
    return {
      medications: activePersonalMedications.length,
      visits: memberVisits.length,
      therapies: memberTherapies.length,
      nextVisit,
    }
  }, [activePersonalMedications, memberVisits, memberTherapies])

  const handleMemberField = (field, value) => {
    if (!selectedMember) return
    updateFamilyMember(selectedMember.id, { [field]: value })
  }

  const handleAddPersonalMedication = (event) => {
    event.preventDefault()
    if (!selectedMember || !personalMedicationForm.name.trim()) return

    addMedicationToMember(selectedMember.id, personalMedicationForm.name.trim())

    const currentMeds = selectedMember.medications || []
    const newIdGuess = currentMeds[currentMeds.length - 1]?.id

    if (newIdGuess) {
      updateMedicationFromMember(selectedMember.id, newIdGuess, {
        name: personalMedicationForm.name.trim(),
        dosage: personalMedicationForm.dosage.trim(),
        schedule: personalMedicationForm.schedule.trim(),
        indication: personalMedicationForm.indication.trim(),
        notes: personalMedicationForm.notes.trim(),
      })
    }

    setTimeout(() => {
      const latestMember =
        familyMembers.find((member) => member.id === selectedMember.id) || selectedMember
      const latestMedication = latestMember.medications?.[latestMember.medications.length - 1]
      if (latestMedication) {
        updateMedicationFromMember(selectedMember.id, latestMedication.id, {
          name: personalMedicationForm.name.trim(),
          dosage: personalMedicationForm.dosage.trim(),
          schedule: personalMedicationForm.schedule.trim(),
          indication: personalMedicationForm.indication.trim(),
          notes: personalMedicationForm.notes.trim(),
        })
      }
    }, 0)

    setPersonalMedicationForm({
      name: '',
      dosage: '',
      schedule: '',
      indication: '',
      notes: '',
    })
  }

  const handleAddVisit = (event) => {
    event.preventDefault()
    if (!selectedMember || !visitForm.title.trim()) return

    updateHealth((prev) => ({
      ...prev,
      specialistVisits: [
        ...prev.specialistVisits,
        {
          id: uid('visit'),
          memberId: selectedMember.id,
          title: visitForm.title.trim(),
          specialty: visitForm.specialty.trim(),
          date: visitForm.date,
          doctor: visitForm.doctor.trim(),
          location: visitForm.location.trim(),
          googleCalendarUrl: visitForm.googleCalendarUrl.trim(),
          driveLinks: visitForm.driveUrl.trim()
            ? [{ id: uid('lnk'), label: 'Drive', url: visitForm.driveUrl.trim() }]
            : [],
          notes: visitForm.notes.trim(),
        },
      ],
    }))

    setVisitForm({
      title: '',
      specialty: '',
      date: '',
      doctor: '',
      location: '',
      googleCalendarUrl: '',
      driveUrl: '',
      notes: '',
    })
  }

  const handleDeleteVisit = (visitId) => {
    updateHealth((prev) => ({
      ...prev,
      specialistVisits: prev.specialistVisits.filter((visit) => visit.id !== visitId),
      visitTherapies: prev.visitTherapies.filter((therapy) => therapy.visitId !== visitId),
      therapyMedications: prev.therapyMedications.filter((row) => row.visitId !== visitId),
    }))
  }

  const handleAddTherapy = (event) => {
    event.preventDefault()
    if (!selectedMember || !therapyForm.title.trim()) return

    updateHealth((prev) => ({
      ...prev,
      visitTherapies: [
        ...prev.visitTherapies,
        {
          id: uid('therapy'),
          memberId: selectedMember.id,
          visitId: therapyForm.visitId,
          title: therapyForm.title.trim(),
          startDate: therapyForm.startDate,
          endDate: therapyForm.endDate,
          prescribingDoctor: therapyForm.prescribingDoctor.trim(),
          driveLinks: therapyForm.driveUrl.trim()
            ? [{ id: uid('lnk'), label: 'Drive', url: therapyForm.driveUrl.trim() }]
            : [],
          notes: therapyForm.notes.trim(),
        },
      ],
    }))

    setTherapyForm({
      visitId: '',
      title: '',
      startDate: '',
      endDate: '',
      prescribingDoctor: '',
      driveUrl: '',
      notes: '',
    })
  }

  const handleDeleteTherapy = (therapyId) => {
    updateHealth((prev) => ({
      ...prev,
      visitTherapies: prev.visitTherapies.filter((therapy) => therapy.id !== therapyId),
      therapyMedications: prev.therapyMedications.filter((row) => row.therapyId !== therapyId),
    }))
  }

  const handleAddTherapyMedication = (event) => {
    event.preventDefault()
    if (!selectedMember || !therapyMedicationForm.medication.trim()) return

    const therapy = memberTherapies.find((item) => item.id === therapyMedicationForm.therapyId)

    updateHealth((prev) => ({
      ...prev,
      therapyMedications: [
        ...prev.therapyMedications,
        {
          id: uid('tmed'),
          memberId: selectedMember.id,
          visitId: therapy?.visitId || '',
          therapyId: therapyMedicationForm.therapyId,
          medication: therapyMedicationForm.medication.trim(),
          dosage: therapyMedicationForm.dosage.trim(),
          frequency: therapyMedicationForm.frequency.trim(),
          timeSlots: therapyMedicationForm.timeSlots.trim(),
          notes: therapyMedicationForm.notes.trim(),
        },
      ],
    }))

    setTherapyMedicationForm({
      therapyId: '',
      medication: '',
      dosage: '',
      frequency: '',
      timeSlots: '',
      notes: '',
    })
  }

  const handleDeleteTherapyMedication = (medicationId) => {
    updateHealth((prev) => ({
      ...prev,
      therapyMedications: prev.therapyMedications.filter((item) => item.id !== medicationId),
    }))
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Salute</div>
          <h1>Caricamento schede sanitarie…</h1>
          <p className="page-subtitle">Sto caricando anagrafiche, farmaci, visite e terapie.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Salute</div>
        <h1>Scheda sanitaria sintetica</h1>
        <p className="page-subtitle">
          Ogni componente ha una vista breve, con tabelle separate per dati inseriti e moduli di
          aggiunta.
        </p>
        {syncError ? <div className="app-status">{syncError}</div> : null}
      </section>

      <section className="card stack-card">
        <div className="page-header">
          <div>
            <div className="card-title">Componenti famiglia</div>
            <div className="card-subtitle">Seleziona la persona da gestire.</div>
          </div>
        </div>

        <div className="family-switcher">
          {familyMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`member-chip ${selectedMemberId === member.id ? 'active' : ''}`}
              onClick={() => setSelectedMemberId(member.id)}
            >
              <span className="chip-avatar">{member.initials || member.name?.slice(0, 2) || 'FM'}</span>
              <span>{memberLabel(member)}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedMember ? (
        <>
          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Panoramica componente famiglia</div>
                <div className="card-subtitle">
                  Vista breve del profilo sanitario di {memberLabel(selectedMember)}.
                </div>
              </div>
            </div>

            <div className="grid-cards responsive-3">
              <div className="widget-card">
                <div className="widget-label">Farmaci personali</div>
                <div className="widget-value">{summary.medications}</div>
              </div>
              <div className="widget-card">
                <div className="widget-label">Visite registrate</div>
                <div className="widget-value">{summary.visits}</div>
              </div>
              <div className="widget-card">
                <div className="widget-label">Terapie registrate</div>
                <div className="widget-value">{summary.therapies}</div>
                <div className="widget-sub">
                  Prossima visita: {summary.nextVisit ? fmt(summary.nextVisit.date) : '—'}
                </div>
              </div>
            </div>
          </section>

          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Dati sintetici</div>
                <div className="card-subtitle">
                  Campi essenziali soltanto, senza scheda lunga dispersiva.
                </div>
              </div>
            </div>

            <div className="form-area">
              <div className="form-grid">
                <label className="fg">
                  <span className="fl">Data di nascita</span>
                  <input
                    className="fi"
                    type="date"
                    value={selectedMember.birthDate || ''}
                    onChange={(e) => handleMemberField('birthDate', e.target.value)}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Gruppo sanguigno</span>
                  <input
                    className="fi"
                    value={selectedMember.bloodGroup || ''}
                    onChange={(e) => handleMemberField('bloodGroup', e.target.value)}
                    placeholder="Es. 0+"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Medico curante</span>
                  <input
                    className="fi"
                    value={selectedMember.doctor || ''}
                    onChange={(e) => handleMemberField('doctor', e.target.value)}
                    placeholder="Nome medico"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Pediatra</span>
                  <input
                    className="fi"
                    value={selectedMember.pediatrician || ''}
                    onChange={(e) => handleMemberField('pediatrician', e.target.value)}
                    placeholder="Solo se serve"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Allergie</span>
                  <textarea
                    className="fi"
                    value={selectedMember.allergies || ''}
                    onChange={(e) => handleMemberField('allergies', e.target.value)}
                    placeholder="Allergie rilevanti"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Patologie croniche</span>
                  <textarea
                    className="fi"
                    value={selectedMember.chronicConditions || ''}
                    onChange={(e) => handleMemberField('chronicConditions', e.target.value)}
                    placeholder="Condizioni croniche"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Note emergenza</span>
                  <textarea
                    className="fi"
                    value={selectedMember.emergencyNotes || ''}
                    onChange={(e) => handleMemberField('emergencyNotes', e.target.value)}
                    placeholder="Informazioni importanti"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Farmaci personali inseriti</div>
                <div className="card-subtitle">
                  Dopo l’inserimento vengono mostrati solo in forma tabellare sintetica.
                </div>
              </div>
            </div>

            <div className="data-area">
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Farmaco</th>
                      <th>Dosaggio</th>
                      <th>Frequenza</th>
                      <th>Indicazione</th>
                      <th>Note</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePersonalMedications.length ? (
                      activePersonalMedications.map((med) => (
                        <tr key={med.id}>
                          <td>{med.name || '—'}</td>
                          <td>{med.dosage || '—'}</td>
                          <td>{med.schedule || '—'}</td>
                          <td>{med.indication || '—'}</td>
                          <td>{med.notes || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-d btn-s"
                              onClick={() => deleteMedicationFromMember(selectedMember.id, med.id)}
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          <div className="empty">Nessun farmaco personale inserito.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-area">
              <div className="card-title">Nuovo farmaco personale</div>
              <div className="card-subtitle">
                Il modulo è separato dai dati già inseriti.
              </div>

              <form className="form-shell form-grid" onSubmit={handleAddPersonalMedication}>
                <label className="fg">
                  <span className="fl">
                    Farmaco <span className="required">*</span>
                  </span>
                  <input
                    className="fi"
                    value={personalMedicationForm.name}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Es. Allopurinolo"
                    required
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
                    placeholder="Es. 100 mg"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Frequenza</span>
                  <input
                    className="fi"
                    value={personalMedicationForm.schedule}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({ ...prev, schedule: e.target.value }))
                    }
                    placeholder="Es. Mattina"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Indicazione</span>
                  <input
                    className="fi"
                    value={personalMedicationForm.indication}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({ ...prev, indication: e.target.value }))
                    }
                    placeholder="A cosa serve"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Note</span>
                  <textarea
                    className="fi"
                    value={personalMedicationForm.notes}
                    onChange={(e) =>
                      setPersonalMedicationForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Note utili"
                  />
                </label>

                <div className="responsive-full actions-row">
                  <button type="submit" className="btn btn-p">
                    + Salva farmaco
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Visite specialistiche inserite</div>
                <div className="card-subtitle">
                  Tabella dati separata dal modulo di inserimento.
                </div>
              </div>
            </div>

            <div className="data-area">
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Visita</th>
                      <th>Specialità</th>
                      <th>Data</th>
                      <th>Medico</th>
                      <th>Luogo</th>
                      <th>Drive</th>
                      <th>Calendar</th>
                      <th>Stato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberVisits.length ? (
                      memberVisits.map((visit) => {
                        const firstLink = visit.driveLinks?.[0]?.url || ''
                        const days = daysBetween(visit.date)
                        return (
                          <tr key={visit.id}>
                            <td>{visit.title || '—'}</td>
                            <td>{visit.specialty || '—'}</td>
                            <td>{fmt(visit.date)}</td>
                            <td>{visit.doctor || '—'}</td>
                            <td>{visit.location || '—'}</td>
                            <td>
                              {firstLink ? (
                                <a
                                  className="drive-link"
                                  href={firstLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Apri link
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              {visit.googleCalendarUrl || visit.date ? (
                                <a
                                  className="drive-link"
                                  href={
                                    visit.googleCalendarUrl ||
                                    calendarLink({
                                      title: visit.title,
                                      date: visit.date,
                                      details: visit.notes || visit.specialty,
                                    })
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Google Calendar
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <span className={`badge ${statusBadge(days)}`}>
                                {statusText(days)}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-d btn-s"
                                onClick={() => handleDeleteVisit(visit.id)}
                              >
                                Elimina
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="9">
                          <div className="empty">Nessuna visita specialistica inserita.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-area">
              <div className="card-title">Nuova visita specialistica</div>
              <div className="card-subtitle">Aggiungi una visita per {memberLabel(selectedMember)}.</div>

              <form className="form-shell form-grid" onSubmit={handleAddVisit}>
                <label className="fg">
                  <span className="fl">
                    Titolo visita <span className="required">*</span>
                  </span>
                  <input
                    className="fi"
                    value={visitForm.title}
                    onChange={(e) => setVisitForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Es. Controllo cardiologico"
                    required
                  />
                </label>

                <label className="fg">
                  <span className="fl">Specialità</span>
                  <input
                    className="fi"
                    value={visitForm.specialty}
                    onChange={(e) =>
                      setVisitForm((prev) => ({ ...prev, specialty: e.target.value }))
                    }
                    placeholder="Es. Cardiologia"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Data visita</span>
                  <input
                    className="fi"
                    type="date"
                    value={visitForm.date}
                    onChange={(e) => setVisitForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Medico</span>
                  <input
                    className="fi"
                    value={visitForm.doctor}
                    onChange={(e) => setVisitForm((prev) => ({ ...prev, doctor: e.target.value }))}
                    placeholder="Nome medico"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Luogo</span>
                  <input
                    className="fi"
                    value={visitForm.location}
                    onChange={(e) =>
                      setVisitForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="Clinica, studio, ospedale"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Link Google Calendar</span>
                  <input
                    className="fi"
                    value={visitForm.googleCalendarUrl}
                    onChange={(e) =>
                      setVisitForm((prev) => ({ ...prev, googleCalendarUrl: e.target.value }))
                    }
                    placeholder="https://calendar.google.com/..."
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Link Drive / PDF referto</span>
                  <input
                    className="fi"
                    value={visitForm.driveUrl}
                    onChange={(e) =>
                      setVisitForm((prev) => ({ ...prev, driveUrl: e.target.value }))
                    }
                    placeholder="https://drive.google.com/..."
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Note</span>
                  <textarea
                    className="fi"
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Note sintetiche"
                  />
                </label>

                <div className="responsive-full actions-row">
                  <button type="submit" className="btn btn-p">
                    + Salva visita
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Terapie inserite</div>
                <div className="card-subtitle">
                  Ogni terapia è collegata a una visita specialistica.
                </div>
              </div>
            </div>

            <div className="data-area">
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Terapia</th>
                      <th>Visita collegata</th>
                      <th>Inizio</th>
                      <th>Fine</th>
                      <th>Medico</th>
                      <th>Drive</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberTherapies.length ? (
                      memberTherapies.map((therapy) => {
                        const firstLink = therapy.driveLinks?.[0]?.url || ''
                        return (
                          <tr key={therapy.id}>
                            <td>{therapy.title || '—'}</td>
                            <td>{visitMap[therapy.visitId]?.title || '—'}</td>
                            <td>{fmt(therapy.startDate)}</td>
                            <td>{fmt(therapy.endDate)}</td>
                            <td>{therapy.prescribingDoctor || '—'}</td>
                            <td>
                              {firstLink ? (
                                <a
                                  className="drive-link"
                                  href={firstLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Apri link
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-d btn-s"
                                onClick={() => handleDeleteTherapy(therapy.id)}
                              >
                                Elimina
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="7">
                          <div className="empty">Nessuna terapia inserita.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-area">
              <div className="card-title">Nuova terapia</div>
              <div className="card-subtitle">
                Il form è separato dalla tabella delle terapie già presenti.
              </div>

              <form className="form-shell form-grid" onSubmit={handleAddTherapy}>
                <label className="fg">
                  <span className="fl">Visita collegata</span>
                  <select
                    className="fi"
                    value={therapyForm.visitId}
                    onChange={(e) =>
                      setTherapyForm((prev) => ({ ...prev, visitId: e.target.value }))
                    }
                  >
                    <option value="">Seleziona visita</option>
                    {memberVisits.map((visit) => (
                      <option key={visit.id} value={visit.id}>
                        {visit.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fg">
                  <span className="fl">
                    Titolo terapia <span className="required">*</span>
                  </span>
                  <input
                    className="fi"
                    value={therapyForm.title}
                    onChange={(e) =>
                      setTherapyForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Es. Terapia post visita"
                    required
                  />
                </label>

                <label className="fg">
                  <span className="fl">Data inizio</span>
                  <input
                    className="fi"
                    type="date"
                    value={therapyForm.startDate}
                    onChange={(e) =>
                      setTherapyForm((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Data fine</span>
                  <input
                    className="fi"
                    type="date"
                    value={therapyForm.endDate}
                    onChange={(e) =>
                      setTherapyForm((prev) => ({ ...prev, endDate: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Medico prescrittore</span>
                  <input
                    className="fi"
                    value={therapyForm.prescribingDoctor}
                    onChange={(e) =>
                      setTherapyForm((prev) => ({
                        ...prev,
                        prescribingDoctor: e.target.value,
                      }))
                    }
                    placeholder="Nome medico"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Link Drive</span>
                  <input
                    className="fi"
                    value={therapyForm.driveUrl}
                    onChange={(e) =>
                      setTherapyForm((prev) => ({ ...prev, driveUrl: e.target.value }))
                    }
                    placeholder="https://drive.google.com/..."
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Note</span>
                  <textarea
                    className="fi"
                    value={therapyForm.notes}
                    onChange={(e) =>
                      setTherapyForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Note terapia"
                  />
                </label>

                <div className="responsive-full actions-row">
                  <button type="submit" className="btn btn-p">
                    + Salva terapia
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="card stack-card">
            <div className="page-header">
              <div>
                <div className="card-title">Farmaci legati alle terapie</div>
                <div className="card-subtitle">
                  Vista tabellare breve dei farmaci assegnati alle terapie.
                </div>
              </div>
            </div>

            <div className="data-area">
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Farmaco</th>
                      <th>Terapia</th>
                      <th>Visita</th>
                      <th>Dosaggio</th>
                      <th>Frequenza</th>
                      <th>Orari</th>
                      <th>Note</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberTherapyMedications.length ? (
                      memberTherapyMedications.map((row) => (
                        <tr key={row.id}>
                          <td>{row.medication || '—'}</td>
                          <td>{therapyMap[row.therapyId]?.title || '—'}</td>
                          <td>{visitMap[row.visitId]?.title || '—'}</td>
                          <td>{row.dosage || '—'}</td>
                          <td>{row.frequency || '—'}</td>
                          <td>{row.timeSlots || '—'}</td>
                          <td>{row.notes || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-d btn-s"
                              onClick={() => handleDeleteTherapyMedication(row.id)}
                            >
                              Elimina
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8">
                          <div className="empty">Nessun farmaco terapia inserito.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-area">
              <div className="card-title">Nuovo farmaco per terapia</div>
              <div className="card-subtitle">Compilazione separata dalla tabella dati.</div>

              <form className="form-shell form-grid" onSubmit={handleAddTherapyMedication}>
                <label className="fg">
                  <span className="fl">Terapia</span>
                  <select
                    className="fi"
                    value={therapyMedicationForm.therapyId}
                    onChange={(e) =>
                      setTherapyMedicationForm((prev) => ({
                        ...prev,
                        therapyId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Seleziona terapia</option>
                    {memberTherapies.map((therapy) => (
                      <option key={therapy.id} value={therapy.id}>
                        {therapy.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fg">
                  <span className="fl">
                    Farmaco <span className="required">*</span>
                  </span>
                  <input
                    className="fi"
                    value={therapyMedicationForm.medication}
                    onChange={(e) =>
                      setTherapyMedicationForm((prev) => ({
                        ...prev,
                        medication: e.target.value,
                      }))
                    }
                    placeholder="Nome farmaco"
                    required
                  />
                </label>

                <label className="fg">
                  <span className="fl">Dosaggio</span>
                  <input
                    className="fi"
                    value={therapyMedicationForm.dosage}
                    onChange={(e) =>
                      setTherapyMedicationForm((prev) => ({
                        ...prev,
                        dosage: e.target.value,
                      }))
                    }
                    placeholder="Es. 1 compressa"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Frequenza</span>
                  <input
                    className="fi"
                    value={therapyMedicationForm.frequency}
                    onChange={(e) =>
                      setTherapyMedicationForm((prev) => ({
                        ...prev,
                        frequency: e.target.value,
                      }))
                    }
                    placeholder="Es. 2 volte al giorno"
                  />
                </label>

                <label className="fg">
                  <span className="fl">Orari</span>
                  <input
                    className="fi"
                    value={therapyMedicationForm.timeSlots}
                    onChange={(e) =>
                      setTherapyMedicationForm((prev) => ({
                        ...prev,
                        timeSlots: e.target.value,
                      }))
                    }
                    placeholder="Es. 08:00, 20:00"
                  />
                </label>

                <label className="fg responsive-full">
                  <span className="fl">Note</span>
                  <textarea
                    className="fi"
                    value={therapyMedicationForm.notes}
                    onChange={(e) =>
                      setTherapyMedicationForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    placeholder="Note farmaco"
                  />
                </label>

                <div className="responsive-full actions-row">
                  <button type="submit" className="btn btn-p">
                    + Salva farmaco terapia
                  </button>
                </div>
              </form>
            </div>
          </section>
        </>
      ) : (
        <section className="card">
          <div className="empty">Nessun componente famiglia disponibile.</div>
        </section>
      )}
    </div>
  )
}
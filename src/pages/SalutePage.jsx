import { useState } from 'react'
import { useAppContext } from '../context/AppContext'

export default function SalutePage() {
  const { familyMembers, healthTables, updateFamilyMember, addMedicationToMember, deleteMedicationFromMember } = useAppContext()
  const [selectedId, setSelectedId] = useState(familyMembers[0]?.id)
  const member = familyMembers.find((item) => item.id === selectedId) || familyMembers[0]

  const onField = (field, value) => updateFamilyMember(member.id, { [field]: value })

  return (
    <div className="page-stack">
      <section className="hero-card health-hero">
        <div>
          <div className="eyebrow">Salute & Terapie</div>
          <h1>Famiglia e dati utili per terapie farmacologiche</h1>
          <p>Una scheda completa per ogni membro, con dati sanitari, contatti, allergie, terapie in corso, documenti e promemoria.</p>
        </div>
      </section>

      <section className="family-switcher">
        {familyMembers.map((item) => (
          <button key={item.id} className={`member-chip ${selectedId === item.id ? 'active' : ''}`} onClick={() => setSelectedId(item.id)}>{item.initials}<span>{item.name}</span></button>
        ))}
      </section>

      {member && (
        <section className="grid-cards cols-2">
          <div className="card stack-card">
            <div className="card-title">Scheda anagrafica e sanitaria</div>
            <div className="form-grid">
              {[
                ['name','Nome e cognome'],['role','Ruolo'],['birthDate','Data nascita'],['bloodGroup','Gruppo sanguigno'],['fiscalCode','Codice fiscale'],['phone','Telefono'],['email','Email'],['doctor','Medico curante'],['pediatrician','Pediatra'],['allergies','Allergie'],['chronicConditions','Patologie croniche'],['currentTherapies','Terapie in corso'],['emergencyNotes','Note emergenza']
              ].map(([field,label]) => (
                <label key={field} className="fg"><span className="fl">{label}</span><input className="fi" value={member[field] || ''} onChange={(e) => onField(field, e.target.value)} /></label>
              ))}
            </div>
          </div>

          <div className="card stack-card">
            <div className="card-title">Documenti e terapia</div>
            <div className="form-grid">
              {[
                ['idCard','Carta identità'],['passport','Passaporto'],['healthCard','Tessera sanitaria'],['drivingLicense','Patente']
              ].map(([field,label]) => (
                <label key={field} className="fg"><span className="fl">{label}</span><input className="fi" value={member.documents?.[field] || ''} onChange={(e) => updateFamilyMember(member.id, { documents: { ...member.documents, [field]: e.target.value } })} /></label>
              ))}
            </div>
            <div className="subsection">
              <div className="subsection-head between wrap"><h4>Farmaci personali</h4><button className="btn btn-s" onClick={() => addMedicationToMember(member.id, {})}>+ Aggiungi farmaco</button></div>
              <div className="timeline-list">
                {(member.medications || []).map((med) => (
                  <div key={med.id} className="timeline-item meds-item"><div><strong>{med.name || 'Farmaco'}</strong><div className="muted">Dose: {med.dosage || '—'} · Frequenza: {med.schedule || '—'}</div><div className="muted">Indicazione: {med.indication || '—'}</div></div><button className="btn btn-s btn-d" onClick={() => deleteMedicationFromMember(member.id, med.id)}>Elimina</button></div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="grid-cards cols-2">
        <div className="card stack-card"><div className="card-title">Tabella terapie</div><div className="table-wrap"><table className="data-table"><thead><tr><th>Membro</th><th>Farmaco</th><th>Frequenza</th><th>Orari</th><th>Medico</th></tr></thead><tbody>{healthTables.therapies.map((row) => <tr key={row.id}><td>{familyMembers.find((m) => m.id === row.memberId)?.initials || row.memberId}</td><td>{row.medication}</td><td>{row.frequency}</td><td>{row.timeSlots}</td><td>{row.prescribingDoctor}</td></tr>)}</tbody></table></div></div>
        <div className="card stack-card"><div className="card-title">Visite e controlli</div><div className="table-wrap"><table className="data-table"><thead><tr><th>Membro</th><th>Tipo</th><th>Data</th><th>Medico</th><th>Luogo</th></tr></thead><tbody>{healthTables.appointments.map((row) => <tr key={row.id}><td>{familyMembers.find((m) => m.id === row.memberId)?.initials || row.memberId}</td><td>{row.type}</td><td>{row.date}</td><td>{row.doctor}</td><td>{row.location}</td></tr>)}</tbody></table></div></div>
      </section>
    </div>
  )
}

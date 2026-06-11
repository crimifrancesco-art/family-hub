import { useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'

const emptyMemberForm = {
  initials: '',
  name: '',
  role: '',
  relationship: '',
  birthDate: '',
  bloodGroup: '',
  fiscalCode: '',
  phone: '',
  email: '',
  doctor: '',
  pediatrician: '',
  allergies: '',
  chronicConditions: '',
  currentTherapies: '',
  emergencyNotes: '',
  conditions: '',
  emergencyContact: '',
  healthId: '',
  healthNotes: '',
  documents: {
    idCard: '',
    passport: '',
    healthCard: '',
    drivingLicense: '',
  },
}

const emptyDocumentForm = {
  category: 'Identità',
  categoryId: 'cat_identity',
  owner: '',
  ownerId: '',
  title: '',
  number: '',
  issueDate: '',
  expiryDate: '',
  storage: '',
  driveLinksText: '',
  notes: '',
}

const emptyWarrantyForm = {
  item: '',
  brand: '',
  purchaseDate: '',
  expiryDate: '',
  invoiceRef: '',
  driveLinksText: '',
  notes: '',
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function formatDate(value) {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function driveLinksToText(links) {
  return ensureArray(links)
    .map((entry) => {
      if (typeof entry === 'string') return entry
      return entry?.url || ''
    })
    .filter(Boolean)
    .join('\n')
}

function textToDriveLinks(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => ({
      id: uid('lnk'),
      label: '',
      url,
    }))
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="arch-section-head">
      <div>
        <div className="arch-section-title">{title}</div>
        {subtitle ? <div className="arch-section-subtitle">{subtitle}</div> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

function FieldError({ text }) {
  if (!text) return null
  return <div className="error-msg" style={{ marginTop: 8 }}>{text}</div>
}

export default function ArchivioPage() {
  const {
    familyMembers,
    archiveTables,
    loadingData,
    syncError,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    updateArchive,
  } = useAppContext()

  const [memberForm, setMemberForm] = useState(emptyMemberForm)
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm)
  const [warrantyForm, setWarrantyForm] = useState(emptyWarrantyForm)

  const [memberError, setMemberError] = useState('')
  const [documentError, setDocumentError] = useState('')
  const [warrantyError, setWarrantyError] = useState('')

  const [memberSearch, setMemberSearch] = useState('')
  const [archiveView, setArchiveView] = useState('documents')

  const [editingMemberId, setEditingMemberId] = useState('')
  const [editingDocumentId, setEditingDocumentId] = useState('')
  const [editingWarrantyId, setEditingWarrantyId] = useState('')

  const [editMemberForm, setEditMemberForm] = useState(emptyMemberForm)
  const [editDocumentForm, setEditDocumentForm] = useState(emptyDocumentForm)
  const [editWarrantyForm, setEditWarrantyForm] = useState(emptyWarrantyForm)

  const members = ensureArray(familyMembers)
  const categories = ensureArray(archiveTables?.categories)
  const documents = ensureArray(archiveTables?.documents)
  const warranties = ensureArray(archiveTables?.warranties)

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    return members.filter((member) => {
      if (!q) return true
      const haystack = [
        member.initials,
        member.name,
        member.role,
        member.relationship,
        member.phone,
        member.email,
        member.fiscalCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [members, memberSearch])

  const archiveStats = useMemo(() => {
    return {
      members: members.length,
      categories: categories.length,
      documents: documents.length,
      warranties: warranties.length,
    }
  }, [members, categories, documents, warranties])

  const handleMemberFormChange = (field, value) => {
    setMemberForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleMemberDocumentChange = (field, value, mode = 'create') => {
    if (mode === 'edit') {
      setEditMemberForm((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [field]: value,
        },
      }))
      return
    }

    setMemberForm((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: value,
      },
    }))
  }

  const handleAddMember = (event) => {
    event.preventDefault()
    setMemberError('')

    if (!memberForm.name.trim()) {
      setMemberError('Il nome del componente famiglia è obbligatorio.')
      return
    }

    addFamilyMember({
      ...memberForm,
      initials: memberForm.initials.trim(),
      name: memberForm.name.trim(),
      role: memberForm.role.trim(),
      relationship: memberForm.relationship.trim(),
      bloodGroup: memberForm.bloodGroup.trim(),
      fiscalCode: memberForm.fiscalCode.trim(),
      phone: memberForm.phone.trim(),
      email: memberForm.email.trim(),
      doctor: memberForm.doctor.trim(),
      pediatrician: memberForm.pediatrician.trim(),
      allergies: memberForm.allergies.trim(),
      chronicConditions: memberForm.chronicConditions.trim(),
      currentTherapies: memberForm.currentTherapies.trim(),
      emergencyNotes: memberForm.emergencyNotes.trim(),
      conditions: memberForm.conditions.trim(),
      emergencyContact: memberForm.emergencyContact.trim(),
      healthId: memberForm.healthId.trim(),
      healthNotes: memberForm.healthNotes.trim(),
      medications: [],
      documents: {
        idCard: memberForm.documents.idCard.trim(),
        passport: memberForm.documents.passport.trim(),
        healthCard: memberForm.documents.healthCard.trim(),
        drivingLicense: memberForm.documents.drivingLicense.trim(),
      },
    })

    setMemberForm(emptyMemberForm)
  }

  const startEditMember = (member) => {
    setEditingMemberId(member.id)
    setEditMemberForm({
      initials: member.initials || '',
      name: member.name || '',
      role: member.role || '',
      relationship: member.relationship || '',
      birthDate: member.birthDate || '',
      bloodGroup: member.bloodGroup || '',
      fiscalCode: member.fiscalCode || '',
      phone: member.phone || '',
      email: member.email || '',
      doctor: member.doctor || '',
      pediatrician: member.pediatrician || '',
      allergies: member.allergies || '',
      chronicConditions: member.chronicConditions || '',
      currentTherapies: member.currentTherapies || '',
      emergencyNotes: member.emergencyNotes || '',
      conditions: member.conditions || '',
      emergencyContact: member.emergencyContact || '',
      healthId: member.healthId || '',
      healthNotes: member.healthNotes || '',
      documents: {
        idCard: member.documents?.idCard || '',
        passport: member.documents?.passport || '',
        healthCard: member.documents?.healthCard || '',
        drivingLicense: member.documents?.drivingLicense || '',
      },
    })
  }

  const saveEditMember = (memberId) => {
    if (!editMemberForm.name.trim()) {
      setMemberError('Il nome del componente famiglia è obbligatorio.')
      return
    }

    updateFamilyMember(memberId, {
      initials: editMemberForm.initials.trim(),
      name: editMemberForm.name.trim(),
      role: editMemberForm.role.trim(),
      relationship: editMemberForm.relationship.trim(),
      birthDate: editMemberForm.birthDate,
      bloodGroup: editMemberForm.bloodGroup.trim(),
      fiscalCode: editMemberForm.fiscalCode.trim(),
      phone: editMemberForm.phone.trim(),
      email: editMemberForm.email.trim(),
      doctor: editMemberForm.doctor.trim(),
      pediatrician: editMemberForm.pediatrician.trim(),
      allergies: editMemberForm.allergies.trim(),
      chronicConditions: editMemberForm.chronicConditions.trim(),
      currentTherapies: editMemberForm.currentTherapies.trim(),
      emergencyNotes: editMemberForm.emergencyNotes.trim(),
      conditions: editMemberForm.conditions.trim(),
      emergencyContact: editMemberForm.emergencyContact.trim(),
      healthId: editMemberForm.healthId.trim(),
      healthNotes: editMemberForm.healthNotes.trim(),
      documents: {
        idCard: editMemberForm.documents.idCard.trim(),
        passport: editMemberForm.documents.passport.trim(),
        healthCard: editMemberForm.documents.healthCard.trim(),
        drivingLicense: editMemberForm.documents.drivingLicense.trim(),
      },
    })

    setEditingMemberId('')
    setEditMemberForm(emptyMemberForm)
  }

  const handleDeleteMember = (memberId) => {
    deleteFamilyMember(memberId)
    if (editingMemberId === memberId) {
      setEditingMemberId('')
      setEditMemberForm(emptyMemberForm)
    }
  }

  const handleAddDocument = (event) => {
    event.preventDefault()
    setDocumentError('')

    if (!documentForm.title.trim()) {
      setDocumentError('Il titolo del documento è obbligatorio.')
      return
    }

    updateArchive((current) => ({
      ...current,
      documents: [
        ...ensureArray(current.documents),
        {
          id: uid('doc'),
          category: documentForm.category,
          categoryId: documentForm.categoryId,
          owner: documentForm.owner.trim(),
          ownerId: documentForm.ownerId,
          title: documentForm.title.trim(),
          number: documentForm.number.trim(),
          issueDate: documentForm.issueDate,
          expiryDate: documentForm.expiryDate,
          storage: documentForm.storage.trim(),
          driveLinks: textToDriveLinks(documentForm.driveLinksText),
          notes: documentForm.notes.trim(),
        },
      ],
    }))

    setDocumentForm(emptyDocumentForm)
  }

  const startEditDocument = (item) => {
    setEditingDocumentId(item.id)
    setEditDocumentForm({
      category: item.category || 'Identità',
      categoryId: item.categoryId || 'cat_identity',
      owner: item.owner || '',
      ownerId: item.ownerId || '',
      title: item.title || '',
      number: item.number || '',
      issueDate: item.issueDate || '',
      expiryDate: item.expiryDate || '',
      storage: item.storage || '',
      driveLinksText: driveLinksToText(item.driveLinks),
      notes: item.notes || '',
    })
  }

  const saveEditDocument = (documentId) => {
    if (!editDocumentForm.title.trim()) {
      setDocumentError('Il titolo del documento è obbligatorio.')
      return
    }

    updateArchive((current) => ({
      ...current,
      documents: ensureArray(current.documents).map((row) =>
        row.id === documentId
          ? {
              ...row,
              category: editDocumentForm.category,
              categoryId: editDocumentForm.categoryId,
              owner: editDocumentForm.owner.trim(),
              ownerId: editDocumentForm.ownerId,
              title: editDocumentForm.title.trim(),
              number: editDocumentForm.number.trim(),
              issueDate: editDocumentForm.issueDate,
              expiryDate: editDocumentForm.expiryDate,
              storage: editDocumentForm.storage.trim(),
              driveLinks: textToDriveLinks(editDocumentForm.driveLinksText),
              notes: editDocumentForm.notes.trim(),
            }
          : row,
      ),
    }))

    setEditingDocumentId('')
    setEditDocumentForm(emptyDocumentForm)
  }

  const deleteDocument = (documentId) => {
    updateArchive((current) => ({
      ...current,
      documents: ensureArray(current.documents).filter((row) => row.id !== documentId),
    }))

    if (editingDocumentId === documentId) {
      setEditingDocumentId('')
      setEditDocumentForm(emptyDocumentForm)
    }
  }

  const handleAddWarranty = (event) => {
    event.preventDefault()
    setWarrantyError('')

    if (!warrantyForm.item.trim()) {
      setWarrantyError('Il nome della garanzia o prodotto è obbligatorio.')
      return
    }

    updateArchive((current) => ({
      ...current,
      warranties: [
        ...ensureArray(current.warranties),
        {
          id: uid('war'),
          item: warrantyForm.item.trim(),
          brand: warrantyForm.brand.trim(),
          purchaseDate: warrantyForm.purchaseDate,
          expiryDate: warrantyForm.expiryDate,
          invoiceRef: warrantyForm.invoiceRef.trim(),
          driveLinks: textToDriveLinks(warrantyForm.driveLinksText),
          notes: warrantyForm.notes.trim(),
        },
      ],
    }))

    setWarrantyForm(emptyWarrantyForm)
  }

  const startEditWarranty = (item) => {
    setEditingWarrantyId(item.id)
    setEditWarrantyForm({
      item: item.item || '',
      brand: item.brand || '',
      purchaseDate: item.purchaseDate || '',
      expiryDate: item.expiryDate || '',
      invoiceRef: item.invoiceRef || '',
      driveLinksText: driveLinksToText(item.driveLinks),
      notes: item.notes || '',
    })
  }

  const saveEditWarranty = (warrantyId) => {
    if (!editWarrantyForm.item.trim()) {
      setWarrantyError('Il nome della garanzia o prodotto è obbligatorio.')
      return
    }

    updateArchive((current) => ({
      ...current,
      warranties: ensureArray(current.warranties).map((row) =>
        row.id === warrantyId
          ? {
              ...row,
              item: editWarrantyForm.item.trim(),
              brand: editWarrantyForm.brand.trim(),
              purchaseDate: editWarrantyForm.purchaseDate,
              expiryDate: editWarrantyForm.expiryDate,
              invoiceRef: editWarrantyForm.invoiceRef.trim(),
              driveLinks: textToDriveLinks(editWarrantyForm.driveLinksText),
              notes: editWarrantyForm.notes.trim(),
            }
          : row,
      ),
    }))

    setEditingWarrantyId('')
    setEditWarrantyForm(emptyWarrantyForm)
  }

  const deleteWarranty = (warrantyId) => {
    updateArchive((current) => ({
      ...current,
      warranties: ensureArray(current.warranties).filter((row) => row.id !== warrantyId),
    }))

    if (editingWarrantyId === warrantyId) {
      setEditingWarrantyId('')
      setEditWarrantyForm(emptyWarrantyForm)
    }
  }

  if (loadingData) {
    return (
      <div className="arch-page">
        <div className="card">
          <div className="page-title">Archivio</div>
          <p className="page-subtitle">Sto caricando archivio e anagrafica famiglia.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="arch-page">
      <style>{`
        .arch-page {
          display: grid;
          gap: 14px;
        }

        .arch-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .arch-stat {
          border-radius: 18px;
          padding: 14px;
          border: 1px solid rgba(120, 138, 164, 0.12);
          background: rgba(255,255,255,0.92);
          display: grid;
          gap: 6px;
        }

        .arch-stat-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted, #667085);
          font-weight: 700;
        }

        .arch-stat-value {
          font-size: 28px;
          line-height: 1;
          font-weight: 800;
          color: #0f172a;
        }

        .arch-stat-note {
          font-size: 12px;
          line-height: 1.45;
          color: var(--muted, #667085);
        }

        .arch-grid-top {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .arch-grid-main {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 14px;
        }

        .arch-panel,
        .arch-form-card {
          border-radius: 22px;
          border: 1px solid rgba(120, 138, 164, 0.12);
          background: rgba(255,255,255,0.92);
          padding: 16px;
        }

        .arch-section-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }

        .arch-section-title {
          font-size: 16px;
          line-height: 1.2;
          font-weight: 800;
          color: #0f172a;
        }

        .arch-section-subtitle {
          margin-top: 4px;
          font-size: 12px;
          line-height: 1.45;
          color: var(--muted, #667085);
        }

        .arch-stack {
          display: grid;
          gap: 12px;
        }

        .arch-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .arch-form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .arch-list {
          display: grid;
          gap: 10px;
        }

        .arch-item {
          display: grid;
          gap: 10px;
          padding: 12px;
          border-radius: 16px;
          background: rgba(248, 250, 252, 0.94);
          border: 1px solid rgba(120, 138, 164, 0.10);
        }

        .arch-item-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .arch-item-title {
          font-size: 14px;
          line-height: 1.2;
          font-weight: 700;
          color: #0f172a;
        }

        .arch-item-subtitle {
          margin-top: 3px;
          font-size: 12px;
          line-height: 1.45;
          color: var(--muted, #667085);
        }

        .arch-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .arch-pill {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(120, 138, 164, 0.12);
        }

        .arch-notes {
          padding: 9px 10px;
          border-radius: 12px;
          background: rgba(255,255,255,0.78);
          border: 1px dashed rgba(120, 138, 164, 0.18);
          color: #475569;
          font-size: 12px;
          line-height: 1.5;
        }

        .arch-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-inline-soft,
        .btn-inline-danger,
        .btn-inline-ghost {
          min-height: 32px;
          padding: 6px 10px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .btn-inline-soft {
          border: 1px solid rgba(21, 101, 192, 0.16);
          background: rgba(21, 101, 192, 0.06);
          color: #1553a2;
        }

        .btn-inline-danger {
          border: 1px solid rgba(183, 28, 28, 0.18);
          background: rgba(183, 28, 28, 0.06);
          color: #a61b1b;
        }

        .btn-inline-ghost {
          border: 1px solid rgba(120, 138, 164, 0.16);
          background: rgba(255,255,255,0.92);
          color: #334155;
        }

        .arch-empty {
          border-radius: 16px;
          padding: 14px;
          background: rgba(248, 250, 252, 0.86);
          border: 1px dashed rgba(120, 138, 164, 0.18);
          color: var(--muted, #667085);
          font-size: 13px;
          line-height: 1.5;
        }

        .arch-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .arch-toolbar-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .arch-tabs button.active {
          background: var(--brand, #2563eb);
          color: #fff;
          border-color: transparent;
        }

        .edit-box {
          border-radius: 14px;
          padding: 10px;
          border: 1px solid rgba(37, 99, 235, 0.14);
          background: rgba(248, 251, 255, 0.94);
          display: grid;
          gap: 10px;
        }

        .search-input {
          min-width: 240px;
        }

        @media (max-width: 1100px) {
          .arch-stat-grid,
          .arch-grid-top,
          .arch-grid-main,
          .arch-form-grid,
          .arch-form-grid-3 {
            grid-template-columns: 1fr;
          }

          .search-input {
            min-width: 100%;
          }
        }
      `}</style>

      {syncError ? (
        <div className="error-msg">Errore di sincronizzazione: {String(syncError)}</div>
      ) : null}

      <div className="arch-stat-grid">
        <div className="arch-stat">
          <div className="arch-stat-label">Familiari</div>
          <div className="arch-stat-value">{archiveStats.members}</div>
          <div className="arch-stat-note">Profili anagrafici gestiti nel Family Hub</div>
        </div>
        <div className="arch-stat">
          <div className="arch-stat-label">Categorie</div>
          <div className="arch-stat-value">{archiveStats.categories}</div>
          <div className="arch-stat-note">Sezioni archivio attive</div>
        </div>
        <div className="arch-stat">
          <div className="arch-stat-label">Documenti</div>
          <div className="arch-stat-value">{archiveStats.documents}</div>
          <div className="arch-stat-note">Elementi documentali registrati</div>
        </div>
        <div className="arch-stat">
          <div className="arch-stat-label">Garanzie</div>
          <div className="arch-stat-value">{archiveStats.warranties}</div>
          <div className="arch-stat-note">Prodotti e coperture archiviate</div>
        </div>
      </div>

      <div className="arch-grid-top">
        <div className="arch-form-card">
          <SectionTitle
            title="Nuovo componente famiglia"
            subtitle="Tutti i campi passano dal context e vengono poi salvati nel payload su Supabase."
          />

          <form onSubmit={handleAddMember} className="arch-stack">
            <div className="arch-form-grid-3">
              <label className="fg">
                <span className="fl">Iniziali</span>
                <input
                  className="fi"
                  value={memberForm.initials}
                  onChange={(e) => handleMemberFormChange('initials', e.target.value)}
                  placeholder="FC"
                />
              </label>

              <label className="fg">
                <span className="fl">Nome e cognome*</span>
                <input
                  className="fi"
                  value={memberForm.name}
                  onChange={(e) => handleMemberFormChange('name', e.target.value)}
                  placeholder="Mario Rossi"
                />
              </label>

              <label className="fg">
                <span className="fl">Ruolo</span>
                <input
                  className="fi"
                  value={memberForm.role}
                  onChange={(e) => handleMemberFormChange('role', e.target.value)}
                  placeholder="Papà, Mamma, Figlio/a..."
                />
              </label>

              <label className="fg">
                <span className="fl">Relazione</span>
                <input
                  className="fi"
                  value={memberForm.relationship}
                  onChange={(e) => handleMemberFormChange('relationship', e.target.value)}
                  placeholder="Padre, Madre..."
                />
              </label>

              <label className="fg">
                <span className="fl">Data di nascita</span>
                <input
                  className="fi"
                  type="date"
                  value={memberForm.birthDate}
                  onChange={(e) => handleMemberFormChange('birthDate', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Gruppo sanguigno</span>
                <input
                  className="fi"
                  value={memberForm.bloodGroup}
                  onChange={(e) => handleMemberFormChange('bloodGroup', e.target.value)}
                  placeholder="0+, A-..."
                />
              </label>

              <label className="fg">
                <span className="fl">Codice fiscale</span>
                <input
                  className="fi"
                  value={memberForm.fiscalCode}
                  onChange={(e) => handleMemberFormChange('fiscalCode', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Telefono</span>
                <input
                  className="fi"
                  value={memberForm.phone}
                  onChange={(e) => handleMemberFormChange('phone', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Email</span>
                <input
                  className="fi"
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => handleMemberFormChange('email', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Medico</span>
                <input
                  className="fi"
                  value={memberForm.doctor}
                  onChange={(e) => handleMemberFormChange('doctor', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Pediatra</span>
                <input
                  className="fi"
                  value={memberForm.pediatrician}
                  onChange={(e) => handleMemberFormChange('pediatrician', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">ID sanitario</span>
                <input
                  className="fi"
                  value={memberForm.healthId}
                  onChange={(e) => handleMemberFormChange('healthId', e.target.value)}
                />
              </label>
            </div>

            <div className="arch-form-grid">
              <label className="fg">
                <span className="fl">Allergie</span>
                <textarea
                  className="fi"
                  rows={2}
                  value={memberForm.allergies}
                  onChange={(e) => handleMemberFormChange('allergies', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Condizioni croniche</span>
                <textarea
                  className="fi"
                  rows={2}
                  value={memberForm.chronicConditions}
                  onChange={(e) => handleMemberFormChange('chronicConditions', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Terapie correnti</span>
                <textarea
                  className="fi"
                  rows={2}
                  value={memberForm.currentTherapies}
                  onChange={(e) => handleMemberFormChange('currentTherapies', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Contatto emergenza</span>
                <input
                  className="fi"
                  value={memberForm.emergencyContact}
                  onChange={(e) => handleMemberFormChange('emergencyContact', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Condizioni</span>
                <textarea
                  className="fi"
                  rows={2}
                  value={memberForm.conditions}
                  onChange={(e) => handleMemberFormChange('conditions', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Note salute</span>
                <textarea
                  className="fi"
                  rows={2}
                  value={memberForm.healthNotes}
                  onChange={(e) => handleMemberFormChange('healthNotes', e.target.value)}
                />
              </label>
            </div>

            <div className="arch-form-grid">
              <label className="fg">
                <span className="fl">Carta identità</span>
                <input
                  className="fi"
                  value={memberForm.documents.idCard}
                  onChange={(e) => handleMemberDocumentChange('idCard', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Passaporto</span>
                <input
                  className="fi"
                  value={memberForm.documents.passport}
                  onChange={(e) => handleMemberDocumentChange('passport', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Tessera sanitaria</span>
                <input
                  className="fi"
                  value={memberForm.documents.healthCard}
                  onChange={(e) => handleMemberDocumentChange('healthCard', e.target.value)}
                />
              </label>

              <label className="fg">
                <span className="fl">Patente</span>
                <input
                  className="fi"
                  value={memberForm.documents.drivingLicense}
                  onChange={(e) => handleMemberDocumentChange('drivingLicense', e.target.value)}
                />
              </label>
            </div>

            <label className="fg">
              <span className="fl">Note emergenza</span>
              <textarea
                className="fi"
                rows={3}
                value={memberForm.emergencyNotes}
                onChange={(e) => handleMemberFormChange('emergencyNotes', e.target.value)}
              />
            </label>

            <FieldError text={memberError} />

            <div>
              <button type="submit" className="btn btn-p">
                Aggiungi familiare
              </button>
            </div>
          </form>
        </div>

        <div className="arch-form-card">
          <SectionTitle
            title="Nuovo elemento archivio"
            subtitle="Documenti e garanzie usano sempre updateArchive, quindi restano coerenti con autosave e deploy."
          />

          <div className="arch-toolbar arch-tabs">
            <div className="arch-toolbar-group">
              <button
                type="button"
                className={`btn ${archiveView === 'documents' ? 'btn-p active' : ''}`}
                onClick={() => setArchiveView('documents')}
              >
                Documento
              </button>
              <button
                type="button"
                className={`btn ${archiveView === 'warranties' ? 'btn-p active' : ''}`}
                onClick={() => setArchiveView('warranties')}
              >
                Garanzia
              </button>
            </div>
          </div>

          {archiveView === 'documents' ? (
            <form onSubmit={handleAddDocument} className="arch-stack">
              <div className="arch-form-grid-3">
                <label className="fg">
                  <span className="fl">Categoria</span>
                  <select
                    className="fi"
                    value={documentForm.categoryId}
                    onChange={(e) => {
                      const category = categories.find((item) => item.id === e.target.value)
                      setDocumentForm((prev) => ({
                        ...prev,
                        categoryId: e.target.value,
                        category: category?.name || '',
                      }))
                    }}
                  >
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fg">
                  <span className="fl">Proprietario</span>
                  <select
                    className="fi"
                    value={documentForm.ownerId}
                    onChange={(e) => {
                      const owner = members.find((item) => item.id === e.target.value)
                      setDocumentForm((prev) => ({
                        ...prev,
                        ownerId: e.target.value,
                        owner: owner?.name || '',
                      }))
                    }}
                  >
                    <option value="">Nessuno</option>
                    {members.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name || item.role || item.initials}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fg">
                  <span className="fl">Titolo*</span>
                  <input
                    className="fi"
                    value={documentForm.title}
                    onChange={(e) => setDocumentForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Numero</span>
                  <input
                    className="fi"
                    value={documentForm.number}
                    onChange={(e) => setDocumentForm((prev) => ({ ...prev, number: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Data rilascio</span>
                  <input
                    className="fi"
                    type="date"
                    value={documentForm.issueDate}
                    onChange={(e) => setDocumentForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Scadenza</span>
                  <input
                    className="fi"
                    type="date"
                    value={documentForm.expiryDate}
                    onChange={(e) => setDocumentForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </label>
              </div>

              <label className="fg">
                <span className="fl">Posizione / storage</span>
                <input
                  className="fi"
                  value={documentForm.storage}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, storage: e.target.value }))}
                  placeholder="Cassaforte, cassetto, Drive, cartella..."
                />
              </label>

              <label className="fg">
                <span className="fl">Link Drive / URL, uno per riga</span>
                <textarea
                  className="fi"
                  rows={3}
                  value={documentForm.driveLinksText}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, driveLinksText: e.target.value }))}
                />
              </label>

              <label className="fg">
                <span className="fl">Note</span>
                <textarea
                  className="fi"
                  rows={3}
                  value={documentForm.notes}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>

              <FieldError text={documentError} />

              <div>
                <button type="submit" className="btn btn-p">
                  Salva documento
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddWarranty} className="arch-stack">
              <div className="arch-form-grid">
                <label className="fg">
                  <span className="fl">Prodotto / bene*</span>
                  <input
                    className="fi"
                    value={warrantyForm.item}
                    onChange={(e) => setWarrantyForm((prev) => ({ ...prev, item: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Brand</span>
                  <input
                    className="fi"
                    value={warrantyForm.brand}
                    onChange={(e) => setWarrantyForm((prev) => ({ ...prev, brand: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Data acquisto</span>
                  <input
                    className="fi"
                    type="date"
                    value={warrantyForm.purchaseDate}
                    onChange={(e) => setWarrantyForm((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Scadenza garanzia</span>
                  <input
                    className="fi"
                    type="date"
                    value={warrantyForm.expiryDate}
                    onChange={(e) => setWarrantyForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </label>

                <label className="fg">
                  <span className="fl">Riferimento fattura</span>
                  <input
                    className="fi"
                    value={warrantyForm.invoiceRef}
                    onChange={(e) => setWarrantyForm((prev) => ({ ...prev, invoiceRef: e.target.value }))}
                  />
                </label>
              </div>

              <label className="fg">
                <span className="fl">Link Drive / URL, uno per riga</span>
                <textarea
                  className="fi"
                  rows={3}
                  value={warrantyForm.driveLinksText}
                  onChange={(e) => setWarrantyForm((prev) => ({ ...prev, driveLinksText: e.target.value }))}
                />
              </label>

              <label className="fg">
                <span className="fl">Note</span>
                <textarea
                  className="fi"
                  rows={3}
                  value={warrantyForm.notes}
                  onChange={(e) => setWarrantyForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>

              <FieldError text={warrantyError} />

              <div>
                <button type="submit" className="btn btn-p">
                  Salva garanzia
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="arch-grid-main">
        <div className="arch-panel">
          <SectionTitle
            title="Componenti famiglia"
            subtitle="CRUD completo sui membri, passando sempre dal provider reale."
            action={
              <input
                className="fi search-input"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Cerca per nome, ruolo, email..."
              />
            }
          />

          {filteredMembers.length ? (
            <div className="arch-list">
              {filteredMembers.map((member) => (
                <div key={member.id} className="arch-item">
                  {editingMemberId === member.id ? (
                    <div className="edit-box">
                      <div className="arch-form-grid-3">
                        <label className="fg">
                          <span className="fl">Iniziali</span>
                          <input
                            className="fi"
                            value={editMemberForm.initials}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({ ...prev, initials: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Nome*</span>
                          <input
                            className="fi"
                            value={editMemberForm.name}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Ruolo</span>
                          <input
                            className="fi"
                            value={editMemberForm.role}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({ ...prev, role: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Relazione</span>
                          <input
                            className="fi"
                            value={editMemberForm.relationship}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                relationship: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Nascita</span>
                          <input
                            className="fi"
                            type="date"
                            value={editMemberForm.birthDate}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                birthDate: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Gruppo sanguigno</span>
                          <input
                            className="fi"
                            value={editMemberForm.bloodGroup}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                bloodGroup: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Codice fiscale</span>
                          <input
                            className="fi"
                            value={editMemberForm.fiscalCode}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                fiscalCode: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Telefono</span>
                          <input
                            className="fi"
                            value={editMemberForm.phone}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Email</span>
                          <input
                            className="fi"
                            value={editMemberForm.email}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({ ...prev, email: e.target.value }))
                            }
                          />
                        </label>
                      </div>

                      <div className="arch-form-grid">
                        <label className="fg">
                          <span className="fl">Medico</span>
                          <input
                            className="fi"
                            value={editMemberForm.doctor}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({ ...prev, doctor: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Pediatra</span>
                          <input
                            className="fi"
                            value={editMemberForm.pediatrician}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                pediatrician: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">ID sanitario</span>
                          <input
                            className="fi"
                            value={editMemberForm.healthId}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({ ...prev, healthId: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Contatto emergenza</span>
                          <input
                            className="fi"
                            value={editMemberForm.emergencyContact}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                emergencyContact: e.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="arch-form-grid">
                        <label className="fg">
                          <span className="fl">Allergie</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editMemberForm.allergies}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                allergies: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Condizioni croniche</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editMemberForm.chronicConditions}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                chronicConditions: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Terapie correnti</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editMemberForm.currentTherapies}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                currentTherapies: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Condizioni</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editMemberForm.conditions}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                conditions: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Note salute</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editMemberForm.healthNotes}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                healthNotes: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Note emergenza</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editMemberForm.emergencyNotes}
                            onChange={(e) =>
                              setEditMemberForm((prev) => ({
                                ...prev,
                                emergencyNotes: e.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="arch-form-grid">
                        <label className="fg">
                          <span className="fl">Carta identità</span>
                          <input
                            className="fi"
                            value={editMemberForm.documents.idCard}
                            onChange={(e) => handleMemberDocumentChange('idCard', e.target.value, 'edit')}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Passaporto</span>
                          <input
                            className="fi"
                            value={editMemberForm.documents.passport}
                            onChange={(e) => handleMemberDocumentChange('passport', e.target.value, 'edit')}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Tessera sanitaria</span>
                          <input
                            className="fi"
                            value={editMemberForm.documents.healthCard}
                            onChange={(e) => handleMemberDocumentChange('healthCard', e.target.value, 'edit')}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Patente</span>
                          <input
                            className="fi"
                            value={editMemberForm.documents.drivingLicense}
                            onChange={(e) => handleMemberDocumentChange('drivingLicense', e.target.value, 'edit')}
                          />
                        </label>
                      </div>

                      <div className="arch-actions">
                        <button
                          type="button"
                          className="btn-inline-soft"
                          onClick={() => saveEditMember(member.id)}
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          className="btn-inline-ghost"
                          onClick={() => {
                            setEditingMemberId('')
                            setEditMemberForm(emptyMemberForm)
                          }}
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="arch-item-head">
                        <div>
                          <div className="arch-item-title">
                            {member.name || 'Familiare'}
                            {member.initials ? ` · ${member.initials}` : ''}
                          </div>
                          <div className="arch-item-subtitle">
                            {member.role || 'Ruolo non indicato'}
                            {member.relationship ? ` · ${member.relationship}` : ''}
                            {member.birthDate ? ` · ${formatDate(member.birthDate)}` : ''}
                          </div>
                        </div>

                        <div className="arch-actions">
                          <button
                            type="button"
                            className="btn-inline-soft"
                            onClick={() => startEditMember(member)}
                          >
                            Modifica
                          </button>
                          <button
                            type="button"
                            className="btn-inline-danger"
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>

                      <div className="arch-pills">
                        <div className="arch-pill">Telefono: {member.phone || '—'}</div>
                        <div className="arch-pill">Email: {member.email || '—'}</div>
                        <div className="arch-pill">CF: {member.fiscalCode || '—'}</div>
                        <div className="arch-pill">Farmaci: {ensureArray(member.medications).length}</div>
                      </div>

                      {(member.allergies ||
                        member.chronicConditions ||
                        member.currentTherapies ||
                        member.healthNotes ||
                        member.emergencyNotes) ? (
                        <div className="arch-notes">
                          {member.allergies ? `Allergie: ${member.allergies}. ` : ''}
                          {member.chronicConditions ? `Condizioni croniche: ${member.chronicConditions}. ` : ''}
                          {member.currentTherapies ? `Terapie: ${member.currentTherapies}. ` : ''}
                          {member.healthNotes ? `Note salute: ${member.healthNotes}. ` : ''}
                          {member.emergencyNotes ? `Emergenza: ${member.emergencyNotes}.` : ''}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="arch-empty">Nessun familiare trovato.</div>
          )}
        </div>

        <div className="arch-panel">
          <SectionTitle
            title="Archivio corrente"
            subtitle="Documenti e garanzie modificabili inline, sempre passando dal context."
          />

          <div className="arch-toolbar arch-tabs">
            <div className="arch-toolbar-group">
              <button
                type="button"
                className={`btn ${archiveView === 'documents' ? 'btn-p active' : ''}`}
                onClick={() => setArchiveView('documents')}
              >
                Documenti
              </button>
              <button
                type="button"
                className={`btn ${archiveView === 'warranties' ? 'btn-p active' : ''}`}
                onClick={() => setArchiveView('warranties')}
              >
                Garanzie
              </button>
            </div>
          </div>

          {archiveView === 'documents' ? (
            documents.length ? (
              <div className="arch-list">
                {documents.map((item) => (
                  <div key={item.id} className="arch-item">
                    {editingDocumentId === item.id ? (
                      <div className="edit-box">
                        <div className="arch-form-grid-3">
                          <label className="fg">
                            <span className="fl">Categoria</span>
                            <select
                              className="fi"
                              value={editDocumentForm.categoryId}
                              onChange={(e) => {
                                const category = categories.find((row) => row.id === e.target.value)
                                setEditDocumentForm((prev) => ({
                                  ...prev,
                                  categoryId: e.target.value,
                                  category: category?.name || '',
                                }))
                              }}
                            >
                              {categories.map((row) => (
                                <option key={row.id} value={row.id}>
                                  {row.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="fg">
                            <span className="fl">Proprietario</span>
                            <select
                              className="fi"
                              value={editDocumentForm.ownerId}
                              onChange={(e) => {
                                const owner = members.find((row) => row.id === e.target.value)
                                setEditDocumentForm((prev) => ({
                                  ...prev,
                                  ownerId: e.target.value,
                                  owner: owner?.name || '',
                                }))
                              }}
                            >
                              <option value="">Nessuno</option>
                              {members.map((row) => (
                                <option key={row.id} value={row.id}>
                                  {row.name || row.role || row.initials}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="fg">
                            <span className="fl">Titolo*</span>
                            <input
                              className="fi"
                              value={editDocumentForm.title}
                              onChange={(e) =>
                                setEditDocumentForm((prev) => ({ ...prev, title: e.target.value }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Numero</span>
                            <input
                              className="fi"
                              value={editDocumentForm.number}
                              onChange={(e) =>
                                setEditDocumentForm((prev) => ({ ...prev, number: e.target.value }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Rilascio</span>
                            <input
                              className="fi"
                              type="date"
                              value={editDocumentForm.issueDate}
                              onChange={(e) =>
                                setEditDocumentForm((prev) => ({ ...prev, issueDate: e.target.value }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Scadenza</span>
                            <input
                              className="fi"
                              type="date"
                              value={editDocumentForm.expiryDate}
                              onChange={(e) =>
                                setEditDocumentForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                              }
                            />
                          </label>
                        </div>

                        <label className="fg">
                          <span className="fl">Storage</span>
                          <input
                            className="fi"
                            value={editDocumentForm.storage}
                            onChange={(e) =>
                              setEditDocumentForm((prev) => ({ ...prev, storage: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Link Drive / URL</span>
                          <textarea
                            className="fi"
                            rows={3}
                            value={editDocumentForm.driveLinksText}
                            onChange={(e) =>
                              setEditDocumentForm((prev) => ({
                                ...prev,
                                driveLinksText: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Note</span>
                          <textarea
                            className="fi"
                            rows={2}
                            value={editDocumentForm.notes}
                            onChange={(e) =>
                              setEditDocumentForm((prev) => ({ ...prev, notes: e.target.value }))
                            }
                          />
                        </label>

                        <div className="arch-actions">
                          <button
                            type="button"
                            className="btn-inline-soft"
                            onClick={() => saveEditDocument(item.id)}
                          >
                            Salva
                          </button>
                          <button
                            type="button"
                            className="btn-inline-ghost"
                            onClick={() => {
                              setEditingDocumentId('')
                              setEditDocumentForm(emptyDocumentForm)
                            }}
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="arch-item-head">
                          <div>
                            <div className="arch-item-title">{item.title || 'Documento'}</div>
                            <div className="arch-item-subtitle">
                              {(item.category || 'Categoria')} · {item.owner || 'Senza proprietario'}
                            </div>
                          </div>

                          <div className="arch-actions">
                            <button
                              type="button"
                              className="btn-inline-soft"
                              onClick={() => startEditDocument(item)}
                            >
                              Modifica
                            </button>
                            <button
                              type="button"
                              className="btn-inline-danger"
                              onClick={() => deleteDocument(item.id)}
                            >
                              Elimina
                            </button>
                          </div>
                        </div>

                        <div className="arch-pills">
                          <div className="arch-pill">Numero: {item.number || '—'}</div>
                          <div className="arch-pill">Rilascio: {formatDate(item.issueDate)}</div>
                          <div className="arch-pill">Scadenza: {formatDate(item.expiryDate)}</div>
                          <div className="arch-pill">Storage: {item.storage || '—'}</div>
                        </div>

                        {item.notes ? <div className="arch-notes">{item.notes}</div> : null}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="arch-empty">Nessun documento presente.</div>
            )
          ) : warranties.length ? (
            <div className="arch-list">
              {warranties.map((item) => (
                <div key={item.id} className="arch-item">
                  {editingWarrantyId === item.id ? (
                    <div className="edit-box">
                      <div className="arch-form-grid">
                        <label className="fg">
                          <span className="fl">Prodotto*</span>
                          <input
                            className="fi"
                            value={editWarrantyForm.item}
                            onChange={(e) =>
                              setEditWarrantyForm((prev) => ({ ...prev, item: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Brand</span>
                          <input
                            className="fi"
                            value={editWarrantyForm.brand}
                            onChange={(e) =>
                              setEditWarrantyForm((prev) => ({ ...prev, brand: e.target.value }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Acquisto</span>
                          <input
                            className="fi"
                            type="date"
                            value={editWarrantyForm.purchaseDate}
                            onChange={(e) =>
                              setEditWarrantyForm((prev) => ({
                                ...prev,
                                purchaseDate: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Scadenza</span>
                          <input
                            className="fi"
                            type="date"
                            value={editWarrantyForm.expiryDate}
                            onChange={(e) =>
                              setEditWarrantyForm((prev) => ({
                                ...prev,
                                expiryDate: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Fattura</span>
                          <input
                            className="fi"
                            value={editWarrantyForm.invoiceRef}
                            onChange={(e) =>
                              setEditWarrantyForm((prev) => ({
                                ...prev,
                                invoiceRef: e.target.value,
                              }))
                            }
                          />
                        </label>
                      </div>

                      <label className="fg">
                        <span className="fl">Link Drive / URL</span>
                        <textarea
                          className="fi"
                          rows={3}
                          value={editWarrantyForm.driveLinksText}
                          onChange={(e) =>
                            setEditWarrantyForm((prev) => ({
                              ...prev,
                              driveLinksText: e.target.value,
                            }))
                          }
                        />
                      </label>

                      <label className="fg">
                        <span className="fl">Note</span>
                        <textarea
                          className="fi"
                          rows={2}
                          value={editWarrantyForm.notes}
                          onChange={(e) =>
                            setEditWarrantyForm((prev) => ({ ...prev, notes: e.target.value }))
                          }
                        />
                      </label>

                      <div className="arch-actions">
                        <button
                          type="button"
                          className="btn-inline-soft"
                          onClick={() => saveEditWarranty(item.id)}
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          className="btn-inline-ghost"
                          onClick={() => {
                            setEditingWarrantyId('')
                            setEditWarrantyForm(emptyWarrantyForm)
                          }}
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="arch-item-head">
                        <div>
                          <div className="arch-item-title">{item.item || 'Garanzia'}</div>
                          <div className="arch-item-subtitle">
                            {item.brand || 'Brand non indicato'} · acquisto {formatDate(item.purchaseDate)}
                          </div>
                        </div>

                        <div className="arch-actions">
                          <button
                            type="button"
                            className="btn-inline-soft"
                            onClick={() => startEditWarranty(item)}
                          >
                            Modifica
                          </button>
                          <button
                            type="button"
                            className="btn-inline-danger"
                            onClick={() => deleteWarranty(item.id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>

                      <div className="arch-pills">
                        <div className="arch-pill">Scadenza: {formatDate(item.expiryDate)}</div>
                        <div className="arch-pill">Fattura: {item.invoiceRef || '—'}</div>
                      </div>

                      {item.notes ? <div className="arch-notes">{item.notes}</div> : null}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="arch-empty">Nessuna garanzia presente.</div>
          )}
        </div>
      </div>
    </div>
  )
}
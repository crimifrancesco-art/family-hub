import { useEffect, useMemo, useState } from 'react'
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

const emptyCategoryForm = {
  name: '',
  kind: 'standard',
    parentId: '',
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

function daysToExpiry(dateValue) {
  if (!dateValue) return null
  const target = new Date(`${dateValue}T12:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function expiryBadge(days) {
  if (days === null) return { label: 'Senza scadenza', className: 'badge-muted' }
  if (days < 0) return { label: 'Scaduto', className: 'badge-danger' }
  if (days <= 30) return { label: `${days} gg`, className: 'badge-warning' }
  return { label: `${days} gg`, className: 'badge-success' }
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

function normalizeUrl(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

function textToNormalizedDriveLinks(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url, index) => ({
      id: uid('lnk'),
      label: `Link ${index + 1}`,
      url: normalizeUrl(url),
    }))
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="section-head compact-head">
      <div>
        <h2 className="page-title" style={{ marginBottom: 4 }}>{title}</h2>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

function MetaPill({ label, value }) {
  if (!value) return null
  return (
    <div className="meta-pill">
      <span className="meta-label">{label}:</span> {value}
    </div>
  )
}

function memberToForm(member) {
  return {
    initials: member?.initials || '',
    name: member?.name || '',
    role: member?.role || '',
    relationship: member?.relationship || '',
    birthDate: member?.birthDate || '',
    bloodGroup: member?.bloodGroup || '',
    fiscalCode: member?.fiscalCode || '',
    phone: member?.phone || '',
    email: member?.email || '',
    doctor: member?.doctor || '',
    pediatrician: member?.pediatrician || '',
    allergies: member?.allergies || '',
    chronicConditions: member?.chronicConditions || '',
    currentTherapies: member?.currentTherapies || '',
    emergencyNotes: member?.emergencyNotes || '',
    conditions: member?.conditions || '',
    emergencyContact: member?.emergencyContact || '',
    healthId: member?.healthId || '',
    healthNotes: member?.healthNotes || '',
    documents: {
      idCard: member?.documents?.idCard || '',
      passport: member?.documents?.passport || '',
      healthCard: member?.documents?.healthCard || '',
      drivingLicense: member?.documents?.drivingLicense || '',
    },
  }
}

export default function ArchivioPage() {
  const {
    familyMembers,
    archiveTables,
    loadingData,
    syncError,
    setArchiveTables,
    updateFamilyMember,
    addFamilyMember,
    deleteFamilyMember,
  } = useAppContext()

  const [memberForm, setMemberForm] = useState(emptyMemberForm)
  const [editingMemberId, setEditingMemberId] = useState('')
  const [editingMemberForm, setEditingMemberForm] = useState(emptyMemberForm)

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm)

  const [memberError, setMemberError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [documentError, setDocumentError] = useState('')

  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [expandedIds, setExpandedIds] = useState([])
  const [selectedNodeId, setSelectedNodeId] = useState('')

  const [editingCategoryId, setEditingCategoryId] = useState('')
  const [editingCategoryForm, setEditingCategoryForm] = useState(emptyCategoryForm)

  const [editingDocumentId, setEditingDocumentId] = useState('')
  const [editingDocumentForm, setEditingDocumentForm] = useState(emptyDocumentForm)

  const categories = ensureArray(archiveTables?.categories)
  const documents = ensureArray(archiveTables?.documents)

  const selectedEditingMember =
    familyMembers.find((member) => member.id === editingMemberId) || null

  useEffect(() => {
    if (!categories.length) return
    const exists = categories.some((item) => item.id === selectedCategoryId)
    if (!selectedCategoryId || !exists) {
      setSelectedCategoryId(categories[0].id)
    }
  }, [categories, selectedCategoryId])

  useEffect(() => {
    const cat = categories.find((row) => row.id === selectedCategoryId)
    if (!cat) return
    setDocumentForm((prev) => ({
      ...prev,
      categoryId: cat.id,
      category: cat.name,
    }))
  }, [selectedCategoryId, categories])

  useEffect(() => {
    if (!editingMemberId) return
    const exists = familyMembers.some((member) => member.id === editingMemberId)
    if (!exists) {
      setEditingMemberId('')
      setEditingMemberForm(emptyMemberForm)
    }
  }, [familyMembers, editingMemberId])

  const documentsByCategory = useMemo(() => {
    const map = new Map()
    categories.forEach((cat) => map.set(cat.id, []))

    documents.forEach((doc) => {
      const catId = doc.categoryId || categories.find((c) => c.name === doc.category)?.id
      if (!map.has(catId)) map.set(catId, [])
      map.get(catId).push(doc)
    })

    return map
  }, [categories, documents])

  const categoryRows = useMemo(() => {
      return categories.filter((cat) => !cat.parentId).map((cat) => {
      const docs = documentsByCategory.get(cat.id) || []
      const nextExpiry = docs
        .map((doc) => doc.expiryDate)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))[0]

      return {
        ...cat,
        count: docs.length,
        nextExpiry,
              children: categories.filter((c) => c.parentId === cat.id),
      }
    })
  }, [categories, documentsByCategory])

  const visibleDocuments = useMemo(() => {
    if (!selectedCategoryId) return documents
    return documents.filter((doc) => {
      const catId = doc.categoryId || categories.find((c) => c.name === doc.category)?.id
      return catId === selectedCategoryId
    })
  }, [documents, selectedCategoryId, categories])

  const treeRows = useMemo(() => {
    return categoryRows.flatMap((cat) => {
      const catNode = {
        id: `cat_${cat.id}`,
        type: 'category',
        categoryId: cat.id,
        payload: cat,
      }

      const isExpanded = expandedIds.includes(cat.id)
      if (!isExpanded) return [catNode]

      const childNodes = (documentsByCategory.get(cat.id) || []).map((doc) => ({
        id: `doc_${doc.id}`,
        type: 'document',
        categoryId: cat.id,
        payload: doc,
      }))

            const subCatNodes = (cat.children || []).flatMap((subCat) => {
        const subCatNode = {
          id: `cat_${subCat.id}`,
          type: 'category',
          categoryId: subCat.id,
          payload: { ...subCat, isChild: true },
        }
        const subDocs = (documentsByCategory.get(subCat.id) || []).map((doc) => ({
          id: `doc_${doc.id}`,
          type: 'document',
          categoryId: subCat.id,
          payload: doc,
        }))
        return [subCatNode, ...subDocs]
      })
      return [catNode, ...subCatNodes, ...childNodes]
    })
  }, [categoryRows, documentsByCategory, expandedIds])

  function toggleExpanded(categoryId) {
    setExpandedIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }

  function resetDocumentForm() {
    const cat = categories.find((row) => row.id === selectedCategoryId) || categories[0]
    setDocumentForm({
      ...emptyDocumentForm,
      categoryId: cat?.id || '',
      category: cat?.name || '',
    })
  }

  function startEditMember(member) {
    setEditingMemberId(member.id)
    setEditingMemberForm(memberToForm(member))
  }

  function cancelEditMember() {
    setEditingMemberId('')
    setEditingMemberForm(emptyMemberForm)
  }

  function saveEditMember() {
    if (!editingMemberId) return

    const name = editingMemberForm.name.trim()
    if (!name) {
      setMemberError('Il nome del familiare è obbligatorio.')
      return
    }

    updateFamilyMember(editingMemberId, {
      initials: editingMemberForm.initials.trim(),
      name,
      role: editingMemberForm.role.trim(),
      relationship: editingMemberForm.relationship.trim(),
      birthDate: editingMemberForm.birthDate,
      bloodGroup: editingMemberForm.bloodGroup.trim(),
      fiscalCode: editingMemberForm.fiscalCode.trim(),
      phone: editingMemberForm.phone.trim(),
      email: editingMemberForm.email.trim(),
      doctor: editingMemberForm.doctor.trim(),
      pediatrician: editingMemberForm.pediatrician.trim(),
      allergies: editingMemberForm.allergies.trim(),
      chronicConditions: editingMemberForm.chronicConditions.trim(),
      currentTherapies: editingMemberForm.currentTherapies.trim(),
      emergencyNotes: editingMemberForm.emergencyNotes.trim(),
      conditions: editingMemberForm.conditions.trim(),
      emergencyContact: editingMemberForm.emergencyContact.trim(),
      healthId: editingMemberForm.healthId.trim(),
      healthNotes: editingMemberForm.healthNotes.trim(),
      documents: {
        idCard: editingMemberForm.documents.idCard.trim(),
        passport: editingMemberForm.documents.passport.trim(),
        healthCard: editingMemberForm.documents.healthCard.trim(),
        drivingLicense: editingMemberForm.documents.drivingLicense.trim(),
      },
    })

    setMemberError('')
  }

  function handleDeleteMember(member) {
    const label = member?.name || member?.role || member?.initials || 'questo familiare'
    const confirmed = window.confirm(
      `Vuoi davvero eliminare ${label}? Verranno rimossi anche documenti, visite, terapie, farmaci e collegamenti associati.`,
    )
    if (!confirmed) return

    if (editingMemberId === member.id) {
      setEditingMemberId('')
      setEditingMemberForm(emptyMemberForm)
    }

    deleteFamilyMember(member.id)
  }

  function handleAddMember(event) {
    event.preventDefault()
    setMemberError('')

    if (!memberForm.name.trim()) {
      setMemberError('Il nome del familiare è obbligatorio.')
      return
    }

    const created = addFamilyMember({
      initials: memberForm.initials.trim(),
      name: memberForm.name.trim(),
      role: memberForm.role.trim(),
      relationship: memberForm.relationship.trim(),
      birthDate: memberForm.birthDate,
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
      documents: {
        idCard: memberForm.documents.idCard.trim(),
        passport: memberForm.documents.passport.trim(),
        healthCard: memberForm.documents.healthCard.trim(),
        drivingLicense: memberForm.documents.drivingLicense.trim(),
      },
    })

    setMemberForm(emptyMemberForm)

    if (created?.id) {
      setEditingMemberId(created.id)
      setEditingMemberForm(memberToForm(created))
    }
  }

  function handleAddCategory(event) {
    event.preventDefault()
    setCategoryError('')

    const name = categoryForm.name.trim()
    if (!name) {
      setCategoryError('Il nome categoria è obbligatorio.')
      return
    }

    const duplicate = categories.some(
          (cat) => cat.name.trim().toLowerCase() === name.toLowerCase() && (cat.parentId || null) === (categoryForm.parentId || null),
    )
    if (duplicate) {
      setCategoryError('Esiste già una categoria con questo nome.')
      return
    }

    const nextCategory = {
      id: uid('cat'),
      name,
      kind: categoryForm.kind || 'standard',
          parentId: categoryForm.parentId || null,
    }

    setArchiveTables((prev) => ({
      ...prev,
      categories: [...ensureArray(prev.categories), nextCategory],
      documents: ensureArray(prev.documents),
      warranties: ensureArray(prev.warranties),
    }))

    setCategoryForm(emptyCategoryForm)
    setSelectedCategoryId(nextCategory.id)
    setExpandedIds((prev) => [...new Set([...prev, nextCategory.id])])
    setSelectedNodeId(`cat_${nextCategory.id}`)
  }

  function startEditCategory(category) {
    setEditingCategoryId(category.id)
    setEditingCategoryForm({
      name: category.name || '',
      kind: category.kind || 'standard',
          parentId: category.parentId || '',
    })
  }

  function saveEditCategory(categoryId) {
    setCategoryError('')

        const name = editingCategoryForm.name.trim()
    if (!name) {
      setCategoryError('Il nome categoria è obbligatorio.')
      return
    }

    const duplicate = categories.some(
      (cat) =>
        cat.id !== categoryId && cat.name.trim().toLowerCase() === name.toLowerCase() && (cat.parentId || null) === (editingCategoryForm.parentId || null)
    )
    if (duplicate) {
      setCategoryError('Esiste già una categoria con questo nome.')
      return
    }

    const oldCategory = categories.find((cat) => cat.id === categoryId)
    if (!oldCategory) return

    setArchiveTables((prev) => ({
      ...prev,
      categories: ensureArray(prev.categories).map((cat) =>
        cat.id === categoryId
          ? { ...cat, name, kind: editingCategoryForm.kind || 'standard' , parentId: editingCategoryForm.parentId || null }
          : cat,
      ),
      documents: ensureArray(prev.documents).map((doc) =>
        doc.categoryId === categoryId
          ? { ...doc, category: name, categoryId }
          : doc,
      ),
      warranties: ensureArray(prev.warranties),
    }))

    if (selectedCategoryId === categoryId) {
      setDocumentForm((prev) => ({ ...prev, categoryId, category: name }))
    }

    if (oldCategory?.name && editingDocumentForm.categoryId === categoryId) {
      setEditingDocumentForm((prev) => ({ ...prev, categoryId, category: name }))
    }

    setEditingCategoryId('')
    setEditingCategoryForm(emptyCategoryForm)
  }

  function deleteCategorySafe(categoryId) {
        const hasChildren = categories.some((c) => c.parentId === categoryId)
    if (hasChildren) {
      setCategoryError('Elimina prima le sottocategorie prima di rimuovere questa categoria.')
      return
    }
    const linkedDocs = documents.filter((doc) => doc.categoryId === categoryId)
    if (linkedDocs.length) {
      setCategoryError('Non puoi eliminare una categoria che contiene documenti.')
      return
    }

    setArchiveTables((prev) => ({
      ...prev,
      categories: ensureArray(prev.categories).filter((cat) => cat.id !== categoryId),
      documents: ensureArray(prev.documents),
      warranties: ensureArray(prev.warranties),
    }))

    setExpandedIds((prev) => prev.filter((id) => id !== categoryId))

    if (selectedCategoryId === categoryId) {
      const remaining = categories.filter((cat) => cat.id !== categoryId)
      setSelectedCategoryId(remaining[0]?.id || '')
    }

    if (selectedNodeId === `cat_${categoryId}`) setSelectedNodeId('')
    if (editingCategoryId === categoryId) {
      setEditingCategoryId('')
      setEditingCategoryForm(emptyCategoryForm)
    }
  }

  function handleAddDocument(event) {
    event.preventDefault()
    setDocumentError('')

    const category = categories.find((cat) => cat.id === documentForm.categoryId)
    if (!category) {
      setDocumentError('Seleziona una categoria valida.')
      return
    }

    if (!documentForm.title.trim()) {
      setDocumentError('Il titolo documento è obbligatorio.')
      return
    }

    const driveLinks = textToNormalizedDriveLinks(documentForm.driveLinksText)
    const invalid = driveLinks.some((item) => !isValidHttpUrl(item.url))
    if (invalid) {
      setDocumentError('Uno o più link non sono validi.')
      return
    }

    const ownerMember = familyMembers.find((member) => member.id === documentForm.ownerId)

    const nextDocument = {
      id: uid('doc'),
      category: category.name,
      categoryId: category.id,
      owner: ownerMember?.name || documentForm.owner.trim(),
      ownerId: ownerMember?.id || documentForm.ownerId || '',
      title: documentForm.title.trim(),
      number: documentForm.number.trim(),
      issueDate: documentForm.issueDate,
      expiryDate: documentForm.expiryDate,
      storage: documentForm.storage.trim(),
      driveLinks,
      notes: documentForm.notes.trim(),
    }

    setArchiveTables((prev) => ({
      ...prev,
      categories: ensureArray(prev.categories),
      documents: [...ensureArray(prev.documents), nextDocument],
      warranties: ensureArray(prev.warranties),
    }))

    setExpandedIds((prev) => [...new Set([...prev, category.id])])
    setSelectedNodeId(`doc_${nextDocument.id}`)
    resetDocumentForm()
  }

  function startEditDocument(doc) {
    setEditingDocumentId(doc.id)
    setEditingDocumentForm({
      category: doc.category || '',
      categoryId: doc.categoryId || '',
      owner: doc.owner || '',
      ownerId: doc.ownerId || '',
      title: doc.title || '',
      number: doc.number || '',
      issueDate: doc.issueDate || '',
      expiryDate: doc.expiryDate || '',
      storage: doc.storage || '',
      driveLinksText: driveLinksToText(doc.driveLinks),
      notes: doc.notes || '',
    })

    if (doc.categoryId) {
      setExpandedIds((prev) => [...new Set([...prev, doc.categoryId])])
    }
  }

  function saveEditDocument(docId) {
    setDocumentError('')

    const category = categories.find((cat) => cat.id === editingDocumentForm.categoryId)
    if (!category) {
      setDocumentError('Categoria non valida.')
      return
    }

    if (!editingDocumentForm.title.trim()) {
      setDocumentError('Il titolo documento è obbligatorio.')
      return
    }

    const driveLinks = textToNormalizedDriveLinks(editingDocumentForm.driveLinksText)
    const invalid = driveLinks.some((item) => !isValidHttpUrl(item.url))
    if (invalid) {
      setDocumentError('Uno o più link non sono validi.')
      return
    }

    const ownerMember = familyMembers.find((member) => member.id === editingDocumentForm.ownerId)

    setArchiveTables((prev) => ({
      ...prev,
      categories: ensureArray(prev.categories),
      documents: ensureArray(prev.documents).map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              category: category.name,
              categoryId: category.id,
              owner: ownerMember?.name || editingDocumentForm.owner.trim(),
              ownerId: ownerMember?.id || editingDocumentForm.ownerId || '',
              title: editingDocumentForm.title.trim(),
              number: editingDocumentForm.number.trim(),
              issueDate: editingDocumentForm.issueDate,
              expiryDate: editingDocumentForm.expiryDate,
              storage: editingDocumentForm.storage.trim(),
              driveLinks,
              notes: editingDocumentForm.notes.trim(),
            }
          : doc,
      ),
      warranties: ensureArray(prev.warranties),
    }))

    setEditingDocumentId('')
    setEditingDocumentForm(emptyDocumentForm)
  }

  function deleteDocument(docId) {
    setArchiveTables((prev) => ({
      ...prev,
      categories: ensureArray(prev.categories),
      documents: ensureArray(prev.documents).filter((doc) => doc.id !== docId),
      warranties: ensureArray(prev.warranties),
    }))

    if (selectedNodeId === `doc_${docId}`) setSelectedNodeId('')
    if (editingDocumentId === docId) {
      setEditingDocumentId('')
      setEditingDocumentForm(emptyDocumentForm)
    }
  }

  if (loadingData) {
    return (
      <div className="card">
        <div className="page-title">Archivio</div>
        <p className="page-subtitle">Sto caricando archivio e anagrafica famiglia.</p>
      </div>
    )
  }

  return (
    <div className="page-shell archivio-page">
      <style>{`
        .archivio-page {
          display: grid;
          gap: 14px;
        }
        .compact-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .archive-top-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .archive-mid-grid {
          display: grid;
          grid-template-columns: 0.95fr 1.05fr;
          gap: 14px;
        }
        .archive-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .archive-form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }
        .archive-form-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .required-mark {
          color: #c62828;
          margin-left: 4px;
        }
        .section-stack {
          display: grid;
          gap: 12px;
        }
        .summary-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .summary-card {
          border-radius: 14px;
          padding: 12px;
          border: 1px solid rgba(120, 138, 164, 0.14);
          background: rgba(255,255,255,0.96);
          display: grid;
          gap: 4px;
        }
        .summary-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .08em;
          color: var(--muted, #667085);
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
        .tree-table {
          border: 1px solid rgba(120, 138, 164, 0.16);
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255,255,255,0.96);
        }
        .tree-toolbar {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(120, 138, 164, 0.12);
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .tree-head,
        .tree-row {
          display: grid;
          grid-template-columns: 2.2fr 1.1fr 1.1fr 1fr 1fr 160px;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
        }
        .tree-head {
          font-size: 12px;
          font-weight: 800;
          color: var(--muted, #667085);
          background: rgba(248,250,252,0.98);
          border-bottom: 1px solid rgba(120, 138, 164, 0.12);
        }
        .tree-row {
          font-size: 13px;
          border-bottom: 1px solid rgba(120, 138, 164, 0.08);
        }
        .tree-row:last-child {
          border-bottom: none;
        }
        .tree-row.selected {
          background: rgba(21,101,192,0.05);
        }
        .tree-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .tree-title {
          font-weight: 800;
          line-height: 1.2;
        }
        .tree-subtitle {
          font-size: 12px;
          color: var(--muted, #667085);
          margin-top: 2px;
        }
        .indent-0 {
          padding-left: 0;
        }
        .indent-1 {
          padding-left: 24px;
        }
                    .indent-2 {
                                padding-left: 48px;
                                          }
        .expand-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(120, 138, 164, 0.16);
          background: white;
          font-weight: 800;
        }
        .row-actions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
          flex-wrap: wrap;
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
        .pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .doc-links {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
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
        .edit-box {
          border: 1px solid rgba(21, 101, 192, 0.16);
          background: rgba(248, 251, 255, 0.96);
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 10px;
        }
        .family-card-list {
          display: grid;
          gap: 10px;
        }
        .family-card {
          border: 1px solid rgba(120, 138, 164, 0.12);
          background: rgba(255,255,255,0.96);
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 10px;
        }
        .family-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          flex-wrap: wrap;
        }
        .empty-box {
          border-radius: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px dashed rgba(120, 138, 164, 0.18);
          color: var(--muted, #667085);
          font-size: 12px;
        }
        @media (max-width: 1180px) {
          .archive-top-grid,
          .archive-mid-grid,
          .summary-strip,
          .archive-form-grid,
          .archive-form-grid-3,
          .archive-form-grid-4,
          .tree-head,
          .tree-row {
            grid-template-columns: 1fr;
          }
          .row-actions {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="card">
        <SectionTitle
          title="Archivio famiglia V3"
          subtitle="Tree-table categorie e documenti, modifica inline, compatibile con AppContext attuale."
        />

        {syncError ? (
          <div className="error-msg">Errore sincronizzazione: {String(syncError)}</div>
        ) : null}

        <div className="summary-strip">
          <div className="summary-card">
            <div className="summary-label">Familiari</div>
            <div className="summary-value">{familyMembers.length}</div>
            <div className="summary-note">Anagrafica disponibile</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Categorie</div>
            <div className="summary-value">{categories.length}</div>
            <div className="summary-note">Archivio documentale</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Documenti</div>
            <div className="summary-value">{documents.length}</div>
            <div className="summary-note">Gestiti in tabella</div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Categoria attiva</div>
            <div className="summary-value" style={{ fontSize: 16 }}>
              {categories.find((c) => c.id === selectedCategoryId)?.name || '—'}
            </div>
            <div className="summary-note">Filtro inserimento attuale</div>
          </div>
        </div>
      </div>

      <div className="archive-top-grid">
        <div className="card">
          <SectionTitle
            title="Nuovo familiare"
            subtitle="Usa addFamilyMember del tuo context."
          />

          <form onSubmit={handleAddMember} className="section-stack">
            <div className="archive-form-grid-4">
              <label className="fg">
                <span className="fl">Iniziali</span>
                <input
                  className="fi"
                  value={memberForm.initials}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, initials: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">
                  Nome<span className="required-mark">*</span>
                </span>
                <input
                  className="fi"
                  value={memberForm.name}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Ruolo</span>
                <input
                  className="fi"
                  value={memberForm.role}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Relazione</span>
                <input
                  className="fi"
                  value={memberForm.relationship}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, relationship: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Data nascita</span>
                <input
                  className="fi"
                  type="date"
                  value={memberForm.birthDate}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, birthDate: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Telefono</span>
                <input
                  className="fi"
                  value={memberForm.phone}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Email</span>
                <input
                  className="fi"
                  value={memberForm.email}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Codice fiscale</span>
                <input
                  className="fi"
                  value={memberForm.fiscalCode}
                  onChange={(e) =>
                    setMemberForm((prev) => ({ ...prev, fiscalCode: e.target.value }))
                  }
                />
              </label>
            </div>

            {memberError ? <div className="error-msg">{memberError}</div> : null}

            <div>
              <button type="submit" className="btn btn-p">
                Aggiungi familiare
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <SectionTitle
            title="Modifica familiare"
            subtitle="Il familiare appena creato viene selezionato qui automaticamente."
          />

          {selectedEditingMember ? (
            <div className="section-stack">
              <div className="pill-row">
                <div className="meta-pill">
                  <span className="meta-label">In modifica:</span>{' '}
                  {selectedEditingMember.name || selectedEditingMember.initials || selectedEditingMember.id}
                </div>
              </div>

              <div className="archive-form-grid-4">
                <label className="fg">
                  <span className="fl">Iniziali</span>
                  <input
                    className="fi"
                    value={editingMemberForm.initials}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, initials: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">
                    Nome<span className="required-mark">*</span>
                  </span>
                  <input
                    className="fi"
                    value={editingMemberForm.name}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Ruolo</span>
                  <input
                    className="fi"
                    value={editingMemberForm.role}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Relazione</span>
                  <input
                    className="fi"
                    value={editingMemberForm.relationship}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({
                        ...prev,
                        relationship: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Data nascita</span>
                  <input
                    className="fi"
                    type="date"
                    value={editingMemberForm.birthDate}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, birthDate: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Gruppo sanguigno</span>
                  <input
                    className="fi"
                    value={editingMemberForm.bloodGroup}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, bloodGroup: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Telefono</span>
                  <input
                    className="fi"
                    value={editingMemberForm.phone}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Email</span>
                  <input
                    className="fi"
                    value={editingMemberForm.email}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Codice fiscale</span>
                  <input
                    className="fi"
                    value={editingMemberForm.fiscalCode}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, fiscalCode: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Medico</span>
                  <input
                    className="fi"
                    value={editingMemberForm.doctor}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, doctor: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Pediatra</span>
                  <input
                    className="fi"
                    value={editingMemberForm.pediatrician}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, pediatrician: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Tessera sanitaria</span>
                  <input
                    className="fi"
                    value={editingMemberForm.healthId}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, healthId: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="archive-form-grid">
                <label className="fg">
                  <span className="fl">Allergie</span>
                  <textarea
                    className="fi"
                    rows={3}
                    value={editingMemberForm.allergies}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, allergies: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Patologie croniche</span>
                  <textarea
                    className="fi"
                    rows={3}
                    value={editingMemberForm.chronicConditions}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({
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
                    rows={3}
                    value={editingMemberForm.currentTherapies}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({
                        ...prev,
                        currentTherapies: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Contatto emergenza</span>
                  <textarea
                    className="fi"
                    rows={3}
                    value={editingMemberForm.emergencyContact}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({
                        ...prev,
                        emergencyContact: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Condizioni</span>
                  <textarea
                    className="fi"
                    rows={3}
                    value={editingMemberForm.conditions}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, conditions: e.target.value }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Note sanitarie</span>
                  <textarea
                    className="fi"
                    rows={3}
                    value={editingMemberForm.healthNotes}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({ ...prev, healthNotes: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="archive-form-grid-4">
                <label className="fg">
                  <span className="fl">Documento identità</span>
                  <input
                    className="fi"
                    value={editingMemberForm.documents.idCard}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({
                        ...prev,
                        documents: { ...prev.documents, idCard: e.target.value },
                      }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Passaporto</span>
                  <input
                    className="fi"
                    value={editingMemberForm.documents.passport}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({
                        ...prev,
                        documents: { ...prev.documents, passport: e.target.value },
                      }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Tessera sanitaria n.</span>
                  <input
                    className="fi"
                    value={editingMemberForm.documents.healthCard}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({
                        ...prev,
                        documents: { ...prev.documents, healthCard: e.target.value },
                      }))
                    }
                  />
                </label>

                <label className="fg">
                  <span className="fl">Patente</span>
                  <input
                    className="fi"
                    value={editingMemberForm.documents.drivingLicense}
                    onChange={(e) =>
                      setEditingMemberForm((prev) => ({
                        ...prev,
                        documents: { ...prev.documents, drivingLicense: e.target.value },
                      }))
                    }
                  />
                </label>
              </div>

              <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  className="btn btn-inline-soft"
                  onClick={saveEditMember}
                >
                  Salva
                </button>
                <button
                  type="button"
                  className="btn btn-inline-ghost"
                  onClick={cancelEditMember}
                >
                  Chiudi
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-box">
              Seleziona un familiare dall’elenco oppure aggiungine uno nuovo.
            </div>
          )}
        </div>
      </div>

      <div className="archive-mid-grid">
        <div className="card">
          <SectionTitle
            title="Nuova categoria"
            subtitle="Create/edit/delete categorie dell'archivio."
          />

          <form onSubmit={handleAddCategory} className="section-stack">
            <div className="archive-form-grid">
              <label className="fg">
                <span className="fl">
                  Nome categoria<span className="required-mark">*</span>
                </span>
                <input
                  className="fi"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Es. Assicurazioni"
                />
              </label>

              <label className="fg">
                <span className="fl">Tipo</span>
                <select
                  className="fi"
                  value={categoryForm.kind}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({ ...prev, kind: e.target.value }))
                  }
                >
                  <option value="standard">standard</option>
                  <option value="table">table</option>
                </select>
              </label>
            </div>
                      <div className="fg">
            <label className="fl">Categoria padre</label>
            <select
              className="fi"
              value={categoryForm.parentId}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, parentId: e.target.value }))}
            >
              <option value="">— Nessuna (radice) —</option>
              {categories
                .filter((c) => !c.parentId)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>

            {categoryError ? <div className="error-msg">{categoryError}</div> : null}

            <div>
              <button type="submit" className="btn btn-p">
                Aggiungi categoria
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <SectionTitle
            title="Nuovo documento"
            subtitle="Salva direttamente in archiveTables.documents."
          />

          <form onSubmit={handleAddDocument} className="section-stack">
            <div className="archive-form-grid-4">
              <label className="fg">
                <span className="fl">Categoria</span>
                <select
                  className="fi"
                  value={documentForm.categoryId}
                  onChange={(e) => {
                    const cat = categories.find((row) => row.id === e.target.value)
                    setDocumentForm((prev) => ({
                      ...prev,
                      categoryId: e.target.value,
                      category: cat?.name || '',
                    }))
                    setSelectedCategoryId(e.target.value)
                  }}
                >
                  <option value="">Seleziona categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                                {cat.parentId ? `  ↳ ${cat.name}` : cat.name}
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
                    const member = familyMembers.find((m) => m.id === e.target.value)
                    setDocumentForm((prev) => ({
                      ...prev,
                      ownerId: e.target.value,
                      owner: member?.name || '',
                    }))
                  }}
                >
                  <option value="">Nessun proprietario</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.role || member.initials || member.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="fg">
                <span className="fl">
                  Titolo documento<span className="required-mark">*</span>
                </span>
                <input
                  className="fi"
                  value={documentForm.title}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Numero</span>
                <input
                  className="fi"
                  value={documentForm.number}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, number: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Data emissione</span>
                <input
                  className="fi"
                  type="date"
                  value={documentForm.issueDate}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, issueDate: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Scadenza</span>
                <input
                  className="fi"
                  type="date"
                  value={documentForm.expiryDate}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, expiryDate: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Posizione archivio</span>
                <input
                  className="fi"
                  value={documentForm.storage}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, storage: e.target.value }))
                  }
                />
              </label>

              <label className="fg">
                <span className="fl">Owner manuale</span>
                <input
                  className="fi"
                  value={documentForm.owner}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, owner: e.target.value }))
                  }
                  placeholder="Usato se non selezioni un familiare"
                />
              </label>
            </div>

            <div className="archive-form-grid">
              <label className="fg">
                <span className="fl">Link Drive / cloud</span>
                <textarea
                  className="fi"
                  rows={3}
                  value={documentForm.driveLinksText}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, driveLinksText: e.target.value }))
                  }
                  placeholder={'Un link per riga\ndrive.google.com/...'}
                />
              </label>

              <label className="fg">
                <span className="fl">Note</span>
                <textarea
                  className="fi"
                  rows={3}
                  value={documentForm.notes}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </label>
            </div>

            {documentError ? <div className="error-msg">{documentError}</div> : null}

            <div>
              <button type="submit" className="btn btn-p">
                Aggiungi documento
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <SectionTitle
          title="Familiari attuali"
          subtitle="Anagrafica letta dal tuo AppContext."
        />

        <div className="family-card-list">
          {familyMembers.length ? (
            familyMembers.map((member) => (
              <div key={member.id} className="family-card">
                <div className="family-head">
                  <div>
                    <div className="tree-title">{member.name || 'Senza nome'}</div>
                    <div className="tree-subtitle">
                      {member.role || member.relationship || member.initials || member.id}
                    </div>
                  </div>

                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-inline-soft"
                      onClick={() => startEditMember(member)}
                    >
                      Modifica
                    </button>

                    <button
                      type="button"
                      className="btn btn-inline-danger"
                      onClick={() => handleDeleteMember(member)}
                    >
                      Elimina
                    </button>
                  </div>
                </div>

                <div className="pill-row">
                  <MetaPill label="Telefono" value={member.phone} />
                  <MetaPill label="Email" value={member.email} />
                  <MetaPill label="CF" value={member.fiscalCode} />
                  <MetaPill label="Tessera sanitaria" value={member.healthId} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-box">Nessun familiare presente.</div>
          )}
        </div>
      </div>

      <div className="card">
        <SectionTitle
          title="Tree-table archivio"
          subtitle="Categorie espandibili e documenti modificabili inline."
          action={
            <div className="row-actions">
              <button
                type="button"
                className="btn btn-inline-ghost"
                onClick={() => setExpandedIds(categories.map((c) => c.id))}
              >
                Espandi tutto
              </button>
              <button
                type="button"
                className="btn btn-inline-ghost"
                onClick={() => setExpandedIds([])}
              >
                Chiudi tutto
              </button>
            </div>
          }
        />

        <div className="tree-table">
          <div className="tree-toolbar">
            <div className="pill-row">
              <span className="meta-pill">
                <span className="meta-label">Filtro</span>
                {categories.find((c) => c.id === selectedCategoryId)?.name || 'Tutte'}
              </span>
              <span className="meta-pill">
                <span className="meta-label">Documenti visibili</span>
                {visibleDocuments.length}
              </span>
            </div>

            <label className="fg" style={{ minWidth: 260 }}>
              <span className="fl">Categoria attiva</span>
              <select
                className="fi"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                              {cat.parentId ? `  ↳ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="tree-head">
            <div>Voce</div>
            <div>Proprietario / Tipo</div>
            <div>Numero / Count</div>
            <div>Emissione</div>
            <div>Scadenza</div>
            <div style={{ textAlign: 'right' }}>Azioni</div>
          </div>

          {treeRows.length ? (
            treeRows.map((row) => {
              if (row.type === 'category') {
                const category = row.payload
                const isExpanded = expandedIds.includes(category.id)
                const nextDays = daysToExpiry(category.nextExpiry)
                const badge = expiryBadge(nextDays)

                return (
                  <div
                    key={row.id}
                    className={`tree-row ${selectedNodeId === row.id ? 'selected' : ''}`}
                    onClick={() => setSelectedNodeId(row.id)}
                  >
                              <div className={`tree-primary ${category.isChild ? 'indent-1' : 'indent-0'}`}>
                      <button
                        type="button"
                        className="expand-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpanded(category.id)
                        }}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>

                      {editingCategoryId === category.id ? (
                        <div className="edit-box" style={{ width: '100%' }}>
                          <div className="archive-form-grid">
                            <label className="fg">
                              <span className="fl">Nome</span>
                              <input
                                className="fi"
                                value={editingCategoryForm.name}
                                onChange={(e) =>
                                  setEditingCategoryForm((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                              />
                            </label>

                            <label className="fg">
                              <span className="fl">Tipo</span>
                              <select
                                className="fi"
                                value={editingCategoryForm.kind}
                                onChange={(e) =>
                                  setEditingCategoryForm((prev) => ({
                                    ...prev,
                                    kind: e.target.value,
                                  }))
                                }
                              >
                                <option value="standard">standard</option>
                                <option value="table">table</option>
                              </select>
                            </label>
                          </div>
                                      <label className="fg">
              <span className="fl">Categoria padre</span>
              <select
                className="fi"
                value={editingCategoryForm.parentId || ''}
                onChange={(e) => setEditingCategoryForm((prev) => ({ ...prev, parentId: e.target.value }))}
              >
                <option value="">— Nessuna (radice) —</option>
                {categories
                  .filter((c) => !c.parentId && c.id !== editingCategoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </label>

                          <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
                            <button
                              type="button"
                              className="btn btn-inline-soft"
                              onClick={() => saveEditCategory(category.id)}
                            >
                              Salva
                            </button>
                            <button
                              type="button"
                              className="btn btn-inline-ghost"
                              onClick={() => {
                                setEditingCategoryId('')
                                setEditingCategoryForm(emptyCategoryForm)
                              }}
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="tree-title">{category.name}</div>
                          <div className="tree-subtitle">
                            Categoria archivio · {category.kind || 'standard'}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>{category.kind || 'standard'}</div>
                    <div>{category.count}</div>
                    <div>—</div>
                    <div>
                      {category.nextExpiry ? (
                        <span className={`badge ${badge.className}`}>
                          {formatDate(category.nextExpiry)} · {badge.label}
                        </span>
                      ) : '—'}
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-inline-soft"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditCategory(category)
                        }}
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="btn btn-inline-danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteCategorySafe(category.id)
                        }}
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                )
              }

              const doc = row.payload
              const days = daysToExpiry(doc.expiryDate)
              const badge = expiryBadge(days)

              return (
                <div
                  key={row.id}
                  className={`tree-row ${selectedNodeId === row.id ? 'selected' : ''}`}
                  onClick={() => setSelectedNodeId(row.id)}
                >
                            <div className={`tree-primary ${categories.find((c) => c.id === row.categoryId)?.parentId ? 'indent-2' : 'indent-1'}`}>
                    {editingDocumentId === doc.id ? (
                      <div className="edit-box" style={{ width: '100%' }}>
                        <div className="archive-form-grid-4">
                          <label className="fg">
                            <span className="fl">Categoria</span>
                            <select
                              className="fi"
                              value={editingDocumentForm.categoryId}
                              onChange={(e) => {
                                const cat = categories.find((row) => row.id === e.target.value)
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  categoryId: e.target.value,
                                  category: cat?.name || '',
                                }))
                              }}
                            >
                              <option value="">Seleziona categoria</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                            {cat.parentId ? `  ↳ ${cat.name}` : cat.name}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="fg">
                            <span className="fl">Proprietario</span>
                            <select
                              className="fi"
                              value={editingDocumentForm.ownerId}
                              onChange={(e) => {
                                const member = familyMembers.find((m) => m.id === e.target.value)
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  ownerId: e.target.value,
                                  owner: member?.name || '',
                                }))
                              }}
                            >
                              <option value="">Nessun proprietario</option>
                              {familyMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name || member.role || member.initials || member.id}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="fg">
                            <span className="fl">Titolo</span>
                            <input
                              className="fi"
                              value={editingDocumentForm.title}
                              onChange={(e) =>
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Numero</span>
                            <input
                              className="fi"
                              value={editingDocumentForm.number}
                              onChange={(e) =>
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  number: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Emissione</span>
                            <input
                              className="fi"
                              type="date"
                              value={editingDocumentForm.issueDate}
                              onChange={(e) =>
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  issueDate: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Scadenza</span>
                            <input
                              className="fi"
                              type="date"
                              value={editingDocumentForm.expiryDate}
                              onChange={(e) =>
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  expiryDate: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Archivio</span>
                            <input
                              className="fi"
                              value={editingDocumentForm.storage}
                              onChange={(e) =>
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  storage: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="fg">
                            <span className="fl">Owner manuale</span>
                            <input
                              className="fi"
                              value={editingDocumentForm.owner}
                              onChange={(e) =>
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  owner: e.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>

                        <div className="archive-form-grid">
                          <label className="fg">
                            <span className="fl">Link Drive</span>
                            <textarea
                              className="fi"
                              rows={3}
                              value={editingDocumentForm.driveLinksText}
                              onChange={(e) =>
                                setEditingDocumentForm((prev) => ({
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
                              rows={3}
                              value={editingDocumentForm.notes}
                              onChange={(e) =>
                                setEditingDocumentForm((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>

                        <div className="row-actions" style={{ justifyContent: 'flex-start' }}>
                          <button
                            type="button"
                            className="btn btn-inline-soft"
                            onClick={() => saveEditDocument(doc.id)}
                          >
                            Salva
                          </button>
                          <button
                            type="button"
                            className="btn btn-inline-ghost"
                            onClick={() => {
                              setEditingDocumentId('')
                              setEditingDocumentForm(emptyDocumentForm)
                            }}
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="tree-title">{doc.title || 'Documento'}</div>
                        <div className="tree-subtitle">{doc.category || 'Categoria non definita'}</div>
                      </div>
                    )}
                  </div>

                  <div>{doc.owner || '—'}</div>
                  <div>{doc.number || '—'}</div>
                  <div>{formatDate(doc.issueDate)}</div>
                  <div>
                    {doc.expiryDate ? (
                      <span className={`badge ${badge.className}`}>
                        {formatDate(doc.expiryDate)} · {badge.label}
                      </span>
                    ) : '—'}
                  </div>

                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn btn-inline-soft"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditDocument(doc)
                      }}
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      className="btn btn-inline-danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteDocument(doc.id)
                      }}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="tree-row">
              <div className="empty-box">Nessuna categoria o documento presente.</div>
            </div>
          )}
        </div>

        {selectedNodeId.startsWith('doc_') ? (
          <div className="section-stack" style={{ marginTop: 12 }}>
            {(() => {
              const docId = selectedNodeId.replace('doc_', '')
              const doc = documents.find((item) => item.id === docId)
              if (!doc) return null

              return (
                <div className="family-card">
                  <div className="family-head">
                    <div>
                      <div className="tree-title">{doc.title || 'Documento'}</div>
                      <div className="tree-subtitle">
                        {doc.category || 'Categoria'} · {doc.owner || 'Senza proprietario'}
                      </div>
                    </div>
                  </div>

                  <div className="pill-row">
                    <MetaPill label="Numero" value={doc.number} />
                    <MetaPill label="Emissione" value={formatDate(doc.issueDate)} />
                    <MetaPill label="Scadenza" value={formatDate(doc.expiryDate)} />
                    <MetaPill label="Archivio" value={doc.storage} />
                  </div>

                  {ensureArray(doc.driveLinks).length ? (
                    <div className="doc-links">
                      {doc.driveLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          className="link-chip"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label || 'Apri link'}
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {doc.notes ? <div className="empty-box">{doc.notes}</div> : null}
                </div>
              )
            })()}
          </div>
        ) : null}
      </div>
    </div>
  )
}
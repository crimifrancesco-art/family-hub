import { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { supabase } from '../lib/supabase'

const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

function fmt(iso) {
  if (!iso) return '—'
  const parts = String(iso).split('-')
  if (parts.length < 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
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

function LinkListEditor({ links, onChange, label = 'Link Google Drive / Calendar' }) {
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
          <div className="muted">Aggiungi più link a Drive, Calendar, PEC, portali o pratiche online.</div>
        </div>
        <button type="button" className="btn btn-s" onClick={handleAdd}>Aggiungi link</button>
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
                  <input className={fieldClass(item.label)} value={item.label} onChange={(e) => handleItemChange(item.id, 'label', e.target.value)} placeholder="Es. PDF polizza, contratto, pratica online" />
                </label>
                <label>
                  <Label>URL</Label>
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

const EMPTY_DOCUMENT_FORM = {
  category: '',
  categoryId: '',
  owner: '',
  ownerId: '',
  title: '',
  number: '',
  issueDate: '',
  expiryDate: '',
  storage: '',
  driveLinks: [],
  notes: '',
  hasWarranty: false,
  warranty: {
    item: '',
    brand: '',
    purchaseDate: '',
    expiryDate: '',
    invoiceRef: '',
    driveLinks: [],
    notes: '',
  },
}

export default function ArchivioPage() {
  const { archiveTables, familyMembers, loadingData, syncError, updateArchive } = useAppContext()

  const [documentForm, setDocumentForm] = useState(EMPTY_DOCUMENT_FORM)
  const [categoryOptions, setCategoryOptions] = useState([])
  const [ownerLookupOptions, setOwnerLookupOptions] = useState([])
  const [lookupError, setLookupError] = useState('')
  const [formErrors, setFormErrors] = useState({})

  const documents = archiveTables?.documents || []
  const warranties = archiveTables?.warranties || []

  useEffect(() => {
    let mounted = true

    const loadLookups = async () => {
      setLookupError('')

      const [categoriesRes, ownersRes] = await Promise.all([
        supabase.from('archive_categories').select('id, name').order('name', { ascending: true }),
        supabase.from('archive_owners').select('id, name').order('name', { ascending: true }),
      ])

      if (!mounted) return

      if (categoriesRes.error || ownersRes.error) {
        setLookupError(categoriesRes.error?.message || ownersRes.error?.message || 'Errore caricamento lookup archivio.')
        setCategoryOptions([])
        setOwnerLookupOptions([])
        return
      }

      setCategoryOptions(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
      setOwnerLookupOptions(Array.isArray(ownersRes.data) ? ownersRes.data : [])
    }

    loadLookups()
    return () => {
      mounted = false
    }
  }, [])

  const fallbackOwnerOptions = useMemo(() => {
    const memberNames = familyMembers
      .map((member) => ({ id: member.id, name: member.name || member.initials || member.role }))
      .filter((member) => member.name)
    return [{ id: 'family_local', name: 'Famiglia' }, ...memberNames]
  }, [familyMembers])

  const effectiveOwnerOptions = ownerLookupOptions.length ? ownerLookupOptions : fallbackOwnerOptions

  const stats = useMemo(() => ({
    documents: documents.length,
    warranties: warranties.length,
    expiringDocuments: documents.filter((doc) => doc.expiryDate).length,
    expiringWarranties: warranties.filter((war) => war.expiryDate).length,
  }), [documents, warranties])

  const saveDocuments = (nextDocuments) => {
    updateArchive((prev) => ({ documents: nextDocuments, warranties: prev.warranties }))
  }

  const saveWarranties = (nextWarranties) => {
    updateArchive((prev) => ({ documents: prev.documents, warranties: nextWarranties }))
  }

  const handleCategorySelect = (categoryId) => {
    const selected = categoryOptions.find((item) => String(item.id) === String(categoryId))
    setDocumentForm((prev) => ({ ...prev, categoryId, category: selected?.name || '' }))
  }

  const handleOwnerSelect = (ownerId) => {
    const selected = effectiveOwnerOptions.find((item) => String(item.id) === String(ownerId))
    setDocumentForm((prev) => ({ ...prev, ownerId, owner: selected?.name || '' }))
  }

  const validateDocumentForm = () => {
    const errors = {}
    if (!documentForm.categoryId && !documentForm.category.trim()) errors.categoryId = 'Seleziona una categoria.'
    if (!documentForm.title.trim()) errors.title = 'Inserisci il titolo del documento.'
    if (documentForm.hasWarranty) {
      if (!documentForm.warranty.item.trim()) errors.warrantyItem = 'Inserisci l’oggetto della garanzia.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddDocument = (e) => {
    e.preventDefault()
    if (!validateDocumentForm()) return

    const newDoc = {
      id: uid('doc'),
      category: documentForm.category.trim(),
      categoryId: documentForm.categoryId,
      owner: documentForm.owner.trim(),
      ownerId: documentForm.ownerId,
      title: documentForm.title.trim(),
      number: documentForm.number.trim(),
      issueDate: documentForm.issueDate,
      expiryDate: documentForm.expiryDate,
      storage: documentForm.storage.trim(),
      driveLinks: ensureDriveLinks(documentForm.driveLinks),
      notes: documentForm.notes.trim(),
    }

    saveDocuments([...documents, newDoc])

    if (documentForm.hasWarranty) {
      saveWarranties([
        ...warranties,
        {
          id: uid('war'),
          item: documentForm.warranty.item.trim(),
          brand: documentForm.warranty.brand.trim(),
          purchaseDate: documentForm.warranty.purchaseDate,
          expiryDate: documentForm.warranty.expiryDate,
          invoiceRef: documentForm.warranty.invoiceRef.trim(),
          driveLinks: ensureDriveLinks(documentForm.warranty.driveLinks),
          notes: documentForm.warranty.notes.trim(),
        },
      ])
    }

    setDocumentForm(EMPTY_DOCUMENT_FORM)
    setFormErrors({})
  }

  const handleUpdateDocument = (docId, field, value) => {
    saveDocuments(documents.map((doc) => (doc.id === docId ? { ...doc, [field]: value } : doc)))
  }

  const handleUpdateDocumentCategory = (docId, categoryId) => {
    const selected = categoryOptions.find((item) => String(item.id) === String(categoryId))
    saveDocuments(documents.map((doc) => (doc.id === docId ? { ...doc, categoryId, category: selected?.name || '' } : doc)))
  }

  const handleUpdateDocumentOwner = (docId, ownerId) => {
    const selected = effectiveOwnerOptions.find((item) => String(item.id) === String(ownerId))
    saveDocuments(documents.map((doc) => (doc.id === docId ? { ...doc, ownerId, owner: selected?.name || '' } : doc)))
  }

  const handleDeleteDocument = (docId) => {
    saveDocuments(documents.filter((doc) => doc.id !== docId))
  }

  const handleUpdateWarranty = (warId, field, value) => {
    saveWarranties(warranties.map((war) => (war.id === warId ? { ...war, [field]: value } : war)))
  }

  const handleDeleteWarranty = (warId) => {
    saveWarranties(warranties.filter((war) => war.id !== warId))
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Archivio</div>
          <h1>Caricamento archivio in corso...</h1>
          <p>Sto caricando categorie, documenti e garanzie.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Archivio documenti</div>
        <h1>Archivio semplice, chiaro e in stile organizzatore</h1>
        <p>
          Inserisci un documento scegliendo la categoria dalla tabella dedicata, poi aggiungi dati opzionali, link Drive o Calendar.
          La garanzia compare solo se serve. I documenti personali restano nella scheda del familiare e non vanno ripetuti qui.
        </p>
        {syncError ? <div className="app-status" style={{ marginTop: 14 }}>{syncError}</div> : null}
        {lookupError ? <div className="app-status" style={{ marginTop: 14 }}>{lookupError}</div> : null}
        <div className="hero-meta" style={{ marginTop: 14 }}>
          <span className="meta-chip">{stats.documents} documenti</span>
          <span className="meta-chip">{stats.warranties} garanzie</span>
          <span className="meta-chip">{stats.expiringDocuments} con scadenza</span>
          <span className="meta-chip">{stats.expiringWarranties} garanzie con scadenza</span>
        </div>
      </section>

      <section className="card stack-card">
        <div className="card-title">Nuovo documento</div>
        <form className="form-shell form-grid" onSubmit={handleAddDocument}>
          <div className="form-header">
            <div>
              <h3 className="form-title">Inserisci un nuovo documento</h3>
              <p className="form-intro">Compila solo quello che serve. I campi obbligatori sono pochi e ben visibili.</p>
            </div>
            <span className="badge">Archivio</span>
          </div>

          <div className="form-section-title">Documento principale</div>
          <div className="grid-cards responsive-2">
            <label>
              <Label required>Categoria</Label>
              <select className={fieldClass(documentForm.categoryId || documentForm.category, Boolean(formErrors.categoryId))} value={documentForm.categoryId} onChange={(e) => handleCategorySelect(e.target.value)}>
                <option value="">Seleziona categoria</option>
                {categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <ErrorLine text={formErrors.categoryId} />
            </label>
            <label>
              <Label>Intestatario</Label>
              <select className={fieldClass(documentForm.ownerId || documentForm.owner)} value={documentForm.ownerId} onChange={(e) => handleOwnerSelect(e.target.value)}>
                <option value="">Seleziona intestatario</option>
                {effectiveOwnerOptions.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
              </select>
            </label>
            <label className="responsive-full">
              <Label required>Titolo documento</Label>
              <input className={fieldClass(documentForm.title, Boolean(formErrors.title))} value={documentForm.title} onChange={(e) => setDocumentForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Es. Assicurazione casa, Contratto, Polizza, Bollo auto" />
              <ErrorLine text={formErrors.title} />
            </label>
            <label>
              <Label>Numero / riferimento</Label>
              <input className={fieldClass(documentForm.number)} value={documentForm.number} onChange={(e) => setDocumentForm((prev) => ({ ...prev, number: e.target.value }))} placeholder="Numero pratica, polizza, contratto..." />
            </label>
            <label>
              <Label>Posizione archivio</Label>
              <input className={fieldClass(documentForm.storage)} value={documentForm.storage} onChange={(e) => setDocumentForm((prev) => ({ ...prev, storage: e.target.value }))} placeholder="Es. Drive, cartella casa, raccoglitore studio" />
            </label>
            <label>
              <Label>Data emissione</Label>
              <input type="date" className={fieldClass(documentForm.issueDate)} value={documentForm.issueDate} onChange={(e) => setDocumentForm((prev) => ({ ...prev, issueDate: e.target.value }))} />
            </label>
            <label>
              <Label>Data scadenza</Label>
              <input type="date" className={fieldClass(documentForm.expiryDate)} value={documentForm.expiryDate} onChange={(e) => setDocumentForm((prev) => ({ ...prev, expiryDate: e.target.value }))} />
            </label>
            <label className="responsive-full">
              <Label>Note</Label>
              <textarea className={fieldClass(documentForm.notes)} value={documentForm.notes} onChange={(e) => setDocumentForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Annotazioni utili, rinnovi, scadenze, riferimenti di contatto" />
            </label>
          </div>

          <LinkListEditor links={documentForm.driveLinks} onChange={(next) => setDocumentForm((prev) => ({ ...prev, driveLinks: next }))} />

          <div className="section-divider" />
          <div className="between">
            <div>
              <div className="form-section-title">Garanzia opzionale</div>
              <div className="muted">Apri il form solo se questo documento ha anche una garanzia collegata.</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" style={{ width: 18, height: 18 }} checked={Boolean(documentForm.hasWarranty)} onChange={(e) => setDocumentForm((prev) => ({ ...prev, hasWarranty: e.target.checked }))} />
              <span className="card-subtitle">Aggiungi anche garanzia</span>
            </label>
          </div>

          {documentForm.hasWarranty ? (
            <div className="subsection-box" style={{ display: 'grid', gap: 14 }}>
              <div className="grid-cards responsive-2">
                <label>
                  <Label required>Oggetto garanzia</Label>
                  <input className={fieldClass(documentForm.warranty.item, Boolean(formErrors.warrantyItem))} value={documentForm.warranty.item} onChange={(e) => setDocumentForm((prev) => ({ ...prev, warranty: { ...prev.warranty, item: e.target.value } }))} placeholder="Es. TV, caldaia, frigorifero" />
                  <ErrorLine text={formErrors.warrantyItem} />
                </label>
                <label>
                  <Label>Marca</Label>
                  <input className={fieldClass(documentForm.warranty.brand)} value={documentForm.warranty.brand} onChange={(e) => setDocumentForm((prev) => ({ ...prev, warranty: { ...prev.warranty, brand: e.target.value } }))} placeholder="Marca prodotto" />
                </label>
                <label>
                  <Label>Data acquisto</Label>
                  <input type="date" className={fieldClass(documentForm.warranty.purchaseDate)} value={documentForm.warranty.purchaseDate} onChange={(e) => setDocumentForm((prev) => ({ ...prev, warranty: { ...prev.warranty, purchaseDate: e.target.value } }))} />
                </label>
                <label>
                  <Label>Scadenza garanzia</Label>
                  <input type="date" className={fieldClass(documentForm.warranty.expiryDate)} value={documentForm.warranty.expiryDate} onChange={(e) => setDocumentForm((prev) => ({ ...prev, warranty: { ...prev.warranty, expiryDate: e.target.value } }))} />
                </label>
                <label className="responsive-full">
                  <Label>Fattura / riferimento</Label>
                  <input className={fieldClass(documentForm.warranty.invoiceRef)} value={documentForm.warranty.invoiceRef} onChange={(e) => setDocumentForm((prev) => ({ ...prev, warranty: { ...prev.warranty, invoiceRef: e.target.value } }))} placeholder="Numero fattura, ordine o ricevuta" />
                </label>
                <label className="responsive-full">
                  <Label>Note garanzia</Label>
                  <textarea className={fieldClass(documentForm.warranty.notes)} value={documentForm.warranty.notes} onChange={(e) => setDocumentForm((prev) => ({ ...prev, warranty: { ...prev.warranty, notes: e.target.value } }))} placeholder="Assistenza, estensione, centro assistenza, condizioni" />
                </label>
              </div>
              <LinkListEditor links={documentForm.warranty.driveLinks} onChange={(next) => setDocumentForm((prev) => ({ ...prev, warranty: { ...prev.warranty, driveLinks: next } }))} label="Link garanzia" />
            </div>
          ) : null}

          <div>
            <button className="btn btn-p" type="submit">Salva documento</button>
          </div>
        </form>
      </section>

      <section className="grid-cards cols-2">
        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Documenti archiviati</div>
              <div className="muted">Elenco semplice, modificabile direttamente.</div>
            </div>
            <span className="badge success">{documents.length}</span>
          </div>

          {documents.length === 0 ? (
            <EmptyState text="Nessun documento archiviato." />
          ) : (
            <div className="timeline-list">
              {documents.map((doc) => (
                <div key={doc.id} className="timeline-item">
                  <div className="between">
                    <div>
                      <div className="card-subtitle">{doc.title || 'Documento'}</div>
                      <div className="muted">{[doc.category, doc.owner].filter(Boolean).join(' • ') || 'Senza dettagli'}</div>
                    </div>
                    <button type="button" className="btn btn-d btn-s" onClick={() => handleDeleteDocument(doc.id)}>Elimina</button>
                  </div>

                  <div className="grid-cards responsive-2" style={{ marginTop: 12 }}>
                    <label>
                      <Label>Categoria</Label>
                      <select className={fieldClass(doc.categoryId || doc.category)} value={doc.categoryId || ''} onChange={(e) => handleUpdateDocumentCategory(doc.id, e.target.value)}>
                        <option value="">Seleziona categoria</option>
                        {categoryOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                    </label>
                    <label>
                      <Label>Intestatario</Label>
                      <select className={fieldClass(doc.ownerId || doc.owner)} value={doc.ownerId || ''} onChange={(e) => handleUpdateDocumentOwner(doc.id, e.target.value)}>
                        <option value="">Seleziona intestatario</option>
                        {effectiveOwnerOptions.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
                      </select>
                    </label>
                    <label className="responsive-full">
                      <Label>Titolo</Label>
                      <input className={fieldClass(doc.title)} value={doc.title || ''} onChange={(e) => handleUpdateDocument(doc.id, 'title', e.target.value)} />
                    </label>
                    <label>
                      <Label>Numero / riferimento</Label>
                      <input className={fieldClass(doc.number)} value={doc.number || ''} onChange={(e) => handleUpdateDocument(doc.id, 'number', e.target.value)} />
                    </label>
                    <label>
                      <Label>Posizione archivio</Label>
                      <input className={fieldClass(doc.storage)} value={doc.storage || ''} onChange={(e) => handleUpdateDocument(doc.id, 'storage', e.target.value)} />
                    </label>
                    <label>
                      <Label>Data emissione</Label>
                      <input type="date" className={fieldClass(doc.issueDate)} value={doc.issueDate || ''} onChange={(e) => handleUpdateDocument(doc.id, 'issueDate', e.target.value)} />
                    </label>
                    <label>
                      <Label>Data scadenza</Label>
                      <input type="date" className={fieldClass(doc.expiryDate)} value={doc.expiryDate || ''} onChange={(e) => handleUpdateDocument(doc.id, 'expiryDate', e.target.value)} />
                    </label>
                    <label className="responsive-full">
                      <Label>Note</Label>
                      <textarea className={fieldClass(doc.notes)} value={doc.notes || ''} onChange={(e) => handleUpdateDocument(doc.id, 'notes', e.target.value)} />
                    </label>
                  </div>

                  <div className="hero-meta" style={{ marginTop: 10 }}>
                    <span className="meta-chip">Emissione {fmt(doc.issueDate)}</span>
                    <span className="meta-chip">Scadenza {fmt(doc.expiryDate)}</span>
                    <span className="meta-chip">{doc.driveLinks?.length || 0} link</span>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <LinkListEditor links={doc.driveLinks} onChange={(next) => handleUpdateDocument(doc.id, 'driveLinks', next)} label="Link documento" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Garanzie archiviate</div>
              <div className="muted">Le vedi solo se sono state realmente aggiunte.</div>
            </div>
            <span className="badge warning">{warranties.length}</span>
          </div>

          {warranties.length === 0 ? (
            <EmptyState text="Nessuna garanzia archiviata." />
          ) : (
            <div className="timeline-list">
              {warranties.map((war) => (
                <div key={war.id} className="timeline-item">
                  <div className="between">
                    <div>
                      <div className="card-subtitle">{war.item || 'Garanzia'}</div>
                      <div className="muted">{war.brand || 'Marca non indicata'}</div>
                    </div>
                    <button type="button" className="btn btn-d btn-s" onClick={() => handleDeleteWarranty(war.id)}>Elimina</button>
                  </div>

                  <div className="grid-cards responsive-2" style={{ marginTop: 12 }}>
                    <label>
                      <Label>Oggetto</Label>
                      <input className={fieldClass(war.item)} value={war.item || ''} onChange={(e) => handleUpdateWarranty(war.id, 'item', e.target.value)} />
                    </label>
                    <label>
                      <Label>Marca</Label>
                      <input className={fieldClass(war.brand)} value={war.brand || ''} onChange={(e) => handleUpdateWarranty(war.id, 'brand', e.target.value)} />
                    </label>
                    <label>
                      <Label>Data acquisto</Label>
                      <input type="date" className={fieldClass(war.purchaseDate)} value={war.purchaseDate || ''} onChange={(e) => handleUpdateWarranty(war.id, 'purchaseDate', e.target.value)} />
                    </label>
                    <label>
                      <Label>Scadenza garanzia</Label>
                      <input type="date" className={fieldClass(war.expiryDate)} value={war.expiryDate || ''} onChange={(e) => handleUpdateWarranty(war.id, 'expiryDate', e.target.value)} />
                    </label>
                    <label className="responsive-full">
                      <Label>Fattura / riferimento</Label>
                      <input className={fieldClass(war.invoiceRef)} value={war.invoiceRef || ''} onChange={(e) => handleUpdateWarranty(war.id, 'invoiceRef', e.target.value)} />
                    </label>
                    <label className="responsive-full">
                      <Label>Note</Label>
                      <textarea className={fieldClass(war.notes)} value={war.notes || ''} onChange={(e) => handleUpdateWarranty(war.id, 'notes', e.target.value)} />
                    </label>
                  </div>

                  <div className="hero-meta" style={{ marginTop: 10 }}>
                    <span className="meta-chip">Acquisto {fmt(war.purchaseDate)}</span>
                    <span className="meta-chip">Scadenza {fmt(war.expiryDate)}</span>
                    <span className="meta-chip">{war.driveLinks?.length || 0} link</span>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <LinkListEditor links={war.driveLinks} onChange={(next) => handleUpdateWarranty(war.id, 'driveLinks', next)} label="Link garanzia" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}


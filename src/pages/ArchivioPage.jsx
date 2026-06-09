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
          <div className="muted">Aggiungi link a Drive, PEC, portali, calendari o pratiche online.</div>
        </div>
        <div>
          <button type="button" className="btn btn-s" onClick={handleAdd}>
            Aggiungi link
          </button>
        </div>
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
                    onChange={(e) => handleItemChange(item.id, 'label', e.target.value)}
                    placeholder="Es. PDF polizza, contratto, pratica online"
                  />
                </label>
                <label>
                  <Label>URL</Label>
                  <input
                    className={fieldClass(item.url)}
                    value={item.url}
                    onChange={(e) => handleItemChange(item.id, 'url', e.target.value)}
                    placeholder="https://drive.google.com/..."
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
}

const EMPTY_CATEGORY_FORM = {
  name: '',
  kind: 'standard',
}

export default function ArchivioPage() {
  const { archiveTables, familyMembers, loadingData, syncError, updateArchive } = useAppContext()
  const [documentForm, setDocumentForm] = useState(EMPTY_DOCUMENT_FORM)
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM)
  const [formErrors, setFormErrors] = useState({})

  const categories = archiveTables?.categories || []
  const documents = archiveTables?.documents || []
  const warranties = archiveTables?.warranties || []

  const ownerOptions = useMemo(() => {
    const family = familyMembers
      .map((member) => ({
        id: member.id,
        name: member.name || member.initials || member.role || 'Membro famiglia',
      }))
      .filter((item) => item.name)

    return [{ id: 'family_local', name: 'Famiglia' }, ...family]
  }, [familyMembers])

  const referenceCategories = useMemo(
    () => categories.filter((item) => item.kind === 'table'),
    [categories],
  )

  const standardCategories = useMemo(
    () => categories.filter((item) => item.kind !== 'table'),
    [categories],
  )

  const stats = useMemo(
    () => ({
      documents: documents.length,
      categories: categories.length,
      warranties: warranties.length,
      expiringDocuments: documents.filter((doc) => doc.expiryDate).length,
    }),
    [documents, categories, warranties],
  )

  const saveArchive = (next) =>
    updateArchive((prev) => ({
      ...prev,
      ...next,
    }))

  const handleCategorySelect = (categoryId) => {
    const selected = categories.find((item) => String(item.id) === String(categoryId))
    setDocumentForm((prev) => ({
      ...prev,
      categoryId,
      category: selected?.name || '',
    }))
  }

  const handleOwnerSelect = (ownerId) => {
    const selected = ownerOptions.find((item) => String(item.id) === String(ownerId))
    setDocumentForm((prev) => ({
      ...prev,
      ownerId,
      owner: selected?.name || '',
    }))
  }

  const validateDocumentForm = () => {
    const errors = {}
    if (!documentForm.categoryId && !documentForm.category.trim()) errors.categoryId = 'Seleziona una categoria.'
    if (!documentForm.title.trim()) errors.title = 'Inserisci il titolo del documento.'
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

    saveArchive({ documents: [...documents, newDoc] })
    setDocumentForm(EMPTY_DOCUMENT_FORM)
    setFormErrors({})
  }

  const handleAddCategory = (e) => {
    e.preventDefault()
    if (!categoryForm.name.trim()) return

    const nextCategory = {
      id: uid('cat'),
      name: categoryForm.name.trim(),
      kind: categoryForm.kind,
    }

    saveArchive({ categories: [...categories, nextCategory] })
    setCategoryForm(EMPTY_CATEGORY_FORM)
  }

  const handleUpdateCategory = (categoryId, field, value) => {
    saveArchive({
      categories: categories.map((item) => (item.id === categoryId ? { ...item, [field]: value } : item)),
      documents:
        field === 'name'
          ? documents.map((doc) =>
              doc.categoryId === categoryId ? { ...doc, category: value } : doc,
            )
          : documents,
    })
  }

  const handleDeleteCategory = (categoryId) => {
    const protectedIds = ['cat_identity', 'cat_house', 'cat_auto', 'cat_work', 'cat_school', 'cat_health', 'cat_reference']
    if (protectedIds.includes(categoryId)) return

    saveArchive({
      categories: categories.filter((item) => item.id !== categoryId),
      documents: documents.map((doc) =>
        doc.categoryId === categoryId ? { ...doc, categoryId: '', category: doc.category || '' } : doc,
      ),
    })
  }

  const handleUpdateDocument = (docId, field, value) => {
    saveArchive({
      documents: documents.map((doc) => (doc.id === docId ? { ...doc, [field]: value } : doc)),
    })
  }

  const handleUpdateDocumentCategory = (docId, categoryId) => {
    const selected = categories.find((item) => String(item.id) === String(categoryId))
    saveArchive({
      documents: documents.map((doc) =>
        doc.id === docId
          ? { ...doc, categoryId, category: selected?.name || doc.category }
          : doc,
      ),
    })
  }

  const handleUpdateDocumentOwner = (docId, ownerId) => {
    const selected = ownerOptions.find((item) => String(item.id) === String(ownerId))
    saveArchive({
      documents: documents.map((doc) =>
        doc.id === docId ? { ...doc, ownerId, owner: selected?.name || doc.owner } : doc,
      ),
    })
  }

  const handleDeleteDocument = (docId) => {
    saveArchive({
      documents: documents.filter((doc) => doc.id !== docId),
    })
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Archivio</div>
          <h1>Caricamento archivio in corso...</h1>
          <p>Sto caricando categorie, documenti e riferimenti.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card archive-hero">
        <div className="eyebrow">Archivio documenti</div>
        <h1>Archivio semplice, ordinato e in stile drive</h1>
        <p>
          Qui non usiamo più la tabella remota `archive_categories`, quindi sparisce l’errore Supabase sulla colonna
          `name`. Le categorie diventano dati dell’app, modificabili e persistiti dentro `app_state`.
        </p>

        {syncError ? <div className="app-status" style={{ marginTop: 14 }}>{syncError}</div> : null}

        <div className="hero-meta" style={{ marginTop: 14 }}>
          <span className="meta-chip">{stats.documents} documenti</span>
          <span className="meta-chip">{stats.categories} categorie</span>
          <span className="meta-chip">{stats.expiringDocuments} con scadenza</span>
          <span className="meta-chip">{referenceCategories.length} tabelle riferimento</span>
        </div>
      </section>

      <section className="grid-cards cols-2 archive-drive-layout">
        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Categorie archivio</div>
              <div className="muted">Struttura modificabile come un pannello organizzatore.</div>
            </div>
            <span className="badge">Drive style</span>
          </div>

          <form className="form-shell" onSubmit={handleAddCategory}>
            <div className="grid-cards responsive-3">
              <label>
                <Label required>Nome categoria</Label>
                <input
                  className={fieldClass(categoryForm.name)}
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Es. Mutui, documenti fiscali, certificati"
                />
              </label>

              <label>
                <Label>Tipo</Label>
                <select
                  className={fieldClass(categoryForm.kind)}
                  value={categoryForm.kind}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, kind: e.target.value }))}
                >
                  <option value="standard">Standard</option>
                  <option value="table">Tabellare / riferimento</option>
                </select>
              </label>

              <div className="archive-submit-col">
                <button className="btn btn-p" type="submit">
                  Aggiungi categoria
                </button>
              </div>
            </div>
          </form>

          <div className="drive-table-wrap">
            <table className="drive-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        className="fi"
                        value={item.name}
                        onChange={(e) => handleUpdateCategory(item.id, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="fi"
                        value={item.kind}
                        onChange={(e) => handleUpdateCategory(item.id, 'kind', e.target.value)}
                      >
                        <option value="standard">Standard</option>
                        <option value="table">Tabellare</option>
                      </select>
                    </td>
                    <td>
                      <button type="button" className="btn btn-d btn-s" onClick={() => handleDeleteCategory(item.id)}>
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card stack-card">
          <div className="between">
            <div>
              <div className="card-title">Nuovo documento</div>
              <div className="muted">Scheda compatta per inserimento rapido.</div>
            </div>
            <span className="badge success">Archivio</span>
          </div>

          <form className="form-shell form-grid" onSubmit={handleAddDocument}>
            <div className="grid-cards responsive-2">
              <label>
                <Label required>Categoria</Label>
                <select
                  className={fieldClass(documentForm.categoryId || documentForm.category, Boolean(formErrors.categoryId))}
                  value={documentForm.categoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                >
                  <option value="">Seleziona categoria</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ErrorLine text={formErrors.categoryId} />
              </label>

              <label>
                <Label>Intestatario</Label>
                <select
                  className={fieldClass(documentForm.ownerId || documentForm.owner)}
                  value={documentForm.ownerId}
                  onChange={(e) => handleOwnerSelect(e.target.value)}
                >
                  <option value="">Seleziona intestatario</option>
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="responsive-full">
                <Label required>Titolo documento</Label>
                <input
                  className={fieldClass(documentForm.title, Boolean(formErrors.title))}
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Es. Contratto, bollo, visura, certificato"
                />
                <ErrorLine text={formErrors.title} />
              </label>

              <label>
                <Label>Numero riferimento</Label>
                <input
                  className={fieldClass(documentForm.number)}
                  value={documentForm.number}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, number: e.target.value }))}
                />
              </label>

              <label>
                <Label>Posizione archivio</Label>
                <input
                  className={fieldClass(documentForm.storage)}
                  value={documentForm.storage}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, storage: e.target.value }))}
                  placeholder="Es. Google Drive / cartella fisica / studio"
                />
              </label>

              <label>
                <Label>Data emissione</Label>
                <input
                  type="date"
                  className={fieldClass(documentForm.issueDate)}
                  value={documentForm.issueDate}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                />
              </label>

              <label>
                <Label>Data scadenza</Label>
                <input
                  type="date"
                  className={fieldClass(documentForm.expiryDate)}
                  value={documentForm.expiryDate}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                />
              </label>

              <label className="responsive-full">
                <Label>Note</Label>
                <textarea
                  className={fieldClass(documentForm.notes)}
                  value={documentForm.notes}
                  onChange={(e) => setDocumentForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </label>
            </div>

            <LinkListEditor
              links={documentForm.driveLinks}
              onChange={(next) => setDocumentForm((prev) => ({ ...prev, driveLinks: next }))}
            />

            <div>
              <button className="btn btn-p" type="submit">
                Salva documento
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="card stack-card">
        <div className="between">
          <div>
            <div className="card-title">Documenti archiviati</div>
            <div className="muted">
              Vista modificabile, con aspetto più vicino a una lista organizzata tipo Google Drive.
            </div>
          </div>
          <span className="badge success">{documents.length}</span>
        </div>

        {documents.length === 0 ? (
          <EmptyState text="Nessun documento archiviato." />
        ) : (
          <div className="drive-table-wrap">
            <table className="drive-table">
              <thead>
                <tr>
                  <th>Titolo</th>
                  <th>Categoria</th>
                  <th>Intestatario</th>
                  <th>Emissione</th>
                  <th>Scadenza</th>
                  <th>Archivio</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <input
                        className="fi"
                        value={doc.title}
                        onChange={(e) => handleUpdateDocument(doc.id, 'title', e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        className="fi"
                        value={doc.categoryId}
                        onChange={(e) => handleUpdateDocumentCategory(doc.id, e.target.value)}
                      >
                        <option value="">Seleziona</option>
                        {categories.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className="fi"
                        value={doc.ownerId}
                        onChange={(e) => handleUpdateDocumentOwner(doc.id, e.target.value)}
                      >
                        <option value="">Seleziona</option>
                        {ownerOptions.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="fi"
                        value={doc.issueDate}
                        onChange={(e) => handleUpdateDocument(doc.id, 'issueDate', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="fi"
                        value={doc.expiryDate}
                        onChange={(e) => handleUpdateDocument(doc.id, 'expiryDate', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="fi"
                        value={doc.storage}
                        onChange={(e) => handleUpdateDocument(doc.id, 'storage', e.target.value)}
                      />
                    </td>
                    <td>
                      <button type="button" className="btn btn-d btn-s" onClick={() => handleDeleteDocument(doc.id)}>
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid-cards cols-2">
        <article className="card stack-card">
          <div className="card-title">Documenti di riferimento</div>
          <div className="muted">
            Categoria tabellare espandibile e modificabile. Qui puoi mettere schede comuni, riferimenti, moduli base e
            documenti condivisi.
          </div>

          {referenceCategories.length === 0 ? (
            <EmptyState text="Nessuna categoria tabellare configurata." />
          ) : (
            <div className="timeline-list">
              {referenceCategories.map((category) => {
                const rows = documents.filter((doc) => doc.categoryId === category.id)
                return (
                  <div key={category.id} className="timeline-item">
                    <div className="between">
                      <div>
                        <div className="card-subtitle">{category.name}</div>
                        <div className="muted">{rows.length} documenti collegati</div>
                      </div>
                      <span className="badge">{category.kind}</span>
                    </div>

                    <div className="hero-meta" style={{ marginTop: 10 }}>
                      {rows.length === 0 ? (
                        <span className="meta-chip">Nessun documento</span>
                      ) : (
                        rows.map((row) => (
                          <span key={row.id} className="meta-chip">
                            {row.title} · {fmt(row.expiryDate)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </article>

        <article className="card stack-card">
          <div className="card-title">Note archivio</div>
          <div className="muted">
            Sono state rimosse le dipendenze esterne a `archive_categories`, e non esiste più la sezione “garanzie e
            assicurazione casa” come blocco grafico prioritario. Le garanzie restano solo come dati storici se già
            presenti nello stato. 
          </div>

          <div className="timeline-list">
            {warranties.length === 0 ? (
              <EmptyState text="Nessuna garanzia salvata." />
            ) : (
              warranties.map((war) => (
                <div key={war.id} className="timeline-item compact">
                  <div className="card-subtitle">{war.item || 'Garanzia'}</div>
                  <div className="muted">
                    {war.brand || 'Marca non indicata'} · scadenza {fmt(war.expiryDate)}
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
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

function todayStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function diffDays(value) {
  if (!value) return null
  const base = todayStart()
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  const normalized = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((normalized.getTime() - base.getTime()) / (1000 * 60 * 60 * 24))
}

function expiryBadgeClass(days) {
  if (days === null) return 'badge-muted'
  if (days < 0) return 'badge-danger'
  if (days <= 30) return 'badge-warning'
  return 'badge-success'
}

function expiryLabel(days) {
  if (days === null) return 'Nessuna scadenza'
  if (days < 0) return `Scaduto da ${Math.abs(days)} gg`
  if (days === 0) return 'Scade oggi'
  if (days === 1) return 'Scade domani'
  return `Scade tra ${days} gg`
}

function EmptyState({ text }) {
  return <div className="empty">{text}</div>
}

function ArchiveMetric({ icon, label, value, sub }) {
  return (
    <div className="widget-card wc-arch" style={{ cursor: 'default' }}>
      <div className="widget-icon">{icon}</div>
      <div className="widget-label">{label}</div>
      <div className="widget-value">{value}</div>
      <div className="widget-sub">{sub}</div>
    </div>
  )
}

export default function ArchivioPage() {
  const {
    archiveTables,
    familyMembers,
    loadingData,
    syncError,
    updateArchive,
  } = useAppContext()

  const categories = archiveTables?.categories || []
  const documents = archiveTables?.documents || []
  const warranties = archiveTables?.warranties || []
  const members = familyMembers || []

  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || 'all')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('documents')
  const [openDocumentId, setOpenDocumentId] = useState('')
  const [openWarrantyId, setOpenWarrantyId] = useState('')

  const searchText = search.trim().toLowerCase()

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchCategory = selectedCategoryId === 'all' || doc.categoryId === selectedCategoryId
      const haystack = [
        doc.title,
        doc.category,
        doc.owner,
        doc.number,
        doc.storage,
        doc.notes,
      ]
        .join(' ')
        .toLowerCase()

      const matchSearch = !searchText || haystack.includes(searchText)
      return matchCategory && matchSearch
    })
  }, [documents, searchText, selectedCategoryId])

  const filteredWarranties = useMemo(() => {
    return warranties.filter((row) => {
      const haystack = [row.item, row.brand, row.invoiceRef, row.notes].join(' ').toLowerCase()
      return !searchText || haystack.includes(searchText)
    })
  }, [searchText, warranties])

  const archiveSummary = useMemo(() => {
    const expiringDocuments = documents.filter((doc) => {
      const days = diffDays(doc.expiryDate)
      return days !== null && days <= 30
    })

    const expiredDocuments = documents.filter((doc) => {
      const days = diffDays(doc.expiryDate)
      return days !== null && days < 0
    })

    const withDrive = documents.filter((doc) => (doc.driveLinks || []).length > 0).length
    const withOwner = documents.filter((doc) => doc.owner || doc.ownerId).length

    return {
      categoriesCount: categories.length,
      documentsCount: documents.length,
      expiringCount: expiringDocuments.length,
      expiredCount: expiredDocuments.length,
      driveCount: withDrive,
      ownedCount: withOwner,
      warrantiesCount: warranties.length,
    }
  }, [categories.length, documents, warranties.length])

  function syncCategoryName(categoryId, nextName, currentCategories) {
    const category = currentCategories.find((item) => item.id === categoryId)
    const prevName = category?.name || ''
    if (!prevName || prevName === nextName) return documents

    return documents.map((doc) =>
      doc.categoryId === categoryId ? { ...doc, category: nextName } : doc,
    )
  }

  function addCategory() {
    const nextCategories = [
      ...categories,
      { id: uid('cat'), name: 'Nuova categoria', kind: 'standard' },
    ]
    updateArchive({
      categories: nextCategories,
      documents,
      warranties,
    })
  }

  function updateCategory(categoryId, field, value) {
    const nextCategories = categories.map((item) =>
      item.id === categoryId ? { ...item, [field]: value } : item,
    )

    const nextDocuments =
      field === 'name'
        ? syncCategoryName(categoryId, value, categories)
        : documents

    updateArchive({
      categories: nextCategories,
      documents: nextDocuments,
      warranties,
    })
  }

  function deleteCategory(categoryId) {
    updateArchive({
      categories: categories.filter((item) => item.id !== categoryId),
      documents: documents.filter((doc) => doc.categoryId !== categoryId),
      warranties,
    })
    if (selectedCategoryId === categoryId) setSelectedCategoryId('all')
  }

  function addDocument() {
    const fallbackCategory = categories[0] || null
    updateArchive({
      categories,
      documents: [
        ...documents,
        {
          id: uid('doc'),
          category: fallbackCategory?.name || '',
          categoryId: fallbackCategory?.id || '',
          owner: '',
          ownerId: '',
          title: 'Nuovo documento',
          number: '',
          issueDate: '',
          expiryDate: '',
          storage: '',
          driveLinks: [],
          notes: '',
        },
      ],
      warranties,
    })
  }

  function updateDocument(documentId, patch) {
    const nextDocuments = documents.map((doc) => {
      if (doc.id !== documentId) return doc

      const next = { ...doc, ...patch }

      if (Object.prototype.hasOwnProperty.call(patch, 'categoryId')) {
        const category = categories.find((item) => item.id === patch.categoryId)
        next.category = category?.name || ''
      }

      if (Object.prototype.hasOwnProperty.call(patch, 'ownerId')) {
        const owner = members.find((member) => member.id === patch.ownerId)
        next.owner = owner?.name || owner?.role || owner?.initials || ''
      }

      return next
    })

    updateArchive({
      categories,
      documents: nextDocuments,
      warranties,
    })
  }

  function deleteDocument(documentId) {
    updateArchive({
      categories,
      documents: documents.filter((doc) => doc.id !== documentId),
      warranties,
    })
    if (openDocumentId === documentId) setOpenDocumentId('')
  }

  function addDocumentDriveLink(documentId) {
    updateArchive({
      categories,
      documents: documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              driveLinks: [...(doc.driveLinks || []), { id: uid('lnk'), label: '', url: '' }],
            }
          : doc,
      ),
      warranties,
    })
  }

  function updateDocumentDriveLink(documentId, linkId, patch) {
    updateArchive({
      categories,
      documents: documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              driveLinks: (doc.driveLinks || []).map((link) =>
                link.id === linkId ? { ...link, ...patch } : link,
              ),
            }
          : doc,
      ),
      warranties,
    })
  }

  function removeDocumentDriveLink(documentId, linkId) {
    updateArchive({
      categories,
      documents: documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              driveLinks: (doc.driveLinks || []).filter((link) => link.id !== linkId),
            }
          : doc,
      ),
      warranties,
    })
  }

  function addWarranty() {
    updateArchive({
      categories,
      documents,
      warranties: [
        ...warranties,
        {
          id: uid('war'),
          item: 'Nuovo bene',
          brand: '',
          purchaseDate: '',
          expiryDate: '',
          invoiceRef: '',
          driveLinks: [],
          notes: '',
        },
      ],
    })
  }

  function updateWarranty(warrantyId, patch) {
    updateArchive({
      categories,
      documents,
      warranties: warranties.map((row) => (row.id === warrantyId ? { ...row, ...patch } : row)),
    })
  }

  function deleteWarranty(warrantyId) {
    updateArchive({
      categories,
      documents,
      warranties: warranties.filter((row) => row.id !== warrantyId),
    })
    if (openWarrantyId === warrantyId) setOpenWarrantyId('')
  }

  function addWarrantyDriveLink(warrantyId) {
    updateArchive({
      categories,
      documents,
      warranties: warranties.map((row) =>
        row.id === warrantyId
          ? {
              ...row,
              driveLinks: [...(row.driveLinks || []), { id: uid('lnk'), label: '', url: '' }],
            }
          : row,
      ),
    })
  }

  function updateWarrantyDriveLink(warrantyId, linkId, patch) {
    updateArchive({
      categories,
      documents,
      warranties: warranties.map((row) =>
        row.id === warrantyId
          ? {
              ...row,
              driveLinks: (row.driveLinks || []).map((link) =>
                link.id === linkId ? { ...link, ...patch } : link,
              ),
            }
          : row,
      ),
    })
  }

  function removeWarrantyDriveLink(warrantyId, linkId) {
    updateArchive({
      categories,
      documents,
      warranties: warranties.map((row) =>
        row.id === warrantyId
          ? {
              ...row,
              driveLinks: (row.driveLinks || []).filter((link) => link.id !== linkId),
            }
          : row,
      ),
    })
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Archivio digitale</div>
          <h1 className="page-title">Sto caricando i documenti</h1>
          <p className="page-subtitle">Categorie, file, link Drive e riferimenti famiglia.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Archivio digitale</div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Archivio famiglia</h1>
            <p className="page-subtitle">
              Documenti, PDF, foto, link Google Drive, garanzie e scadenze in un solo spazio.
            </p>
          </div>
          <div className="row">
            <span className="badge badge-arch">{archiveSummary.documentsCount} documenti</span>
            <span className="badge badge-warning">{archiveSummary.expiringCount} in scadenza</span>
            <span className="badge badge-dash">{archiveSummary.categoriesCount} categorie</span>
          </div>
        </div>
        {syncError ? <div className="app-status">{syncError}</div> : null}
      </section>

      <section>
        <div className="section-title">Panoramica archivio</div>
        <div className="grid-2 widget-grid">
          <ArchiveMetric
            icon="🗂️"
            label="Categorie"
            value={archiveSummary.categoriesCount}
            sub="Struttura archivio personalizzabile"
          />
          <ArchiveMetric
            icon="📄"
            label="Documenti"
            value={archiveSummary.documentsCount}
            sub={`${archiveSummary.driveCount} con link Drive`}
          />
          <ArchiveMetric
            icon="⏳"
            label="Scadenze"
            value={archiveSummary.expiringCount}
            sub={`${archiveSummary.expiredCount} già scaduti`}
          />
          <ArchiveMetric
            icon="🧾"
            label="Garanzie"
            value={archiveSummary.warrantiesCount}
            sub="Beni, fatture e riferimenti"
          />
        </div>
      </section>

      <section className="card">
        <div className="between">
          <div>
            <div className="section-title">Ricerca e filtri</div>
            <p className="page-subtitle">Trova rapidamente documenti, intestatari e riferimenti.</p>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: 12 }}>
          <div className="fg">
            <label className="fl">Cerca</label>
            <input
              className="fi fi-arch"
              placeholder="Titolo, proprietario, numero, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="fg">
            <label className="fl">Categoria</label>
            <select
              className="fi fi-arch"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="all">Tutte le categorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name || 'Categoria'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <button
            className={`btn btn-sm ${activeTab === 'documents' ? 'btn-arch' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Documenti
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'warranties' ? 'btn-arch' : ''}`}
            onClick={() => setActiveTab('warranties')}
          >
            Garanzie
          </button>
          <button className="btn btn-sm" onClick={addCategory}>
            + Categoria
          </button>
          <button className="btn btn-arch btn-sm" onClick={addDocument}>
            + Documento
          </button>
          <button className="btn btn-sm" onClick={addWarranty}>
            + Garanzia
          </button>
        </div>
      </section>

      <section className="card">
        <div className="between">
          <div>
            <div className="section-title">Categorie archivio</div>
            <p className="page-subtitle">Blocchi organizzativi modificabili e persistiti dentro app.</p>
          </div>
        </div>

        <div className="timeline-list" style={{ marginTop: 12 }}>
          {categories.length === 0 ? (
            <EmptyState text="Nessuna categoria presente." />
          ) : (
            categories.map((category) => {
              const countDocs = documents.filter((doc) => doc.categoryId === category.id).length
              return (
                <div key={category.id} className="subsection-box">
                  <div className="form-grid">
                    <div className="fg">
                      <label className="fl">Nome categoria</label>
                      <input
                        className="fi fi-arch"
                        value={category.name || ''}
                        onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="fg">
                      <label className="fl">Tipo</label>
                      <select
                        className="fi fi-arch"
                        value={category.kind || 'standard'}
                        onChange={(e) => updateCategory(category.id, 'kind', e.target.value)}
                      >
                        <option value="standard">Standard</option>
                        <option value="table">Tabella</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <span className="badge badge-arch">{countDocs} documenti</span>
                    <button className="btn btn-d btn-sm" onClick={() => deleteCategory(category.id)}>
                      Elimina categoria
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {activeTab === 'documents' ? (
        <section className="card">
          <div className="between">
            <div>
              <div className="section-title">Documenti</div>
              <p className="page-subtitle">
                Schede digitali con intestatario, scadenza, archivio fisico e link Google Drive.
              </p>
            </div>
          </div>

          <div className="timeline-list" style={{ marginTop: 12 }}>
            {filteredDocuments.length === 0 ? (
              <EmptyState text="Nessun documento trovato con i filtri correnti." />
            ) : (
              filteredDocuments.map((doc) => {
                const isOpen = openDocumentId === doc.id
                const days = diffDays(doc.expiryDate)

                return (
                  <div key={doc.id} className="timeline-item tl-arch">
                    <div className="between">
                      <div>
                        <div className="strong">{doc.title || 'Documento'}</div>
                        <div className="small muted" style={{ marginTop: 4 }}>
                          {doc.category || 'Categoria'} · {doc.owner || 'Intestatario non indicato'}
                        </div>
                      </div>
                      <div className="row">
                        <span className={`badge ${expiryBadgeClass(days)}`}>{expiryLabel(days)}</span>
                        <button className="btn btn-sm" onClick={() => setOpenDocumentId(isOpen ? '' : doc.id)}>
                          {isOpen ? 'Chiudi' : 'Apri'}
                        </button>
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="stack-card" style={{ marginTop: 14 }}>
                        <div className="form-grid">
                          <div className="fg">
                            <label className="fl">Titolo</label>
                            <input
                              className="fi fi-arch"
                              value={doc.title || ''}
                              onChange={(e) => updateDocument(doc.id, { title: e.target.value })}
                            />
                          </div>
                          <div className="fg">
                            <label className="fl">Categoria</label>
                            <select
                              className="fi fi-arch"
                              value={doc.categoryId || ''}
                              onChange={(e) => updateDocument(doc.id, { categoryId: e.target.value })}
                            >
                              <option value="">Seleziona categoria</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name || 'Categoria'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="fg">
                            <label className="fl">Intestatario</label>
                            <select
                              className="fi fi-arch"
                              value={doc.ownerId || ''}
                              onChange={(e) => updateDocument(doc.id, { ownerId: e.target.value })}
                            >
                              <option value="">Seleziona membro</option>
                              {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name || member.role || member.initials || 'Membro'}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="fg">
                            <label className="fl">Numero documento</label>
                            <input
                              className="fi fi-arch"
                              value={doc.number || ''}
                              onChange={(e) => updateDocument(doc.id, { number: e.target.value })}
                            />
                          </div>
                          <div className="fg">
                            <label className="fl">Emissione</label>
                            <input
                              className="fi fi-arch"
                              type="date"
                              value={doc.issueDate || ''}
                              onChange={(e) => updateDocument(doc.id, { issueDate: e.target.value })}
                            />
                          </div>
                          <div className="fg">
                            <label className="fl">Scadenza</label>
                            <input
                              className="fi fi-arch"
                              type="date"
                              value={doc.expiryDate || ''}
                              onChange={(e) => updateDocument(doc.id, { expiryDate: e.target.value })}
                            />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">Archivio fisico / posizione</label>
                            <input
                              className="fi fi-arch"
                              value={doc.storage || ''}
                              onChange={(e) => updateDocument(doc.id, { storage: e.target.value })}
                              placeholder="Cassaforte, cassetto studio, cartellina blu..."
                            />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">Note</label>
                            <textarea
                              className="fi fi-arch"
                              value={doc.notes || ''}
                              onChange={(e) => updateDocument(doc.id, { notes: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="subsection-box">
                          <div className="between">
                            <div>
                              <div className="section-title">Google Drive e allegati</div>
                              <p className="page-subtitle">Link a PDF, foto, scansioni e cartelle condivise.</p>
                            </div>
                            <button className="btn btn-sm" onClick={() => addDocumentDriveLink(doc.id)}>
                              + Link
                            </button>
                          </div>

                          <div className="timeline-list" style={{ marginTop: 12 }}>
                            {(doc.driveLinks || []).length === 0 ? (
                              <EmptyState text="Nessun link Drive associato a questo documento." />
                            ) : (
                              (doc.driveLinks || []).map((link) => (
                                <div key={link.id} className="subsection-box">
                                  <div className="form-grid">
                                    <div className="fg">
                                      <label className="fl">Etichetta</label>
                                      <input
                                        className="fi fi-arch"
                                        value={link.label || ''}
                                        onChange={(e) =>
                                          updateDocumentDriveLink(doc.id, link.id, { label: e.target.value })
                                        }
                                        placeholder="PDF fronte, scansione, cartella Drive..."
                                      />
                                    </div>
                                    <div className="fg">
                                      <label className="fl">URL Drive</label>
                                      <input
                                        className="fi fi-arch"
                                        value={link.url || ''}
                                        onChange={(e) =>
                                          updateDocumentDriveLink(doc.id, link.id, { url: e.target.value })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="row">
                                    {link.url ? (
                                      <a className="drive-link" href={link.url} target="_blank" rel="noreferrer">
                                        🔗 Apri link
                                      </a>
                                    ) : null}
                                    <button className="btn btn-d btn-sm" onClick={() => removeDocumentDriveLink(doc.id, link.id)}>
                                      Rimuovi
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="row">
                          <span className="badge badge-arch">{fmtDate(doc.issueDate)}</span>
                          <span className={`badge ${expiryBadgeClass(days)}`}>{expiryLabel(days)}</span>
                          <button className="btn btn-d btn-sm" onClick={() => deleteDocument(doc.id)}>
                            Elimina documento
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="between">
            <div>
              <div className="section-title">Garanzie e beni</div>
              <p className="page-subtitle">Prodotti, fatture, scadenze di garanzia e riferimenti acquisto.</p>
            </div>
          </div>

          <div className="timeline-list" style={{ marginTop: 12 }}>
            {filteredWarranties.length === 0 ? (
              <EmptyState text="Nessuna garanzia presente." />
            ) : (
              filteredWarranties.map((row) => {
                const isOpen = openWarrantyId === row.id
                const days = diffDays(row.expiryDate)

                return (
                  <div key={row.id} className="timeline-item tl-arch">
                    <div className="between">
                      <div>
                        <div className="strong">{row.item || 'Bene'}</div>
                        <div className="small muted" style={{ marginTop: 4 }}>
                          {row.brand || 'Marca non indicata'} · {row.invoiceRef || 'Nessun riferimento fattura'}
                        </div>
                      </div>
                      <div className="row">
                        <span className={`badge ${expiryBadgeClass(days)}`}>{expiryLabel(days)}</span>
                        <button className="btn btn-sm" onClick={() => setOpenWarrantyId(isOpen ? '' : row.id)}>
                          {isOpen ? 'Chiudi' : 'Apri'}
                        </button>
                      </div>
                    </div>

                    {isOpen ? (
                      <div className="stack-card" style={{ marginTop: 14 }}>
                        <div className="form-grid">
                          <div className="fg">
                            <label className="fl">Bene / prodotto</label>
                            <input
                              className="fi fi-arch"
                              value={row.item || ''}
                              onChange={(e) => updateWarranty(row.id, { item: e.target.value })}
                            />
                          </div>
                          <div className="fg">
                            <label className="fl">Marca</label>
                            <input
                              className="fi fi-arch"
                              value={row.brand || ''}
                              onChange={(e) => updateWarranty(row.id, { brand: e.target.value })}
                            />
                          </div>
                          <div className="fg">
                            <label className="fl">Data acquisto</label>
                            <input
                              className="fi fi-arch"
                              type="date"
                              value={row.purchaseDate || ''}
                              onChange={(e) => updateWarranty(row.id, { purchaseDate: e.target.value })}
                            />
                          </div>
                          <div className="fg">
                            <label className="fl">Scadenza garanzia</label>
                            <input
                              className="fi fi-arch"
                              type="date"
                              value={row.expiryDate || ''}
                              onChange={(e) => updateWarranty(row.id, { expiryDate: e.target.value })}
                            />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">Riferimento fattura</label>
                            <input
                              className="fi fi-arch"
                              value={row.invoiceRef || ''}
                              onChange={(e) => updateWarranty(row.id, { invoiceRef: e.target.value })}
                            />
                          </div>
                          <div className="fg col-full">
                            <label className="fl">Note</label>
                            <textarea
                              className="fi fi-arch"
                              value={row.notes || ''}
                              onChange={(e) => updateWarranty(row.id, { notes: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="subsection-box">
                          <div className="between">
                            <div>
                              <div className="section-title">Allegati garanzia</div>
                              <p className="page-subtitle">Scontrini, fatture, PDF e foto del prodotto.</p>
                            </div>
                            <button className="btn btn-sm" onClick={() => addWarrantyDriveLink(row.id)}>
                              + Link
                            </button>
                          </div>

                          <div className="timeline-list" style={{ marginTop: 12 }}>
                            {(row.driveLinks || []).length === 0 ? (
                              <EmptyState text="Nessun link associato alla garanzia." />
                            ) : (
                              (row.driveLinks || []).map((link) => (
                                <div key={link.id} className="subsection-box">
                                  <div className="form-grid">
                                    <div className="fg">
                                      <label className="fl">Etichetta</label>
                                      <input
                                        className="fi fi-arch"
                                        value={link.label || ''}
                                        onChange={(e) =>
                                          updateWarrantyDriveLink(row.id, link.id, { label: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="fg">
                                      <label className="fl">URL Drive</label>
                                      <input
                                        className="fi fi-arch"
                                        value={link.url || ''}
                                        onChange={(e) =>
                                          updateWarrantyDriveLink(row.id, link.id, { url: e.target.value })
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="row">
                                    {link.url ? (
                                      <a className="drive-link" href={link.url} target="_blank" rel="noreferrer">
                                        🔗 Apri link
                                      </a>
                                    ) : null}
                                    <button className="btn btn-d btn-sm" onClick={() => removeWarrantyDriveLink(row.id, link.id)}>
                                      Rimuovi
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="row">
                          <span className="badge badge-arch">{fmtDate(row.purchaseDate)}</span>
                          <span className={`badge ${expiryBadgeClass(days)}`}>{expiryLabel(days)}</span>
                          <button className="btn btn-d btn-sm" onClick={() => deleteWarranty(row.id)}>
                            Elimina garanzia
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </section>
      )}
    </div>
  )
}
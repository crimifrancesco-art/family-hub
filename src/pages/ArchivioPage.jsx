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

function daysBetween(from, to = new Date()) {
  if (!from) return null
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  const diff = start.getTime() - end.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function calendarLink({ title, date, details = '' }) {
  if (!date) return ''
  const start = `${date.replaceAll('-', '')}T090000`
  const end = `${date.replaceAll('-', '')}T100000`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title || 'Scadenza documento',
  )}&dates=${start}/${end}&details=${encodeURIComponent(details)}`
}

function statusBadge(days) {
  if (days === null) return 'badge-muted'
  if (days < 0) return 'badge-danger'
  if (days <= 30) return 'badge-warning'
  return 'badge-success'
}

function statusText(days) {
  if (days === null) return 'Senza data'
  if (days < 0) return 'Scaduto'
  if (days === 0) return 'Oggi'
  return `${days} gg`
}

export default function ArchivioPage() {
  const { archiveTables, familyMembers, updateArchive, loadingData, syncError } = useAppContext()

  const categories = archiveTables?.categories || []
  const documents = archiveTables?.documents || []

  const [form, setForm] = useState({
    categoryId: categories[0]?.id || '',
    ownerId: familyMembers[0]?.id || '',
    title: '',
    number: '',
    issueDate: '',
    expiryDate: '',
    storage: '',
    driveUrl: '',
    notes: '',
  })

  const docsWithMeta = useMemo(() => {
    return documents
      .map((doc) => {
        const owner =
          familyMembers.find((member) => member.id === doc.ownerId)?.name ||
          doc.owner ||
          '—'
        const category =
          categories.find((cat) => cat.id === doc.categoryId)?.name ||
          doc.category ||
          '—'
        const firstLink = Array.isArray(doc.driveLinks) ? doc.driveLinks[0]?.url || '' : ''
        const days = daysBetween(doc.expiryDate)

        return {
          ...doc,
          owner,
          category,
          firstLink,
          days,
        }
      })
      .sort((a, b) => {
        const av = a.expiryDate || '9999-99-99'
        const bv = b.expiryDate || '9999-99-99'
        return av.localeCompare(bv)
      })
  }, [documents, familyMembers, categories])

  const handleAddDocument = (event) => {
    event.preventDefault()

    if (!form.title.trim()) return
    if (!form.categoryId) return

    const category = categories.find((item) => item.id === form.categoryId)
    const owner = familyMembers.find((item) => item.id === form.ownerId)

    updateArchive((prev) => ({
      ...prev,
      documents: [
        ...prev.documents,
        {
          id: uid('doc'),
          categoryId: form.categoryId,
          category: category?.name || '',
          ownerId: form.ownerId,
          owner: owner?.name || '',
          title: form.title.trim(),
          number: form.number.trim(),
          issueDate: form.issueDate,
          expiryDate: form.expiryDate,
          storage: form.storage.trim(),
          driveLinks: form.driveUrl.trim()
            ? [{ id: uid('lnk'), label: 'Google Drive', url: form.driveUrl.trim() }]
            : [],
          notes: form.notes.trim(),
        },
      ],
    }))

    setForm({
      categoryId: categories[0]?.id || '',
      ownerId: familyMembers[0]?.id || '',
      title: '',
      number: '',
      issueDate: '',
      expiryDate: '',
      storage: '',
      driveUrl: '',
      notes: '',
    })
  }

  const handleDeleteDocument = (docId) => {
    updateArchive((prev) => ({
      ...prev,
      documents: prev.documents.filter((doc) => doc.id !== docId),
    }))
  }

  if (loadingData) {
    return (
      <div className="page-stack">
        <section className="hero-card">
          <div className="eyebrow">Archivio</div>
          <h1>Caricamento archivio…</h1>
          <p className="page-subtitle">Sto caricando documenti, link Drive e scadenze.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="eyebrow">Archivio famiglia</div>
        <h1>Documenti e scadenze</h1>
        <p className="page-subtitle">
          A sinistra vedi i documenti già inseriti in tabella. Sotto trovi il form per aggiungerne
          uno nuovo in modo guidato.
        </p>
        {syncError ? <div className="app-status">{syncError}</div> : null}
      </section>

      <section className="card stack-card">
        <div className="page-header">
          <div>
            <div className="card-title">Panoramica archivio</div>
            <div className="card-subtitle">Vista sintetica: pochi numeri, nessuna confusione.</div>
          </div>
        </div>

        <div className="grid-cards responsive-3">
          <div className="widget-card wc-arch">
            <div className="widget-label">Categorie</div>
            <div className="widget-value">{categories.length}</div>
          </div>
          <div className="widget-card wc-arch">
            <div className="widget-label">Documenti</div>
            <div className="widget-value">{documents.length}</div>
          </div>
          <div className="widget-card wc-arch">
            <div className="widget-label">Con scadenza</div>
            <div className="widget-value">
              {docsWithMeta.filter((doc) => Boolean(doc.expiryDate)).length}
            </div>
          </div>
        </div>
      </section>

      <section className="card stack-card">
        <div className="page-header">
          <div>
            <div className="card-title">Documenti inseriti</div>
            <div className="card-subtitle">
              Tutti i dati salvati sono in tabella, separati dal modulo di inserimento.
            </div>
          </div>
        </div>

        <div className="data-area">
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Intestatario</th>
                  <th>Titolo</th>
                  <th>Numero</th>
                  <th>Emissione</th>
                  <th>Scadenza</th>
                  <th>Archivio</th>
                  <th>Drive</th>
                  <th>Calendar</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {docsWithMeta.length ? (
                  docsWithMeta.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.category}</td>
                      <td>{doc.owner}</td>
                      <td>{doc.title || '—'}</td>
                      <td>{doc.number || '—'}</td>
                      <td>{fmt(doc.issueDate)}</td>
                      <td>
                        <div className="stack-card">
                          <span>{fmt(doc.expiryDate)}</span>
                          <span className={`badge ${statusBadge(doc.days)}`}>
                            {statusText(doc.days)}
                          </span>
                        </div>
                      </td>
                      <td>{doc.storage || '—'}</td>
                      <td>
                        {doc.firstLink ? (
                          <a
                            className="drive-link"
                            href={doc.firstLink}
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
                        {doc.expiryDate ? (
                          <a
                            className="drive-link"
                            href={calendarLink({
                              title: doc.title,
                              date: doc.expiryDate,
                              details: doc.notes || doc.category,
                            })}
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
                        <button
                          type="button"
                          className="btn btn-d btn-s"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10">
                      <div className="empty">Nessun documento inserito.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="card stack-card">
        <div className="page-header">
          <div>
            <div className="card-title">Nuovo documento</div>
            <div className="card-subtitle">
              Compila qui sotto. Dopo il salvataggio, il documento compare nella tabella sopra.
            </div>
          </div>
        </div>

        <div className="form-area">
          <form className="form-shell form-grid" onSubmit={handleAddDocument}>
            <label className="fg">
              <span className="fl">Categoria</span>
              <select
                className="fi fi-arch"
                value={form.categoryId}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="fg">
              <span className="fl">Intestatario</span>
              <select
                className="fi fi-arch"
                value={form.ownerId}
                onChange={(e) => setForm((prev) => ({ ...prev, ownerId: e.target.value }))}
              >
                {familyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || member.role || member.initials}
                  </option>
                ))}
              </select>
            </label>

            <label className="fg">
              <span className="fl">
                Titolo <span className="required">*</span>
              </span>
              <input
                className="fi fi-arch"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Es. Carta identità"
                required
              />
            </label>

            <label className="fg">
              <span className="fl">Numero / riferimento</span>
              <input
                className="fi fi-arch"
                value={form.number}
                onChange={(e) => setForm((prev) => ({ ...prev, number: e.target.value }))}
                placeholder="Numero documento"
              />
            </label>

            <label className="fg">
              <span className="fl">Data emissione</span>
              <input
                className="fi fi-arch"
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Data scadenza</span>
              <input
                className="fi fi-arch"
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
              />
            </label>

            <label className="fg responsive-full">
              <span className="fl">Archivio fisico / dove si trova</span>
              <input
                className="fi fi-arch"
                value={form.storage}
                onChange={(e) => setForm((prev) => ({ ...prev, storage: e.target.value }))}
                placeholder="Es. Cassetto studio, raccoglitore blu..."
              />
            </label>

            <label className="fg responsive-full">
              <span className="fl">Link Google Drive / PDF online</span>
              <input
                className="fi fi-arch"
                value={form.driveUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, driveUrl: e.target.value }))}
                placeholder="https://drive.google.com/..."
              />
            </label>

            <label className="fg responsive-full">
              <span className="fl">Note</span>
              <textarea
                className="fi fi-arch"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Descrizione breve, note utili, dettagli garanzia..."
              />
            </label>

            <div className="responsive-full actions-row">
              <button type="submit" className="btn btn-arch">
                + Salva documento
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
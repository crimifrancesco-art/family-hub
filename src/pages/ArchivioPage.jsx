import { useAppContext } from '../context/AppContext'

export default function ArchivioPage() {
  const { archiveTables } = useAppContext()
  return (
    <div className="page-stack">
      <section className="hero-card archive-hero">
        <div>
          <div className="eyebrow">Archivio</div>
          <h1>Tabelle base per documenti, polizze e garanzie</h1>
          <p>Ho preparato una base elegante e ordinata da ampliare nel tempo per avere tutto a portata di mano.</p>
        </div>
      </section>

      <section className="grid-cards cols-2">
        <div className="card stack-card"><div className="card-title">Documenti</div><div className="table-wrap"><table className="data-table"><thead><tr><th>Categoria</th><th>Intestatario</th><th>Titolo</th><th>Numero</th><th>Scadenza</th></tr></thead><tbody>{archiveTables.documents.map((row) => <tr key={row.id}><td>{row.category}</td><td>{row.owner}</td><td>{row.title}</td><td>{row.number}</td><td>{row.expiryDate}</td></tr>)}</tbody></table></div></div>
        <div className="card stack-card"><div className="card-title">Garanzie e acquisti</div><div className="table-wrap"><table className="data-table"><thead><tr><th>Oggetto</th><th>Brand</th><th>Acquisto</th><th>Scadenza</th><th>Fattura</th></tr></thead><tbody>{archiveTables.warranties.map((row) => <tr key={row.id}><td>{row.item}</td><td>{row.brand}</td><td>{row.purchaseDate}</td><td>{row.expiryDate}</td><td>{row.invoiceRef}</td></tr>)}</tbody></table></div></div>
      </section>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useAppContext } from '../context/AppContext'

const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const monthKeyFromDate = (value) => {
  if (!value) return ''
  return String(value).slice(0, 7)
}

const fmtCurrency = (value) =>
  new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const fmtDate = (value) => {
  if (!value) return '—'
  const parts = String(value).split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

const toNumber = (value) => {
  const parsed = Number(String(value || '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

const emptyBudgetForm = {
  month: '',
  totalBudget: '',
  fixedBudget: '',
  variableBudget: '',
  savingsTarget: '',
  notes: '',
}

const emptyExpenseForm = {
  date: '',
  title: '',
  category: 'spesa',
  amount: '',
  type: 'variabile',
  memberId: '',
  paymentMethod: 'carta',
  status: 'pagata',
  recurring: false,
  merchant: '',
  notes: '',
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function memberLabel(member) {
  return member?.name || member?.role || member?.initials || member?.id || 'Membro'
}

function categoryLabel(value) {
  if (value === 'casa') return 'Casa'
  if (value === 'bollette') return 'Bollette'
  if (value === 'salute') return 'Salute'
  if (value === 'trasporti') return 'Trasporti'
  if (value === 'scuola') return 'Scuola'
  if (value === 'viaggi') return 'Viaggi'
  if (value === 'tempo-libero') return 'Tempo libero'
  if (value === 'abbonamenti') return 'Abbonamenti'
  if (value === 'spesa') return 'Spesa'
  return 'Altro'
}

function paymentMethodLabel(value) {
  if (value === 'contanti') return 'Contanti'
  if (value === 'bonifico') return 'Bonifico'
  if (value === 'sdd') return 'SDD'
  if (value === 'paypal') return 'PayPal'
  return 'Carta'
}

function statusLabel(value) {
  if (value === 'prevista') return 'Prevista'
  if (value === 'rinviata') return 'Rinviata'
  return 'Pagata'
}

function typeLabel(value) {
  if (value === 'fissa') return 'Fissa'
  return 'Variabile'
}

function monthLabel(value) {
  if (!value) return '—'
  const [year, month] = String(value).split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

function toneByRatio(value) {
  if (value >= 100) return 'badge-danger'
  if (value >= 80) return 'badge-warning'
  return 'badge-success'
}

function SectionHeader({ badge, title, subtitle }) {
  return (
    <div className="section-head compact-head">
      {badge ? <div className="badge badge-dash">{badge}</div> : null}
      <h2 className="page-title" style={{ marginTop: 8 }}>{title}</h2>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </div>
  )
}

function FieldError({ text }) {
  if (!text) return null
  return <div className="error-msg" style={{ marginTop: 8 }}>{text}</div>
}

function MetaPills({ items }) {
  const visible = items.filter((item) => item?.value !== undefined && item?.value !== null && item?.value !== '')
  if (!visible.length) return null

  return (
    <div className="tree-meta compact-meta">
      {visible.map((item) => (
        <div key={`${item.label}_${item.value}`} className="meta-pill">
          <span className="meta-label">{item.label}:</span> {item.value}
        </div>
      ))}
    </div>
  )
}

export default function SpesePage() {
  const { familyMembers, loadingData, syncError, financeTables, updateFinance } = useAppContext()

  const nowMonth = new Date().toISOString().slice(0, 7)

  const [selectedMonth, setSelectedMonth] = useState(nowMonth)
  const [budgetForm, setBudgetForm] = useState({ ...emptyBudgetForm, month: nowMonth })
  const [expenseForm, setExpenseForm] = useState({
    ...emptyExpenseForm,
    date: new Date().toISOString().slice(0, 10),
  })

  const [budgetError, setBudgetError] = useState('')
  const [expenseError, setExpenseError] = useState('')

  const [editingBudgetId, setEditingBudgetId] = useState('')
  const [editingExpenseId, setEditingExpenseId] = useState('')

  const [editBudgetForm, setEditBudgetForm] = useState(emptyBudgetForm)
  const [editExpenseForm, setEditExpenseForm] = useState(emptyExpenseForm)

  useEffect(() => {
    if (!familyMembers.length) return
    if (!expenseForm.memberId) {
      setExpenseForm((prev) => ({ ...prev, memberId: familyMembers[0].id }))
    }
  }, [familyMembers, expenseForm.memberId])

  const budgets = ensureArray(financeTables?.monthlyBudgets)
  const expenses = ensureArray(financeTables?.expenses)

  const selectedBudget =
    budgets.find((row) => row.month === selectedMonth) || null

  useEffect(() => {
    setBudgetForm((prev) => ({ ...prev, month: selectedMonth || nowMonth }))
  }, [selectedMonth, nowMonth])

  const monthExpenses = useMemo(() => {
    return expenses
      .filter((item) => monthKeyFromDate(item.date) === selectedMonth)
      .sort((a, b) => `${b.date || ''}`.localeCompare(`${a.date || ''}`))
  }, [expenses, selectedMonth])

  const totals = useMemo(() => {
    const totalSpent = monthExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0)
    const fixedSpent = monthExpenses
      .filter((item) => item.type === 'fissa')
      .reduce((sum, item) => sum + toNumber(item.amount), 0)
    const variableSpent = monthExpenses
      .filter((item) => item.type !== 'fissa')
      .reduce((sum, item) => sum + toNumber(item.amount), 0)

    const totalBudget = toNumber(selectedBudget?.totalBudget)
    const fixedBudget = toNumber(selectedBudget?.fixedBudget)
    const variableBudget = toNumber(selectedBudget?.variableBudget)
    const savingsTarget = toNumber(selectedBudget?.savingsTarget)

    return {
      totalSpent,
      fixedSpent,
      variableSpent,
      totalBudget,
      fixedBudget,
      variableBudget,
      savingsTarget,
      remaining: totalBudget - totalSpent,
      fixedRemaining: fixedBudget - fixedSpent,
      variableRemaining: variableBudget - variableSpent,
      usageRatio: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    }
  }, [monthExpenses, selectedBudget])

  const categoryBreakdown = useMemo(() => {
    const map = new Map()

    monthExpenses.forEach((item) => {
      const key = item.category || 'altro'
      map.set(key, (map.get(key) || 0) + toNumber(item.amount))
    })

    return Array.from(map.entries())
      .map(([key, amount]) => ({
        key,
        label: categoryLabel(key),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthExpenses])

  const recentMonths = useMemo(() => {
    const keys = new Set([nowMonth, ...budgets.map((row) => row.month), ...expenses.map((row) => monthKeyFromDate(row.date))])
    return Array.from(keys).filter(Boolean).sort((a, b) => b.localeCompare(a))
  }, [budgets, expenses, nowMonth])

  const buildBudgetPayload = (form, oldRow = null) => {
    if (!form.month) {
      throw new Error('Seleziona il mese di riferimento.')
    }

    return {
      id: oldRow?.id || uid('budget'),
      month: form.month,
      totalBudget: toNumber(form.totalBudget),
      fixedBudget: toNumber(form.fixedBudget),
      variableBudget: toNumber(form.variableBudget),
      savingsTarget: toNumber(form.savingsTarget),
      notes: String(form.notes || '').trim(),
      createdAt: oldRow?.createdAt || new Date().toISOString(),
    }
  }

  const buildExpensePayload = (form, oldRow = null) => {
    if (!form.date || !String(form.title || '').trim() || !String(form.amount || '').trim()) {
      throw new Error('Compila i campi obbligatori: data, titolo e importo.')
    }

    return {
      id: oldRow?.id || uid('expense'),
      date: form.date,
      title: String(form.title || '').trim(),
      category: form.category || 'spesa',
      amount: toNumber(form.amount),
      type: form.type || 'variabile',
      memberId: form.memberId || '',
      paymentMethod: form.paymentMethod || 'carta',
      status: form.status || 'pagata',
      recurring: Boolean(form.recurring),
      merchant: String(form.merchant || '').trim(),
      notes: String(form.notes || '').trim(),
      createdAt: oldRow?.createdAt || new Date().toISOString(),
    }
  }

  const handleSaveBudget = (event) => {
    event.preventDefault()
    setBudgetError('')

    try {
      const payload = buildBudgetPayload(budgetForm)
      const existing = budgets.find((row) => row.month === payload.month)

      updateFinance((prev) => ({
        ...prev,
        monthlyBudgets: existing
          ? ensureArray(prev.monthlyBudgets).map((row) => (row.id === existing.id ? { ...payload, id: existing.id, createdAt: existing.createdAt } : row))
          : [...ensureArray(prev.monthlyBudgets), payload],
      }))

      setSelectedMonth(payload.month)
      setBudgetForm({ ...emptyBudgetForm, month: payload.month })
    } catch (error) {
      setBudgetError(error.message || 'Errore nel salvataggio del budget.')
    }
  }

  const handleSaveExpense = (event) => {
    event.preventDefault()
    setExpenseError('')

    try {
      const payload = buildExpensePayload(expenseForm)

      updateFinance((prev) => ({
        ...prev,
        expenses: [...ensureArray(prev.expenses), payload],
      }))

      setExpenseForm((prev) => ({
        ...emptyExpenseForm,
        date: new Date().toISOString().slice(0, 10),
        memberId: prev.memberId || familyMembers[0]?.id || '',
      }))
    } catch (error) {
      setExpenseError(error.message || 'Errore nel salvataggio della spesa.')
    }
  }

  const handleDeleteBudget = (budgetId) => {
    updateFinance((prev) => ({
      ...prev,
      monthlyBudgets: ensureArray(prev.monthlyBudgets).filter((row) => row.id !== budgetId),
    }))

    if (editingBudgetId === budgetId) {
      setEditingBudgetId('')
      setEditBudgetForm(emptyBudgetForm)
    }
  }

  const handleDeleteExpense = (expenseId) => {
    updateFinance((prev) => ({
      ...prev,
      expenses: ensureArray(prev.expenses).filter((row) => row.id !== expenseId),
    }))

    if (editingExpenseId === expenseId) {
      setEditingExpenseId('')
      setEditExpenseForm(emptyExpenseForm)
    }
  }

  const startEditBudget = (budget) => {
    setEditingBudgetId(budget.id)
    setEditBudgetForm({
      month: budget.month || '',
      totalBudget: String(budget.totalBudget || ''),
      fixedBudget: String(budget.fixedBudget || ''),
      variableBudget: String(budget.variableBudget || ''),
      savingsTarget: String(budget.savingsTarget || ''),
      notes: budget.notes || '',
    })
  }

  const saveEditBudget = (budget) => {
    try {
      const payload = buildBudgetPayload(editBudgetForm, budget)

      updateFinance((prev) => ({
        ...prev,
        monthlyBudgets: ensureArray(prev.monthlyBudgets).map((row) =>
          row.id === budget.id ? payload : row,
        ),
      }))

      setEditingBudgetId('')
      setEditBudgetForm(emptyBudgetForm)
      setSelectedMonth(payload.month)
    } catch (error) {
      setBudgetError(error.message || 'Errore nel salvataggio del budget.')
    }
  }

  const startEditExpense = (expense) => {
    setEditingExpenseId(expense.id)
    setEditExpenseForm({
      date: expense.date || '',
      title: expense.title || '',
      category: expense.category || 'spesa',
      amount: String(expense.amount || ''),
      type: expense.type || 'variabile',
      memberId: expense.memberId || '',
      paymentMethod: expense.paymentMethod || 'carta',
      status: expense.status || 'pagata',
      recurring: Boolean(expense.recurring),
      merchant: expense.merchant || '',
      notes: expense.notes || '',
    })
  }

  const saveEditExpense = (expense) => {
    try {
      const payload = buildExpensePayload(editExpenseForm, expense)

      updateFinance((prev) => ({
        ...prev,
        expenses: ensureArray(prev.expenses).map((row) =>
          row.id === expense.id ? payload : row,
        ),
      }))

      setEditingExpenseId('')
      setEditExpenseForm(emptyExpenseForm)
    } catch (error) {
      setExpenseError(error.message || 'Errore nel salvataggio della spesa.')
    }
  }

  if (loadingData) {
    return (
      <div className="card">
        <div className="page-title">Spese / Budget</div>
        <p className="page-subtitle">Sto caricando budget mensili, uscite e riepiloghi familiari.</p>
      </div>
    )
  }

  return (
    <div className="page-shell spese-page compact-drive">
      <style>{`
        .spese-page {
          display: grid;
          gap: 14px;
        }

        .compact-head .page-title {
          font-size: 24px;
        }

        .compact-drive .card {
          border-radius: 18px;
        }

        .compact-drive .page-subtitle {
          margin-top: 4px;
        }

        .spese-top-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 14px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .summary-card {
          background: var(--panel, #fff);
          border: 1px solid rgba(120, 138, 164, 0.12);
          border-radius: 14px;
          padding: 12px;
          display: grid;
          gap: 4px;
        }

        .summary-label {
          font-size: 11px;
          color: var(--muted, #667085);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .summary-value {
          font-size: 22px;
          font-weight: 800;
          line-height: 1.05;
        }

        .summary-note {
          font-size: 12px;
          color: var(--muted, #667085);
        }

        .section-stack {
          display: grid;
          gap: 12px;
        }

        .spese-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .spese-form-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .spese-form-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .required-mark {
          color: #c62828;
          margin-left: 4px;
        }

        .tree-list {
          display: grid;
          gap: 8px;
        }

        .budget-card,
        .expense-row {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(120, 138, 164, 0.12);
          border-radius: 14px;
          padding: 10px 12px;
          display: grid;
          gap: 8px;
        }

        .row-head,
        .expense-row-top,
        .breakdown-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tree-title {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.2;
        }

        .tree-subtitle {
          color: var(--muted, #667085);
          font-size: 12px;
          margin-top: 2px;
        }

        .tree-meta,
        .pill-row,
        .row-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .compact-meta .meta-pill {
          padding: 5px 8px;
          font-size: 11px;
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

        .tree-notes {
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(248, 250, 252, 0.95);
          border: 1px dashed rgba(120, 138, 164, 0.18);
          color: #4b5563;
          font-size: 12px;
          line-height: 1.45;
        }

        .empty-box {
          border-radius: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px dashed rgba(120, 138, 164, 0.18);
          color: var(--muted, #667085);
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
          background: rgba(248, 251, 255, 0.95);
          border-radius: 12px;
          padding: 10px;
          display: grid;
          gap: 10px;
        }

        .edit-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .breakdown-list {
          display: grid;
          gap: 8px;
        }

        .breakdown-row {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(120, 138, 164, 0.12);
          background: rgba(255, 255, 255, 0.92);
        }

        .progress-wrap {
          display: grid;
          gap: 6px;
        }

        .progress-bar {
          width: 100%;
          height: 10px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.14);
          overflow: hidden;
        }

        .progress-bar > span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%);
        }

        .amount-strong {
          font-weight: 800;
          font-size: 16px;
        }

        @media (max-width: 1100px) {
          .spese-top-grid,
          .summary-grid,
          .spese-form-grid,
          .spese-form-grid-3,
          .spese-form-grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="card">
        <SectionHeader
          badge="Spese"
          title="Budget mensile, uscite e controllo familiare"
          subtitle="Vista compatta con budget del mese, inserimento rapido spese e modifica inline."
        />

        {syncError ? (
          <div className="error-msg">Errore di sincronizzazione: {String(syncError)}</div>
        ) : null}

        <div className="spese-top-grid">
          <div className="section-stack">
            <div className="card">
              <div className="page-section-title">Mese di lavoro</div>

              <div className="spese-form-grid">
                <label className="fg">
                  <span className="fl">Mese selezionato</span>
                  <select
                    className="fi"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {recentMonths.map((month) => (
                      <option key={month} value={month}>
                        {monthLabel(month)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="fg">
                  <span className="fl">Nuovo mese rapido</span>
                  <input
                    className="fi"
                    type="month"
                    value={budgetForm.month}
                    onChange={(e) => setBudgetForm((prev) => ({ ...prev, month: e.target.value }))}
                  />
                </label>
              </div>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-label">Speso nel mese</div>
                <div className="summary-value">{fmtCurrency(totals.totalSpent)}</div>
                <div className="summary-note">{monthExpenses.length} movimenti registrati</div>
              </div>

              <div className="summary-card">
                <div className="summary-label">Budget totale</div>
                <div className="summary-value">{fmtCurrency(totals.totalBudget)}</div>
                <div className="summary-note">Budget impostato per {monthLabel(selectedMonth)}</div>
              </div>

              <div className="summary-card">
                <div className="summary-label">Residuo</div>
                <div className="summary-value">{fmtCurrency(totals.remaining)}</div>
                <div className="summary-note">Disponibilità residua del mese</div>
              </div>

              <div className="summary-card">
                <div className="summary-label">Obiettivo risparmio</div>
                <div className="summary-value">{fmtCurrency(totals.savingsTarget)}</div>
                <div className="summary-note">{totals.usageRatio}% del budget usato</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="page-section-title">Utilizzo budget</div>

            <div className="section-stack" style={{ marginTop: 12 }}>
              <div className="progress-wrap">
                <div className="row-head">
                  <div className="summary-label" style={{ fontSize: 12 }}>Totale mese</div>
                  <div className={`badge ${toneByRatio(totals.usageRatio)}`}>{totals.usageRatio}%</div>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${Math.min(totals.usageRatio, 100)}%` }} />
                </div>
                <div className="summary-note">
                  Speso {fmtCurrency(totals.totalSpent)} su {fmtCurrency(totals.totalBudget)}
                </div>
              </div>

              <MetaPills
                items={[
                  { label: 'Spese fisse', value: fmtCurrency(totals.fixedSpent) },
                  { label: 'Budget fisso', value: fmtCurrency(totals.fixedBudget) },
                  { label: 'Residuo fisso', value: fmtCurrency(totals.fixedRemaining) },
                  { label: 'Spese variabili', value: fmtCurrency(totals.variableSpent) },
                  { label: 'Budget variabile', value: fmtCurrency(totals.variableBudget) },
                  { label: 'Residuo variabile', value: fmtCurrency(totals.variableRemaining) },
                ]}
              />

              {selectedBudget?.notes ? (
                <div className="tree-notes">
                  <strong>Note budget:</strong> {selectedBudget.notes}
                </div>
              ) : (
                <div className="empty-box">Nessuna nota budget per il mese selezionato.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <SectionHeader
          badge="Budget mensile"
          title="1. Imposta o aggiorna budget"
          subtitle="Un budget per mese con quota totale, fissa, variabile e target risparmio."
        />

        <form onSubmit={handleSaveBudget} className="section-stack">
          <div className="spese-form-grid-4">
            <label className="fg">
              <span className="fl">
                Mese<span className="required-mark">*</span>
              </span>
              <input
                className="fi"
                type="month"
                value={budgetForm.month}
                onChange={(e) => setBudgetForm((prev) => ({ ...prev, month: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">Budget totale</span>
              <input
                className="fi"
                type="number"
                min="0"
                step="0.01"
                value={budgetForm.totalBudget}
                onChange={(e) => setBudgetForm((prev) => ({ ...prev, totalBudget: e.target.value }))}
                placeholder="Es. 2500"
              />
            </label>

            <label className="fg">
              <span className="fl">Quota fissa</span>
              <input
                className="fi"
                type="number"
                min="0"
                step="0.01"
                value={budgetForm.fixedBudget}
                onChange={(e) => setBudgetForm((prev) => ({ ...prev, fixedBudget: e.target.value }))}
                placeholder="Es. 1200"
              />
            </label>

            <label className="fg">
              <span className="fl">Quota variabile</span>
              <input
                className="fi"
                type="number"
                min="0"
                step="0.01"
                value={budgetForm.variableBudget}
                onChange={(e) => setBudgetForm((prev) => ({ ...prev, variableBudget: e.target.value }))}
                placeholder="Es. 900"
              />
            </label>

            <label className="fg">
              <span className="fl">Target risparmio</span>
              <input
                className="fi"
                type="number"
                min="0"
                step="0.01"
                value={budgetForm.savingsTarget}
                onChange={(e) => setBudgetForm((prev) => ({ ...prev, savingsTarget: e.target.value }))}
                placeholder="Es. 400"
              />
            </label>
          </div>

          <label className="fg">
            <span className="fl">Note budget</span>
            <textarea
              className="fi"
              rows={2}
              value={budgetForm.notes}
              onChange={(e) => setBudgetForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Obiettivi, vincoli, spese previste del mese"
            />
          </label>

          <FieldError text={budgetError} />

          <div>
            <button type="submit" className="btn btn-p">
              Salva budget mensile
            </button>
          </div>
        </form>

        <div className="tree-list" style={{ marginTop: 12 }}>
          {budgets.length ? (
            budgets
              .slice()
              .sort((a, b) => `${b.month || ''}`.localeCompare(`${a.month || ''}`))
              .map((budget) => (
                <div key={budget.id} className="budget-card">
                  {editingBudgetId === budget.id ? (
                    <div className="edit-box">
                      <div className="spese-form-grid-4">
                        <label className="fg">
                          <span className="fl">Mese</span>
                          <input
                            className="fi"
                            type="month"
                            value={editBudgetForm.month}
                            onChange={(e) => setEditBudgetForm((prev) => ({ ...prev, month: e.target.value }))}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Budget totale</span>
                          <input
                            className="fi"
                            type="number"
                            step="0.01"
                            value={editBudgetForm.totalBudget}
                            onChange={(e) => setEditBudgetForm((prev) => ({ ...prev, totalBudget: e.target.value }))}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Quota fissa</span>
                          <input
                            className="fi"
                            type="number"
                            step="0.01"
                            value={editBudgetForm.fixedBudget}
                            onChange={(e) => setEditBudgetForm((prev) => ({ ...prev, fixedBudget: e.target.value }))}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Quota variabile</span>
                          <input
                            className="fi"
                            type="number"
                            step="0.01"
                            value={editBudgetForm.variableBudget}
                            onChange={(e) => setEditBudgetForm((prev) => ({ ...prev, variableBudget: e.target.value }))}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Target risparmio</span>
                          <input
                            className="fi"
                            type="number"
                            step="0.01"
                            value={editBudgetForm.savingsTarget}
                            onChange={(e) => setEditBudgetForm((prev) => ({ ...prev, savingsTarget: e.target.value }))}
                          />
                        </label>
                      </div>

                      <label className="fg">
                        <span className="fl">Note</span>
                        <textarea
                          className="fi"
                          rows={2}
                          value={editBudgetForm.notes}
                          onChange={(e) => setEditBudgetForm((prev) => ({ ...prev, notes: e.target.value }))}
                        />
                      </label>

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn btn-inline-soft"
                          onClick={() => saveEditBudget(budget)}
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          className="btn btn-inline-ghost"
                          onClick={() => {
                            setEditingBudgetId('')
                            setEditBudgetForm(emptyBudgetForm)
                          }}
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="row-head">
                        <div>
                          <div className="tree-title">{monthLabel(budget.month)}</div>
                          <div className="tree-subtitle">Budget mensile famiglia</div>
                        </div>

                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-inline-soft"
                            onClick={() => startEditBudget(budget)}
                          >
                            Modifica
                          </button>
                          <button
                            type="button"
                            className="btn btn-inline-danger"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>

                      <MetaPills
                        items={[
                          { label: 'Totale', value: fmtCurrency(budget.totalBudget) },
                          { label: 'Fisso', value: fmtCurrency(budget.fixedBudget) },
                          { label: 'Variabile', value: fmtCurrency(budget.variableBudget) },
                          { label: 'Risparmio', value: fmtCurrency(budget.savingsTarget) },
                        ]}
                      />

                      {budget.notes ? <div className="tree-notes">{budget.notes}</div> : null}
                    </>
                  )}
                </div>
              ))
          ) : (
            <div className="empty-box">Nessun budget mensile impostato.</div>
          )}
        </div>
      </div>

      <div className="card">
        <SectionHeader
          badge="Nuova spesa"
          title="2. Registra uscita"
          subtitle="Inserimento rapido con categoria, membro, metodo di pagamento e stato."
        />

        <form onSubmit={handleSaveExpense} className="section-stack">
          <div className="spese-form-grid-4">
            <label className="fg">
              <span className="fl">
                Data<span className="required-mark">*</span>
              </span>
              <input
                className="fi"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </label>

            <label className="fg">
              <span className="fl">
                Titolo<span className="required-mark">*</span>
              </span>
              <input
                className="fi"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Es. Spesa supermercato"
              />
            </label>

            <label className="fg">
              <span className="fl">Categoria</span>
              <select
                className="fi"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
              >
                <option value="spesa">Spesa</option>
                <option value="casa">Casa</option>
                <option value="bollette">Bollette</option>
                <option value="salute">Salute</option>
                <option value="trasporti">Trasporti</option>
                <option value="scuola">Scuola</option>
                <option value="viaggi">Viaggi</option>
                <option value="tempo-libero">Tempo libero</option>
                <option value="abbonamenti">Abbonamenti</option>
                <option value="altro">Altro</option>
              </select>
            </label>

            <label className="fg">
              <span className="fl">
                Importo<span className="required-mark">*</span>
              </span>
              <input
                className="fi"
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="Es. 56.80"
              />
            </label>

            <label className="fg">
              <span className="fl">Tipo</span>
              <select
                className="fi"
                value={expenseForm.type}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="variabile">Variabile</option>
                <option value="fissa">Fissa</option>
              </select>
            </label>

            <label className="fg">
              <span className="fl">Membro</span>
              <select
                className="fi"
                value={expenseForm.memberId}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, memberId: e.target.value }))}
              >
                <option value="">Nessuno</option>
                {familyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {memberLabel(member)}
                  </option>
                ))}
              </select>
            </label>

            <label className="fg">
              <span className="fl">Metodo pagamento</span>
              <select
                className="fi"
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              >
                <option value="carta">Carta</option>
                <option value="contanti">Contanti</option>
                <option value="bonifico">Bonifico</option>
                <option value="sdd">SDD</option>
                <option value="paypal">PayPal</option>
              </select>
            </label>

            <label className="fg">
              <span className="fl">Stato</span>
              <select
                className="fi"
                value={expenseForm.status}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="pagata">Pagata</option>
                <option value="prevista">Prevista</option>
                <option value="rinviata">Rinviata</option>
              </select>
            </label>

            <label className="fg">
              <span className="fl">Esercente / fornitore</span>
              <input
                className="fi"
                value={expenseForm.merchant}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, merchant: e.target.value }))}
                placeholder="Es. Conad"
              />
            </label>
          </div>

          <label className="fg">
            <span className="fl">
              <input
                type="checkbox"
                checked={expenseForm.recurring}
                onChange={(e) => setExpenseForm((prev) => ({ ...prev, recurring: e.target.checked }))}
                style={{ marginRight: 8 }}
              />
              Spesa ricorrente
            </span>
          </label>

          <label className="fg">
            <span className="fl">Note</span>
            <textarea
              className="fi"
              rows={2}
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Dettagli utili, rate, riferimenti"
            />
          </label>

          <FieldError text={expenseError} />

          <div>
            <button type="submit" className="btn btn-p">
              Salva spesa
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <SectionHeader
          badge="Analisi mese"
          title="3. Ripartizione categorie"
          subtitle="Totale per categoria sul mese selezionato."
        />

        {categoryBreakdown.length ? (
          <div className="breakdown-list">
            {categoryBreakdown.map((item) => {
              const ratio = totals.totalSpent > 0 ? Math.round((item.amount / totals.totalSpent) * 100) : 0

              return (
                <div key={item.key} className="breakdown-row">
                  <div>
                    <div className="tree-title">{item.label}</div>
                    <div className="tree-subtitle">{ratio}% del totale mensile</div>
                  </div>
                  <div className="amount-strong">{fmtCurrency(item.amount)}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-box">Nessuna spesa registrata nel mese selezionato.</div>
        )}
      </div>

      <div className="card">
        <SectionHeader
          badge="Storico spese"
          title="4. Elenco movimenti"
          subtitle="Lista compatta con modifica ed eliminazione inline."
        />

        {monthExpenses.length ? (
          <div className="tree-list">
            {monthExpenses.map((expense) => {
              const member = familyMembers.find((item) => item.id === expense.memberId)

              return (
                <div key={expense.id} className="expense-row">
                  {editingExpenseId === expense.id ? (
                    <div className="edit-box">
                      <div className="spese-form-grid-4">
                        <label className="fg">
                          <span className="fl">Data</span>
                          <input
                            className="fi"
                            type="date"
                            value={editExpenseForm.date}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, date: e.target.value }))}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Titolo</span>
                          <input
                            className="fi"
                            value={editExpenseForm.title}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, title: e.target.value }))}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Categoria</span>
                          <select
                            className="fi"
                            value={editExpenseForm.category}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, category: e.target.value }))}
                          >
                            <option value="spesa">Spesa</option>
                            <option value="casa">Casa</option>
                            <option value="bollette">Bollette</option>
                            <option value="salute">Salute</option>
                            <option value="trasporti">Trasporti</option>
                            <option value="scuola">Scuola</option>
                            <option value="viaggi">Viaggi</option>
                            <option value="tempo-libero">Tempo libero</option>
                            <option value="abbonamenti">Abbonamenti</option>
                            <option value="altro">Altro</option>
                          </select>
                        </label>

                        <label className="fg">
                          <span className="fl">Importo</span>
                          <input
                            className="fi"
                            type="number"
                            step="0.01"
                            value={editExpenseForm.amount}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, amount: e.target.value }))}
                          />
                        </label>

                        <label className="fg">
                          <span className="fl">Tipo</span>
                          <select
                            className="fi"
                            value={editExpenseForm.type}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, type: e.target.value }))}
                          >
                            <option value="variabile">Variabile</option>
                            <option value="fissa">Fissa</option>
                          </select>
                        </label>

                        <label className="fg">
                          <span className="fl">Membro</span>
                          <select
                            className="fi"
                            value={editExpenseForm.memberId}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, memberId: e.target.value }))}
                          >
                            <option value="">Nessuno</option>
                            {familyMembers.map((member) => (
                              <option key={member.id} value={member.id}>
                                {memberLabel(member)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="fg">
                          <span className="fl">Metodo</span>
                          <select
                            className="fi"
                            value={editExpenseForm.paymentMethod}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                          >
                            <option value="carta">Carta</option>
                            <option value="contanti">Contanti</option>
                            <option value="bonifico">Bonifico</option>
                            <option value="sdd">SDD</option>
                            <option value="paypal">PayPal</option>
                          </select>
                        </label>

                        <label className="fg">
                          <span className="fl">Stato</span>
                          <select
                            className="fi"
                            value={editExpenseForm.status}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, status: e.target.value }))}
                          >
                            <option value="pagata">Pagata</option>
                            <option value="prevista">Prevista</option>
                            <option value="rinviata">Rinviata</option>
                          </select>
                        </label>

                        <label className="fg">
                          <span className="fl">Esercente</span>
                          <input
                            className="fi"
                            value={editExpenseForm.merchant}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, merchant: e.target.value }))}
                          />
                        </label>
                      </div>

                      <label className="fg">
                        <span className="fl">
                          <input
                            type="checkbox"
                            checked={editExpenseForm.recurring}
                            onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, recurring: e.target.checked }))}
                            style={{ marginRight: 8 }}
                          />
                          Spesa ricorrente
                        </span>
                      </label>

                      <label className="fg">
                        <span className="fl">Note</span>
                        <textarea
                          className="fi"
                          rows={2}
                          value={editExpenseForm.notes}
                          onChange={(e) => setEditExpenseForm((prev) => ({ ...prev, notes: e.target.value }))}
                        />
                      </label>

                      <div className="edit-actions">
                        <button
                          type="button"
                          className="btn btn-inline-soft"
                          onClick={() => saveEditExpense(expense)}
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          className="btn btn-inline-ghost"
                          onClick={() => {
                            setEditingExpenseId('')
                            setEditExpenseForm(emptyExpenseForm)
                          }}
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="expense-row-top">
                        <div>
                          <div className="pill-row" style={{ marginBottom: 4 }}>
                            <span className="badge badge-dash">{categoryLabel(expense.category)}</span>
                            <span className="badge badge-dash">{typeLabel(expense.type)}</span>
                            <span className="badge badge-dash">{statusLabel(expense.status)}</span>
                            {expense.recurring ? <span className="badge badge-warning">Ricorrente</span> : null}
                          </div>

                          <div className="tree-title">{expense.title}</div>
                          <div className="tree-subtitle">
                            {fmtDate(expense.date)} · {expense.merchant || 'Fornitore non indicato'}
                          </div>
                        </div>

                        <div className="row-actions">
                          <div className="amount-strong">{fmtCurrency(expense.amount)}</div>
                          <button
                            type="button"
                            className="btn btn-inline-soft"
                            onClick={() => startEditExpense(expense)}
                          >
                            Modifica
                          </button>
                          <button
                            type="button"
                            className="btn btn-inline-danger"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>

                      <MetaPills
                        items={[
                          { label: 'Membro', value: member ? memberLabel(member) : '—' },
                          { label: 'Pagamento', value: paymentMethodLabel(expense.paymentMethod) },
                          { label: 'Mese', value: monthLabel(monthKeyFromDate(expense.date)) },
                        ]}
                      />

                      {expense.notes ? <div className="tree-notes">{expense.notes}</div> : null}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-box">
            Nessuna spesa registrata per {monthLabel(selectedMonth)}.
          </div>
        )}
      </div>
    </div>
  )
}
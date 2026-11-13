import { CalendarDays, FileEdit, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createAdjustment, deleteAdjustment, getAdjustments } from '../services/adjustmentsApi'
import { lookupMember } from '../services/membersApi'

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

const initialForm = {
  blockLot: '',
  adjustmentDate: getToday(),
  principal: '',
  interest: '',
  penalty: '',
  reason: '',
}

function AdjustmentEntry() {
  const [adjustments, setAdjustments] = useState([])
  const [form, setForm] = useState(initialForm)
  const [member, setMember] = useState(null)
  const [lookupState, setLookupState] = useState('idle')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')

  async function loadAdjustments() {
    setIsLoading(true)
    setError('')
    try {
      setAdjustments(await getAdjustments())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // The effect loads records from the authenticated API when the module opens.
    // eslint-disable-next-line react(set-state-in-effect)
    loadAdjustments()
  }, [])

  useEffect(() => {
    const value = form.blockLot.trim()
    const parts = value.split('/').map((part) => part.trim())
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      // eslint-disable-next-line react(set-state-in-effect)
      setMember(null)
      setLookupState('idle')
      return undefined
    }

    let isCurrent = true
    const timeoutId = window.setTimeout(async () => {
      setLookupState('loading')
      try {
        const result = await lookupMember(parts[0], parts[1])
        if (isCurrent) {
          setMember(result)
          setLookupState(result ? 'found' : 'not-found')
        }
      } catch (lookupError) {
        if (isCurrent) {
          setMember(null)
          setLookupState('error')
          setError(lookupError.message)
        }
      }
    }, 350)

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
    }
  }, [form.blockLot])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setMessage('')
    try {
      await createAdjustment(form)
      setForm({ ...initialForm, adjustmentDate: getToday() })
      setMember(null)
      setLookupState('idle')
      setMessage('Adjustment saved and member balance updated.')
      await loadAdjustments()
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(adjustment) {
    const confirmed = window.confirm(
      `Delete this ${adjustment.component} adjustment for Block/Lot ${adjustment.member.block}/${adjustment.member.lot}? The member balance will be reversed.`,
    )
    if (!confirmed) {
      return
    }

    setDeletingId(adjustment.id)
    setError('')
    setMessage('')
    try {
      await deleteAdjustment(adjustment.id)
      setMessage('Adjustment deleted and member balance reversed.')
      await loadAdjustments()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setDeletingId(null)
    }
  }

  const visibleAdjustments = adjustments.filter((adjustment) => [
    adjustment.adjustmentDate,
    `${adjustment.member.block}/${adjustment.member.lot}`,
    adjustment.member.registeredOwners ?? '',
    adjustment.component,
    adjustment.direction,
    adjustment.reason,
    adjustment.createdByUsername,
  ].join(' ').toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <section className="space-y-6">
      <div>
        <div className="mb-2 h-0.5 w-8 bg-emerald-700" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Member Adjustments</h1>
        <p className="mt-1 text-sm text-slate-500">Record controlled corrections to member balances.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">Block / Lot
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
              <input name="blockLot" value={form.blockLot} onChange={updateField} placeholder="1/1" required className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 font-normal" />
            </div>
            <span className={`mt-2 block text-xs ${lookupState === 'found' ? 'text-emerald-700' : 'text-slate-500'}`}>
              {lookupState === 'found' ? `${member.registeredOwners || 'Member'} found` : 'Enter a member Block/Lot'}
            </span>
          </label>
          <label className="text-sm font-semibold text-slate-700">Adjustment date
            <div className="relative mt-2">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} aria-hidden="true" />
              <input name="adjustmentDate" type="date" value={form.adjustmentDate} onChange={updateField} required className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 font-normal" />
            </div>
          </label>
          <label className="text-sm font-semibold text-slate-700">Principal
            <input name="principal" type="number" step="0.01" value={form.principal} onChange={updateField} placeholder="0.00" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Interest
            <input name="interest" type="number" step="0.01" value={form.interest} onChange={updateField} placeholder="0.00" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Penalty
            <input name="penalty" type="number" step="0.01" value={form.penalty} onChange={updateField} placeholder="0.00" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2 lg:col-span-1">Reason
            <input name="reason" value={form.reason} onChange={updateField} maxLength="2000" required placeholder="Reason for adjustment" className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" />
          </label>
        </div>
        <p className="mt-4 text-xs text-slate-500">Enter a positive amount to increase a balance or a negative amount to decrease it. Leave a component blank when it does not need adjustment.</p>
        {error && <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</p>}
        {message && <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{message}</p>}
        <button type="submit" disabled={isSaving || lookupState !== 'found'} className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
          <FileEdit size={17} aria-hidden="true" />
          {isSaving ? 'Saving...' : 'Save adjustment'}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Adjustment history</h2>
            <p className="mt-1 text-sm text-slate-500">{adjustments.length} saved adjustments</p>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search adjustments" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm sm:w-72" />
        </div>
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading adjustments...</p>}
        {!isLoading && !error && visibleAdjustments.length === 0 && <p className="p-6 text-sm text-slate-500">No adjustments found.</p>}
        {!isLoading && visibleAdjustments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Member</th><th className="px-5 py-3">Type</th><th className="px-5 py-3 text-right">Amount</th><th className="px-5 py-3">Reason</th><th className="px-5 py-3">Admin</th><th className="px-5 py-3"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleAdjustments.map((adjustment) => (
                  <tr key={adjustment.id}>
                    <td className="whitespace-nowrap px-5 py-4">{adjustment.adjustmentDate}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{adjustment.member.block} / {adjustment.member.lot}</td>
                    <td className="whitespace-nowrap px-5 py-4">{adjustment.direction === 'increase' ? 'Increase' : 'Decrease'} {adjustment.component}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">{Number(adjustment.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td className="min-w-56 px-5 py-4">{adjustment.reason}</td>
                    <td className="whitespace-nowrap px-5 py-4">{adjustment.createdByUsername}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(adjustment)}
                        disabled={deletingId === adjustment.id}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        {deletingId === adjustment.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default AdjustmentEntry

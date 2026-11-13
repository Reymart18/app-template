import { Edit3, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createMember, getMembers, updateMember } from '../services/membersApi'

const amountFormatter = new Intl.NumberFormat('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function MemberList({ refreshKey }) {
  const [members, setMembers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [formMode, setFormMode] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [form, setForm] = useState({ block: '', lot: '', registeredOwners: '', email: '', cellphoneNumber: '', telephoneNumber: '', classification: 'HO', sqmSize: '', principal: '', interest: '', penalty: '' })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadMembers() {
      setIsLoading(true)
      setError('')

      try {
        const response = await getMembers({ page: pagination.page, search })
        if (isCurrent) {
          setMembers(response.items)
          setPagination((current) => ({ ...current, ...response }))
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message)
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    loadMembers()
    return () => {
      isCurrent = false
    }
  }, [pagination.page, refreshKey, reloadKey, search])

  function handleSearch(event) {
    event.preventDefault()
    setPagination((current) => ({ ...current, page: 1 }))
    setSearch(searchInput)
  }

  function formatAmount(value) {
    return amountFormatter.format(Number(value ?? 0))
  }

  function openCreate() {
    setSelectedMember(null)
    setForm({ block: '', lot: '', registeredOwners: '', email: '', cellphoneNumber: '', telephoneNumber: '', classification: 'HO', sqmSize: '', principal: '', interest: '', penalty: '' })
    setFormError('')
    setFormMode('create')
  }

  function openEdit(member) {
    setSelectedMember(member)
    setForm({
      block: member.block,
      lot: member.lot,
      registeredOwners: member.registeredOwners ?? '',
      email: member.email ?? '',
      cellphoneNumber: member.cellphoneNumber ?? '',
      telephoneNumber: member.telephoneNumber ?? '',
      classification: member.classification,
      sqmSize: '',
      principal: '',
      interest: '',
      penalty: '',
    })
    setFormError('')
    setFormMode('edit')
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setFormError('')
    try {
      const values = {
        block: form.block,
        lot: form.lot,
        registeredOwners: form.registeredOwners,
        email: form.email,
        cellphoneNumber: form.cellphoneNumber,
        telephoneNumber: form.telephoneNumber,
        classification: form.classification,
      }
      if (formMode === 'edit') {
        await updateMember(selectedMember.id, values)
      } else {
        await createMember({ ...values, sqmSize: form.sqmSize, principal: form.principal, interest: form.interest, penalty: form.penalty })
      }
      setFormMode(null)
      setReloadKey((current) => current + 1)
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Member masterlist</h2>
          <p className="mt-1 text-sm text-slate-600">{pagination.total} member records</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button type="button" onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800">
            <Plus size={17} aria-hidden="true" />
            Add member
          </button>
          <form className="flex w-full gap-2 sm:w-auto" onSubmit={handleSearch}>
          <label className="sr-only" htmlFor="member-search">Search members</label>
          <div className="relative flex-1 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input
              id="member-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search Block, Lot, or owner"
              className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
            />
          </div>
          <button className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700" type="submit">
            Search
          </button>
          </form>
        </div>
      </div>

      {error && <p className="m-6 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</p>}
      {isLoading && <p className="p-6 text-sm text-slate-500">Loading member records...</p>}
      {!isLoading && !error && members.length === 0 && <p className="p-6 text-sm text-slate-500">No member records found.</p>}
      {!isLoading && !error && members.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Block / Lot</th>
                <th className="px-5 py-3">Registered owner/s</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Cellphone</th>
                <th className="px-5 py-3">Telephone</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3 text-right">SQM</th>
                <th className="px-5 py-3 text-right">Principal</th>
                <th className="px-5 py-3 text-right">Interest</th>
                <th className="px-5 py-3 text-right">Penalty</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{member.block} / {member.lot}</td>
                  <td className="min-w-56 px-5 py-4">{member.registeredOwners || '—'}</td>
                  <td className="px-5 py-4">{member.email || '—'}</td>
                  <td className="whitespace-nowrap px-5 py-4">{member.cellphoneNumber || '—'}</td>
                  <td className="whitespace-nowrap px-5 py-4">{member.telephoneNumber || '—'}</td>
                  <td className="px-5 py-4">{member.classification}</td>
                  <td className="px-5 py-4 text-right">{member.sqmSize ? formatAmount(member.sqmSize) : '—'}</td>
                  <td className="px-5 py-4 text-right">{formatAmount(member.principal)}</td>
                  <td className="px-5 py-4 text-right">{formatAmount(member.interest)}</td>
                  <td className="px-5 py-4 text-right">{formatAmount(member.penalty)}</td>
                  <td className="px-5 py-4 text-right">
                    <button type="button" onClick={() => openEdit(member)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-cyan-700 transition hover:bg-cyan-50">
                      <Edit3 size={14} aria-hidden="true" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-600">
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
            className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
            className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {formMode && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="member-form-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="member-form-title" className="text-xl font-bold text-slate-950">{formMode === 'edit' ? 'Edit member' : 'Add member'}</h3>
                <p className="mt-1 text-sm text-slate-500">{formMode === 'create' ? 'Initial balances can be entered when creating a member.' : 'Principal, interest, penalty, and SQM cannot be edited here.'}</p>
              </div>
              <button type="button" onClick={() => setFormMode(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close member form"><X size={20} /></button>
            </div>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">Block<input name="block" value={form.block} onChange={updateField} required className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Lot<input name="lot" value={form.lot} onChange={updateField} required className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Registered owner/s<textarea name="registeredOwners" value={form.registeredOwners} onChange={updateField} rows="2" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Gmail / email<input name="email" type="email" value={form.email} onChange={updateField} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Cellphone number<input name="cellphoneNumber" type="number" min="0" step="1" value={form.cellphoneNumber} onChange={updateField} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Telephone number<input name="telephoneNumber" type="number" min="0" step="1" value={form.telephoneNumber} onChange={updateField} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-700">Classification<select name="classification" value={form.classification} onChange={updateField} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 font-normal"><option value="HO">HO</option><option value="LO">LO</option></select></label>
                {formMode === 'create' && (
                  <>
                    <label className="text-sm font-semibold text-slate-700">SQM size<input name="sqmSize" type="number" min="0" step="0.01" value={form.sqmSize} onChange={updateField} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700">Principal<input name="principal" type="number" min="0" step="0.01" value={form.principal} onChange={updateField} required className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700">Interest<input name="interest" type="number" min="0" step="0.01" value={form.interest} onChange={updateField} required className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                    <label className="text-sm font-semibold text-slate-700">Penalty<input name="penalty" type="number" min="0" step="0.01" value={form.penalty} onChange={updateField} required className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 font-normal" /></label>
                  </>
                )}
              </div>
              {formError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{formError}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setFormMode(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="submit" disabled={isSaving} className="rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? 'Saving...' : formMode === 'edit' ? 'Save changes' : 'Add member'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

export default MemberList

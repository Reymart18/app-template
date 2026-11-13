import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createCollection, deleteCollection, getCollections, updateCollection } from '../services/collectionsApi'
import { lookupMember } from '../services/membersApi'

const paymentCategories = [
  'Association dues',
  'Water dues',
  'ID/Stickers',
  'Swimming pool tickets',
  'Rental of facilities',
  'Construction bond',
  'Multi-purpose hall rental',
  'Others',
]
const paymentTypes = ['Cash', 'Online', 'Check', 'Bank transfer']

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getNextReferenceNumber(records) {
  const numericReferences = records
    .map((record) => record.referenceNumber?.trim())
    .filter((reference) => reference && /^\d+$/.test(reference))
  const latest = numericReferences.sort((first, second) => Number(second) - Number(first))[0]
  if (!latest) return '0001'
  return String(Number(latest) + 1).padStart(latest.length, '0')
}

function CollectionEntry() {
  const [collections, setCollections] = useState([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [form, setForm] = useState({
    blockLot: '',
    collectionDate: getToday(),
    referenceNumber: '',
    amount: '',
    discountPercentage: '0',
    paymentCategory: 'Association dues',
    paymentType: 'Cash',
    remarks: '',
  })
  const [member, setMember] = useState(null)
  const [lookupState, setLookupState] = useState('idle')
  const [lookupMessage, setLookupMessage] = useState('')
  const [listError, setListError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  async function loadCollections() {
    setIsLoading(true)
    setListError('')
    try {
      setCollections(await getCollections())
    } catch (error) {
      setListError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // The effect loads records from the authenticated API when the module opens.
    // eslint-disable-next-line react(set-state-in-effect)
    loadCollections()
  }, [])

  useEffect(() => {
    const value = form.blockLot.trim()
    if (!formMode || !value) return undefined

    const parts = value.split('/').map((part) => part.trim())
    if (parts.length !== 2 || !parts[0] || !parts[1]) return undefined

    let isCurrent = true
    const timeoutId = window.setTimeout(async () => {
      setLookupState('loading')
      setLookupMessage('')
      try {
        const result = await lookupMember(parts[0], parts[1])
        if (!isCurrent) return
        setMember(result)
        setLookupState(result ? 'found' : 'not-found')
        setLookupMessage(result ? '' : 'No member was found for this Block/Lot.')
      } catch (error) {
        if (isCurrent) {
          setLookupState('error')
          setLookupMessage(error.message)
        }
      }
    }, 350)

    return () => {
      isCurrent = false
      window.clearTimeout(timeoutId)
    }
  }, [form.blockLot, formMode])

  const visibleCollections = collections.filter((collection) => {
    const text = [
      collection.collectionDate,
      `${collection.member.block}/${collection.member.lot}`,
      collection.member.registeredOwners,
      collection.paymentCategory,
      collection.paymentType,
      collection.referenceNumber,
    ].join(' ')
    return text.toLowerCase().includes(search.trim().toLowerCase())
  })

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setSaveError('')
    if (name === 'blockLot') {
      setMember(null)
      setLookupState('idle')
      setLookupMessage('')
    }

  }

  const discountValue = Number(form.amount || 0) * Number(form.discountPercentage || 0) / 100
  const netAmount = Math.max(0, Number(form.amount || 0) - discountValue)

  function openCreate() {
    setSelectedId(null)
    setMember(null)
    setLookupState('idle')
    setLookupMessage('')
    setSaveError('')
    setForm({
      blockLot: '',
      collectionDate: getToday(),
      referenceNumber: getNextReferenceNumber(collections),
      amount: '',
      discountPercentage: '0',
      paymentCategory: 'Association dues',
      paymentType: 'Cash',
      remarks: '',
    })
    setFormMode('create')
  }

  function openEdit() {
    const selected = collections.find((collection) => collection.id === selectedId)
    if (!selected) return
    setMember(selected.member)
    setLookupState('found')
    setLookupMessage('')
    setSaveError('')
    setForm({
      blockLot: `${selected.member.block}/${selected.member.lot}`,
      collectionDate: selected.collectionDate,
      referenceNumber: selected.referenceNumber,
      amount: selected.amount,
      discountPercentage: selected.discountPercentage ?? '0',
      paymentCategory: selected.paymentCategory,
      paymentType: selected.paymentType ?? 'Cash',
      remarks: selected.remarks ?? '',
    })
    setFormMode('edit')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveError('')
    try {
      if (formMode === 'edit') {
        await updateCollection(selectedId, form)
      } else {
        await createCollection(form)
      }
      setFormMode(null)
      setSelectedId(null)
      await loadCollections()
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedId || !window.confirm('Delete the selected collection record?')) return
    setSaveError('')
    try {
      await deleteCollection(selectedId)
      setSelectedId(null)
      await loadCollections()
    } catch (error) {
      setListError(error.message)
    }
  }

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold text-slate-950">Collection entries</h3>
            <p className="mt-1 text-sm text-slate-500">{collections.length} saved records</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search collections" aria-label="Search collections" className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
          </div>
        </div>

        {listError && <p className="m-6 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{listError}</p>}
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading collection records...</p>}
        {!isLoading && !listError && visibleCollections.length === 0 && <p className="p-6 text-sm text-slate-500">No matching collection entries.</p>}
        {!isLoading && !listError && visibleCollections.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-12 px-5 py-3" />
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Block / Lot</th>
                  <th className="px-5 py-3">Registered owner/s</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Payment type</th>
                  <th className="px-5 py-3">OR NO.</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleCollections.map((collection) => (
                  <tr key={collection.id} onClick={() => setSelectedId(collection.id)} className={`cursor-pointer ${selectedId === collection.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-5 py-4"><input type="radio" name="selected-collection" checked={selectedId === collection.id} onChange={() => setSelectedId(collection.id)} aria-label={`Select collection ${collection.referenceNumber}`} /></td>
                    <td className="whitespace-nowrap px-5 py-4">{collection.collectionDate}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">{collection.member.block} / {collection.member.lot}</td>
                    <td className="min-w-56 px-5 py-4">{collection.member.registeredOwners || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-4">{collection.paymentCategory}</td>
                    <td className="whitespace-nowrap px-5 py-4">{collection.paymentType}</td>
                    <td className="whitespace-nowrap px-5 py-4">{collection.referenceNumber}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold">{Number(collection.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-4">
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"><Plus size={16} />Add collection</button>
          <button type="button" disabled={!selectedId} onClick={openEdit} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"><Edit3 size={16} />Edit</button>
          <button type="button" disabled={!selectedId} onClick={handleDelete} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={16} />Delete</button>
        </div>
      </div>

      {formMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="collection-modal-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFormMode(null)
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <button type="button" onClick={() => setFormMode(null)} className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close collection form"><X size={18} /></button>
            <h3 id="collection-modal-title" className="text-xl font-bold text-slate-950">{formMode === 'edit' ? 'Edit collection' : 'Add collection'}</h3>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-block-lot">Block / Lot</label>
                  <input id="collection-block-lot" name="blockLot" value={form.blockLot} onChange={updateField} placeholder="e.g. 1/1" required className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
                  <p className={`mt-2 text-xs ${lookupState === 'error' || lookupState === 'not-found' ? 'text-rose-700' : 'text-slate-500'}`}>{lookupState === 'loading' ? 'Looking up member...' : lookupState === 'found' ? `Member: ${member?.registeredOwners || 'Found'}` : lookupMessage}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-member-name">Registered owner/s</label>
                  <div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="collection-member-name" value={member?.registeredOwners ?? ''} readOnly placeholder="Filled from the masterlist" className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm" /></div>
                </div>
                <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-date">Collection date</label><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="collection-date" name="collectionDate" type="date" value={form.collectionDate} onChange={updateField} required className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm" /></div></div>
                <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-reference">OR #</label><input id="collection-reference" name="referenceNumber" value={form.referenceNumber} onChange={updateField} required className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-amount">Amount</label><input id="collection-amount" name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={updateField} required className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" /></div>
                <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-discount">Discount (%)</label><input id="collection-discount" name="discountPercentage" type="number" min="0" max="100" step="0.01" value={form.discountPercentage} onChange={updateField} required className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" /><p className="mt-2 text-xs text-slate-500">Discount amount: {discountValue.toFixed(2)}</p></div>
                <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-payment-category">Payment category</label><select id="collection-payment-category" name="paymentCategory" value={form.paymentCategory} onChange={updateField} required className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="" disabled>Select payment category</option>{paymentCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
                <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-payment-type">Payment type</label><select id="collection-payment-type" name="paymentType" value={form.paymentType} onChange={updateField} required className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="" disabled>Select payment type</option>{paymentTypes.map((type) => <option key={type}>{type}</option>)}</select></div>
              </div>
              <div><label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="collection-remarks">Remarks <span className="font-normal text-slate-400">(optional)</span></label><textarea id="collection-remarks" name="remarks" rows="3" value={form.remarks} onChange={updateField} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm"><span className="font-semibold text-slate-600">Net amount</span><span className="text-lg font-bold text-slate-950">{netAmount.toFixed(2)}</span></div>
              {saveError && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{saveError}</p>}
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setFormMode(null)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={lookupState !== 'found' || isSaving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{isSaving && <LoaderCircle size={16} className="animate-spin" />}{formMode === 'edit' ? 'Save changes' : 'Add collection'}</button></div>
              {formMode === 'create' && lookupState === 'found' && <p className="flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 size={15} />Member is ready for collection entry.</p>}
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

export default CollectionEntry

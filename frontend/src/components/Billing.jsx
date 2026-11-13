import { useEffect, useState } from 'react'
import { FileText, Play, Search } from 'lucide-react'
import { generateBilling, getBillings } from '../services/billingApi'

const amountFormatter = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

function Billing() {
  const [billings, setBillings] = useState([])
  const [billingMonth, setBillingMonth] = useState(getCurrentMonth())
  const [rate, setRate] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadBillings() {
    setIsLoading(true)
    setError('')
    try {
      setBillings(await getBillings())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBillings()
  }, [])

  async function handleGenerate(event) {
    event.preventDefault()
    if (!window.confirm(`Run billing for ${billingMonth} using an association rate of ${rate}? Existing bills for this month will be skipped.`)) {
      return
    }
    setIsGenerating(true)
    setError('')
    setMessage('')
    try {
      const result = await generateBilling({ billingMonth, rate })
      setMessage(`${result.created} billing records created. ${result.skippedExisting} existing records skipped${result.skippedMissingSqm ? `, ${result.skippedMissingSqm} members skipped because SQM is missing` : ''}.`)
      await loadBillings()
    } catch (generateError) {
      setError(generateError.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const visibleBillings = billings.filter((billing) => `${billing.billingMonth} ${billing.member.block}/${billing.member.lot} ${billing.member.registeredOwners ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  const billingMonths = [...new Set(visibleBillings.map((billing) => billing.billingMonth))]
  const selectedBillings = visibleBillings.filter((billing) => billing.billingMonth === selectedMonth)
  const formatMonth = (month) => new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const billingSummaries = billingMonths.map((month) => {
    const records = visibleBillings.filter((billing) => billing.billingMonth === month)
    return {
      month,
      rate: records[0]?.rate ?? '0',
      accounts: records.length,
      totalBilled: records.reduce((total, billing) => total + Number(billing.amount ?? 0), 0),
    }
  })

  return (
    <section className="space-y-6">
      <div>
        <div className="mb-2 h-0.5 w-8 bg-emerald-700" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Monthly Billing</h1>
        <p className="mt-1 text-sm text-slate-500">Generate and manage monthly homeowner billing records.</p>
      </div>
      <div className="w-fit max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row">
          <div className="flex min-h-28 w-full items-center justify-center bg-gradient-to-br from-emerald-950 to-emerald-800 text-white sm:w-24 sm:shrink-0">
            <FileText size={34} strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="p-5">
            <form className="flex flex-col gap-5 lg:flex-row lg:items-center" onSubmit={handleGenerate}>
              <div className="grid gap-4 sm:grid-cols-2 lg:flex lg:items-end">
                <label className="text-xs font-semibold text-slate-700 lg:w-44">Billing Month<input type="month" value={billingMonth} onChange={(event) => setBillingMonth(event.target.value)} required className="mt-2 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" /></label>
                <label className="text-xs font-semibold text-slate-700 lg:w-32">Association Rate<div className="mt-2 flex h-10 overflow-hidden rounded-md border border-slate-200"><span className="flex items-center bg-slate-50 px-2 text-sm text-slate-500">₱</span><input type="number" min="0.01" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="Rate" required className="min-w-0 flex-1 px-2 text-sm outline-none" /></div></label>
                <button type="submit" disabled={isGenerating} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"><Play size={13} fill="currentColor" aria-hidden="true" />{isGenerating ? 'Running...' : 'Run Billing'}</button>
              </div>
            </form>
          </div>
        </div>
        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">{error}</p>}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 text-emerald-800" size={20} aria-hidden="true" />
            <div>
              <h3 className="text-base font-bold text-slate-950">Billing History</h3>
              <p className="mt-0.5 text-xs text-slate-500">View and manage your monthly billing records</p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search billing records..." aria-label="Search billing records" className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
          </div>
        </div>
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading billing records...</p>}
        {!isLoading && !error && billingMonths.length === 0 && <p className="p-6 text-sm text-slate-500">No billing records found.</p>}
        {!isLoading && billingMonths.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-emerald-950 text-[10px] font-semibold uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-2.5">Period</th>
                  <th className="px-4 py-2.5 text-right">Rate</th>
                  <th className="px-4 py-2.5 text-right">Accounts</th>
                  <th className="px-4 py-2.5 text-right">Total billed</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {billingSummaries.map((summary) => (
                  <tr key={summary.month} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{formatMonth(summary.month)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">₱{amountFormatter.format(Number(summary.rate))}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{summary.accounts} members</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">₱{amountFormatter.format(summary.totalBilled)}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setSelectedMonth(summary.month)} className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {selectedMonth && selectedBillings.length > 0 && (
          <div className="border-t border-slate-200">
            <div className="flex items-center justify-between gap-4 bg-slate-50 px-6 py-4">
              <h4 className="font-bold text-slate-950">{formatMonth(selectedMonth)} billing details</h4>
              <button type="button" onClick={() => setSelectedMonth(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white">Close</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3">Month</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3">Block / Lot</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3">Registered owner/s</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3 text-right">SQM</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3 text-right">Prev principal</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3 text-right">Prev interest</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3 text-right">Prev penalty</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3 text-right">Principal</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3 text-right">Interest</th><th className="sticky top-0 z-10 bg-slate-50 px-5 py-3 text-right">Penalty</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedBillings.map((billing) => <tr key={billing.id}><td className="px-5 py-4">{billing.billingMonth}</td><td className="px-5 py-4 font-semibold text-slate-900">{billing.member.block} / {billing.member.lot}</td><td className="px-5 py-4">{billing.member.registeredOwners || '—'}</td><td className="px-5 py-4 text-right">{amountFormatter.format(Number(billing.member.sqmSize ?? 0))}</td><td className="px-5 py-4 text-right">{amountFormatter.format(Number(billing.previousPrincipal))}</td><td className="px-5 py-4 text-right">{amountFormatter.format(Number(billing.previousInterest))}</td><td className="px-5 py-4 text-right">{amountFormatter.format(Number(billing.previousPenalty))}</td><td className="px-5 py-4 text-right">{amountFormatter.format(Number(billing.principal))}</td><td className="px-5 py-4 text-right">{amountFormatter.format(Number(billing.interest))}</td><td className="px-5 py-4 text-right">{amountFormatter.format(Number(billing.penalty))}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Billing

import { FileSpreadsheet, Upload } from 'lucide-react'
import { useState } from 'react'
import { importMasterlist } from '../services/membersApi'

function MasterlistUpload({ onImported }) {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!file) {
      setError('Select an Excel masterlist file first.')
      return
    }

    setError('')
    setResult(null)
    setIsImporting(true)

    try {
      const importResult = await importMasterlist(file)
      setResult(importResult)
      onImported()
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
          <FileSpreadsheet size={25} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">Import member masterlist</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Upload an Excel file to create new members and update matching BLOCK and LOT records.
          </p>
        </div>
      </div>

      <form className="mt-7" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold text-slate-700" htmlFor="masterlist-file">
          Excel file
        </label>
        <input
          id="masterlist-file"
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-700 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-cyan-800"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Required columns: BLOCK, LOT, REGISTERED OWNER/S, SQM SIZE, CLASSIFICATION (HO/LO), PRINCIPAL, INTEREST, and PENALTY.
        </p>

        <button
          type="submit"
          disabled={isImporting}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-cyan-700 px-5 text-sm font-bold text-white shadow-lg shadow-cyan-700/15 transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-600/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Upload size={18} aria-hidden="true" />
          {isImporting ? 'Importing...' : 'Import masterlist'}
        </button>
      </form>

      {result && (
        <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          Import complete: {result.inserted} created and {result.updated} updated ({result.total} total rows).
        </p>
      )}
      {error && (
        <p className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}

export default MasterlistUpload

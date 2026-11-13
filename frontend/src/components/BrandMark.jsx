import { Building2 } from 'lucide-react'

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-lg shadow-cyan-600/20">
        <Building2 size={22} strokeWidth={2.2} aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-bold tracking-wide text-slate-900">PVHAI</p>
        <p className="text-xs font-medium text-slate-500">Accountant System</p>
      </div>
    </div>
  )
}

export default BrandMark

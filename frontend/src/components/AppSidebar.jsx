import { ArrowLeftRight, BookUser, FileEdit, FileText, LogOut } from 'lucide-react'
import { useState } from 'react'

function AppSidebar({ user, onSignOut, activeSection, onNavigate }) {
  const [expandedMenu, setExpandedMenu] = useState(null)

  return (
    <aside className="group/sidebar hidden min-h-screen w-20 shrink-0 flex-col overflow-hidden bg-[#0b3b32] px-3 py-5 text-white transition-[width] duration-200 hover:w-64 lg:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#a7c957] text-[#0b3b32] shadow-sm">
          <BookUser size={24} strokeWidth={2.2} aria-hidden="true" />
        </div>
        <div className="hidden leading-tight group-hover/sidebar:block">
          <p className="text-lg font-bold tracking-wide text-white">PVHAI</p>
          <p className="text-[9px] font-medium text-emerald-100">Accounting System</p>
        </div>
      </div>
      <nav className="mt-10 space-y-2" aria-label="Administrator navigation">
        <div className="group/transaction relative">
          <button
            type="button"
            onClick={() => setExpandedMenu((current) => (current === 'transaction' ? null : 'transaction'))}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-200/20 ${
              activeSection === 'collection' || activeSection === 'billing'
                ? 'bg-[#2d6a5a] text-white'
                : 'text-emerald-50 hover:bg-[#174d41]'
            }`}
          >
            <ArrowLeftRight className="shrink-0" size={19} aria-hidden="true" />
            <span className="hidden group-hover/sidebar:inline">Transactions</span>
          </button>
          <div className={`${expandedMenu === 'transaction' ? 'block' : 'hidden'} ml-4 border-l border-emerald-800 pl-3 group-hover/transaction:block`}>
            <button
              type="button"
              onClick={() => onNavigate('collection')}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                activeSection === 'collection' ? 'bg-[#a7c957] font-bold text-[#0b3b32]' : 'text-emerald-100 hover:bg-[#174d41] hover:text-white'
              }`}
            >
              <FileText className="shrink-0" size={17} aria-hidden="true" />
              <span className="hidden group-hover/sidebar:inline">Payment List Entry</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('billing')}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                activeSection === 'billing' ? 'bg-[#a7c957] font-bold text-[#0b3b32]' : 'text-emerald-100 hover:bg-[#174d41] hover:text-white'
              }`}
            >
              <FileText className="shrink-0" size={17} aria-hidden="true" />
              <span className="hidden group-hover/sidebar:inline">Monthly Billing</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('adjustments')}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                activeSection === 'adjustments' ? 'bg-[#a7c957] font-bold text-[#0b3b32]' : 'text-emerald-100 hover:bg-[#174d41] hover:text-white'
              }`}
            >
              <FileEdit className="shrink-0" size={17} aria-hidden="true" />
              <span className="hidden group-hover/sidebar:inline">Adjustments</span>
            </button>
          </div>
        </div>

        <div className="group/masterlist relative">
          <button
            type="button"
            onClick={() => setExpandedMenu((current) => (current === 'masterlist' ? null : 'masterlist'))}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-200/20 ${
              activeSection === 'masterlist' ? 'bg-[#2d6a5a] text-white' : 'text-emerald-50 hover:bg-[#174d41]'
            }`}
          >
            <BookUser className="shrink-0" size={19} aria-hidden="true" />
            <span className="hidden group-hover/sidebar:inline">Masterlist</span>
          </button>
          <div className={`${expandedMenu === 'masterlist' ? 'block' : 'hidden'} ml-4 border-l border-emerald-800 pl-3 group-hover/masterlist:block`}>
            <button
              type="button"
              onClick={() => onNavigate('masterlist')}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                activeSection === 'masterlist' ? 'bg-[#a7c957] font-bold text-[#0b3b32]' : 'text-emerald-100 hover:bg-[#174d41] hover:text-white'
              }`}
            >
              <BookUser className="shrink-0" size={17} aria-hidden="true" />
              <span className="hidden group-hover/sidebar:inline">Members</span>
            </button>
          </div>
        </div>
      </nav>
      <div className="mt-auto border-t border-emerald-800 pt-5">
        <p className="px-3 text-xs text-emerald-200">Signed in as</p>
        <p className="mt-1 truncate px-3 text-sm font-semibold text-white">{user.username}</p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-[#174d41] hover:text-white focus:outline-none focus:ring-4 focus:ring-emerald-200/20"
        >
          <LogOut className="shrink-0" size={18} aria-hidden="true" />
          <span className="hidden group-hover/sidebar:inline">Sign out</span>
        </button>
      </div>
    </aside>
  )
}

export default AppSidebar

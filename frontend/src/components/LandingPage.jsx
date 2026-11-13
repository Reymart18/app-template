import { LogOut, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import AppSidebar from './AppSidebar'
import BrandMark from './BrandMark'
import CollectionEntry from './CollectionEntry'
import Billing from './Billing'
import AdjustmentEntry from './AdjustmentEntry'
import MemberList from './MemberList'
import MasterlistUpload from './MasterlistUpload'

function LandingPage({ user, onSignOut }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeSection, setActiveSection] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(null)

  return (
    <main className="flex min-h-screen bg-slate-50 text-slate-900">
      <AppSidebar
        user={user}
        onSignOut={onSignOut}
        activeSection={activeSection}
        onNavigate={setActiveSection}
      />
      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8 lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <BrandMark />
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-cyan-600/15"
            >
              <LogOut size={17} aria-hidden="true" />
              Sign out
            </button>
          </div>
          <div className="mx-auto mt-4 max-w-6xl">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMobileMenu((current) => (current === 'transaction' ? null : 'transaction'))}
                className="flex-1 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Transaction
              </button>
              <button
                type="button"
                onClick={() => setMobileMenu((current) => (current === 'masterlist' ? null : 'masterlist'))}
                className="flex-1 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Masterlist
              </button>
            </div>
            {mobileMenu === 'transaction' && (
              <div className="mt-2 space-y-2">
                <button type="button" onClick={() => setActiveSection('collection')} className="w-full rounded-lg bg-emerald-50 px-3 py-2 text-left text-sm font-semibold text-emerald-800">Payment List Entry</button>
                <button type="button" onClick={() => setActiveSection('billing')} className="w-full rounded-lg bg-emerald-50 px-3 py-2 text-left text-sm font-semibold text-emerald-800">Billing</button>
                <button type="button" onClick={() => setActiveSection('adjustments')} className="w-full rounded-lg bg-emerald-50 px-3 py-2 text-left text-sm font-semibold text-emerald-800">Adjustments</button>
              </div>
            )}
            {mobileMenu === 'masterlist' && (
              <button
                type="button"
                onClick={() => setActiveSection('masterlist')}
                className="mt-2 w-full rounded-lg bg-cyan-50 px-3 py-2 text-left text-sm font-semibold text-cyan-800"
              >
                Members
              </button>
            )}
          </div>
        </header>

        {activeSection === null && (
          <section className="border-b border-slate-200 bg-white px-5 py-12 sm:px-8 sm:py-16">
            <div className="mx-auto max-w-6xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-800">
                <ShieldCheck size={15} aria-hidden="true" />
                Administrator workspace
              </div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Welcome, {user.username}.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Import the member masterlist here before recording collections. These records are the source of truth for future portal data.
              </p>
            </div>
          </section>
        )}

        {activeSection === 'collection' && (
          <section id="collection-entry" className="px-5 py-10 sm:px-8 sm:py-14">
            <div className="mx-auto max-w-none">
              <p className="text-sm font-semibold text-emerald-700">Collection records</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Record a collection</h2>
              <div className="mt-7 w-full">
                <CollectionEntry />
              </div>
            </div>
          </section>
        )}

        {activeSection === 'billing' && (
          <section id="billing" className="px-5 py-10 sm:px-8 sm:py-14">
            <div className="mx-auto max-w-none">
              <div className="w-full">
                <Billing />
              </div>
            </div>
          </section>
        )}

        {activeSection === 'adjustments' && (
          <section id="adjustments" className="px-5 py-10 sm:px-8 sm:py-14">
            <div className="mx-auto max-w-none">
              <div className="w-full">
                <AdjustmentEntry />
              </div>
            </div>
          </section>
        )}

        {activeSection === 'masterlist' && (
          <section id="member-masterlist" className="px-5 py-10 sm:px-8 sm:py-14">
            <div className="mx-auto max-w-none">
              <p className="text-sm font-semibold text-cyan-700">Member records</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Masterlist administration</h2>
              <div className="mt-7 w-full">
                <MasterlistUpload onImported={() => setRefreshKey((current) => current + 1)} />
              </div>
              <MemberList refreshKey={refreshKey} />
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export default LandingPage

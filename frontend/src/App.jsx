import { useState } from 'react'
import LandingPage from './components/LandingPage'
import LoginForm from './components/LoginForm'
import { clearSession, getSession } from './services/session'

function App() {
  const [session, setSession] = useState(getSession)

  function handleSignOut() {
    clearSession()
    setSession(null)
  }

  if (session) {
    return <LandingPage user={session.user} onSignOut={handleSignOut} />
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-slate-950 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:p-0">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_90%_82%,rgba(20,184,166,0.15),transparent_30%)]"
        aria-hidden="true"
      />
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 px-12 py-14 text-white lg:flex xl:px-20">
        <div className="absolute -left-24 top-28 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-md">
          <p className="mb-5 text-sm font-semibold tracking-[0.24em] text-cyan-300">PVHAI</p>
          <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">Accounting made clear for your community.</h1>
          <p className="mt-6 text-base leading-7 text-slate-300">
            A focused workspace for maintaining accurate records and keeping your association finances organized.
          </p>
        </div>
        <p className="relative text-sm text-slate-400">Parkplace Village Homeowners Association Inc.</p>
      </section>
      <section className="relative flex items-center justify-center lg:bg-white lg:px-10">
        <LoginForm onLogin={setSession} />
      </section>
    </main>
  )
}

export default App

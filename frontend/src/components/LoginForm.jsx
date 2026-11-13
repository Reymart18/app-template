import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import BrandMark from './BrandMark'
import LoginField from './LoginField'
import { login } from '../services/authApi'
import { saveSession } from '../services/session'

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      const result = await login({ identifier: email, password })
      saveSession(result, rememberMe)
      onLogin(result)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl shadow-slate-950/25 sm:p-10 lg:shadow-none">
      <BrandMark />
      <div className="mt-9">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to access the PVHAI Accountant System.</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <LoginField
          icon={Mail}
          id="email"
          label="Username or email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your username or email"
        />
        <LoginField
          icon={LockKeyhole}
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
        >
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-600"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
          </button>
        </LoginField>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-600"
            />
            Remember me
          </label>
          <a className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 hover:underline" href="#forgot-password">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 w-full rounded-lg bg-cyan-700 text-sm font-bold text-white shadow-lg shadow-cyan-700/20 transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-600/25 active:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p aria-live="polite" className="mt-4 min-h-5 text-center text-sm text-cyan-700">
        {message}
      </p>
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">Secure access for authorized PVHAI accounting personnel.</p>
    </div>
  )
}

export default LoginForm

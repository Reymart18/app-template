function LoginField({ icon: Icon, id, label, type = 'text', value, onChange, placeholder, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={19}
          aria-hidden="true"
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-600/10"
          required
        />
        {children}
      </div>
    </div>
  )
}

export default LoginField

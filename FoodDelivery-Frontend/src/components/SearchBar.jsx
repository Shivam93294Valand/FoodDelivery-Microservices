

const SearchBar = ({ value, onChange, placeholder = 'Search restaurants, cuisines…' }) => {
  return (
    <div className="w-full">
      <label className="sr-only" htmlFor="search">Search</label>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-black/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.65-3.65" />
        </svg>
        <input
          id="search"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/80 ring-1 ring-black/10 focus:ring-2 focus:ring-black/20 outline-none shadow-sm placeholder:text-black/40"
        />
      </div>
    </div>
  )
}

export default SearchBar

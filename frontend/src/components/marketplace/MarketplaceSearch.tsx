interface Props {
  search: string;
  setSearch: (val: string) => void;
}

export default function MarketplaceSearch({ search, setSearch }: Props) {
  return (
    <div className="flex gap-3">
      <div className="flex-1 relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, role or skill..."
          className="w-full bg-white/5 border border-white/10 focus:border-fuchsia-500 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm outline-none transition-all" />
      </div>
      <button type="button"
        className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all">
        🔽 Filter
      </button>
    </div>
  );
}
export default function FeelingPicker({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-4xl font-black text-primary w-14 text-center">{value}</span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-2 accent-primary cursor-pointer"
        />
        <span className="text-xs text-muted-foreground w-8">10</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-md text-sm font-bold transition-colors ${
              value === n ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

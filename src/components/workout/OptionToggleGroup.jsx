export function OptionToggleGroup({ options, value, onChange, layout = "wrap" }) {
  const containerClass =
    layout === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-wrap gap-2"

  const buttonClass = layout === "grid" ? "rounded-lg px-4 py-4 text-sm" : "rounded-lg px-4 py-2.5 text-sm"

  return (
    <div className={containerClass}>
      {options.map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`${buttonClass} font-bold uppercase tracking-wide border transition-colors ${
            value === opt.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border hover:bg-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

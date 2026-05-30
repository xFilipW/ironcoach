import { Dumbbell, Zap, Calculator, ChevronRight, X, BarChart3, Scale, UtensilsCrossed, Trophy } from "lucide-react"

const NAV_ITEMS = [
  { id: "analytics", label: "Dashboard", icon: BarChart3 },
  { id: "workout", label: "Treningi", icon: Dumbbell },
  { id: "records", label: "Rekordy", icon: Trophy },
  { id: "diet", label: "Dieta", icon: UtensilsCrossed },
  { id: "measurements", label: "Pomiary", icon: Scale },
  { id: "calculator", label: "Kalkulator 1RM", icon: Calculator },
]

export default function AppSidebar({ activeTab, setActiveTab, open, setOpen }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col h-full min-h-0 w-64 bg-card border-r border-border transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Zap size={16} className="text-primary-foreground" />
          </div>
          <span className="text-xl font-black tracking-widest uppercase text-foreground">IronCoach</span>
          <button type="button" className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setActiveTab(id)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold uppercase tracking-wide transition-colors ${
                activeTab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {label}
              {activeTab === id && <ChevronRight size={14} className="ml-auto" />}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}

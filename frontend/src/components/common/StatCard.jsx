export default function StatCard({ label, value, icon, colorClass = 'bg-indigo-650', trend }) {
  return (
    <div className="card p-6 flex items-start justify-between group hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 hover:border-slate-800 transition-all duration-300">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{label}</p>
        <p className="text-3xl font-extrabold text-white mt-3.5 tabular-nums leading-none tracking-tight">
          {value ?? 0}
        </p>
        {trend !== undefined && (
          <p className={`text-[10px] mt-3 font-bold flex items-center gap-1 uppercase tracking-wider ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span>{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}% this week</span>
          </p>
        )}
      </div>
      <div
        className={`${colorClass} w-12 h-12 rounded-2xl text-xl shadow-lg border border-white/5 shrink-0 ml-4
                    flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
      >
        {icon}
      </div>
    </div>
  )
}

import React from "react";

export default function DashboardStats({ stats }) {
  const { pending = 0, running = 0, completed = 0, failed = 0, cancelled = 0 } = stats.jobs || {};
  const activeWorkers = stats.activeWorkers || 0;

  const cards = [
    {
      title: "Active Workers",
      value: activeWorkers,
      description: "Workers accepting jobs",
      colorClass: "from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-400",
      icon: (
        <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      title: "Pending Queue",
      value: pending,
      description: "Waiting in queue",
      colorClass: "from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Running Jobs",
      value: running,
      description: "Processing live",
      colorClass: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
      icon: (
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
        </svg>
      ),
    },
    {
      title: "Completed Jobs",
      value: completed,
      description: "Finished successfully",
      colorClass: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Failed Jobs",
      value: failed,
      description: "Errored or crashed",
      colorClass: "from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`bg-gradient-to-br ${card.colorClass} border rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all duration-300 hover:scale-[1.02]`}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{card.title}</span>
            <div className="p-2 bg-black/20 rounded-lg">{card.icon}</div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight mb-1">{card.value}</div>
            <p className="text-[11px] opacity-60 font-light">{card.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

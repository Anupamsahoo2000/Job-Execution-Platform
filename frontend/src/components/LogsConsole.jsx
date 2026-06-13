import React, { useEffect, useRef, useState } from "react";

export default function LogsConsole({ logs, onClear }) {
  const consoleEndRef = useRef(null);
  const [autoscroll, setAutoscroll] = useState(true);

  useEffect(() => {
    if (autoscroll && consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoscroll]);

  const getLogLevelStyle = (level) => {
    switch (level) {
      case "error":
        return "text-rose-400";
      case "warn":
        return "text-amber-400";
      default:
        return "text-slate-300";
    }
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour12: false });
  };

  return (
    <div className="bg-[#07080c] border border-[#1a1b24] rounded-xl overflow-hidden shadow-2xl flex flex-col h-[280px]">
      {/* Console Header */}
      <div className="bg-[#0f1118] px-4 py-2 border-b border-[#1a1b24] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mock Red/Yellow/Green window controls */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="font-mono text-xs text-slate-400 ml-2 font-semibold">Live System Events Stream</span>
        </div>

        <div className="flex gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoscroll(!autoscroll)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${
              autoscroll
                ? "bg-violet-950/40 text-violet-400 border border-violet-800/30"
                : "bg-slate-900 text-slate-500 border border-slate-800/30"
            }`}
          >
            {autoscroll ? "• AUTOSCROLL ON" : "• AUTOSCROLL OFF"}
          </button>
          {/* Clear button */}
          <button
            onClick={onClear}
            className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer"
          >
            Clear Console
          </button>
        </div>
      </div>

      {/* Logs Window */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-left space-y-1 select-text">
        {logs.length === 0 ? (
          <div className="text-slate-600 italic h-full flex items-center justify-center">
            &gt; Waiting for system actions... Submit a job or spawn workers to see live events.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="hover:bg-slate-900/40 py-0.5 px-1 rounded flex items-start gap-2">
              <span className="text-slate-600 font-medium select-none">
                [{formatTimestamp(log.timestamp)}]
              </span>
              
              {log.jobId && (
                <span className="text-indigo-400 font-bold select-none cursor-pointer hover:underline">
                  [Job {log.jobId.substring(0, 8)}]
                </span>
              )}

              {log.workerName && (
                <span className="text-emerald-400 font-semibold select-none">
                  ({log.workerName})
                </span>
              )}

              <span className={getLogLevelStyle(log.level)}>{log.message}</span>
            </div>
          ))
        )}
        <div ref={consoleEndRef} />
      </div>
    </div>
  );
}

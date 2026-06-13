import React from "react";

export default function WorkerList({ workers }) {
  const isWorkerActive = (worker) => {
    const lastHeartbeat = new Date(worker.lastHeartbeat).getTime();
    return worker.status === "ACTIVE" && (Date.now() - lastHeartbeat) < 15000;
  };

  return (
    <div className="bg-[#11131a] border border-[#1f222e] rounded-xl p-6 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-[#1f222e] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 012-2h10a2 2 0 012 2m-14 0a2 2 0 002 2h10a2 2 0 002-2M7 7h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2a2 2 0 002 2zM7 17h10a2 2 0 002 2v2a2 2 0 00-2 2H7a2 2 0 00-2-2v-2a2 2 0 002-2z" />
          </svg>
          <h3 className="font-semibold text-sm text-slate-200">Worker Instances ({workers.length})</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-[350px] pr-1">
        {workers.length === 0 ? (
          <div className="text-center py-6 px-4 bg-slate-950/30 rounded-lg border border-slate-900 flex flex-col items-center justify-center h-full">
            <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-slate-400 font-medium mb-3">No Worker Processes Connected</p>
            <p className="text-[10px] text-slate-500 mb-4 max-w-xs leading-normal">
              Register workers to process queued tasks. Open a new terminal and run:
            </p>
            <div className="bg-[#07080a] border border-[#1c1d24] text-[#86efac] font-mono text-[10px] rounded p-2 select-all w-full text-left">
              node worker.js --name Worker-Alpha
            </div>
          </div>
        ) : (
          workers.map((worker) => {
            const active = isWorkerActive(worker);
            return (
              <div
                key={worker.id}
                className={`border rounded-lg p-3 bg-[#161822]/80 transition-all ${
                  active ? "border-[#2b2e40]" : "border-rose-950 bg-rose-950/5"
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{worker.name}</h4>
                    <span className="text-[9px] text-slate-500 font-mono select-all">
                      ID: {worker.id.substring(0, 8)}...
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium gap-1 ${
                      active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                    {active ? "ONLINE" : "DEAD"}
                  </span>
                </div>

                {/* Resource Gauges */}
                <div className="grid grid-cols-2 gap-3 mb-2.5">
                  {/* CPU Gauge */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>CPU:</span>
                      <span className="font-semibold text-slate-300">{active ? `${worker.cpuUsage}%` : "0%"}</span>
                    </div>
                    <div className="w-full bg-[#0d0e12] rounded-full h-1">
                      <div
                        className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${active ? worker.cpuUsage : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Gauge */}
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Memory:</span>
                      <span className="font-semibold text-slate-300">{active ? `${worker.memoryUsage} MB` : "0 MB"}</span>
                    </div>
                    <div className="w-full bg-[#0d0e12] rounded-full h-1">
                      <div
                        className="bg-teal-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${active ? Math.min((worker.memoryUsage / 200) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Task execution summary */}
                <div className="text-[10px] flex items-center gap-1 border-t border-[#1f222e]/60 pt-2 text-slate-400">
                  <span className="font-medium text-slate-500">Status:</span>
                  {active && worker.currentJobId ? (
                    <span className="text-blue-400 font-semibold truncate flex items-center gap-1">
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                      </svg>
                      Running [{worker.currentJobId.substring(0, 8)}]
                    </span>
                  ) : active ? (
                    <span className="text-emerald-400 font-medium">Idle (Waiting for job)</span>
                  ) : (
                    <span className="text-rose-400 font-medium">Offline</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

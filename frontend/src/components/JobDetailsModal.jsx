import React, { useEffect, useState } from "react";

export default function JobDetailsModal({ jobId, onClose }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:3000/api/jobs/${jobId}`);
      if (!res.ok) {
        throw new Error("Failed to load job details");
      }
      const data = await res.json();
      setJob(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-all">
      <div className="w-full max-w-2xl bg-[#11131a] border border-[#2b2e40] rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f222e]">
          <div className="text-left">
            <h3 className="font-bold text-slate-200 text-sm">Job Specifications</h3>
            <span className="font-mono text-[10px] text-slate-500 select-all">UUID: {jobId}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-left">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-violet-500 mb-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs text-slate-400">Retrieving job specs...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-rose-400 border border-rose-950 bg-rose-950/10 rounded-lg">
              Error: {error}
            </div>
          ) : job ? (
            <>
              {/* Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#161822]/60 p-4 border border-[#1f222e] rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Job Type</span>
                  <span className="text-slate-200 font-bold capitalize">{job.type.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Status</span>
                  <span className={`font-bold ${
                    job.status === "COMPLETED" ? "text-emerald-400" :
                    job.status === "FAILED" ? "text-rose-400" :
                    job.status === "RUNNING" ? "text-blue-400 animate-pulse" :
                    "text-amber-400"
                  }`}>{job.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Priority</span>
                  <span className="text-slate-200 font-semibold">{
                    job.priority === 3 ? "High" : job.priority === 2 ? "Medium" : "Low"
                  }</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5 font-medium">Retries (Attempted)</span>
                  <span className="text-slate-200 font-mono">{job.attempts} / {job.maxRetries}</span>
                </div>
              </div>

              {/* Payload */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payload Parameters</h4>
                <pre className="bg-[#08090d] border border-[#1c1d27] rounded-lg p-3 font-mono text-[11px] text-[#38bdf8] overflow-x-auto">
                  {JSON.stringify(job.payload, null, 2)}
                </pre>
              </div>

              {/* Result or Error */}
              {job.result && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Execution Result</h4>
                  <pre className="bg-[#08090d] border border-[#1c1d27] rounded-lg p-3 font-mono text-[11px] text-[#4ade80] overflow-x-auto">
                    {JSON.stringify(job.result, null, 2)}
                  </pre>
                </div>
              )}

              {job.error && (
                <div>
                  <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">Execution Error Exception</h4>
                  <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-3 font-mono text-[11px] text-rose-300">
                    {job.error}
                  </div>
                </div>
              )}

              {/* Time stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-[#1f222e] pt-4 text-[10px] text-slate-500">
                <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
                <div>Started: {job.startedAt ? new Date(job.startedAt).toLocaleString() : "N/A"}</div>
                <div>Finished: {job.completedAt ? new Date(job.completedAt).toLocaleString() : "N/A"}</div>
              </div>

              {/* Job Execution Logs */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chronological Execution Logs</h4>
                <div className="bg-[#08090d] border border-[#1c1d27] rounded-lg p-3 font-mono text-[10px] space-y-1.5 max-h-[180px] overflow-y-auto">
                  {job.logs && job.logs.length === 0 ? (
                    <span className="text-slate-600 italic">No logs recorded for this execution.</span>
                  ) : (
                    job.logs.map((log) => (
                      <div key={log.id} className="flex gap-2">
                        <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={log.level === "error" ? "text-rose-400" : log.level === "warn" ? "text-amber-400" : "text-slate-300"}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">No specifications found.</div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#1f222e] flex justify-end gap-2 bg-[#0f1118]">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}

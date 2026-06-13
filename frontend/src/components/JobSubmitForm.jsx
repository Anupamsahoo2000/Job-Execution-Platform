import React, { useState } from "react";

export default function JobSubmitForm({ onSubmit }) {
  const [type, setType] = useState("delay");
  const [priority, setPriority] = useState(1);
  const [maxRetries, setMaxRetries] = useState(3);
  const [duration, setDuration] = useState(10);
  const [fibN, setFibN] = useState(38);
  const [arraySize, setArraySize] = useState(500000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    let payload = {};
    if (type === "delay") {
      payload = { duration: parseInt(duration) };
    } else if (type === "math") {
      payload = { n: parseInt(fibN) };
    } else if (type === "sorting") {
      payload = { arraySize: parseInt(arraySize) };
    }

    const jobData = {
      type,
      priority: parseInt(priority),
      maxRetries: parseInt(maxRetries),
      payload,
    };

    try {
      await onSubmit(jobData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#11131a] border border-[#1f222e] rounded-xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-4 border-b border-[#1f222e] pb-3">
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-sm text-slate-200">Submit New Job</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Job Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Job Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-[#181a24] border border-[#2b2e40] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="delay">Delay Job (Time simulation)</option>
              <option value="math">Math Job (Fibonacci computation)</option>
              <option value="sorting">Sorting Job (QuickSort array)</option>
              <option value="failure_sim">Failure Simulation (Retry flow)</option>
              <option value="crash_sim">Crash Simulation (Recovery flow)</option>
            </select>
          </div>

          {/* Dynamic Configuration Params */}
          {type === "delay" && (
            <div className="p-3 bg-slate-900/40 border border-[#2b2e40]/60 rounded-lg space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Duration (seconds):</span>
                <span className="text-violet-400 font-bold">{duration}s</span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-1 bg-[#181a24] rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
          )}

          {type === "math" && (
            <div className="p-3 bg-slate-900/40 border border-[#2b2e40]/60 rounded-lg space-y-2">
              <label className="block text-xs text-slate-400">Fibonacci Term (N):</label>
              <input
                type="number"
                min="10"
                max="45"
                value={fibN}
                onChange={(e) => setFibN(e.target.value)}
                className="w-full bg-[#181a24] border border-[#2b2e40] rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-500 block">Values &gt; 40 generate real CPU usage on workers.</span>
            </div>
          )}

          {type === "sorting" && (
            <div className="p-3 bg-slate-900/40 border border-[#2b2e40]/60 rounded-lg space-y-2">
              <label className="block text-xs text-slate-400">Array Size:</label>
              <input
                type="number"
                min="10000"
                max="2000000"
                step="10000"
                value={arraySize}
                onChange={(e) => setArraySize(e.target.value)}
                className="w-full bg-[#181a24] border border-[#2b2e40] rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-500 block">Number of elements to sort in memory.</span>
            </div>
          )}

          {type === "failure_sim" && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-lg">
              <p className="text-[11px] text-rose-300 font-light leading-relaxed">
                <strong>Simulates Job Failure:</strong> This job will run up to 50% progress, fail, and trigger the retry policy.
              </p>
            </div>
          )}

          {type === "crash_sim" && (
            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg">
              <p className="text-[11px] text-amber-300 font-light leading-relaxed">
                <strong>Simulates Worker Crash:</strong> The worker executing this job will call `process.exit(1)` at 50% progress. The scheduler will detect the missing heartbeat and reschedule the task on another worker.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Queue Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-[#181a24] border border-[#2b2e40] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
              </select>
            </div>

            {/* Max Retries */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Max Retries</label>
              <input
                type="number"
                min="0"
                max="5"
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
                className="w-full bg-[#181a24] border border-[#2b2e40] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </form>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg text-sm mt-6 transition-all shadow-lg shadow-violet-900/20 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Queueing...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit Job
          </>
        )}
      </button>
    </div>
  );
}

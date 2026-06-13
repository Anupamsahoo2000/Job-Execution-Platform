import React, { useState } from "react";

export default function JobTable({ jobs, workers, onCancel, onViewDetails }) {
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const getWorkerName = (workerId) => {
    const worker = workers.find((w) => w.id === workerId);
    return worker ? worker.name : "Unassigned";
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 3:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">HIGH</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">LOW</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 gap-1 animate-pulse">
            PENDING
          </span>
        );
      case "RUNNING":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 gap-1">
            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            RUNNING
          </span>
        );
      case "COMPLETED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETED</span>;
      case "FAILED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">FAILED</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-700/20 text-slate-400 border border-slate-700/30">CANCELLED</span>;
      default:
        return null;
    }
  };

  const getProgressColor = (status) => {
    if (status === "FAILED") return "bg-rose-500";
    if (status === "CANCELLED") return "bg-slate-500";
    if (status === "COMPLETED") return "bg-emerald-500";
    return "bg-blue-500";
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesStatus = filterStatus === "ALL" || job.status === filterStatus;
    const matchesSearch =
      job.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getWorkerName(job.workerId).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-[#11131a] border border-[#1f222e] rounded-xl p-6 shadow-xl w-full">
      {/* Filters & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f222e] pb-4 mb-4">
        <div>
          <h3 className="font-semibold text-base text-slate-200 text-left">Job History & Queue</h3>
          <p className="text-xs text-slate-500 text-left mt-0.5">Asynchronous computation executions status</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by ID, type, worker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#181a24] border border-[#2b2e40] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 w-full sm:w-[200px]"
            />
          </div>

          {/* Status filter dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#181a24] border border-[#2b2e40] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="ALL">All States</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1f222e] text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-3 pl-2">Job ID</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Priority</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 w-[150px]">Progress</th>
              <th className="pb-3">Assigned Worker</th>
              <th className="pb-3 text-center">Attempts</th>
              <th className="pb-3 text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f222e]/40">
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 bg-slate-900/10 rounded-lg">
                  No jobs found matching criteria. Submit a job to get started!
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-[#161822]/40 transition-colors">
                  {/* Job ID */}
                  <td className="py-3.5 pl-2 font-mono font-bold text-slate-400">
                    <button
                      onClick={() => onViewDetails(job.id)}
                      className="hover:underline hover:text-violet-400 cursor-pointer select-all"
                    >
                      {job.id.substring(0, 8)}
                    </button>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 capitalize font-medium text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {job.type.replace("_", " ")}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5">{getPriorityBadge(job.priority)}</td>

                  {/* Status */}
                  <td className="py-3.5">{getStatusBadge(job.status)}</td>

                  {/* Progress Bar */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-[#181a24] rounded-full h-1.5 border border-[#2b2e40]/30 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${getProgressColor(job.status)}`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="w-7 text-right font-mono text-[10px] text-slate-400 font-bold">{job.progress}%</span>
                    </div>
                  </td>

                  {/* Worker */}
                  <td className="py-3.5">
                    {job.workerId ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20 gap-1">
                        <span className="w-1 h-1 rounded-full bg-indigo-400" />
                        {getWorkerName(job.workerId)}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Attempts */}
                  <td className="py-3.5 text-center font-mono font-medium text-slate-300">
                    {job.attempts} / {job.maxRetries}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 text-right pr-2 space-x-1.5">
                    <button
                      onClick={() => onViewDetails(job.id)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer"
                    >
                      Logs
                    </button>
                    {(job.status === "PENDING" || job.status === "RUNNING") && (
                      <button
                        onClick={() => onCancel(job.id)}
                        className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/30 px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

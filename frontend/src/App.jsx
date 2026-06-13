import React, { useState, useEffect } from "react";
import DashboardStats from "./components/DashboardStats.jsx";
import JobSubmitForm from "./components/JobSubmitForm.jsx";
import WorkerList from "./components/WorkerList.jsx";
import JobTable from "./components/JobTable.jsx";
import LogsConsole from "./components/LogsConsole.jsx";
import JobDetailsModal from "./components/JobDetailsModal.jsx";

const API_BASE_URL = "http://localhost:3000";

export default function App() {
  const [stats, setStats] = useState({
    jobs: { pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 },
    activeWorkers: 0,
  });
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // connecting, connected, disconnected

  // Fetch initial dataset
  const fetchInitialData = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_BASE_URL}/api/jobs/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Jobs
      const jobsRes = await fetch(`${API_BASE_URL}/api/jobs`);
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }

      // 3. Fetch Workers
      const workersRes = await fetch(`${API_BASE_URL}/api/workers`);
      if (workersRes.ok) {
        const workersData = await workersRes.json();
        setWorkers(workersData);
      }
    } catch (error) {
      console.error("Failed to load initial dashboard datasets:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();

    // Establish Server-Sent Events stream
    const eventSource = new EventSource(`${API_BASE_URL}/api/events`);

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onerror = (err) => {
      console.error("SSE Connection Error:", err);
      setConnectionStatus("disconnected");
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const { type, data } = parsed;

        if (type === "stats") {
          setStats(data);
        } else if (type === "job_updated") {
          setJobs((prevJobs) => {
            const index = prevJobs.findIndex((j) => j.id === data.id);
            if (index !== -1) {
              const updated = [...prevJobs];
              updated[index] = data;
              return updated;
            } else {
              return [data, ...prevJobs];
            }
          });
        } else if (type === "worker_updated") {
          setWorkers((prevWorkers) => {
            const index = prevWorkers.findIndex((w) => w.id === data.id);
            if (index !== -1) {
              const updated = [...prevWorkers];
              updated[index] = data;
              return updated;
            } else {
              return [...prevWorkers, data];
            }
          });
        } else if (type === "log") {
          setLogs((prevLogs) => {
            // Keep logs array capped at 150 items to optimize memory performance
            const updated = [...prevLogs, data];
            if (updated.length > 150) {
              updated.shift();
            }
            return updated;
          });
        }
      } catch (error) {
        console.error("Error parsing event data:", error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // API Call: Submit a job
  const handleJobSubmit = async (jobData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit job");
      }
    } catch (error) {
      alert(`Job submission failed: ${error.message}`);
    }
  };

  // API Call: Cancel a job
  const handleCancelJob = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/cancel`, {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to cancel job");
      }
    } catch (error) {
      alert(`Could not cancel job: ${error.message}`);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-[#07080a] py-6 px-4 sm:px-6 lg:px-8 text-slate-100 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1f222e] pb-5 gap-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight text-white m-0 leading-none">
              Distributed Job Execution Platform
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Monitor asynchronous job scheduling, priority queues, and worker health.
            </p>
          </div>
          
          <div className="flex items-center self-start sm:self-auto">
            {/* Real-time Connection State Badge */}
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold gap-1.5 border ${
                connectionStatus === "connected"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : connectionStatus === "connecting"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-emerald-400 animate-pulse"
                    : connectionStatus === "connecting"
                    ? "bg-amber-400 animate-bounce"
                    : "bg-rose-400"
                }`}
              />
              {connectionStatus === "connected"
                ? "SSE CONNECTED"
                : connectionStatus === "connecting"
                ? "CONNECTING..."
                : "SSE DISCONNECTED"}
            </span>
          </div>
        </header>

        {/* Dashboard Stats */}
        <DashboardStats stats={stats} />

        {/* Middle Work Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-1 space-y-6 flex flex-col">
            <JobSubmitForm onSubmit={handleJobSubmit} />
            <WorkerList workers={workers} />
          </div>

          {/* Job Queue Column */}
          <div className="lg:col-span-2">
            <JobTable
              jobs={jobs}
              workers={workers}
              onCancel={handleCancelJob}
              onViewDetails={setSelectedJobId}
            />
          </div>
        </div>

        {/* Logs Console */}
        <LogsConsole logs={logs} onClear={handleClearLogs} />
      </div>

      {/* Modal overlays */}
      {selectedJobId && (
        <JobDetailsModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} />
      )}
    </div>
  );
}

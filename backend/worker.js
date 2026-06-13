const os = require("os");

// Parse CLI Arguments
const args = process.argv.slice(2);
let name = `Worker-${Math.floor(Math.random() * 1000)}`;
args.forEach((arg, idx) => {
  if (arg.startsWith("--name=")) {
    name = arg.split("=")[1];
  } else if (arg === "--name" && args[idx + 1]) {
    name = args[idx + 1];
  }
});

const API_URL = process.env.API_URL || "http://localhost:3000";
let workerId = null;
let currentJob = null;
let heartbeatInterval = null;
let pollingInterval = null;
let isExecuting = false;

// Simulated CPU and Memory load metrics
let currentCpuUsage = 0;
let currentMemoryUsage = 0;

console.log(`=== Starting Job Execution Worker: [${name}] ===`);

// Helper function to calculate Fibonacci iteratively
function getFibonacci(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  let a = 0, b = 1, temp;
  for (let i = 2; i <= n; i++) {
    temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

// 1. Worker Registration
async function register() {
  try {
    const response = await fetch(`${API_URL}/api/workers/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const data = await response.json();
    workerId = data.workerId;
    console.log(`Worker registered successfully. ID: ${workerId}`);
    
    // Clear existing intervals
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (pollingInterval) clearInterval(pollingInterval);

    // Start heartbeat and polling loops
    startHeartbeatLoop();
    startPollingLoop();
  } catch (error) {
    console.error(`Error during registration: ${error.message}. Retrying in 5s...`);
    setTimeout(register, 5000);
  }
}

// 2. Heartbeat Loop
function startHeartbeatLoop() {
  heartbeatInterval = setInterval(async () => {
    if (!workerId) return;

    // Simulate metrics based on worker state
    if (isExecuting && currentJob) {
      switch (currentJob.type) {
        case "math":
          currentCpuUsage = (Math.random() * 15 + 83).toFixed(1); // 83-98%
          currentMemoryUsage = (Math.random() * 10 + 45).toFixed(1); // 45-55 MB
          break;
        case "sorting":
          currentCpuUsage = (Math.random() * 20 + 55).toFixed(1); // 55-75%
          currentMemoryUsage = (Math.random() * 30 + 85).toFixed(1); // 85-115 MB
          break;
        case "delay":
          currentCpuUsage = (Math.random() * 5 + 4).toFixed(1); // 4-9%
          currentMemoryUsage = (Math.random() * 5 + 18).toFixed(1); // 18-23 MB
          break;
        default:
          currentCpuUsage = (Math.random() * 10 + 10).toFixed(1); // 10-20%
          currentMemoryUsage = (Math.random() * 10 + 25).toFixed(1); // 25-35 MB
      }
    } else {
      // Idle metrics
      currentCpuUsage = (Math.random() * 2.5 + 1.5).toFixed(1); // 1.5-4%
      currentMemoryUsage = (Math.random() * 3 + 15).toFixed(1); // 15-18 MB
    }

    try {
      const response = await fetch(`${API_URL}/api/workers/${workerId}/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpuUsage: parseFloat(currentCpuUsage),
          memoryUsage: parseFloat(currentMemoryUsage),
        }),
      });

      if (response.status === 404 || response.status === 403) {
        console.warn("Server does not recognize worker or marked it dead. Re-registering...");
        clearInterval(heartbeatInterval);
        clearInterval(pollingInterval);
        workerId = null;
        register();
      }
    } catch (error) {
      console.warn(`Failed to send heartbeat: ${error.message}`);
    }
  }, 5000);
}

// 3. Job Polling Loop
function startPollingLoop() {
  pollingInterval = setInterval(async () => {
    if (!workerId || isExecuting) return;

    try {
      const response = await fetch(`${API_URL}/api/workers/${workerId}/poll`);
      if (response.status === 403) {
        console.warn("Worker forbidden. Re-registering...");
        register();
        return;
      }

      if (!response.ok) return;

      const data = await response.json();
      if (data.job) {
        isExecuting = true;
        currentJob = data.job;
        executeJob(data.job);
      }
    } catch (error) {
      console.warn(`Failed to poll for job: ${error.message}`);
    }
  }, 2000);
}

// Helper to report job progress/status updates
async function updateJob(jobId, payload) {
  try {
    const response = await fetch(`${API_URL}/api/jobs/${jobId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.status === 409) {
      // Job was cancelled or already completed
      const data = await response.json();
      console.log(`[Job Cancelled] Stopped executing Job ${jobId}. State: ${data.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Failed to update job progress: ${error.message}`);
    return true;
  }
}

// 4. Job Execution Engine
async function executeJob(job) {
  console.log(`\n>>> Executing Job ${job.id} (Type: ${job.type}, Priority: ${job.priority})`);
  
  try {
    switch (job.type) {
      case "delay":
        await runDelayJob(job);
        break;
      case "math":
        await runMathJob(job);
        break;
      case "sorting":
        await runSortingJob(job);
        break;
      case "failure_sim":
        await runFailureSimJob(job);
        break;
      case "crash_sim":
        await runCrashSimJob(job);
        break;
      default:
        throw new Error(`Unsupported job type: ${job.type}`);
    }
  } catch (error) {
    console.error(`Execution error: ${error.message}`);
    await updateJob(job.id, {
      status: "FAILED",
      error: error.message,
      logMessage: `Execution threw error: ${error.message}`,
    });
  } finally {
    isExecuting = false;
    currentJob = null;
    console.log(`<<< Finished Job ${job.id}. Worker is idle.\n`);
  }
}

// Job Type Implementations
async function runDelayJob(job) {
  const duration = job.payload.duration || 5;
  await updateJob(job.id, {
    progress: 0,
    logMessage: `Starting Delay Job for ${duration}s...`,
  });

  for (let i = 1; i <= duration; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const progress = Math.round((i / duration) * 100);
    const active = await updateJob(job.id, {
      progress,
      logMessage: `Progress: step ${i} of ${duration} seconds`,
    });
    if (!active) return; // Terminate if job was cancelled
  }

  await updateJob(job.id, {
    status: "COMPLETED",
    progress: 100,
    result: { message: "Delay completed successfully" },
    logMessage: "Delay job finished successfully.",
  });
}

async function runMathJob(job) {
  const n = job.payload.n || 40;
  
  await updateJob(job.id, {
    progress: 0,
    logMessage: `Starting Math Job (Compute Fibonacci N=${n})...`,
  });

  await new Promise((resolve) => setTimeout(resolve, 800));
  await updateJob(job.id, { progress: 25, logMessage: "Calculating intermediate recurrences..." });

  await new Promise((resolve) => setTimeout(resolve, 800));
  await updateJob(job.id, { progress: 50, logMessage: "Performing addition sequence..." });

  await new Promise((resolve) => setTimeout(resolve, 800));
  await updateJob(job.id, { progress: 75, logMessage: "Verifying value sizes..." });

  // Actual computation
  const startTime = Date.now();
  const value = getFibonacci(n);
  const timeTaken = Date.now() - startTime;

  await new Promise((resolve) => setTimeout(resolve, 500));
  await updateJob(job.id, {
    status: "COMPLETED",
    progress: 100,
    result: { n, fibonacciValue: value.toString(), timeTakenMs: timeTaken },
    logMessage: `Fibonacci(${n}) = ${value}. Time taken: ${timeTaken}ms. Completed successfully.`,
  });
}

async function runSortingJob(job) {
  const arraySize = job.payload.arraySize || 500000;
  
  await updateJob(job.id, {
    progress: 0,
    logMessage: `Starting Sorting Job (Size: ${arraySize} elements)...`,
  });

  await new Promise((resolve) => setTimeout(resolve, 800));
  await updateJob(job.id, { progress: 30, logMessage: "Generating random floating-point array..." });

  const arr = Array.from({ length: arraySize }, () => Math.random());
  
  await new Promise((resolve) => setTimeout(resolve, 800));
  await updateJob(job.id, { progress: 70, logMessage: `Array generated. Sorting using quicksort algorithm...` });

  const startTime = Date.now();
  arr.sort((a, b) => a - b);
  const timeTaken = Date.now() - startTime;

  await new Promise((resolve) => setTimeout(resolve, 500));
  await updateJob(job.id, {
    status: "COMPLETED",
    progress: 100,
    result: { arraySize, sortedFirstTen: arr.slice(0, 10), timeTakenMs: timeTaken },
    logMessage: `Sorted ${arraySize} elements in ${timeTaken}ms.`,
  });
}

async function runFailureSimJob(job) {
  await updateJob(job.id, {
    progress: 0,
    logMessage: "Starting Failure Simulation...",
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  await updateJob(job.id, {
    progress: 50,
    logMessage: "Processing halfway marker. Attempting server database write...",
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  // Throw error
  throw new Error("Controlled simulation failure: Connection reset by peer.");
}

async function runCrashSimJob(job) {
  await updateJob(job.id, {
    progress: 0,
    logMessage: "Starting Crash Simulation job...",
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  await updateJob(job.id, {
    progress: 50,
    logMessage: "CRITICAL: Simulating worker process crash in 1 second. System will exit(1)!",
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("CRASHING NOW!");
  process.exit(1);
}

// Catch unexpected errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception inside worker:", err);
});

// Boot registration
register();

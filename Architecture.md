# System Architecture: Distributed Job Execution Platform

This document describes the design decisions, component interactions, scalability options, and fault recovery mechanisms of the Distributed Job Execution Platform.

---

## 1. Overall System Architecture

The platform uses a decoupled, event-driven architecture designed to separate job submission from job scheduling and job execution. The main layers are:

1. **Frontend Dashboard (React Single Page App)**:
   - Built with React, Tailwind CSS (v4), and native EventSource client.
   - Provides a real-time visualization of active workers, job status updates, and live system log streams.
   - Communicates with the backend server via HTTP REST APIs for actions (submission, cancellation, details query) and a Server-Sent Events (SSE) stream for instantaneous console logs and state updates.

2. **Backend Server (Express API & Background Routines)**:
   - Implemented in Node.js/Express.
   - Serves as the central API gateway for client requests and worker communications.
   - Operates two core background loops running asynchronously:
     - **Job Scheduler Loop**: Scans for pending jobs and idle workers, matching them according to priority and FIFO scheduling.
     - **Crash Detector Loop**: Scans active workers for heartbeat timeouts, marking inactive workers as DEAD and reclaiming their tasks.
   - Manages state inside a **PostgreSQL** database using the **Sequelize ORM**.

3. **Distributed Worker Processes (Independent Node.js Clients)**:
   - Run as standalone CLI processes (`node worker.js --name <name>`).
   - Register themselves to get a unique UUID, periodically send heartbeats containing CPU/Memory load, and poll for new jobs when idle.
   - Execute jobs asynchronously using local memory and threads, reporting step-by-step progress and logs to the server.

```
+-----------------------------------------------------------+
|                   React Frontend Dashboard                |
+-----------------------------------------------------------+
        | (REST APIs)                           ^ (SSE Stream)
        v                                       |
+-----------------------------------------------------------+
|                   Express API Gateway                     |
+-----------------------------------------------------------+
        |                       ^               |
        | (DB Sync & Queries)   |               | (REST APIs)
        v                       |               v
+------------------+   +-------------------+  +-------------+
| PostgreSQL DB    |   | Scheduler Loop    |  | Workers     |
| (Sequelize ORM)  |   | & Crash Detector  |  | (Standalone)|
+------------------+   +-------------------+  +-------------+
```

---

## 2. Component Interactions & Lifecycles

### A. Job Submission & Scheduling
1. **Submit**: A user submits a job via the React UI. The backend creates a record in the `Jobs` table in `PENDING` status.
2. **Trigger**: The scheduler is immediately run (and is also checked every 2 seconds).
3. **Match**: The scheduler queries:
   - Active, idle workers: `status = ACTIVE` and `currentJobId = NULL` and `lastHeartbeat >= NOW() - 15s`.
   - Pending jobs: `status = PENDING`, ordered by `priority DESC` (HIGH=3, MEDIUM=2, LOW=1) and `createdAt ASC` (FIFO).
4. **Assign**: In a Sequelize transaction, the scheduler pairs the job and worker, updating `job.status = RUNNING`, `job.workerId = worker.id`, `job.attempts += 1`, and `worker.currentJobId = job.id`.
5. **Broadcast**: Emits the assignment event to all connected dashboard SSE channels.

### B. Job Execution & Progress Reporting
1. **Poll**: The idle worker polls `/api/workers/:id/poll` every 2 seconds. It receives the assigned job.
2. **Execute**: The worker flags itself as busy (`isExecuting = true`) and starts the job routine.
3. **Progress updates**: During execution, the worker calls `/api/jobs/:id/progress` periodically to update the completion percentage and upload action logs.
4. **Completion**: Upon finishing, the worker submits the final result with `status = COMPLETED`. The server saves the results, clears the worker's `currentJobId = null`, and triggers the scheduler.

---

## 3. Design Decisions & Trade-offs

- **Server-Sent Events (SSE) vs. WebSockets**:
  - *Decision*: Used SSE (`EventSource`) for the frontend updates, while keeping workers on HTTP REST Polling.
  - *Rationale*: SSE is built directly into HTML5, does not require external libraries like Socket.io (reducing dependency bloating), and naturally handles reconnections. Because our dashboard is read-heavy (submitting logs and stats in one direction), SSE is more resource-efficient than maintaining complex two-way WebSocket handshakes.
- **REST Polling Workers vs. Persistent WebSockets**:
  - *Decision*: Workers poll `/api/workers/:id/poll` every 2 seconds when idle, and send heartbeats every 5 seconds.
  - *Rationale*: Polling makes workers highly resilient to network interruptions. If a worker goes offline for a minute, it doesn't drop a socket connection state; it simply fails a request, retries, and registers itself again automatically once the server is back.
- **Database Transactions (Sequelize)**:
  - *Decision*: Every scheduling assignment and worker crash cleanup is wrapped inside a PostgreSQL Transaction.
  - *Rationale*: Guarantees atomic operations. Ensures that a job is never assigned to two workers simultaneously (race condition) and that worker status changes are always synced with job status recoveries.

---

## 4. Failure Handling Strategies

1. **Worker Crash Recovery (Heartbeat Monitoring)**:
   - Every worker sends heartbeats every 5 seconds.
   - The server's `Crash Detector` loop (every 5 seconds) marks any worker as `DEAD` if its `lastHeartbeat` is older than 15 seconds.
   - If that worker was executing a job, the crash detector reads the job's retry state.
     - If `attempts < maxRetries`, the job is reset to `PENDING` and the assigned worker is cleared, allowing other active workers to pick it up.
     - If `attempts >= maxRetries`, the job is marked `FAILED` with a log entry stating max retries were exceeded due to worker failure.

2. **Job Failure (Retry Policy)**:
   - If a job fails during execution (e.g. database timeout in worker, mathematical exception), the worker reports `status = FAILED`.
   - The server inspects if `attempts < maxRetries`. If true, it automatically resets the job status to `PENDING` and increments the attempt count. This allows the priority scheduler to retry the job.

3. **Server Recovery / DB Resync**:
   - If the server restarts or crashes, workers will receive `404` or connection failures during heartbeat.
   - The worker script is written to automatically re-register (`POST /api/workers/register`) when the server returns a 404 or 403, allowing the cluster to self-heal and reconnect without manual intervention.

---

## 5. Scalability Considerations

- **Horizontal Scaling of Workers**: Since workers are completely detached CLI scripts communicating via HTTP REST APIs, they can be scaled across different machines or Kubernetes pods. They only require connection to the backend URL.
- **Database Indexing**: The `Jobs` table should have indexes on `status` and `priority` to speed up the scheduler queries as the volume of historical jobs increases.
- **Distributed Lock for Scheduler**: To scale the API/Scheduler server horizontally (running multiple Express nodes), the current in-memory scheduling lock (`isScheduling` flag) should be replaced with a distributed lock mechanism using **Redis** (e.g., Redlock) or PostgreSQL advisory locks. This ensures multiple scheduler nodes do not assign the same job twice.

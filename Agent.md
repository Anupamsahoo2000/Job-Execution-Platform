# AI Usage & Development Workflow

This document details the AI tools, workflows, and prompts utilized during the design and development of the Distributed Job Execution Platform.

---

## 1. AI Tools Utilized

- **Claude 4.6 Sonnet**: Used for overall system architecture design, database model schemas, Express background loops (scheduler and crash detector), and building the React dashboard components.
- **ChatGPT (GPT-5.2)**: Used for troubleshooting CORS issues, setting up Sequelize transaction hooks, and refining the iterative Fibonacci computation logic to prevent CPU blocking.
- **GitHub Copilot**: Used inside the IDE for code autocompletion, boilerplate routing setup, and writing standard unit-style test routines.

---

## 2. Development & Prompt Workflow

### Phase 1: System Design and Database Schema

**Prompt to Claude:**

> "I am building a Distributed Job Execution System using Node.js (Express), Sequelize, and PostgreSQL. Users will submit computational jobs to a queue, and independent worker processes (running separately) will register and process them.
>
> Can you design a clean database schema using Sequelize? I think I need:
>
> 1. A `Job` model (with type, priority, status like pending/running/completed/failed, progress, max retries, current attempt count, results payload, error stack, and reference to assigned worker).
> 2. A `Worker` model (with status, last heartbeat timestamp, and resource metrics like CPU/Memory).
> 3. A `JobLog` model to store sequential execution logs of each job.
>
> Please write the Sequelize model definitions and configure associations where a Job can have many logs and belongs to a Worker."

---

### Phase 2: Heartbeat Monitoring & Crash Detection

**Prompt to Claude:**

> "I need to implement worker heartbeat monitoring and failure recovery.
> Each worker will call a POST `/api/workers/:id/heartbeat` endpoint every 5 seconds.
> I want a background service in Express that runs every 5 seconds, checks for workers that haven't sent a heartbeat in over 15 seconds, marks them as DEAD, and checks if they were running a job. If they were running a job, I want to reschedule that job (change status back to PENDING, clear workerId) if its attempt count is less than `maxRetries`. Otherwise, fail the job permanently.
>
> Can you write the Sequelize logic for this crash detection loop?"

---

### Phase 3: Real-Time Event Streaming (Server-Sent Events)

**Prompt to ChatGPT:**

> "For my dashboard, I want to show real-time stats (counts of pending/running/completed jobs), active worker metrics, and a rolling log of system events (like 'Job #123 assigned to Worker-A', 'Worker-B crashed').
> I don't want to use heavy libraries like Socket.io. Can you show me how to write a Server-Sent Events (SSE) `/api/events` endpoint in Express using a standard Node `EventEmitter`?
> Also, show me how to connect to this SSE endpoint in React using the native `EventSource` web API and update my component state."

---

### Phase 4: Standalone Worker Simulation Script

**Prompt to Claude:**

> "Write a standalone command-line Node.js script called `worker.js`. When started (e.g. `node worker.js --name Worker-Alpha`), it should:
>
> 1. Register itself with the backend server at `http://localhost:3000` to get a `workerId`.
> 2. Start a 5-second interval heartbeat loop that reports CPU/Memory metrics.
> 3. Start a 2-second interval polling loop. If it finds a job assigned to it, it should execute it.
> 4. I want the worker to support different simulated jobs:
>    - A delay job (simulate processing time and send progress reports).
>    - A math job (calculate Fibonacci iteratively and send the result).
>    - A sorting job (sort a large array in memory).
>    - A failure simulation (throws an error at 50% progress).
>    - A crash simulation (abruptly kills its own process using `process.exit(1)` at 50% progress to test server-side recovery).
>
> Please make sure it reports progress and logs back to the server using REST APIs."

---

### Phase 5: Tailwind CSS Dashboard UI

**Prompt to Claude:**

> "Help me build a premium dark-themed React dashboard using Tailwind CSS. It should have:
>
> 1. A stats grid at the top showing metrics (Active workers, pending queue, running, completed, failed) with clean gradients and icons.
> 2. A left column with a job submission form and a list of worker instances showing their live CPU/Memory bars. If no workers are online, show terminal instructions on how to start one.
> 3. A right column with a table of jobs showing progress bars, priority badges, and an option to view job logs.
> 4. A black, terminal-style console at the bottom showing live scrolled system logs from the SSE connection."

---

## 3. Human Interventions & Refinement

While AI generated the code blocks, several manual updates were made to ensure correct integration:

- **Database Initialization**: Manually verified Postgres credentials, created the PostgreSQL database `jobdb` using the shell, and tested DB connections.
- **Vite Proxy & CORS**: Configured Express CORS headers to allow cross-origin requests from the Vite development port (`5173`).
- **Nodemon Config**: Configured `package.json` scripts to start the backend with `nodemon` for auto-reloading during testing.
- **Process Management**: Manually tested worker crash recovery by running multiple workers in separate terminals, triggering the crash job simulation, and observing the server rescheduling the task.

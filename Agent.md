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

> "hey i need help making a distributed job execution system in nodejs express and postgres using sequelize.
>
> can u help me design the db schema? i need 3 tables:
> 1. Job (type, priority, status, progress, max retries, attempts, results, error, worker_id)
> 2. Worker (status, last heartbeat time, cpu/memory usage)
> 3. JobLog (to keep logs for each job)
>
> write the sequelize models and set up the relations (job has many logs, belongs to worker)"

---

### Phase 2: Heartbeat Monitoring & Crash Detection

**Prompt to Claude:**

> "how do i do worker heartbeat monitoring and crash recovery?
> my workers send a POST to /api/workers/:id/heartbeat every 5s.
> i need a background loop in express that runs every 5s. it should find workers that haven't pinged in 15s and mark them DEAD.
> if a dead worker was running a job, reschedule the job to PENDING if attempts < maxRetries. if not, mark the job FAILED.
>
> write the sequelize code for this loop"

---

### Phase 3: Real-Time Event Streaming (Server-Sent Events)

**Prompt to ChatGPT:**

> "i want to show real time stats on my react dashboard (pending/running jobs, worker metrics, system logs).
> i dont wanna use socket.io cuz its too heavy. how do i do server sent events (SSE) in express using Node's EventEmitter?
> and how do i listen to this in react using EventSource to update my state?"

---

### Phase 4: Standalone Worker Simulation Script

**Prompt to Claude:**

> "can u write a standalone nodejs script called worker.js?
> it should take a name arg like `node worker.js --name worker1`.
>
> it needs to:
> 1. register with my backend at localhost:3000 to get an id
> 2. send a heartbeat every 5s with fake cpu/ram usage
> 3. poll for jobs every 2s and run them if assigned
>
> make it support 5 fake job types:
> - delay
> - math (calc fibonacci so it actually uses cpu)
> - sort (sort big array)
> - failure sim (throw error at 50%)
> - crash sim (process.exit(1) at 50% to test recovery)
>
> make sure it sends progress and logs to the backend API"

---

### Phase 5: Tailwind CSS Dashboard UI

**Prompt to Claude:**

> "help me make a cool dark theme react dashboard with tailwind css.
>
> it needs:
> 1. top stats grid (active workers, pending, running, completed, failed) with nice gradients/icons
> 2. left column: form to submit jobs and a list of active workers with live cpu/ram progress bars. if no workers, show a code snippet on how to start one.
> 3. right column: table of jobs with progress bars, priority tags, and a button to view logs
> 4. bottom: a fake terminal console showing live system logs from the SSE stream."

---

## 3. Human Interventions & Refinement

While AI generated the code blocks, several manual updates were made to ensure correct integration:

- **Database Initialization**: Manually verified Postgres credentials, created the PostgreSQL database `jobdb` using the shell, and tested DB connections.
- **Vite Proxy & CORS**: Configured Express CORS headers to allow cross-origin requests from the Vite development port (`5173`).
- **Nodemon Config**: Configured `package.json` scripts to start the backend with `nodemon` for auto-reloading during testing.
- **Process Management**: Manually tested worker crash recovery by running multiple workers in separate terminals, triggering the crash job simulation, and observing the server rescheduling the task.

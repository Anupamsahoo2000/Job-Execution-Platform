# Distributed Job Execution Platform

A real-time, fault-tolerant **Distributed Job Execution System** where users can submit computational jobs that execute asynchronously across a cluster of workers. The platform includes job queue prioritization, automatic retries, heartbeat health monitoring, and worker crash recovery.

---

## Features

1. **Job Submission**: Queue tasks with variable payloads, priorities, and retry limits.
2. **Worker Registration**: Independent worker processes register and announce availability.
3. **Queue Prioritization**: High-priority tasks bypass low-priority tasks in the queue.
4. **Heartbeat Health Monitoring**: Workers report CPU and Memory metrics every 5 seconds.
5. **Worker Crash Recovery**: Server detects worker crashes (no heartbeat for 15s) and automatically re-queues active tasks to other available workers.
6. **Automatic Retry Policy**: Failed jobs are automatically retried up to `maxRetries` before marking them as failed.
7. **Real-time Monitoring Dashboard**: Watch job progress, metrics, and live system log streams in real-time.

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** database server

### 1. Database Configuration
Create a database in PostgreSQL named `jobdb` (or configure a custom name).

Update the environment settings in `backend/.env` with your PostgreSQL credentials:
```env
PORT=3000
DB_NAME=jobdb
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
```

### 2. Install Dependencies
Run npm install in both the backend and frontend directories:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## Running the Application

To run the full stack, you need to open multiple terminal windows:

### Step 1: Start the Backend Server
Starts the API gateway, scheduler, and crash detector:
```bash
cd backend
npm run dev
```
The server will start on `http://localhost:3000`.

### Step 2: Start the Frontend Dashboard
Starts the Vite React development server:
```bash
cd frontend
npm run dev
```
Open your browser and navigate to `http://localhost:5173/`.

### Step 3: Spawn Worker Instances
Spawn one or more simulated worker processes. You can run these in separate terminal windows:
```bash
cd backend
# Starts Worker-Alpha
node worker.js --name Worker-Alpha

# (Optional) Starts Worker-Beta in another terminal
node worker.js --name Worker-Beta
```

---

## Testing & Verifying System Features

You can test the system's resilience and scheduling capabilities directly from the dashboard:

1. **Verify Job Execution**:
   - Submit a **Delay Job** (e.g., duration 10s) on the dashboard.
   - Observe the progress bar climbing from 0% to 100% in real-time, accompanied by live logs in the console.

2. **Verify Queue Prioritization**:
   - Stop/terminate all workers (so they go offline).
   - Submit 5 **Low Priority** jobs, then submit 1 **High Priority** job.
   - Restart one worker (`node worker.js --name Worker-Alpha`).
   - Observe that the worker is immediately assigned the **High Priority** job first, even though it was submitted last.

3. **Verify Retry Policy**:
   - Submit a **Failure Simulation** job with `Max Retries` set to 2.
   - The worker will process it up to 50% and fail. The server will catch this, reset the status to `PENDING`, and increase the attempt count.
   - After the second attempt fails, the job will transition to `FAILED` permanently.

4. **Verify Worker Crash Recovery**:
   - Ensure you have two workers running (`Worker-Alpha` and `Worker-Beta`).
   - Submit a **Crash Simulation** job.
   - The assigned worker (e.g. `Worker-Beta`) will crash and terminate itself at 50% progress.
   - Observe the dashboard. After 15 seconds, the server will detect the missing heartbeats, mark `Worker-Beta` as `DEAD` (Offline), and reclaim the active job.
   - Since `Worker-Alpha` is still online, the job will be automatically rescheduled and completed on `Worker-Alpha`.

---

## Assumptions Made

1. **Local Worker Spawning**: While the system is designed to scale across network boundaries, for testing purposes, workers run on the local machine and communicate with `localhost:3000`.
2. **Worker Resource Monitoring**: Since workers are node scripts, the CPU and Memory metrics reported in the heartbeats are simulated based on the active task type (e.g. higher CPU load for Fibonacci calculations, higher Memory load for sorting arrays) to provide realistic metrics graphs on the dashboard.
3. **Database Concurrency**: The scheduler relies on database transactions to ensure that jobs are never double-scheduled. It is assumed the database is PostgreSQL, which supports transactions and `JSONB` datatypes natively.

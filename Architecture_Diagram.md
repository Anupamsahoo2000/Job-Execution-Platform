# System Architecture Diagram

Below is a visual representation of the Distributed Job Execution Platform's architecture. 

It illustrates how the frontend dashboard, backend API, background loops, database, and standalone worker processes interact with each other.

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#3b82f6,stroke:#1e3a8a,stroke-width:2px,color:#fff;
    classDef backend fill:#8b5cf6,stroke:#4c1d95,stroke-width:2px,color:#fff;
    classDef database fill:#10b981,stroke:#064e3b,stroke-width:2px,color:#fff;
    classDef worker fill:#f59e0b,stroke:#78350f,stroke-width:2px,color:#fff;
    classDef loop fill:#ef4444,stroke:#7f1d1d,stroke-width:2px,color:#fff;

    subgraph Client Layer
        UI["💻 React Dashboard\n(Tailwind CSS)"]:::frontend
    end

    subgraph Node.js Backend Server
        API["⚙️ Express API Gateway\n(REST & SSE)"]:::backend
        SSE["📡 Event Emitter\n(Live Broadcasting)"]:::backend
        
        JS["⏱️ Job Scheduler Loop\n(Priority Matcher)"]:::loop
        CD["🩺 Crash Detector Loop\n(Heartbeat Monitor)"]:::loop
    end

    subgraph Storage Layer
        DB[("🗄️ PostgreSQL\n(Sequelize ORM)")]:::database
    end

    subgraph Distributed Execution Layer
        W1["⚙️ Worker-Alpha\n(CLI Process)"]:::worker
        W2["⚙️ Worker-Beta\n(CLI Process)"]:::worker
    end

    %% Frontend Interactions
    UI -- "1. Submit Jobs (HTTP POST)" --> API
    API -. "2. Real-time Logs & Stats (SSE Stream)" .-> UI

    %% Backend to Database
    API -- "Read/Write State" --> DB
    JS -- "Find Pending Jobs & Idle Workers" --> DB
    CD -- "Detect Timeouts & Requeue Jobs" --> DB

    %% Worker Interactions
    W1 -- "Register & Heartbeat (5s)" --> API
    W1 -- "Poll for Jobs (2s) & Report Progress" --> API
    
    W2 -- "Register & Heartbeat (5s)" --> API
    W2 -- "Poll for Jobs (2s) & Report Progress" --> API

    %% Internal Triggers
    API -- "Trigger Events" --> SSE
    JS -. "Notify Assignments" .-> SSE
    CD -. "Notify Worker Deaths" .-> SSE
```

## How to view this diagram:
If you are viewing this on **GitHub**, the diagram above will render automatically. 
If you are viewing this in an IDE like VS Code, you can use the built-in Markdown Preview or install a "Mermaid Preview" extension to see the visual flowchart.

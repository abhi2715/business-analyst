# 🧠 AI Data Analytics Chatbot

> **A local-first, AI-powered data analytics platform** that combines natural language conversation with real SQL execution — letting users upload CSV files, get auto-generated dashboards, and ask questions in plain English that are answered with verified, locally-executed SQL queries.

---

## 📋 Table of Contents

- [Why This Project?](#-why-this-project)
- [Architecture Overview](#-architecture-overview)
- [Project Flow (End-to-End)](#-project-flow-end-to-end)
- [Tech Stack — Tools & Libraries](#-tech-stack--tools--libraries)
- [Feature-by-Feature Breakdown](#-feature-by-feature-breakdown)
- [File Structure & Code Walkthrough](#-file-structure--code-walkthrough)
- [Key Design Decisions](#-key-design-decisions)
- [How to Run Locally](#-how-to-run-locally)
- [Deployment](#-deployment)
- [Probable Questions & Answers (Viva / Interview)](#-probable-questions--answers-viva--interview)

---

## 💡 Why This Project?

Most AI chatbots "hallucinate" when asked data questions — they guess numbers instead of computing them. This project solves that by using a **Text-to-SQL architecture**:

1. The **AI generates SQL queries**, not answers.
2. The SQL is **executed locally in the browser** using DuckDB-WASM (an in-browser database).
3. The user sees **both the AI's explanation AND the verified query result** side by side.

This means the AI can never fabricate numbers — every data answer is backed by a real query running against the actual uploaded dataset.

---

## 🏗 Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Frontend)                        │
│                                                                    │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │  Home    │───▶│  Dashboard   │───▶│   Chat Interface         │  │
│  │  (Upload)│    │  (Recharts)  │    │   (SSE Streaming)        │  │
│  └──────────┘    └──────────────┘    └────────┬─────────────────┘  │
│                                               │                    │
│       ┌───────────────────────────────────────┘                    │
│       ▼                                                            │
│  ┌──────────────────────────┐                                      │
│  │  DuckDB-WASM             │  ◀── CSV loaded into in-browser DB   │
│  │  (In-Browser SQL Engine) │  ◀── AI-generated SQL executed here  │
│  │  Table: "dataset"        │  ──▶ Results rendered as HTML table   │
│  └──────────────────────────┘                                      │
│                                                                    │
└───────────────────────┬────────────────────────────────────────────┘
                        │ HTTP POST + SSE Stream
                        ▼
┌────────────────────────────────────────────────────────────────────┐
│                        SERVER (Backend)                            │
│                                                                    │
│  ┌─────────────────┐    ┌───────────────┐    ┌──────────────────┐ │
│  │  NestJS Server   │───▶│ ChatService   │───▶│ Groq Cloud API  │ │
│  │  (REST + SSE)    │    │ (PapaParser)  │    │ (LLaMA 3.1 LLM) │ │
│  └─────────────────┘    └───────────────┘    └──────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### The Core Insight

The system is split into **two distinct phases**:

| Phase | What Happens | Where It Runs |
|-------|-------------|---------------|
| **Analysis** | CSV is parsed, KPIs computed, AI generates diagnostic insights | Backend (Node.js) |
| **Querying** | User asks questions → AI generates SQL → SQL executes → Results displayed | Frontend (Browser) via DuckDB-WASM |

**SQL execution happens entirely in the browser** — no data ever leaves the user's machine during the chat phase. This is a deliberate privacy-first, zero-latency design.

---

## 🔄 Project Flow (End-to-End)

### Step 1: File Upload (Home Screen)
```
User drops CSV ──▶ Frontend sends file to POST /chat/analyze
                    ──▶ Backend parses CSV with PapaParser
                    ──▶ Backend computes: rowCount, columns, totalSales,
                        totalProfit, columnStats, trendData, breakdown
                    ──▶ Backend sends data summary to Groq LLM for AI insights
                    ──▶ Returns JSON with all dashboard data + insights
```

**Simultaneously in the browser:**
```
Frontend receives file ──▶ loadCSVIntoDuckDB(db, file, 'dataset')
                           ──▶ File registered as buffer in DuckDB-WASM
                           ──▶ CREATE TABLE dataset AS SELECT * FROM read_csv_auto(...)
                           ──▶ Now SQL queries can run locally!
```

### Step 2: Dashboard View
```
Dashboard component receives analysis JSON ──▶ Renders:
  ├── 4 KPI Cards (Revenue, Rows, Profit, Health Score)
  ├── Area Chart (time-series trend via Recharts)
  ├── Pie Chart (categorical breakdown)
  └── AI Insights panel (diagnostic text from Groq)
```

### Step 3: Chat with Data
```
User types: "What is the total revenue?"
    │
    ▼
Frontend sends POST /chat/stream with message + chat history
    │
    ▼
Backend streams response via SSE (Server-Sent Events):
  "The total revenue is ₹4,750..."
  ```sql
  SELECT SUM(revenue) AS total_revenue FROM dataset;
  ```
    │
    ▼
Frontend receives streaming text ──▶ Rendered in real-time (typewriter effect)
    │
    ▼
After stream ends, frontend extracts SQL from ```sql ... ``` blocks
    │
    ▼
executeSQL(db, "SELECT SUM(revenue) AS total_revenue FROM dataset")
    │
    ▼
DuckDB-WASM runs query locally ──▶ Returns: [{total_revenue: 4750}]
    │
    ▼
Result rendered as formatted HTML table below the AI's response
```

### Step 4: User Sees Three Things
1. **AI Explanation** — "The total revenue is ₹4,750. This figure represents..."
2. **SQL Query** — Syntax-highlighted code block
3. **Verified Result Table** — Actual data from DuckDB execution

---

## 🛠 Tech Stack — Tools & Libraries

### Frontend

| Library | Version | Purpose |
|---------|---------|---------|
| **React** | 19.2.8 | UI framework (functional components, hooks) |
| **TypeScript** | 6.0.2 | Type safety across all components |
| **Vite** | 8.3.0 | Build tool & dev server (HMR, fast bundling) |
| **DuckDB-WASM** | 1.33.1 | **In-browser SQL database** — runs SQL queries locally using WebAssembly |
| **Apache Arrow** | 21.2.0 | Columnar data format used by DuckDB for query results |
| **Recharts** | 3.10.1 | Charting library (AreaChart, PieChart with ResponsiveContainer) |
| **Framer Motion** | 13.2.0 | Animations (page transitions, staggered card reveals, floating elements) |
| **Lucide React** | 1.45.0 | Icon library (200+ icons: Upload, Database, TrendingUp, etc.) |
| **React Markdown** | 10.1.0 | Renders AI responses as formatted Markdown |
| **rehype-raw** | 7.0.0 | Allows raw HTML inside Markdown (for AI responses with HTML tags) |
| **React CountUp** | 6.5.3 | Animated number counting for KPI cards |
| **Axios** | 1.20.0 | HTTP client (used for file upload `multipart/form-data`) |
| **Vanilla CSS** | — | Custom glassmorphism design system, no Tailwind |

### Backend

| Library | Version | Purpose |
|---------|---------|---------|
| **NestJS** | 12.0.1 | Enterprise Node.js framework (modules, dependency injection, decorators) |
| **Groq SDK** | 1.6.0 | API client for Groq Cloud (LLaMA inference at ~500 tokens/sec) |
| **PapaParser** | 5.7.0 | CSV parsing with type inference, header detection, error handling |
| **Multer** | 2.3.0 | Multipart file upload handling (Express middleware) |
| **dotenv** | 17.4.2 | Environment variable loading (`GROQ_API_KEY`) |
| **RxJS** | 7.8.1 | Reactive programming (used internally by NestJS) |
| **@nestjs/config** | 12.0.0 | Configuration module for environment variables |

### Infrastructure & Tooling

| Tool | Purpose |
|------|---------|
| **Vercel** | Frontend deployment (auto-deploys on `git push`) |
| **Render / Railway** | Backend deployment (Node.js hosting) |
| **Groq Cloud** | LLM inference API (LLaMA 3.1 8B at ultra-low latency) |
| **Vitest** | Unit testing framework (backend) |
| **OxLint** | Fast linter for both frontend and backend |

---

## 📦 Feature-by-Feature Breakdown

### 1. CSV Upload & Drag-and-Drop
- **Files:** `Home.tsx`, `App.tsx`
- **Libraries:** Native HTML5 Drag & Drop API, Multer (backend)
- **How:** `FileReader` + `FormData` for upload. File is sent to backend AND loaded into DuckDB-WASM simultaneously.
- **Recent Files:** Stored in `localStorage` for quick re-access.

### 2. Auto-Generated Analytics Dashboard
- **Files:** `Dashboard.tsx`, `chat.service.ts`
- **Libraries:** Recharts (charts), Framer Motion (animations), React CountUp (numbers)
- **How:** Backend's `analyzeData()` method parses CSV, infers column types (numeric vs categorical vs date), computes KPIs, groups time-series data, and generates AI insights via Groq.

### 3. Text-to-SQL Chat
- **Files:** `App.tsx` (handleSend), `chat.service.ts` (processChatStream), `duckdb.ts`
- **Libraries:** DuckDB-WASM, Groq SDK, Fetch API (SSE)
- **How:** User's natural language question → Groq LLM generates SQL → Frontend extracts SQL from markdown code block → `executeSQL()` runs it in DuckDB-WASM → Result rendered as table.

### 4. SSE Streaming (Real-Time Responses)
- **Files:** `chat.controller.ts`, `chat.service.ts`, `App.tsx`
- **Protocol:** Server-Sent Events (SSE) over HTTP POST
- **How:** Backend calls `groq.chat.completions.create({ stream: true })`, iterates chunks, writes `data: {content}` lines. Frontend uses `ReadableStream` API to read chunks and update UI in real-time.
- **Format:** `data: {"content": "token"}\n\n` per chunk, `data: [DONE]\n\n` to signal end.

### 5. In-Browser SQL Execution (DuckDB-WASM)
- **Files:** `duckdb.ts`
- **Libraries:** `@duckdb/duckdb-wasm`, Apache Arrow
- **How:** CSV file is registered as a buffer → `CREATE TABLE dataset AS SELECT * FROM read_csv_auto(...)` → Any SQL can now run via `conn.query()`. Results are Arrow tables converted to JSON.
- **Why Browser:** Zero latency, no data leaves the machine, no server-side database needed.

### 6. AI-Powered Insights
- **Files:** `chat.service.ts` (analyzeData method)
- **Libraries:** Groq SDK with `response_format: { type: "json_object" }`
- **How:** Dataset summary is sent to LLM with a structured prompt requesting JSON output with specific keys (alerts, totalRevenue, etc.). Response is parsed and injected into dashboard components.

### 7. Glassmorphism UI Design
- **Files:** `index.css`
- **Techniques:** `backdrop-filter: blur(16px)`, semi-transparent backgrounds (`rgba(255,255,255,0.7)`), subtle borders, box shadows, CSS custom properties for theming.
- **Animations:** `@keyframes fadeInUp`, `@keyframes floatVigorous`, `@keyframes spin`. Framer Motion for orchestrated stagger animations.

### 8. Dynamic Model Discovery
- **Files:** `chat.service.ts` (getValidModel)
- **How:** Instead of hardcoding a model name, the backend queries `groq.models.list()`, filters out non-chat models (whisper, guard, vision, etc.), and selects the best available LLaMA model. Result is cached for subsequent requests.

---

## 📁 File Structure & Code Walkthrough

```
Data-Analytics-Chatbot/
├── backend/
│   ├── src/
│   │   ├── main.ts                 # NestJS bootstrap, CORS setup, port binding
│   │   ├── app.module.ts           # Root module — imports ConfigModule + ChatModule
│   │   ├── app.controller.ts       # Health check endpoint
│   │   ├── app.service.ts          # Basic app service
│   │   └── chat/
│   │       ├── chat.module.ts      # Chat feature module
│   │       ├── chat.controller.ts  # REST endpoints: POST /chat, /chat/stream, /chat/upload, /chat/analyze
│   │       └── chat.service.ts     # Core business logic:
│   │                                 # - processChat(): Single-response chat
│   │                                 # - processChatStream(): SSE streaming chat
│   │                                 # - analyzeData(): CSV analysis + KPI computation + AI insights
│   │                                 # - getValidModel(): Dynamic Groq model discovery
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Main app component:
│   │   │                             # - View routing (home → dashboard → chat)
│   │   │                             # - handleFileUpload(): Dual upload (backend + DuckDB)
│   │   │                             # - handleSend(): Chat flow with SSE + SQL extraction
│   │   │                             # - ResultTable: Renders DuckDB query results
│   │   ├── duckdb.ts               # DuckDB-WASM integration:
│   │   │                             # - initDuckDB(): Initialize WASM database
│   │   │                             # - loadCSVIntoDuckDB(): Register file + CREATE TABLE
│   │   │                             # - executeSQL(): Run arbitrary SQL, return JSON
│   │   ├── index.css               # Complete design system:
│   │   │                             # - CSS custom properties (design tokens)
│   │   │                             # - Glassmorphism cards (.glass)
│   │   │                             # - Chat layout (sidebar + messages + input)
│   │   │                             # - Scrollbar styling
│   │   │                             # - Animations (@keyframes)
│   │   │                             # - KPI cards, charts, tooltips
│   │   └── components/
│   │       ├── Home.tsx            # Upload screen:
│   │       │                         # - Drag & drop zone
│   │       │                         # - Floating animated elements
│   │       │                         # - Loading progress steps
│   │       │                         # - Recent files (localStorage)
│   │       └── Dashboard.tsx       # Analytics dashboard:
│   │                                 # - 4 KPI cards with hover tooltips
│   │                                 # - AreaChart (time-series trend)
│   │                                 # - PieChart (categorical breakdown)
│   │                                 # - AI Insights panel
│   │                                 # - Indian number formatting (₹, Lakhs)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── README.md                       # This file
```

---

## 🎯 Key Design Decisions

### 1. Why DuckDB-WASM in the Browser (not a server-side database)?

| Approach | Pros | Cons |
|----------|------|------|
| **Server DB (Postgres/MySQL)** | Persistent, multi-user | Latency, setup complexity, data privacy risk |
| **DuckDB-WASM (chosen)** | Zero latency, no data leaves browser, no DB setup | Session-only (data lost on refresh), browser memory limits |

**Decision:** For a data analysis chatbot where users upload sensitive business data, keeping SQL execution client-side is a significant **privacy advantage**. The data never leaves the user's browser.

### 2. Why Groq Instead of OpenAI?

| Provider | Speed | Cost | Models |
|----------|-------|------|--------|
| OpenAI GPT-4 | ~30 tokens/sec | $$$$ | GPT-4, GPT-3.5 |
| **Groq (chosen)** | ~500 tokens/sec | Free tier available | LLaMA 3.1, Mixtral |

**Decision:** Groq's inference speed makes streaming feel instantaneous. For SQL generation, LLaMA 3.1 is more than sufficient — you don't need GPT-4 class reasoning to write `SELECT SUM(revenue) FROM dataset`.

### 3. Why SSE Instead of WebSockets?

| Protocol | Complexity | Use Case |
|----------|-----------|----------|
| WebSocket | Bidirectional, stateful | Real-time chat, gaming |
| **SSE (chosen)** | Unidirectional (server→client), simple | AI streaming (one-way token stream) |

**Decision:** AI chat is fundamentally one-directional during generation — the server streams tokens to the client. SSE is simpler, works over standard HTTP, and requires no special infrastructure (unlike WebSockets which need sticky sessions).

### 4. Why Text-to-SQL Instead of Letting the AI Calculate?

| Approach | Problem |
|----------|---------|
| Ask AI to calculate directly | AI hallucinates numbers, can't do complex aggregations |
| **Text-to-SQL (chosen)** | AI generates SQL → SQL engine computes → Results are ground truth |

**Decision:** LLMs are terrible at arithmetic but excellent at translating natural language to SQL. By grounding every answer in a real SQL execution, we eliminate hallucinated numbers entirely.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend
```bash
cd backend
npm install
# Create .env file with your Groq API key
echo "GROQ_API_KEY=your_key_here" > .env
npm run start:dev
# Server runs at http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes (for AI) | `mock-key` | Groq Cloud API key. Without it, the app runs in mock mode. |
| `GROQ_MODEL` | No | Auto-discovered | Override the LLM model (e.g., `llama-3.1-8b-instant`) |
| `PORT` | No | `3000` | Backend server port |
| `VITE_API_URL` | No | `http://localhost:3000` | Backend URL for frontend |

---

## 🌐 Deployment

### Frontend → Vercel
- Connect GitHub repo to Vercel
- Set root directory to `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` environment variable to your backend URL

### Backend → Render / Railway
- Set root directory to `backend`
- Build command: `npm run build`
- Start command: `npm run start:prod`
- Set `GROQ_API_KEY` environment variable

---

## ❓ Probable Questions & Answers (Viva / Interview)

### Q1: "What happens when the user uploads a CSV file?"

**Answer:** Two things happen in parallel:
1. The file is sent to the backend (`POST /chat/analyze`) where **PapaParser** parses it with dynamic type inference. The backend computes KPIs (total revenue, profit, row count), identifies date columns for time-series analysis, finds categorical columns for breakdown charts, and sends a summary to the **Groq LLM** for AI-generated business insights. All of this is returned as a JSON response that powers the Dashboard.
2. Simultaneously, the same file is loaded into **DuckDB-WASM** in the browser using `loadCSVIntoDuckDB()`. This creates a SQL table called `dataset` that can be queried locally. This dual processing means the dashboard shows instant analytics while the chat can execute any SQL query without a round-trip to the server.

---

### Q2: "How does the Text-to-SQL pipeline work? How do you prevent hallucinations?"

**Answer:** When the user asks "What is the total revenue?", the message (along with the dataset's schema — column names, stats) is sent to the Groq API. The LLM is prompted to respond with a natural language explanation followed by a SQL query in a markdown code block. After the full response streams in, the frontend uses a **regex** (`/```sql\n([\s\S]*?)\n```/g`) to extract the SQL. This extracted SQL is then executed locally in **DuckDB-WASM** via `executeSQL()`, and the result is displayed as a formatted table.

The key anti-hallucination mechanism is that the AI never provides the numbers itself — it only writes the SQL. The actual computation happens in DuckDB against the real data. If the SQL is wrong (e.g., references a non-existent column), DuckDB throws an error which is shown to the user, rather than silently returning wrong numbers.

---

### Q3: "Why DuckDB-WASM? Why not just send queries to a server-side database?"

**Answer:** Three reasons:
1. **Privacy:** The user's CSV data stays in their browser. No business data is stored on any server.
2. **Zero Latency:** SQL queries execute in milliseconds locally vs. network round-trip overhead.
3. **No Infrastructure:** No need to provision, manage, or pay for a database server. DuckDB compiles to WebAssembly and runs entirely in the browser's JavaScript engine.

DuckDB is specifically designed for analytical queries (OLAP) — it's columnar, vectorized, and can handle millions of rows efficiently, making it ideal for this use case.

---

### Q4: "Explain the SSE streaming mechanism."

**Answer:** When the user sends a chat message, the frontend makes a `POST` request to `/chat/stream`. The backend sets three HTTP headers:
- `Content-Type: text/event-stream`
- `Cache-Control: no-cache`
- `Connection: keep-alive`

The backend then calls `groq.chat.completions.create({ stream: true })` which returns an async iterator. For each token chunk from the LLM, the backend writes `data: {"content": "token"}\n\n` to the response. When done, it sends `data: [DONE]\n\n`.

On the frontend, the response is read using the `ReadableStream` API (`response.body.getReader()`). Each chunk is decoded, parsed, and the message state is updated in real-time, creating the "typewriter" effect.

The advantage over WebSockets is simplicity — SSE works over standard HTTP, auto-reconnects, and doesn't require any special server configuration (important for Vercel/Render deployment).

---

### Q5: "How does the AI generate insights for the dashboard?"

**Answer:** In the `analyzeData()` method, after computing all numeric stats and categorical breakdowns from the CSV, the backend constructs a structured prompt that includes the dataset summary. This is sent to the Groq API with `response_format: { type: "json_object" }` which forces the LLM to return valid JSON. The prompt asks for specific keys like `alerts`, `totalRevenue`, `profitMargin`, etc. The returned JSON is parsed and each insight is injected into the corresponding dashboard component (KPI card tooltips, the AI Insights panel, etc.).

---

### Q6: "What is DuckDB-WASM and how is it initialized?"

**Answer:** DuckDB-WASM is a compiled-to-WebAssembly version of DuckDB — a high-performance analytical database. In `duckdb.ts`, initialization involves:
1. Loading two WASM bundles (MVP and EH — Exception Handling variants)
2. `duckdb.selectBundle()` picks the best bundle for the browser
3. A Web Worker is created to run the database on a separate thread (won't block the UI)
4. The database is instantiated with the WASM module

When a CSV is uploaded, `loadCSVIntoDuckDB()` reads the file as a `Uint8Array`, registers it as a file buffer in DuckDB's virtual filesystem, then runs `CREATE TABLE dataset AS SELECT * FROM read_csv_auto(...)` which automatically infers column types.

---

### Q7: "What is the role of the system prompt? How does the AI know the column names?"

**Answer:** When the file is first uploaded, the frontend creates a hidden "system context" message (id: '0') that contains:
- The filename
- Total row count
- All column names
- Total sales/profit values
- Column statistics (min, max, average)

This message is included in every chat API call as part of the conversation history, but is filtered out from the UI (`messages.filter(m => m.id !== '0')`). This gives the LLM full knowledge of the dataset schema so it can generate correct SQL using exact column names.

---

### Q8: "How does the model discovery work?"

**Answer:** Instead of hardcoding a model like `llama-3.1-8b-instant`, the `getValidModel()` method in `chat.service.ts`:
1. Checks if a `GROQ_MODEL` environment variable is set (manual override)
2. If not, calls `groq.models.list()` to get all available models
3. Filters out non-chat models (whisper, guard, embed, vision, deepseek, etc.)
4. Prioritizes LLaMA models, falls back to any valid model
5. Caches the result so subsequent requests don't re-query the API

This makes the app resilient to model deprecations — if a model is retired from Groq, the app automatically picks the next best available one.

---

### Q9: "What NestJS concepts are you using?"

**Answer:**
- **Modules:** `ChatModule` encapsulates all chat-related logic (controller + service)
- **Dependency Injection:** `ChatService` is injected into `ChatController` via constructor injection
- **Decorators:** `@Controller('chat')`, `@Post()`, `@Body()`, `@Res()`, `@UploadedFile()`
- **Interceptors:** `FileInterceptor('file')` from `@nestjs/platform-express` for Multer file uploads
- **ConfigModule:** `ConfigModule.forRoot({ isGlobal: true })` loads `.env` variables globally
- **Logger:** `new Logger(ChatService.name)` for structured server-side logging

---

### Q10: "How is the frontend state managed? Why no Redux or Zustand?"

**Answer:** The app uses React's built-in `useState` and `useRef` hooks. The state is simple enough that a global state library would be over-engineering:
- `view`: Controls which screen is shown (home / dashboard / chat)
- `messages`: Array of chat messages
- `dashboardData`: The analysis JSON from the backend
- `db`: DuckDB instance (initialized once)
- `isLoading`: Loading spinner state

All state lives in the root `App.tsx` and is passed down as props to `Home`, `Dashboard`, and inline chat components. For a single-page data analysis tool with one user flow, this is the right level of complexity.

---

### Q11: "What would you improve if you had more time?"

**Answer:**
1. **Multi-file support** — Allow uploading multiple CSVs and JOINing across them
2. **Chart generation from chat** — AI suggests chart type + config, rendered dynamically
3. **Export to PDF/Excel** — Dashboard export functionality
4. **Auth + History** — User accounts with saved analysis sessions (MongoDB is already in the dependencies)
5. **Error recovery** — If DuckDB SQL fails, auto-retry with corrected column names
6. **Caching layer** — Cache repeated queries to avoid re-execution
7. **Mobile responsive** — The current layout is desktop-optimized

---

### Q12: "Is the data secure? Where is it stored?"

**Answer:** The architecture is deliberately **privacy-first**:
- The CSV file is sent to the backend only once (for initial analysis) but is **not stored** — it's processed in memory and discarded
- The same CSV is loaded into **DuckDB-WASM in the browser** for all subsequent queries — data never leaves the client
- No database stores the uploaded data (MongoDB is included in dependencies but not used for data storage)
- Chat history exists only in React state — refreshing the page clears everything

---

### Q13: "How does the frontend extract and execute SQL from the AI's response?"

**Answer:** After the SSE stream completes and `fullContent` contains the AI's entire response, this line extracts all SQL code blocks:

```javascript
const sqlMatches = [...fullContent.matchAll(/```(?:sql)?\n([\s\S]*?)\n```/g)];
const validSqls = sqlMatches.map(m => m[1].trim()).filter(sql => sql.length > 5);
```

It takes the **last** valid SQL block (in case the AI included examples), executes it via `executeSQL(db, sql)`, limits display to 20 rows, and renders it as a `ResultTable` component with column headers and formatted cells.

---

### Q14: "What happens if the Groq API is not configured?"

**Answer:** The system has a **graceful fallback**. If `GROQ_API_KEY` is not set:
- `chat.service.ts` sets `this.groq = null` and logs a warning
- `processChat()` returns a mock response: "(Mock Mode) Set GROQ_API_KEY..."
- `processChatStream()` streams the mock message and closes
- `analyzeData()` skips the AI insights call and uses hardcoded default insights
- The dashboard still works (all numeric analysis is done in pure TypeScript, not by the LLM)

This means the entire application is functional without an API key — only the AI-generated text is missing.

---

### Q15: "Explain the component hierarchy and data flow."

**Answer:**
```
App.tsx (root — owns all state)
  ├── Home.tsx
  │     Props: onFileSelect, isLoading
  │     Action: User drops CSV → calls onFileSelect(file)
  │
  ├── Dashboard.tsx
  │     Props: data (analysis JSON), onStartChat, onBackToUpload
  │     Renders: KPI cards, charts, AI insights
  │     Action: "Chat with Data" button → calls onStartChat()
  │
  └── Chat (inline in App.tsx)
        State: messages[], input, isLoading
        Action: handleSend() → SSE stream → SQL extraction → DuckDB execution
        Renders: Message bubbles, ResultTable, suggested questions, input bar
```

Data flows **downward** via props. Events flow **upward** via callback props (`onFileSelect`, `onStartChat`). No prop drilling beyond one level.

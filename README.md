# 🚀 Enterprise Data Analytics Chatbot

A state-of-the-art, fully autonomous AI Data Analytics platform built to process massive datasets completely in the browser using WebAssembly. Upload a CSV, ask questions in natural English, and watch the AI write and execute SQL queries instantly to give you 100% mathematically exact answers—all without sending your raw data to the cloud.

## ✨ Core Features & Specialties

### 1. In-Browser SQL Engine (DuckDB WASM)
* **The Problem:** Traditional AI chatbots hallucinate numbers because they can only look at small samples of data. Sending a 500MB CSV to an LLM API is impossible due to token limits.
* **Our Solution:** We integrated **DuckDB WebAssembly** directly into the React frontend. When you upload a CSV, it is instantly converted into an in-memory SQL database inside your browser. 
* **The Magic:** When you ask the AI a question, it doesn't try to guess the answer. Instead, it generates a strict SQL query (`SELECT sum(revenue)...`). The frontend intercepts this query, executes it locally against your massive dataset in milliseconds, and displays the mathematically exact result!

### 2. Real-Time Streaming & Markdown UI
* **Server-Sent Events (SSE):** The backend streams tokens from the Groq API (LLaMA-3) directly to the frontend using SSE. Responses appear instantly, token-by-token, eliminating loading anxiety.
* **Rich Markdown:** Chat bubbles beautifully render markdown, tables, and code blocks using `react-markdown`.
* **Stop Generation:** Users can halt long AI responses instantly to save tokens and time.

### 3. Enterprise-Grade UI/UX
* **3D Particle Background:** A stunning, interactive WebGL particle network powered by `tsparticles`.
* **Bento-Box Layout:** A sleek, glassmorphic layout featuring "Recent Datasets" (persisted in `localStorage`) and instant "Demo Datasets".
* **Staggered Loading States:** Dragging a CSV triggers a beautiful, staggered loading animation that builds anticipation (*"Parsing Schema" -> "Generating AI Insights"*).
* **Suggested Questions:** The AI dynamically analyzes your CSV headers and generates 3 clickable question chips (e.g., *"What is the total revenue?"*) to help users get started immediately.

## 🛠️ Technology Stack

**Frontend:**
* **React 18 + Vite:** Lightning-fast HMR and optimized production builds.
* **DuckDB WASM:** High-performance analytical SQL database running locally in the browser.
* **Framer Motion:** Smooth, physics-based micro-animations and layout transitions.
* **Lucide React:** Clean, consistent SVG iconography.
* **Recharts:** (Configured for future dynamic chart rendering).

**Backend:**
* **NestJS (Node.js):** Enterprise-grade, scalable TypeScript backend framework.
* **Groq API (LLaMA-3 8B):** Ultra-fast LLM inference engine. We use a highly tuned system prompt that instructs the AI to operate strictly as an Indian Data Analyst and generate precise DuckDB SQL queries.
* **Express & Multer:** Handles lightweight schema processing before handing heavy lifting over to the frontend WASM engine.

## 🚀 How to Run Locally

### 1. Start the Backend
```bash
cd backend
npm install
# Ensure GROQ_API_KEY is set in your environment
npm run start:dev
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

## ☁️ Deployment

This project is fully containerized and decoupled for modern cloud deployment:
- **Frontend (Vite):** Optimized for **Vercel**. Just add `VITE_API_URL` pointing to your backend.
- **Backend (NestJS):** Optimized for **Render**. Just add `GROQ_API_KEY` and start with `npm run start:prod`.

---
*Built with ❤️ for next-generation data intelligence.*

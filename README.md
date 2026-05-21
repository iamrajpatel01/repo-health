# Repo Health Intelligence (Surgical AI)

**Repo Health Intelligence** is a high-performance, deterministic codebase analysis platform. It tracks the architectural decay of a codebase across Git commits without relying on expensive, slow, or generic LLM embedding strategies.

By applying graph mathematics to local Abstract Syntax Trees (AST) and Git logs, it costs **$0.00** to analyze the entire topology of a repository. AI is only invoked dynamically via a **Surgical Strike**—sending a maximum of 15 lines of code to an LLM only when a critical structural violation occurs.

---

## 🚀 The Core Philosophy

Modern AI developer tools are incredibly expensive and inefficient. They often ingest an entire codebase into a vector database and spend large amounts of LLM tokens on every commit just to determine if code is "good" or "bad."

**We built a $0 Deterministic Pipeline.** We removed AI from the ingestion layer entirely. Instead, we use a custom Python mathematical engine to understand the codebase, allowing us to spend ~$0.0001 in tokens *only* when an anomaly occurs.

---

## 🧠 The Engineering Architecture

### 1. The Git Walker (`git_walker.py`)
Traverses the `.git` folder locally, grabbing chronological file churn.
- **Bus Factor Tracking:** Determines if a single developer writes > 80% of a specific file. If so, it flags the file as a key-person dependency risk (BF:1).

### 2. The AST Parser (`ast_parser.py`)
Parses code files directly into Abstract Syntax Trees.
- **McCabe Cyclomatic Complexity:** We calculate exact complexity by counting branching logic (`if`, `for`, `while`, `catch`).
- **Zero Native Binaries:** For Python, we use the zero-dependency built-in AST module. For JS/TS, we use extremely fast structural regex heuristics. No C-compilers or heavy binaries needed.

### 3. The Graph Math Engine (`graph_engine.py`)
Feeds the AST and Git data into a Directed Graph (via NetworkX) and runs rigorous mathematical rules.
- **Hotspot Risk:** Combines a node's connections (degree) with its Git churn. If a file is heavily connected AND constantly edited, it's flagged as a severe hotspot.
- **Cycle Detection:** Mathematically detects circular dependencies in the import graph.

### 4. Surgical AI Strike (`pipeline.py` & `main.py`)
We don't send the codebase to the LLM. We only trigger the LLM (Gemini 1.5 Flash via LiteLLM) when our deterministic graph math detects a sudden structural drop (e.g., a new circular dependency).
- **Surgical Diff Extraction:** We run `git diff -U1` to extract a maximum of 15 lines of code, isolated *strictly* to the exact file that caused the graph to break. This tiny patch is sent to the LLM to explain the architectural degradation.

---

## 💻 The Frontend Dashboard (Next.js + React Flow)

The UI visualizes the deterministic math engine's output dynamically.

- **Smart Layout Engine:** Connected files are passed through Dagre for a hierarchical tree visualization, while isolated files are wrapped in a neat grid underneath to avoid stretching the graph to infinity.
- **Toxic Edges:** Circular dependencies are drawn as thick, pulsing, animated red lines across the architecture.
- **Risk Indicators:** Glassmorphism nodes dynamically update their borders based on risk:
  - **Red:** High Cyclomatic Complexity.
  - **Orange:** Critical Bus Factor Risk (BF:1).
- **AI Risk Center:** The sidebar proudly declares "Architecture is stable. No LLM tokens spent." until an anomaly drops the graph score, which then enables the "Explain Anomaly (~$0.0001)" button.

---

## 🛠️ Setup Instructions

### Backend (FastAPI + Graph Engine)
1. Navigate to the `backend/` directory.
2. Create a `.env` file with the following:
   ```env
   USE_REAL_LLM=true
   LLM_MODEL=gemini/gemini-1.5-flash
   GEMINI_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install python-dotenv
   ```
4. Start the server:
   ```bash
   python main.py
   ```
   *(The backend runs on `http://localhost:8000`)*

### Frontend (Next.js + Tailwind + React Flow)
1. Navigate to the `frontend/` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   *(The frontend runs on `http://localhost:3000`)*

---

## 🎤 Q&A Defense Cheat Sheet (For the Pitch)

**Q: "Why didn't you just use embeddings or RAG?"**
> "RAG is meant for semantic search, not structural topology. Embeddings don't understand that File A imports File B, creating a circular dependency loop. Our mathematical graph perfectly understands architecture, while RAG just guesses based on text similarity. Plus, math is free; vector DBs are not."

**Q: "How are you parsing the code so fast?"**
> "We wrote a hybrid AST parser. For Python, we use the zero-dependency built-in AST module. For JS/TS, we use structural regex heuristics. It runs locally in milliseconds and doesn't require any heavy C-compilers or native binaries."

**Q: "What exactly is 'Hotspot Risk'?"**
> "It's a combination of Node Degree and Git Churn. If a file is heavily connected to the rest of the app (high degree) AND it is constantly being edited in every commit (high churn), it's statistically the most likely place for a bug to occur. We flag that automatically."
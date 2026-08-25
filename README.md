<div align="center">

# 🎓 StudyStream

**Turn lectures into searchable knowledge.**

StudyStream fetches available YouTube captions without downloading the video. It processes transcripts through a local RAG pipeline — chunking, embedding, and indexing — then answers questions using transcript-retrieved context and provides clickable timestamp citations to the retrieved source chunks. All powered by a Node.js-first architecture.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Mistral AI](https://img.shields.io/badge/Mistral%20AI-LLM-FF7000?logo=mistral&logoColor=white)](https://mistral.ai/)
[![Transformers.js](https://img.shields.io/badge/Transformers.js-Local%20Embeddings-FFD21E?logo=huggingface&logoColor=black)](https://huggingface.co/docs/transformers.js/index)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6F61)](https://www.trychroma.com/)
</div>

---

## ⚡ What it does

Give StudyStream a YouTube link. It will:

1. **Extract**: Fetches available YouTube captions without downloading the video.
2. **Chunk**: Splits the text while preserving the `startTime` and `endTime` metadata.
3. **Embed** the chunks locally using HuggingFace's `all-MiniLM-L6-v2` directly inside Node.js (384-dimensional vectors).
4. **Index** the embeddings into a local ChromaDB vector store.
5. **Summarize** the video (Title, Summary, Key Concepts, Takeaways).
6. **Generate a Quiz** (5 multiple-choice questions based on the video context).
7. **Answer your questions** using transcript-retrieved context — with clickable timestamp citations linking directly to the relevant lecture segment.

The interactive dashboard provides:

- **Real-time SSE processing** — a live pipeline view (Fetch → Chunk → Embed → Index → Summarize)
- **AI-generated summary** — title, paragraph summary, key concept pills, and key takeaways
- **Interactive quiz** — one-question-at-a-time card flow with explanations and score tracking
- **AI Tutor** — a RAG-powered chat sidebar grounded in the transcript
- **Timestamp source cards** — every answer cites the exact transcript segments with links that jump to that position in the video
- **Latency observability** — per-query breakdown of embedding, retrieval, and LLM generation time

---

## 🗺️ Architecture Flow

```
                         STUDYSTREAM
                              │
                        YouTube URL
                              │
                              ▼
                    Node.js / Express
                              │
                       Create Job
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              Get captions         Video metadata
                    │
                    ▼
             Timestamped text
                    │
                    ▼
                Chunking
                    │
             ┌──────┴──────┐
             │             │
             ▼             ▼
         Embeddings     Metadata
      Transformers.js   timestamps
             │             │
             └──────┬──────┘
                    ▼
                 ChromaDB
                    │
             User question
                    │
                    ▼
               Query embedding
                     │
                     ▼
                  ChromaDB
      (Filter: videoId = current video)
                     │
                     ▼
          Top-K Similarity Search
                     │
                     ▼
           Relevant transcript chunks
                    │
                    ▼
              Context builder
                    │
                    ▼
              Mistral API
                    │
             ┌──────┴───────┐
             ▼              ▼
          Answer         Sources
                            │
                            ▼
                     YouTube timestamp
```

**Independent Generation Tasks:**
```
Transcript
    ├──→ Summary
    ├──→ Key concepts
    └──→ Quiz
```

*Note the core distinction in RAG: **ChromaDB retrieves** the relevant chunks, while **Mistral generates** the final grounded answer. Timestamps in source citations come directly from chunk metadata — not from the LLM.*

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Application API | [Node.js](https://nodejs.org/) + [Express.js](https://expressjs.com/) (REST + SSE) |
| Frontend | [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + Tailwind CSS |
| Embeddings | [@xenova/transformers](https://huggingface.co/docs/transformers.js) (`all-MiniLM-L6-v2` local) |
| Vector Store | [ChromaDB](https://www.trychroma.com/) (`chromadb` npm) |
| Transcription | `youtube-transcript` npm (Fetches available YouTube captions) |
| LLM | [Mistral AI](https://mistral.ai/) (Configurable via `LLM_MODEL` env var) |

---

## 📂 Project Structure

```
StudyStream/
├── frontend/                    # React SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx              # State orchestrator — SSE, routing, history
│   │   ├── index.css            # Dark theme, glassmorphism utilities, animations
│   │   └── components/
│   │       ├── Header.jsx           # Logo + New Analysis button
│   │       ├── VideoInput.jsx       # URL input + localStorage history
│   │       ├── ProcessingPipeline.jsx # SSE progress dashboard with stage indicators
│   │       ├── SummarySection.jsx   # Title, summary, concept pills, takeaways
│   │       ├── QuizSection.jsx      # Card-based interactive quiz UI
│   │       ├── AITutor.jsx          # RAG chat sidebar + timestamp source cards
│   │       └── PerformanceMetrics.jsx # Collapsible latency tray per query
│   └── tailwind.config.js
├── server/                      # Node.js API
│   ├── src/
│   │   ├── controllers/         # Route logic (video, chat, summary, quiz)
│   │   ├── services/            # Core business logic
│   │   │   ├── transcription.service.js # youtube-transcript
│   │   │   ├── chunking.service.js      # preserve timestamps
│   │   │   ├── embedding.service.js     # Transformers.js
│   │   │   ├── rag.service.js           # Similarity + LLM orchestration
│   │   │   ├── llm.service.js           # Mistral API calls
│   │   │   └── job.service.js           # Background job state
│   │   ├── clients/
│   │   │   └── chroma.client.js         # ChromaDB interface
│   │   ├── routes/              # Express routers
│   │   └── server.js            # Entry point
├── evaluation/                  # RAG accuracy testing
│   ├── evaluate.js
│   └── questions.json
└── README.md
```

---

## 🧠 Important Design Decisions

1. **Node.js-First Architecture**: The application backend is implemented entirely in Node.js. Transformers.js enables local embedding generation within the JavaScript runtime, eliminating the need for a separate Python inference service. ChromaDB runs as a separate local process, but every application-layer concern — transcription, chunking, embedding, RAG orchestration, and LLM calls — lives within a single Node.js service.
2. **Skipping Local Whisper**: For the MVP, the system uses available YouTube captions instead of downloading and transcribing the video locally, significantly reducing processing time and infrastructure requirements.
3. **Preserved Timestamps & Data Isolation**: The chunk text is embedded while its metadata (`videoId`, `startTime`, `endTime`, and `chunkIndex`) is stored alongside the vector in ChromaDB. This ensures retrieval is isolated to the current video and allows the backend to return clickable timestamps directly from metadata, bypassing LLM citation generation.
   ```json
   {
     "videoId": "dQw4w9WgXcQ",
     "chunkIndex": 17,
     "startTime": 742.3,
     "endTime": 768.1
   }
   ```
4. **Asynchronous Jobs & SSE**: Video processing can take time. Instead of blocking the HTTP request, the backend creates a job ID and streams progress back to the React frontend using Server-Sent Events (SSE).
5. **Latency Tracking**: Tracks component-level and end-to-end latency for embedding generation, vector retrieval, and LLM generation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- [ChromaDB running locally](https://docs.trychroma.com/getting-started) (e.g., via Docker: `docker run -p 8000:8000 chromadb/chroma`)
- A [Mistral AI API Key](https://console.mistral.ai/)

### 1. Backend Setup
```bash
cd StudyStream/server
npm install
```
Rename `.env.example` to `.env` and add your keys:
```env
PORT=5000
CHROMA_URL=http://localhost:8000
LLM_API_KEY=your_mistral_api_key
```
Start the server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd StudyStream/frontend
npm install
npm run dev
```
Open the provided `localhost` URL in your browser.

---

## 📊 Evaluation

StudyStream includes a custom evaluation script to measure RAG performance using a ground-truth dataset.

To evaluate retrieval accuracy, run:
```bash
node evaluation/evaluate.js
```

Retrieval evaluation measures whether the expected chunk/information appears in the top-1, top-3, and top-5 retrieved results from ChromaDB based on your ground-truth questions. The evaluation script also reports real retrieval latency (Chroma search + local embedding generation).

---

## 🔮 Limitations & Future Extensions

- **Caption Availability**: Videos without available captions are not currently supported. A future version could fall back to Whisper or a transcription API (e.g. Deepgram) when YouTube captions are unavailable.
  ```
                YouTube
                   │
            ┌──────┴──────┐
            ▼             ▼
       Captions       No captions
            │             │
            │        Transcription API
            │             │
            └──────┬──────┘
                   ▼
              Transcript
  ```
- **Reranking**: Adding a cross-encoder reranking stage after vector retrieval would improve precision for complex or ambiguous queries.

- **Ephemeral Job State**: Job status and processing metadata are maintained in memory. This keeps the MVP lightweight but means state is lost when the server restarts. A persistent store could be introduced for production deployments.

- **Conversation History**: The current RAG pipeline is stateless. A future extension would inject previous conversation turns into the retrieval and generation context for multi-turn dialogues.

- **Hybrid Retrieval**: Combining semantic vector search with keyword/BM25 retrieval would improve recall for queries where exact terminology matters.

- **Evaluation Expansion**: The current evaluation script measures retrieval recall (Top-1/3/5). A fuller evaluation would also measure end-to-end answer quality using an LLM-as-judge approach.

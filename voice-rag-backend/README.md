# Voice RAG Assistant — Python Backend

## File Structure & What Each File Does

```
voice-rag-backend/
│
├── main.py             ← FastAPI app — all API routes live here
├── config.py           ← Reads .env — single source of truth for settings
├── schemas.py          ← Pydantic models for request/response validation
├── ingest.py           ← Run ONCE — loads docs into ChromaDB
├── retrieval.py        ← RAG search — embeds question, queries ChromaDB
├── prompt_builder.py   ← Builds the full LLM prompt (system + context + history)
├── llm_client.py       ← Calls Ollama — all LLM logic in one place
├── session_store.py    ← In-memory conversation history per session
│
├── requirements.txt    ← All Python dependencies (pip install -r requirements.txt)
├── .env                ← Configuration (no API keys needed)
│
└── docs/
    └── sample_faq.txt  ← Demo document — replace with your own PDFs
```

---

## How the Modules Connect

```
POST /chat  (main.py)
     │
     ├── retrieval.py       ← embed question → search ChromaDB → top-k chunks
     ├── session_store.py   ← load conversation history
     ├── prompt_builder.py  ← build: SYSTEM + CONTEXT + HISTORY + question
     ├── llm_client.py      ← call Ollama → generate answer
     └── session_store.py   ← save user + assistant messages
```

---

## Tools & Libraries (All Free)

| Library              | Purpose                                      |
|----------------------|----------------------------------------------|
| fastapi              | Web framework — handles HTTP routes          |
| uvicorn              | ASGI server — runs FastAPI                   |
| pydantic             | Request/response validation                  |
| python-dotenv        | Loads .env configuration                     |
| langchain            | RAG text splitter + chain utilities          |
| langchain-community  | Ollama LLM + OllamaEmbeddings + ChromaDB     |
| langchain-core       | Core LangChain interfaces                    |
| ollama               | Python client for local Ollama server        |
| chromadb             | Local vector database (no cloud account)     |
| pymupdf              | Extracts text from PDF files                 |

---

## Step-by-Step Setup

### 1. Install Ollama

macOS:
```
brew install ollama
```

Windows / Linux → download from https://ollama.com/download

### 2. Pull AI models (one-time download)

```
ollama pull llama3.2:3b        # ~2 GB  LLM for chat
ollama pull nomic-embed-text   # ~274 MB for RAG embeddings
```

### 3. Create a virtual environment

```
cd voice-rag-backend
python -m venv venv

# Mac/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### 4. Install Python packages

```
pip install -r requirements.txt
```

### 5. Add your documents

Place PDF or TXT files into the docs/ folder.
A sample_faq.txt is already included for testing.

### 6. Build the knowledge base (run once)

Start Ollama first:
```
ollama serve
```

Then in your project terminal:
```
python ingest.py
```

Expected output:
```
[INFO] Found 1 document(s):
  ✓  sample_faq.txt  (1 section(s))
[INFO] Split into 14 chunks  (size=500, overlap=50)
[SUCCESS] 14 chunks stored in ChromaDB at './chroma_db'
[DONE] Knowledge base is ready!
```

### 7. Start the backend server

Two terminals are needed:

Terminal 1 — keep running:
```
ollama serve
```

Terminal 2:
```
uvicorn main:app --reload --port 8000
```

### 8. Test it

Open your browser:
- API health:  http://localhost:8000/health
- Swagger UI:  http://localhost:8000/docs

Test the chat endpoint with curl:
```
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the return policy?", "session_id": null}'
```

---

## API Endpoints

| Method | Path                    | Description                            |
|--------|-------------------------|----------------------------------------|
| GET    | /                       | Server status check                    |
| GET    | /health                 | Full status (model, KB, sessions)      |
| POST   | /chat                   | Send message, get RAG-powered reply    |
| DELETE | /session/{session_id}   | Clear conversation history             |
| GET    | /sessions               | List active sessions (admin)           |
| POST   | /reload-kb              | Reload ChromaDB without restart        |

---

## Troubleshooting

| Problem                          | Fix                                              |
|----------------------------------|--------------------------------------------------|
| "Cannot connect to Ollama"       | Run: ollama serve in a separate terminal         |
| "Model not found"                | Run: ollama pull llama3.2:3b                     |
| kb_ready: false in /health       | Run: python ingest.py to build the knowledge base|
| ModuleNotFoundError              | Run: pip install -r requirements.txt             |
| Port 8000 already in use         | Use: uvicorn main:app --port 8001                |
| Very slow responses              | Normal on CPU. llama3.2:3b takes 2-5s per answer |

---

## Changing the LLM Model

Edit .env:
```
LLM_MODEL=llama3.2:3b    # fastest — recommended for voice
LLM_MODEL=mistral:7b     # better quality — needs 8GB RAM
LLM_MODEL=llama3.1:8b    # best quality  — needs 8GB RAM
```

Pull the model first:  ollama pull mistral:7b
Then restart the server or call: POST /reload-kb

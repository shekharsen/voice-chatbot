# Voice RAG Assistant — React Frontend

## File Structure

```
voice-rag-react/
├── package.json                ← dependencies & proxy config
├── public/
│   └── index.html              ← HTML shell (loads fonts, mounts #root)
└── src/
    ├── index.js                ← React entry point
    ├── index.css               ← Global CSS variables & keyframes
    ├── App.jsx                 ← Root component — all state lives here
    ├── api.js                  ← Backend communication (fetch calls)
    ├── hooks/
    │   └── useSpeech.js        ← Web Speech API hook (mic + TTS)
    └── components/
        ├── Header.jsx          ← Top bar with status badge
        ├── Banner.jsx          ← Warning strips (KB missing, no mic)
        ├── ChatArea.jsx        ← Scrollable message list
        ├── MessageBubble.jsx   ← Individual chat bubble + ThinkingBubble
        ├── MicButton.jsx       ← Animated mic / stop button
        └── InputBar.jsx        ← Bottom bar (mic + text input + send)
```

---

## How to Run

### Step 1 — Make sure the backend is running first

Open two terminals:

Terminal 1:
```
ollama serve
```

Terminal 2 (in voice-rag-bot/ folder):
```
uvicorn main:app --reload --port 8000
```

---

### Step 2 — Install React dependencies

```
cd voice-rag-react
npm install
```

This installs: react, react-dom, react-scripts (~300MB, one-time).

---

### Step 3 — Start the React development server

```
npm start
```

React will open http://localhost:3000 automatically in your browser.

The `"proxy": "http://localhost:8000"` line in package.json forwards
all /chat and /health API calls to FastAPI automatically.
No CORS errors. No URL changes needed.

---

### Step 4 — Use it

1. Open http://localhost:3000 in Chrome or Edge
2. Click the glowing mic button
3. Allow microphone when Chrome asks
4. Speak your question
5. The assistant answers from your documents and speaks back

---

## For Client Demos (ngrok)

1. Start ngrok: `ngrok http 8000`
2. Copy your ngrok URL (e.g. https://abc123.ngrok-free.app)
3. Open src/api.js and change:
   ```
   export const BASE_URL = 'https://abc123.ngrok-free.app';
   ```
4. Build for production: `npm run build`
5. Serve the build/ folder or share via any static host

---

## Component Responsibilities

| File | What it does |
|------|-------------|
| App.jsx | Owns all state: messages, session, loading, status |
| api.js | All fetch() calls to FastAPI — one place to change the URL |
| useSpeech.js | Wraps SpeechRecognition and SpeechSynthesis APIs |
| Header.jsx | Shows app name and live backend status (green/red dot) |
| Banner.jsx | Warns if KB not found or browser doesn't support voice |
| ChatArea.jsx | Scrollable list of MessageBubble components |
| MessageBubble.jsx | Single chat bubble with source chips |
| MicButton.jsx | Animated button: idle / listening / speaking states |
| InputBar.jsx | Text input + send + new conversation button |

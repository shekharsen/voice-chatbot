/**
 * api.js
 * ------
 * All communication with the FastAPI backend lives here.
 * The "proxy" field in package.json forwards /api/* to
 * http://localhost:8000 during development automatically,
 * so no CORS issues and no need to hardcode the URL.
 *
 * For client demos via ngrok, change BASE_URL below.
 */

export const BASE_URL = '';   // empty = use package.json proxy (recommended)
// export const BASE_URL = 'https://YOUR-NGROK-URL.ngrok-free.app';  // for demos


/**
 * Check if the FastAPI backend is alive and the KB is ready.
 * Returns: { status, llm_model, kb_ready, ollama_url }
 */
export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: HTTP ${res.status}`);
  return res.json();
}


/**
 * Send a chat message to the backend.
 * @param {string} message     — the user's question
 * @param {string|null} sessionId — existing session ID (null on first message)
 * Returns: { reply, session_id, sources, kb_used }
 */
export async function sendChat(message, sessionId) {
  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!res.ok) {
    // Try to surface the FastAPI error detail
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}


/**
 * Delete session history on the server (called by "New conversation").
 * @param {string} sessionId
 */
export async function clearSession(sessionId) {
  await fetch(`${BASE_URL}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
}

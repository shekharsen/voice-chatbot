"""
schemas.py
----------
All Pydantic models (request bodies and response shapes) for the API.

Keeping schemas in one file means:
  • FastAPI auto-generates accurate OpenAPI / Swagger docs at /docs
  • Request validation is automatic — invalid payloads return 422 before
    any business logic runs
  • Frontend developers have a single reference for the API contract
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Request models ────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """
    Body for POST /chat

    Fields:
        message    : The user's question or message text.
        session_id : UUID from a previous response. Send None on the first
                     message — the server will create a new session and return
                     the ID for subsequent requests.
    """
    message:    str            = Field(..., min_length=1, max_length=2000,
                                       description="User's question or message")
    session_id: Optional[str]  = Field(None,
                                       description="Session UUID from previous response")

    class Config:
        json_schema_extra = {
            "example": {
                "message":    "What is the return policy?",
                "session_id": None,
            }
        }


# ── Response models ───────────────────────────────────────────────────────────

class ChatResponse(BaseModel):
    """
    Response from POST /chat

    Fields:
        reply      : The LLM-generated answer (plain text, ready for TTS).
        session_id : UUID to send back on the next request for conversation memory.
        sources    : List of filenames the answer was retrieved from.
        kb_used    : True if RAG context was found and injected into the prompt.
    """
    reply:      str       = Field(..., description="LLM-generated answer")
    session_id: str       = Field(..., description="Session UUID for follow-up requests")
    sources:    list[str] = Field(default_factory=list,
                                  description="Source document filenames")
    kb_used:    bool      = Field(False, description="Whether RAG context was used")

    class Config:
        json_schema_extra = {
            "example": {
                "reply":      "We offer a 30-day return policy. Items must be in original packaging.",
                "session_id": "3f7a1c22-b4d9-4e8f-a1c2-1234567890ab",
                "sources":    ["sample_faq.txt"],
                "kb_used":    True,
            }
        }


class HealthResponse(BaseModel):
    """
    Response from GET /health

    Used by the React frontend to show the status badge and KB warning.
    """
    status:          str  = Field(..., description="Always 'ok' if server is up")
    llm_model:       str  = Field(..., description="Ollama model name in use")
    embed_model:     str  = Field(..., description="Embedding model name in use")
    kb_ready:        bool = Field(..., description="True if ChromaDB is populated")
    ollama_url:      str  = Field(..., description="Ollama server URL being used")
    active_sessions: int  = Field(..., description="Number of active chat sessions")

    class Config:
        json_schema_extra = {
            "example": {
                "status":          "ok",
                "llm_model":       "llama3.2:3b",
                "embed_model":     "nomic-embed-text",
                "kb_ready":        True,
                "ollama_url":      "http://localhost:11434",
                "active_sessions": 2,
            }
        }


class SessionDeleteResponse(BaseModel):
    """Response from DELETE /session/{session_id}"""
    status:     str = Field(..., description="'cleared' or 'not_found'")
    session_id: str = Field(..., description="The session ID that was targeted")

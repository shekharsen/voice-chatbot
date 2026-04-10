"""
prompt_builder.py
-----------------
Builds the full prompt sent to Ollama on every chat request.

Separating prompt logic into its own module makes it easy to:
  • Tune the system prompt for different client use cases
  • Add few-shot examples without cluttering main.py
  • A/B test different prompt formats

Prompt structure:
  [SYSTEM INSTRUCTIONS]
  [RAG CONTEXT — top-k document chunks]
  [CONVERSATION HISTORY — last N turns]
  User: <question>
  Assistant:
"""

from config import settings


# ── System prompt ─────────────────────────────────────────────────────────────
# Adjust this for your specific client use case.
# Key rules enforced here:
#   1. Answer ONLY from context (prevents hallucination)
#   2. Short answers (2-4 sentences) — this is a voice interface
#   3. Plain sentences — no markdown, bullets, or headers in voice output

SYSTEM_PROMPT = """You are a friendly, knowledgeable voice assistant for a company.

Rules you must follow:
1. Answer using ONLY the provided context below. Do not use outside knowledge.
2. Keep answers SHORT — 2 to 4 plain sentences maximum. This is a voice interface.
3. Never use bullet points, markdown, bold text, headers, or special characters.
4. Speak naturally in full sentences as if talking to a customer on the phone.
5. If the context does not contain the answer, say exactly:
   "I don't have that information right now. Please contact our support team for help."
6. Never guess, estimate, or make up facts, prices, or policies."""


def build_prompt(question: str, context: str, history: list[dict]) -> str:
    """
    Assemble the complete prompt for the Ollama LLM.

    Args:
        question : The user's current message.
        context  : RAG-retrieved document chunks (empty string if KB not ready).
        history  : List of {"role": "user"/"assistant", "content": str} dicts.

    Returns:
        A single string prompt ready to pass to llm.invoke().
    """
    # ── Format conversation history ───────────────────────────────────────
    history_text = _format_history(history)

    # ── Build prompt with or without RAG context ──────────────────────────
    if context:
        return (
            f"{SYSTEM_PROMPT}\n\n"
            f"KNOWLEDGE BASE CONTEXT (answer from this):\n"
            f"{context}\n\n"
            f"CONVERSATION HISTORY:\n"
            f"{history_text}\n\n"
            f"User: {question}\n"
            f"Assistant:"
        )
    else:
        # No KB context — LLM answers from general knowledge with a disclaimer
        return (
            f"{SYSTEM_PROMPT}\n\n"
            f"Note: The knowledge base is not available. "
            f"If you cannot answer accurately, direct the user to contact support.\n\n"
            f"CONVERSATION HISTORY:\n"
            f"{history_text}\n\n"
            f"User: {question}\n"
            f"Assistant:"
        )


def _format_history(history: list[dict]) -> str:
    """
    Convert history list to a readable multi-turn dialogue string.
    Only the last MAX_TURNS * 2 messages are included to stay within
    the LLM's context window.
    """
    if not history:
        return "(No previous conversation)"

    # Trim to last N turns
    max_messages = settings.MAX_TURNS * 2
    recent = history[-max_messages:]

    lines = []
    for msg in recent:
        role    = "User" if msg["role"] == "user" else "Assistant"
        content = msg["content"].strip()
        lines.append(f"{role}: {content}")

    return "\n".join(lines)

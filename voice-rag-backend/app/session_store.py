"""
session_store.py
----------------
Manages per-user conversation history in memory.

Each session is identified by a UUID generated on the first chat request
and returned to the frontend, which sends it back on subsequent requests.
This allows the LLM to remember what was said earlier in the conversation.

Storage: Python dict (in-memory)
  • Fast, zero dependencies, perfect for demos
  • Data is lost when the server restarts (acceptable for a portfolio demo)
  • For production: swap _store with a Redis or Supabase-backed store

Session structure:
  {
    "session-uuid": [
        {"role": "user",      "content": "What is the return policy?"},
        {"role": "assistant", "content": "We offer a 30-day return policy…"},
        ...
    ]
  }
"""

from config import settings

# Module-level dict: session_id → list of message dicts
_store: dict[str, list[dict]] = {}


def get_history(session_id: str) -> list[dict]:
    """
    Return the conversation history for a session.
    Returns an empty list if the session does not exist yet.
    """
    return _store.get(session_id, [])


def append_messages(session_id: str, user_message: str, assistant_reply: str):
    """
    Add a user + assistant message pair to the session history.
    Automatically trims old messages when the history exceeds MAX_TURNS.

    Args:
        session_id      : UUID string identifying the session.
        user_message    : The user's question / input text.
        assistant_reply : The LLM's generated response.
    """
    if session_id not in _store:
        _store[session_id] = []

    _store[session_id].append({"role": "user",      "content": user_message})
    _store[session_id].append({"role": "assistant",  "content": assistant_reply})

    # Keep only the most recent MAX_TURNS pairs to control memory and token usage
    max_messages = settings.MAX_TURNS * 2
    if len(_store[session_id]) > max_messages:
        _store[session_id] = _store[session_id][-max_messages:]


def delete_session(session_id: str) -> bool:
    """
    Remove a session and its entire history.

    Returns:
        True  if the session existed and was deleted.
        False if the session was not found.
    """
    if session_id in _store:
        del _store[session_id]
        return True
    return False


def list_sessions() -> dict:
    """
    Return summary info about all active sessions.
    Used by the /sessions admin endpoint.
    """
    return {
        "active_sessions": len(_store),
        "session_ids": list(_store.keys()),
        "turn_counts": {sid: len(msgs) // 2 for sid, msgs in _store.items()},
    }


def clear_all_sessions():
    """
    Wipe all session data. Useful for testing or admin resets.
    """
    _store.clear()

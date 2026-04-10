"""
llm_client.py
-------------
Wraps the Ollama LLM so all generation logic lives in one place.

Why a separate module?
  • Swapping models (e.g. llama3.2:3b → mistral:7b) requires one line change
  • Centralises error handling for Ollama connectivity issues
  • Easy to add streaming support later without touching main.py

Ollama runs 100% locally — no API key, no internet, no cost.
Make sure Ollama is running before starting the server:
    ollama serve
"""

from config import settings

# Lazy-loaded singleton — created once on first call, reused after
_llm = None


def get_llm():
    """
    Return a LangChain Ollama LLM instance (singleton).
    Parameters are read from config/settings.
    """
    global _llm

    if _llm is None:
        from langchain_community.llms import Ollama

        _llm = Ollama(
            model=settings.LLM_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=settings.LLM_TEMPERATURE,
            num_predict=settings.LLM_MAX_TOKENS,
        )

    return _llm


def generate(prompt: str) -> str:
    """
    Send a prompt to Ollama and return the generated text.

    Args:
        prompt : The fully assembled prompt string from prompt_builder.py.

    Returns:
        The LLM's response as a clean string (leading/trailing whitespace stripped).

    Raises:
        ConnectionError : If Ollama is not running or unreachable.
        RuntimeError    : For any other LLM generation failure.
    """
    try:
        llm    = get_llm()
        result = llm.invoke(prompt)
        return result.strip()

    except Exception as exc:
        error_str = str(exc).lower()

        # Give a helpful error message based on the failure type
        if "connection refused" in error_str or "connect" in error_str:
            raise ConnectionError(
                f"Cannot connect to Ollama at {settings.OLLAMA_BASE_URL}. "
                "Make sure Ollama is running: ollama serve"
            )
        elif "model" in error_str and "not found" in error_str:
            raise RuntimeError(
                f"Model '{settings.LLM_MODEL}' not found in Ollama. "
                f"Pull it first: ollama pull {settings.LLM_MODEL}"
            )
        else:
            raise RuntimeError(f"LLM generation failed: {exc}")


def reset_llm():
    """
    Force re-creation of the LLM instance on next call.
    Useful if the model name in settings is changed at runtime.
    """
    global _llm
    _llm = None

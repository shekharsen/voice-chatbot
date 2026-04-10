"""
ingest.py
---------
One-time script that builds the RAG knowledge base.

What it does:
  1. Loads all PDF / TXT / MD files from the docs/ folder
  2. Splits them into overlapping 500-character chunks
  3. Embeds each chunk using nomic-embed-text (via Ollama — free)
  4. Stores embeddings in a local ChromaDB vector database

Run this ONCE before starting the server.
Re-run whenever you add or update documents.

Prerequisites:
  • Ollama running:          ollama serve
  • Embedding model pulled:  ollama pull nomic-embed-text

Usage:
  python ingest.py
"""

import sys
import shutil
from pathlib import Path
from config import settings


# ── Document loading ──────────────────────────────────────────────────────────

def load_documents() -> list:
    """
    Scan docs/ for supported files (.pdf, .txt, .md) and load them.
    Attaches the source filename to every document's metadata so
    the UI can show which file an answer came from.
    """
    from langchain_community.document_loaders import PyMuPDFLoader, TextLoader

    docs_path = Path(settings.DOCS_DIR)

    # Create folder with a sample if it doesn't exist
    if not docs_path.exists():
        print(f"[WARN] '{settings.DOCS_DIR}' folder not found — creating it.")
        docs_path.mkdir(parents=True, exist_ok=True)
        print(f"[INFO] Add your PDF/TXT files to '{settings.DOCS_DIR}' and re-run.")
        sys.exit(0)

    supported_extensions = {".pdf", ".txt", ".md"}
    all_files = [
        f for f in docs_path.rglob("*")
        if f.is_file() and f.suffix.lower() in supported_extensions
    ]

    if not all_files:
        print(f"[ERROR] No PDF/TXT/MD files found in '{settings.DOCS_DIR}'.")
        print("[INFO]  Add documents and re-run ingest.py.")
        sys.exit(1)

    print(f"[INFO] Found {len(all_files)} document(s):")
    documents = []

    for file_path in all_files:
        try:
            if file_path.suffix.lower() == ".pdf":
                loader = PyMuPDFLoader(str(file_path))
            else:
                loader = TextLoader(str(file_path), encoding="utf-8")

            loaded_pages = loader.load()

            # Tag every page/chunk with its source filename
            for doc in loaded_pages:
                doc.metadata["source"] = file_path.name

            documents.extend(loaded_pages)
            print(f"  ✓  {file_path.name}  ({len(loaded_pages)} section(s))")

        except Exception as exc:
            print(f"  ✗  {file_path.name}: {exc}")

    print(f"\n[INFO] Total sections loaded: {len(documents)}")
    return documents


# ── Text splitting ────────────────────────────────────────────────────────────

def split_documents(documents: list) -> list:
    """
    Split documents into overlapping chunks.

    chunk_size=500 chars   → small enough for precise retrieval
    chunk_overlap=50 chars → prevents answers being cut at boundaries

    The splitter tries to break on paragraphs first, then sentences,
    then words — never in the middle of a word.
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(documents)
    print(f"[INFO] Split into {len(chunks)} chunks  (size=500, overlap=50)")
    return chunks


# ── Embedding + ChromaDB storage ──────────────────────────────────────────────

def embed_and_store(chunks: list):
    """
    Embed every chunk using nomic-embed-text (via Ollama — free, local)
    and persist the vectors in ChromaDB on disk.

    Wipes the old ChromaDB first so re-running ingest always gives
    a clean, consistent knowledge base.
    """
    from langchain_community.vectorstores import Chroma
    from langchain_community.embeddings import OllamaEmbeddings

    # Clear old database so re-ingestion is always clean
    chroma_path = Path(settings.CHROMA_DIR)
    if chroma_path.exists():
        shutil.rmtree(chroma_path)
        print(f"[INFO] Cleared old ChromaDB at '{settings.CHROMA_DIR}'")

    print(f"[INFO] Loading embedding model '{settings.EMBED_MODEL}' via Ollama…")
    embeddings = OllamaEmbeddings(
        model=settings.EMBED_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
    )

    print("[INFO] Embedding chunks and writing to ChromaDB…")
    print("       (First run: ~0.5s per chunk — be patient)")

    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=settings.CHROMA_DIR,
        collection_name="voice_rag",
    )

    stored = vectordb._collection.count()
    print(f"\n[SUCCESS] {stored} chunks stored in ChromaDB at '{settings.CHROMA_DIR}'")
    return vectordb


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    print("=" * 55)
    print("  Voice RAG Bot — Document Ingestion")
    print(f"  Model  : {settings.EMBED_MODEL}")
    print(f"  Docs   : {settings.DOCS_DIR}")
    print(f"  Output : {settings.CHROMA_DIR}")
    print("=" * 55)

    documents = load_documents()
    chunks    = split_documents(documents)
    embed_and_store(chunks)

    print("\n[DONE] Knowledge base is ready!")
    print("       Next step: uvicorn main:app --reload --port 8000\n")


if __name__ == "__main__":
    main()

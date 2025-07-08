import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ["TRANSFORMERS_OFFLINE"] = "1"
import warnings
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

import sys
import json
import numpy as np
import re
import io
import contextlib
from sentence_transformers import SentenceTransformer

MODEL = None

def get_model():
    """Load SentenceTransformer only once"""
    global MODEL
    if MODEL is None:
        with contextlib.redirect_stderr(io.StringIO()):
            MODEL = SentenceTransformer(r"local_models/models--sentence-transformers--all-MiniLM-L6-v2/snapshots/c9745ed1d9f207416be6d2e6f8de32d1f16199bf")
    return MODEL

def embed_chunks(chunks_path, embeddings_path):
    """Embed chunk['content'] and save as .npy"""
    try:
        with open(chunks_path, 'r', encoding='utf-8') as f:
            chunks = [json.loads(line) for line in f if line.strip()]

        if not chunks:
            print(json.dumps({"error": "No valid chunks to embed."}))
            sys.exit(1)

        contents = [chunk['content'] for chunk in chunks]

        model = get_model()
        embeddings = model.encode(contents, show_progress_bar=False)

        np.save(embeddings_path, embeddings)
        print(json.dumps({"message": f"Saved {len(embeddings)} embeddings to: {embeddings_path}"}))

    except Exception as e:
        print(json.dumps({"error": f"Error in embed_chunks: {e}"}))
        sys.exit(1)

def find_best_answer(question, chunks_path, embeddings_path, top_k=3, min_score=0.25):
    """Search for the top-k most similar chunks"""
    try:
        with open(chunks_path, 'r', encoding='utf-8') as f:
            chunks = [json.loads(line) for line in f if line.strip()]

        if not chunks:
            print(json.dumps({"error": "No chunks found in file."}))
            return

        embeddings = np.load(embeddings_path)
        if len(embeddings) != len(chunks):
            print(json.dumps({"error": "Embedding count mismatch."}))
            return

        model = get_model()
        question_embedding = model.encode([question], show_progress_bar=False)

        similarities = np.dot(embeddings, question_embedding.T) / (
            np.linalg.norm(embeddings, axis=1, keepdims=True) * np.linalg.norm(question_embedding)
        )
        similarities = similarities.flatten()

        # Get top-k chunks by similarity
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        top_scores = similarities[top_indices]

        if np.max(top_scores) < min_score:
            print(json.dumps({"message": "No confident match found for your question."}))
            return

        top_chunks = [chunks[i] for i in top_indices]
        scored_results = []
        for i, chunk in zip(top_indices, top_chunks):
            scored_results.append({
                "section_title": chunk.get("section_title", "Unknown Section"),
                "page": chunk.get("page", "?"),
                "content": chunk["content"],
                "score": float(top_scores[list(top_indices).index(i)])
            })

        print(json.dumps(scored_results, ensure_ascii=False, indent=2))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

# ==== Entry Point ====
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python rag_handler.py <embed|answer> [args...]"}))
        sys.exit(1)

    mode = sys.argv[1]

    if mode == "embed":
        if len(sys.argv) != 4:
            print(json.dumps({"error": "Usage: python rag_handler.py embed <chunks_jsonl> <output_embeddings.npy>"}))
            sys.exit(1)
        embed_chunks(sys.argv[2], sys.argv[3])

    elif mode == "answer":
        if len(sys.argv) != 5:
            print(json.dumps({"error": "Usage: python rag_handler.py answer <chunks_jsonl> <embeddings.npy> \"<question>\""}))
            sys.exit(1)
        find_best_answer(sys.argv[4], sys.argv[2], sys.argv[3])

    else:
        print(json.dumps({"error": f"Unknown mode: {mode}"}))
        sys.exit(1)

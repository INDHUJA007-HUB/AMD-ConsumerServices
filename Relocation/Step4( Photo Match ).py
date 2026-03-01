import numpy as np
import json
import os
from PIL import Image
from sentence_transformers import SentenceTransformer
from typing import List, Tuple, Dict
import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model = SentenceTransformer("clip-ViT-B-32", device=DEVICE)
SIGNATURE_DIR = "neighborhood_signatures"


def load_signatures(signature_dir: str) -> Dict[str, np.ndarray]:
    """Load all stored neighborhood signatures from disk."""
    signatures = {}
    for fname in os.listdir(signature_dir):
        if fname.endswith(".npy"):
            name = fname.replace("_", " ").replace(".npy", "")
            signatures[name] = np.load(os.path.join(signature_dir, fname))
    return signatures


def encode_user_image(image_path: str) -> np.ndarray:
    """Encode a user's uploaded image into a normalized CLIP vector."""
    img = Image.open(image_path).convert("RGB")
    with torch.no_grad():
        embedding = model.encode(
            img,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
    return embedding


def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    """
    Cosine similarity between two L2-normalized vectors.
    Since both are unit vectors, this equals their dot product.
    Range: [-1, 1]. Higher = more similar vibe.
    """
    return float(np.dot(vec_a, vec_b))


def match_neighborhood(
    user_image_path: str,
    signatures: Dict[str, np.ndarray],
    top_k: int = 3,
) -> List[Tuple[str, float, str]]:
    """
    Match a user photo to the top-k most similar neighborhoods.
    
    Returns a ranked list of (neighborhood_name, similarity_score, verdict).
    """
    user_vector = encode_user_image(user_image_path)

    results = []
    for name, signature in signatures.items():
        score = cosine_similarity(user_vector, signature)
        results.append((name, score))

    results.sort(key=lambda x: x[1], reverse=True)

    # Interpret the score into a human-readable confidence label
    def score_label(score: float) -> str:
        if score > 0.85:   return "Excellent match 🎯"
        elif score > 0.75: return "Strong match ✅"
        elif score > 0.60: return "Moderate match 🔶"
        else:              return "Weak match ❌"

    ranked = [(name, round(score, 4), score_label(score)) for name, score in results[:top_k]]
    return ranked


def run_match(user_image_path: str):
    print(f"\n{'='*50}")
    print(f"Matching: {user_image_path}")
    print(f"{'='*50}")

    signatures = load_signatures(SIGNATURE_DIR)
    matches = match_neighborhood(user_image_path, signatures, top_k=len(signatures))

    print(f"\n{'Rank':<6} {'Neighborhood':<20} {'Score':<10} {'Result'}")
    print("-" * 55)
    for rank, (name, score, label) in enumerate(matches, 1):
        print(f"#{rank:<5} {name:<20} {score:<10} {label}")

    best_match = matches[0]
    print(f"\n✅ Best Vibe Match: {best_match[0]} (score: {best_match[1]})")
    return best_match


# Example usage:
# result = run_match("path/to/user_uploaded_photo.jpg")
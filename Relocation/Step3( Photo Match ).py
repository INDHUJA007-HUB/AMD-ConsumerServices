import numpy as np
import json
import os
from typing import Dict
from sklearn.preprocessing import normalize

SIGNATURE_DIR = "neighborhood_signatures"
os.makedirs(SIGNATURE_DIR, exist_ok=True)


def compute_signature(embeddings: np.ndarray, method: str = "mean") -> np.ndarray:
    """
    Compute a single representative vector for a neighborhood.
    
    Methods:
      - 'mean'   : Simple average (fast, good baseline)
      - 'trimmed': Robust mean — removes top/bottom 10% outliers (recommended)
    """
    if embeddings.shape[0] == 0:
        raise ValueError("No embeddings provided.")

    if method == "trimmed":
        # Remove 10% outlier vectors by distance from the raw mean
        raw_mean = np.mean(embeddings, axis=0)
        distances = np.linalg.norm(embeddings - raw_mean, axis=1)
        threshold = np.percentile(distances, 90)
        filtered = embeddings[distances <= threshold]
        logger.info(f"  Trimmed {len(embeddings) - len(filtered)} outlier images")
        embeddings = filtered

    centroid = np.mean(embeddings, axis=0)

    # Re-normalize the centroid to unit sphere for accurate cosine similarity
    centroid = centroid / (np.linalg.norm(centroid) + 1e-8)
    return centroid


def save_signatures(signatures: Dict[str, np.ndarray], metadata: Dict):
    """Persist signatures to disk as JSON (portable) and .npy (fast)."""
    output = {}
    for name, vector in signatures.items():
        np.save(os.path.join(SIGNATURE_DIR, f"{name.replace(' ', '_')}.npy"), vector)
        output[name] = {
            "signature": vector.tolist(),
            "image_count": metadata[name]["valid_count"],
            "dimensions": vector.shape[0],
        }

    with open(os.path.join(SIGNATURE_DIR, "signatures.json"), "w") as f:
        json.dump(output, f, indent=2)
    logger.info(f"Signatures saved to '{SIGNATURE_DIR}/'")


# Compute and save signatures
signatures = {}
for name, data in neighborhood_embeddings.items():
    embeddings = data["embeddings"]
    logger.info(f"\nComputing signature for: {name}")
    signature = compute_signature(embeddings, method="trimmed")
    signatures[name] = signature
    logger.info(f"  Signature shape: {signature.shape}, norm: {np.linalg.norm(signature):.4f}")

save_signatures(signatures, neighborhood_embeddings)
print("\nAll neighborhood signatures saved.")
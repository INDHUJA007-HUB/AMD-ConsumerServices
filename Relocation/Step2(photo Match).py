import torch
import numpy as np
from PIL import Image
import requests
from io import BytesIO
from sentence_transformers import SentenceTransformer
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load CLIP — uses GPU automatically if available
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
model = SentenceTransformer("clip-ViT-B-32", device=DEVICE)
logger.info(f"CLIP model loaded on: {DEVICE}")


def fetch_image(url: str, timeout: int = 10) -> Optional[Image.Image]:
    """Download and decode a single image. Returns None on failure."""
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content)).convert("RGB")
        return img
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {e}")
        return None


def download_images_parallel(urls: List[str], max_workers: int = 10) -> List[Optional[Image.Image]]:
    """Download multiple images in parallel using threads."""
    images = [None] * len(urls)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_idx = {executor.submit(fetch_image, url): i for i, url in enumerate(urls)}
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            images[idx] = future.result()
    return images


def encode_images_batched(images: List[Image.Image], batch_size: int = 32) -> np.ndarray:
    """
    Encode a list of PIL images into CLIP vectors in batches.
    Returns an array of shape (N, 512).
    """
    valid_images = [img for img in images if img is not None]
    if not valid_images:
        return np.array([])

    all_embeddings = []
    for i in range(0, len(valid_images), batch_size):
        batch = valid_images[i:i + batch_size]
        with torch.no_grad():
            embeddings = model.encode(
                batch,
                batch_size=batch_size,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=True,  # L2-normalize for cosine sim via dot product
            )
        all_embeddings.append(embeddings)
        logger.info(f"  Encoded batch {i // batch_size + 1} / {len(valid_images) // batch_size + 1}")

    return np.vstack(all_embeddings)


# Generate embeddings for all neighborhoods
neighborhood_embeddings = {}
for name, image_records in all_neighborhood_images.items():
    logger.info(f"\nProcessing: {name} ({len(image_records)} images)")
    
    urls = [r["url"] for r in image_records]
    images = download_images_parallel(urls, max_workers=12)
    embeddings = encode_images_batched(images, batch_size=32)

    neighborhood_embeddings[name] = {
        "embeddings": embeddings,          # shape: (N, 512)
        "image_records": image_records,
        "valid_count": len(embeddings),
    }
    logger.info(f"  → {len(embeddings)} valid embeddings generated")
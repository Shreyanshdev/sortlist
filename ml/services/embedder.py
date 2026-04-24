from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List
import os

model_name = os.getenv('EMBEDDER_MODEL', 'all-MiniLM-L6-v2')

class Embedder:
    def __init__(self):
        self.model = SentenceTransformer(model_name)

    def embed(self, text: str) -> np.ndarray:
        return self.model.encode(text)

    def embed_batch(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(texts)

embedder = Embedder()

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from services.embedder import embedder

router = APIRouter()

class EmbedRequest(BaseModel):
    texts: List[str]

@router.post("/batch")
def embed_batch(req: EmbedRequest):
    # This just warms up the cache/embedder
    embedder.embed_batch(req.texts)
    return {"status": "success"}

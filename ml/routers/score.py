from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from services.scorer import scorer
from services.parser import parser
import base64
import traceback

router = APIRouter()

class ParseRequest(BaseModel):
    file_base64: str
    file_type: str

@router.post("/parse")
def parse_resume(req: ParseRequest):
    """Parse a resume from base64-encoded file bytes."""
    try:
        file_bytes = base64.b64decode(req.file_base64)
        print(f"[Parse] Received {len(file_bytes)} bytes, type={req.file_type}")
        
        result = parser.parse(file_bytes, req.file_type)
        print(f"[Parse] Success: {len(result.get('sentences', []))} sentences extracted")
        return result
    except Exception as e:
        print(f"[Parse] Failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Parse error: {str(e)}")

class ScoreRequest(BaseModel):
    s3Key: Optional[str] = None
    parsedSections: Dict[str, str]
    sentences: List[str]
    criteria: List[Dict]
    githubScore: Optional[float] = None
    leetcodeScore: Optional[float] = None

@router.post("/score")
def score_resume(req: ScoreRequest):
    try:
        return scorer.score(req.parsedSections, req.sentences, req.criteria, req.githubScore, req.leetcodeScore)
    except Exception as e:
        print(f"[Score] Failed: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Score error: {str(e)}")

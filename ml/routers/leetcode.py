from fastapi import APIRouter
from pydantic import BaseModel
from services.leetcode_analyzer import leetcode_analyzer

router = APIRouter()

class LeetCodeRequest(BaseModel):
    url: str

@router.post("/analyze")
async def analyze_leetcode(req: LeetCodeRequest):
    return await leetcode_analyzer.analyze(req.url)

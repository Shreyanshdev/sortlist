from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
from services.github_analyzer import github_analyzer

router = APIRouter()

class GitHubRequest(BaseModel):
    url: str
    criteria: List[Dict]

@router.post("/analyze")
async def analyze_github(req: GitHubRequest):
    return await github_analyzer.analyze(req.url, req.criteria)

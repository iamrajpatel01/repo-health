from fastapi import APIRouter
from typing import Dict, Any
from app.services.diff import get_diff_data
from app.schemas import DiffResponse

router = APIRouter()

@router.get("/diff/{commit_hash}", response_model=DiffResponse)
def get_diff(commit_hash: str):
    """
    Get architectural diff analysis for a specific commit hash.
    Includes risk scoring, diff excerpts, and AI-generated explanations.
    """
    return get_diff_data(commit_hash)

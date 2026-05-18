from fastapi import APIRouter
from app.services.graph import get_graph_data
from app.schemas import GraphResponse

router = APIRouter()

@router.get("/graph/{commit_hash}", response_model=GraphResponse)
def get_graph(commit_hash: str):
    """
    Get repository graph data for a specific commit hash.
    Compatible with React Flow.
    """
    return get_graph_data(commit_hash)

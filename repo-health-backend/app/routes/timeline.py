from fastapi import APIRouter
from app.services.timeline import get_timeline_data
from app.schemas import TimelineResponse

router = APIRouter()

@router.get("/timeline", response_model=TimelineResponse)
def get_timeline():
    """
    Get timeline events.
    """
    return get_timeline_data()

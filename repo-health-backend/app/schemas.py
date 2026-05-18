from pydantic import BaseModel
from typing import List, Optional

# --- Timeline Schemas ---

class TimelineEvent(BaseModel):
    id: int
    type: str
    description: str
    timestamp: str
    health_score: float
    anomaly: bool
    severity: str
    volatility_score: float
    risk_score: Optional[float] = None
    anomaly_reason: Optional[str] = None

class TimelineResponse(BaseModel):
    timeline: List[TimelineEvent]

# --- Graph Schemas ---

class GraphNodePosition(BaseModel):
    x: float
    y: float

class GraphNodeData(BaseModel):
    label: str
    risk: float
    hotspot_rank: Optional[int] = None
    dependency_risk: Optional[str] = None

class GraphNode(BaseModel):
    id: str
    risk: float
    complexity: int
    churn: int
    position: GraphNodePosition
    data: GraphNodeData
    hotspot_rank: Optional[int] = None
    dependency_risk: Optional[str] = None

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: str

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# --- Diff Schemas ---

class DiffResponse(BaseModel):
    commit: str
    health_drop: float
    files_changed: int
    toxic_dependency: bool
    diff_excerpt: List[str]
    llm_explanation: str
    risk_score: Optional[float] = None

# --- Premerge Schemas ---

class PremergeRequest(BaseModel):
    diff_text: str

class PremergeResponse(BaseModel):
    risk_score: float
    anomaly_warning: bool
    architectural_warning: str
    dependency_risk: str
    suggested_action: str

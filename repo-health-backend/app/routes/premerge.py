from fastapi import APIRouter
from app.schemas import PremergeRequest, PremergeResponse
from app.services.llm_service import explain_diff
from app.utils.metrics import calculate_health_score, calculate_dependency_risk

router = APIRouter()

@router.post("/premerge", response_model=PremergeResponse)
def analyze_premerge(request: PremergeRequest):
    """
    Analyzes a git diff before merging, returning architectural risk and warnings.
    """
    if not request.diff_text or not request.diff_text.strip():
        return PremergeResponse(
            risk_score=0.0,
            anomaly_warning=False,
            architectural_warning="No structural changes detected.",
            dependency_risk="low",
            suggested_action="None required. Safe to merge."
        )

    # Truncate diff text to avoid massive token usage
    safe_diff = request.diff_text[:1000]
    
    # Reuse LLM explanation for architectural warning
    architectural_warning = explain_diff(safe_diff)
    
    # Calculate deterministic metrics based on the diff content
    # Health score is 0-100 (100 is good). So risk is 100 - health.
    health_score = calculate_health_score(safe_diff)
    risk_score = 100.0 - health_score
    
    # Determine dependency risk dynamically based on diff content
    has_dependency = "import" in safe_diff or "require" in safe_diff or "from " in safe_diff
    dependency_risk = calculate_dependency_risk(10 if has_dependency else 0, 2 if has_dependency else 0)
    
    # Trigger anomaly if risk is abnormally high
    anomaly_warning = risk_score > 20.0
    
    # Provide a suggested action
    lower_warning = architectural_warning.lower()
    if "service" in lower_warning and "db" in lower_warning:
        suggested_action = "Move DB access into service layer."
    elif "circular" in lower_warning:
        suggested_action = "Break circular dependency by extracting shared interfaces."
    elif anomaly_warning:
        suggested_action = "Refactor newly introduced dependencies and decouple layers."
    else:
        suggested_action = "Review structural changes. Safe to merge."
        
    return PremergeResponse(
        risk_score=round(risk_score, 2),
        anomaly_warning=anomaly_warning,
        architectural_warning=architectural_warning,
        dependency_risk=dependency_risk,
        suggested_action=suggested_action
    )

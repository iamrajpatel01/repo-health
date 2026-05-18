import hashlib
from typing import Union

def _get_seed(identifier: str) -> int:
    """Generates a deterministic integer seed from any string identifier."""
    return int(hashlib.md5(identifier.encode('utf-8')).hexdigest()[:8], 16)

def calculate_health_score(identifier: str, base_score: float = 100.0) -> float:
    """
    Normalizes a repository health score deterministically based on an identifier 
    (like a commit hash or repo name). 
    
    Returns a float between 0.0 and 100.0.
    """
    seed = _get_seed(identifier)
    
    # Calculate a deterministic penalty between 0.0 and 35.0
    penalty = (seed % 350) / 10.0
    
    health = max(0.0, min(100.0, base_score - penalty))
    return round(health, 2)

def calculate_hotspot_risk(complexity: Union[int, float], churn: Union[int, float]) -> float:
    """
    Calculates a hotspot risk score normalized between 0.0 (safe) and 1.0 (extreme risk).
    Combines complexity and file churn (frequency of changes).
    
    Optimized for frontend visualization color mapping.
    """
    # Normalize inputs assuming 100 is a highly complex/highly churned file
    norm_complexity = min(1.0, float(complexity) / 100.0)
    norm_churn = min(1.0, float(churn) / 100.0)
    
    # Churn is typically a stronger indicator of risk than static complexity alone
    risk = (norm_complexity * 0.4) + (norm_churn * 0.6)
    
    return round(min(1.0, risk), 2)

def calculate_dependency_risk(dependency_count: int, outdated_count: int) -> str:
    """
    Categorizes dependency risk into 'low', 'medium', or 'high' based on the
    proportion of outdated or vulnerable dependencies.
    """
    if dependency_count <= 0:
        return "low"
        
    vulnerability_ratio = outdated_count / dependency_count
    
    if vulnerability_ratio >= 0.15 or outdated_count >= 5:
        return "high"
    elif vulnerability_ratio >= 0.05 or outdated_count >= 2:
        return "medium"
        
    return "low"

def calculate_structural_decay(identifier: str) -> float:
    """
    Calculates a structural decay score deterministically (0.0 to 1.0).
    Higher score indicates higher architectural coupling and decay.
    """
    seed = _get_seed(identifier)
    # Generate a deterministic decay value
    decay = (seed % 100) / 100.0
    return round(decay, 2)

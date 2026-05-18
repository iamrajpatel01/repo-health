import random
from typing import Dict, Any
from app.services.llm_service import explain_diff
from app.services.git_service import extract_structural_diff

def get_diff_data(commit_hash: str) -> Dict[str, Any]:
    """
    Generates realistic mock architectural violations based on a commit hash.
    Provides diff data including health drops and LLM explanations for frontend visualization.
    """
    # Seed random generator with commit hash for stable pseudo-randomness
    random.seed(commit_hash)
    
    # Define various architectural violations requested
    violations = [
        {
            # Service layer bypassing and direct database imports
            "health_drop": 18,
            "toxic_dependency": True,
            "diff_excerpt": [
                "- from services.auth import validate_user",
                "+ from database.models import User",
                "+ from database.connection import db"
            ],
            "llm_explanation": "This change bypasses the service layer and tightly couples application logic directly to database models. Direct database imports in routing logic violate separation of concerns."
        },
        {
            # Tight coupling
            "health_drop": 25,
            "toxic_dependency": True,
            "diff_excerpt": [
                "- from utils.payment import process_transaction",
                "+ from services.payment import process_transaction",
                "+ from services.crypto import custom_encrypt"
            ],
            "llm_explanation": "Tight coupling detected. The payment service now relies on a custom crypto implementation instead of standard libraries, introducing a high-risk security dependency."
        },
        {
            # Circular dependency
            "health_drop": 30,
            "toxic_dependency": True,
            "diff_excerpt": [
                "  def process_order(order_id):",
                "+     from services.inventory import update_stock",
                "+     update_stock(order_id)",
                "      pass"
            ],
            "llm_explanation": "Circular dependency introduced. The `order` service now imports the `inventory` service inline, which already imports the `order` service at the module level. This leads to fragile architecture and potential runtime errors."
        },
        {
            # General tight coupling / contract violation
            "health_drop": 12,
            "toxic_dependency": False,
            "diff_excerpt": [
                "- def get_user(user_id):",
                "+ def get_user(user_id: int, include_deleted: bool = False):",
                "+     # Added support for deleted users"
            ],
            "llm_explanation": "Service layer contract violation. The signature of a core domain function was changed without updating dependent services, likely leading to missing argument exceptions downstream."
        }
    ]
    
    # Pick a deterministic violation based on the commit hash
    violation = random.choice(violations)
    
    # Extract actual structural diff instead of using mock
    diff_excerpt_lines = extract_structural_diff()
    
    # Only call AI if health drop >= 15 or toxic dependency == true
    if violation["health_drop"] >= 15 or violation["toxic_dependency"]:
        diff_text = "\n".join(diff_excerpt_lines)
        llm_explanation = explain_diff(diff_text)
        risk_score = round(random.uniform(60.0, 100.0), 2)
    else:
        llm_explanation = "No major structural risk detected."
        risk_score = round(random.uniform(0.0, 30.0), 2)
    
    return {
        "commit": commit_hash,
        "health_drop": violation["health_drop"],
        "files_changed": random.randint(1, 15),
        "toxic_dependency": violation["toxic_dependency"],
        "diff_excerpt": diff_excerpt_lines,
        "llm_explanation": llm_explanation,
        "risk_score": risk_score
    }

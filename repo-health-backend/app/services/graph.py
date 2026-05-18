import random

def get_graph_data(commit_hash: str):
    """
    Generates realistic repository graph data for a specific commit.
    Optimized for React Flow compatibility.
    """
    # Seed random generator with commit hash for stable results per commit
    random.seed(commit_hash)
    
    # Define realistic nodes with risk, complexity, and churn
    raw_nodes = [
        # Healthy dependency example (core logic)
        {"id": "auth.py", "risk": 0.15, "complexity": 12, "churn": 25},
        {"id": "db.py", "risk": 0.05, "complexity": 8, "churn": 10},
        {"id": "models/user.py", "risk": 0.10, "complexity": 5, "churn": 15},
        {"id": "services/user.py", "risk": 0.20, "complexity": 18, "churn": 30},
        {"id": "routes/api.py", "risk": 0.25, "complexity": 22, "churn": 45},
        
        # Toxic dependency example (high risk, high complexity, circular)
        {"id": "crypto.py", "risk": 0.95, "complexity": 65, "churn": 12},
        {"id": "legacy_auth.py", "risk": 0.88, "complexity": 80, "churn": 5},
        {"id": "payment.py", "risk": 0.82, "complexity": 55, "churn": 44},
        
        # Utility
        {"id": "utils.py", "risk": 0.12, "complexity": 15, "churn": 60},
    ]
    
    # Process nodes for React Flow compatibility
    nodes = []
    for i, node in enumerate(raw_nodes):
        # Adding some jitter to make it look dynamic based on commit hash
        risk = min(1.0, max(0.01, node["risk"] * random.uniform(0.9, 1.1)))
        
        # Build node structure matching user requirements + React Flow needs
        hotspot_rank = i + 1 if risk > 0.5 else None
        dependency_risk = "high" if risk > 0.8 else "medium" if risk > 0.4 else "low"
        
        nodes.append({
            "id": node["id"],
            "risk": round(risk, 2),
            "complexity": int(node["complexity"] * random.uniform(0.9, 1.1)),
            "churn": int(node["churn"] * random.uniform(0.9, 1.1)),
            
            # React Flow specific fields (optional layouting, label data)
            "position": {"x": 0.0, "y": 0.0},  # Frontend should use a layout engine like Dagre
            "data": {
                "label": node["id"],
                "risk": round(risk, 2),
                "hotspot_rank": hotspot_rank,
                "dependency_risk": dependency_risk
            },
            "hotspot_rank": hotspot_rank,
            "dependency_risk": dependency_risk
        })
        
    raw_edges = [
        # Healthy edges
        {"source": "auth.py", "target": "db.py"},
        {"source": "services/user.py", "target": "models/user.py"},
        {"source": "services/user.py", "target": "db.py"},
        {"source": "routes/api.py", "target": "services/user.py"},
        {"source": "routes/api.py", "target": "auth.py"},
        {"source": "utils.py", "target": "db.py"},
        
        # Toxic edges (e.g. payment tightly coupled to legacy auth and custom crypto)
        {"source": "payment.py", "target": "legacy_auth.py"},
        {"source": "payment.py", "target": "crypto.py"},
        {"source": "legacy_auth.py", "target": "db.py"},
        
        # Circular dependency (Toxic)
        {"source": "crypto.py", "target": "payment.py"},
    ]
    
    edges = []
    for edge in raw_edges:
        edges.append({
            "id": f"e-{edge['source']}-{edge['target']}",
            "source": edge["source"],
            "target": edge["target"],
            "type": "import" # Custom edge type for React Flow
        })
        
    return {
        "nodes": nodes,
        "edges": edges
    }

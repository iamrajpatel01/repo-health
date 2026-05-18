import datetime
import random
from app.services.anomaly_service import detect_anomaly

def get_timeline_data():
    """
    Generates mock timeline data for risk events with realistic volatility spikes
    and automatic anomaly detection.
    """
    events = []
    base_date = datetime.datetime.now() - datetime.timedelta(days=30)
    
    event_types = ["vulnerability_found", "secret_leaked", "permission_changed", "dependency_updated", "architectural_degradation"]
    
    # Generate a realistic time series of health scores for 30 days
    health_scores = []
    current_health = 95.0
    
    for i in range(30):
        # 10% chance of a major spike/drop, otherwise stable with minor jitter
        if random.random() < 0.1:
            current_health -= random.uniform(15, 30) # Sudden degradation
        else:
            current_health += random.uniform(-2, 4) # Jitter and slow recovery
            
        # Bound the score
        current_health = max(10.0, min(100.0, current_health))
        health_scores.append(current_health)
        
        event_date = base_date + datetime.timedelta(days=i)
        
        # Detect anomaly using historical data up to this point
        # We need at least 3 points for meaningful anomaly detection
        anomaly_result = {"is_anomaly": False, "severity": "low", "volatility_score": 0.0}
        if len(health_scores) >= 3:
            anomaly_result = detect_anomaly(health_scores.copy())
            
        # Force specific event types based on anomaly detection
        if anomaly_result["is_anomaly"]:
            event_type = random.choice(["vulnerability_found", "secret_leaked", "architectural_degradation"])
            risk_score = round(random.uniform(70.0, 100.0), 2)
            anomaly_reason = f"High volatility detected due to sudden {event_type.replace('_', ' ')}."
        else:
            event_type = random.choice(event_types)
            risk_score = round(random.uniform(0.0, 30.0), 2)
            anomaly_reason = None
            
        events.append({
            "id": i + 1,
            "type": event_type,
            "description": f"Commit activity resulted in {event_type.replace('_', ' ')}",
            "timestamp": event_date.isoformat(),
            "health_score": round(current_health, 2),
            "anomaly": anomaly_result["is_anomaly"],
            "severity": anomaly_result["severity"],
            "volatility_score": anomaly_result["volatility_score"],
            "risk_score": risk_score,
            "anomaly_reason": anomaly_reason
        })
        
    # Sort events by timestamp ascending for Recharts frontend visualization
    events.sort(key=lambda x: x["timestamp"])
    return {"timeline": events}

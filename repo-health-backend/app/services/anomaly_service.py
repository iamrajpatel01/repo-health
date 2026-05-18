import numpy as np
import logging
from typing import List, Dict, Union

def detect_anomaly(scores: List[float]) -> Dict[str, Union[bool, str, float]]:
    """
    Detects sudden health degradation (anomalies) in a time-series list of scores.
    Uses numpy to calculate moving average, standard deviation, and volatility.
    Optimized for timeline visualization.
    
    Args:
        scores (List[float]): A list of numerical health scores ordered by time.
                              The last element is considered the most recent score.
                              
    Returns:
        Dict: A dictionary containing 'is_anomaly', 'severity', and 'volatility_score'.
    """
    default_response = {
        "is_anomaly": False,
        "severity": "low",
        "volatility_score": 0.0
    }
    
    if not scores or len(scores) < 3:
        logging.info("Not enough scores provided to perform anomaly detection.")
        return default_response
        
    try:
        # Convert list to numpy array
        data = np.array(scores)
        
        # Consider the last score as the current reading
        current_score = data[-1]
        
        # Use a rolling window of up to 14 previous scores for moving average and volatility bands
        history = data[:-1]
        window = history[-14:] if len(history) > 14 else history
        
        # Calculate moving average and standard deviation over the rolling window
        mean = float(np.mean(window))
        std_dev = float(np.std(window))
        
        # We represent volatility as the standard deviation of historical data
        volatility_score = round(std_dev, 2)
        
        if std_dev == 0:
            # If there's no historical variation, any drop is a major anomaly
            z_score = -float('inf') if current_score < mean else 0
        else:
            # How many standard deviations the current score is away from the historical mean
            z_score = (current_score - mean) / std_dev
            
        # Detect sudden health degradation (significant negative z-score)
        is_anomaly = False
        severity = "low"
        
        if z_score <= -3.0:
            is_anomaly = True
            severity = "critical"
        elif z_score <= -2.0:
            is_anomaly = True
            severity = "high"
        elif z_score <= -1.0:
            # A minor drop isn't strictly an anomaly, but it increases the severity
            severity = "medium"
            
        return {
            "is_anomaly": is_anomaly,
            "severity": severity,
            "volatility_score": volatility_score
        }
        
    except Exception as e:
        logging.error(f"Error calculating anomaly detection: {str(e)}")
        return default_response

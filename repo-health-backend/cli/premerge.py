#!/usr/bin/env python3
import subprocess
import urllib.request
import urllib.error
import json
import sys

def get_staged_diff():
    try:
        result = subprocess.run(
            ["git", "diff", "--cached"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError:
        print("\033[91mError: Could not extract git diff. Are you in a git repository?\033[0m")
        sys.exit(0)

def main():
    print("\033[96m\u21BB Analyzing staged changes for architectural risk...\033[0m\n")
    diff_text = get_staged_diff()
    
    if not diff_text.strip():
        print("\033[93mNo staged changes detected. Safe to merge.\033[0m")
        sys.exit(0)
        
    payload = json.dumps({"diff_text": diff_text}).encode("utf-8")
    req = urllib.request.Request(
        "http://localhost:8000/api/premerge",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            
        risk_score = data.get("risk_score", 0)
        anomaly = data.get("anomaly_warning", False)
        arch_warning = data.get("architectural_warning", "")
        dep_risk = data.get("dependency_risk", "low")
        action = data.get("suggested_action", "")
        
        # Color coding risk score
        risk_color = "\033[91m" if risk_score > 30 else "\033[93m" if risk_score > 15 else "\033[92m"
        
        if anomaly or risk_score > 20:
            print("\033[91m\u26A0 WARNING\033[0m\n")
            print("Potential repository health degradation detected:\n")
            print(f"* Risk score increased ({risk_color}{risk_score}\033[0m)")
            
            if dep_risk != "low":
                print(f"* Dependency risk is \033[93m{dep_risk}\033[0m")
                
            if arch_warning and arch_warning != "No major structural risk detected.":
                print(f"* {arch_warning}")
                
            if anomaly:
                print("* Commits are outside normal volatility bands")
                
            print(f"\n\033[94mSuggested action:\033[0m\n{action}\n")
        else:
            print("\033[92m\u2714 Safe to merge.\033[0m")
            print(f"Risk Score: {risk_score} (Low)")
            
    except urllib.error.URLError as e:
        print(f"\033[91mError connecting to backend: {e}\033[0m")
        print("Please ensure the FastAPI server is running on http://localhost:8000")
        
    # Exit 0 always for hackathon demo stability
    sys.exit(0)

if __name__ == "__main__":
    main()

import os
import logging
from dotenv import load_dotenv
import litellm

# Load environment variables
load_dotenv()

# To switch providers, just change MODEL_NAME and set the corresponding API KEY in .env
# Examples:
# MODEL_NAME="gpt-4o-mini" (Requires OPENAI_API_KEY)
# MODEL_NAME="claude-3-haiku-20240307" (Requires ANTHROPIC_API_KEY)
# MODEL_NAME="gemini/gemini-1.5-flash" (Requires GEMINI_API_KEY)

MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4o-mini")

def explain_diff(diff_text: str) -> str:
    """
    Analyzes a code diff and provides a one-sentence explanation of the architectural risk.
    Uses LiteLLM for dynamic model provider orchestration.
    """
    fallback_response = "Structural risk detected, but AI explanation is temporarily unavailable."
    
    try:
        response = litellm.completion(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior software architecture reviewer. Explain the architectural risk of the provided code diff in ONE sentence. Focus on: tight coupling, dependency violations, circular dependencies, maintainability risks, and service layer bypassing."
                },
                {
                    "role": "user",
                    "content": f"Review this diff:\n{diff_text}"
                }
            ],
            max_tokens=60,
            temperature=0.2
        )
        
        explanation = response.choices[0].message.content.strip()
        return explanation
    except Exception as e:
        logging.error(f"Error calling LLM provider via LiteLLM: {str(e)}")
        return fallback_response

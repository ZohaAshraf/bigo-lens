import os
import json
import requests
from dotenv import load_dotenv
from app.schemas import ComplexityResult

load_dotenv()

# Free-tier Flash model. Google renames/rotates these fairly often — if this
# starts returning 404s, check https://ai.google.dev/gemini-api/docs/models
# for the current free-tier model name and update GEMINI_MODEL below.
GEMINI_MODEL = "gemini-3.6-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

SYSTEM_PROMPT = """You are an expert algorithm analyst. Given a code snippet, determine \
its time and space complexity using Big-O notation.

Respond ONLY with a JSON object in exactly this shape — no markdown fences, no preamble, \
no text before or after the JSON:
{
  "time_complexity": "O(...)",
  "space_complexity": "O(...)",
  "confidence": 0.0-1.0,
  "explanation": "2-3 sentence explanation of your reasoning, mentioning the specific \
patterns you noticed (loops, recursion, data structure operations, etc)."
}
"""


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    return json.loads(text)


def analyze_with_llm(code: str, language: str) -> ComplexityResult:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY not set. Add it to backend/.env (copy .env.example first)."
        )

    user_prompt = (
        f"Language: {language}\n\nCode:\n```{language}\n{code}\n```\n\n"
        "Analyze its time and space complexity."
    )

    payload = {
        "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {"temperature": 0.2},
    }

    response = requests.post(
        GEMINI_URL,
        params={"key": api_key},
        json=payload,
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"]

    try:
        parsed = _extract_json(text)
    except (json.JSONDecodeError, KeyError, IndexError):
        return ComplexityResult(
            time_complexity="Unknown",
            space_complexity=None,
            confidence=0.0,
            explanation="The AI analysis returned a response that couldn't be parsed. Try again.",
            heuristic_signals={"source": "llm", "raw_response": text},
        )

    return ComplexityResult(
        time_complexity=parsed.get("time_complexity", "Unknown"),
        space_complexity=parsed.get("space_complexity"),
        confidence=float(parsed.get("confidence", 0.5)),
        explanation=parsed.get("explanation", ""),
        heuristic_signals={"source": "llm"},
    )
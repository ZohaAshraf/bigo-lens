import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import CodeInput, ComplexityResult
from app.analyzer.heuristic import analyze_heuristic
from app.analyzer.llm import analyze_with_llm

logger = logging.getLogger("bigo_lens")

app = FastAPI(title="BigO Lens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIDENCE_THRESHOLD = 0.65


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=ComplexityResult)
def analyze(payload: CodeInput):
    result = analyze_heuristic(payload.code, payload.language)

    needs_llm = (
        payload.language != "python"
        or result.time_complexity == "Unknown"
        or result.confidence < CONFIDENCE_THRESHOLD
    )

    if needs_llm:
        try:
            llm_result = analyze_with_llm(payload.code, payload.language)
            if llm_result.time_complexity != "Unknown":
                return llm_result
        except Exception:
            # No API key set, or the API call failed — log it so it's
            # visible in the terminal, but still fall back to the
            # heuristic result rather than breaking the whole request.
            logger.exception("Gemini analysis failed, falling back to heuristic result")

    return result
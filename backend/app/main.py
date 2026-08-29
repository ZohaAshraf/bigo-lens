from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import CodeInput, ComplexityResult
from app.analyzer.heuristic import analyze_heuristic

app = FastAPI(title="BigO Lens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=ComplexityResult)
def analyze(payload: CodeInput):
    result = analyze_heuristic(payload.code, payload.language)
    return result

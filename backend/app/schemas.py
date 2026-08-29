from pydantic import BaseModel
from typing import Optional


class CodeInput(BaseModel):
    code: str
    language: str = "python"  # python | javascript | java | cpp


class ComplexityResult(BaseModel):
    time_complexity: str
    space_complexity: Optional[str] = None
    confidence: float
    explanation: str
    heuristic_signals: dict

<div align="center">

# BigO Lens

**An instrument for reading your code's growth.**

Paste in a function. Get its time complexity — with the reasoning behind it, not just a label.

[![Status](https://img.shields.io/badge/status-in%20progress-e8a33d)](#status)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](#tech-stack)
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-3178c6)](#tech-stack)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

<!--
  Add a screenshot or GIF of the app here.
  Suggested: a screen capture of the split-panel UI mid-analysis,
  with the growth curve animating in.
-->
<img src="docs/screenshot.png" alt="BigO Lens interface — paste code on the left, see complexity and an animated growth curve on the right" width="800" />

</div>

---

## What it does

BigO Lens analyzes a code snippet and returns:

- **Time complexity**, in standard Big-O notation
- **A confidence score**, so you know how much to trust the result
- **A plain-English explanation** of exactly which pattern in your code drove that answer
- **An animated growth curve**, plotting your code against every standard complexity class (O(1) → O(2ⁿ)) so you can see where it lands, not just read a tag

## How it works

Rather than sending every snippet straight to an LLM, BigO Lens analyzes in two layers:

1. **AST-based heuristic engine** — walks the actual syntax tree of your code using Python's `ast` module. It tracks nested loop depth, distinguishes mutually-exclusive recursive branches (e.g. binary search) from concurrently-running ones (e.g. naive Fibonacci), detects halving operations to separate O(log n) recursion from O(n), and recognizes built-in sort usage.
2. **LLM fallback** — automatically triggered when the heuristic's confidence is low or the input language isn't fully supported yet by static analysis. If the LLM call fails for any reason, the app gracefully falls back to the heuristic's best result instead of failing the request.

You always get an answer, and you always get an honest sense of how much to trust it.

## Tech stack

| Layer      | Technology                                              |
|------------|-----------------------------------------------------------|
| Backend    | FastAPI, Python `ast` module, Gemini API (LLM fallback)   |
| Frontend   | React, TypeScript, Vite, Tailwind CSS                      |
| Styling    | Custom "blueprint" design system — graph-paper grids, IBM Plex Mono, single-accent amber highlight |

## Project structure

```
bigo-lens/
├── backend/
│   ├── app/
│   │   ├── analyzer/
│   │   │   ├── heuristic.py   # AST-based static analysis
│   │   │   └── llm.py         # LLM fallback analysis
│   │   ├── main.py            # FastAPI app & /analyze endpoint
│   │   └── schemas.py         # Request/response models
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── CodeInput.tsx
    │   │   ├── GrowthCurve.tsx  # animated complexity chart
    │   │   └── ResultPanel.tsx
    │   ├── lib/api.ts
    │   └── App.tsx
    └── package.json
```

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with your LLM API key (used only as a fallback when the heuristic is uncertain):

```
GEMINI_API_KEY=your_key_here
```

Run the API:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`, with a health check at `/health`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API

**`POST /analyze`**

```json
// Request
{
  "code": "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)",
  "language": "python"
}
```

```json
// Response
{
  "time_complexity": "O(2^n)",
  "space_complexity": null,
  "confidence": 0.65,
  "explanation": "'fib' makes 2 recursive calls that can run together in the same invocation, without shrinking the input by a fixed fraction — exponential branching, like naive Fibonacci.",
  "heuristic_signals": { "...": "..." }
}
```

## Status

🚧 Actively in development. Currently supported:

- ✅ Full static analysis for Python
- ✅ LLM fallback for other languages and low-confidence cases
- ⏳ JavaScript, Java, and C++ static analysis — planned
- ⏳ Space-complexity detection — planned

## Roadmap

- [ ] Static analysis support for JavaScript, Java, and C++
- [ ] Space-complexity heuristics alongside time complexity
- [ ] Detection of memoization and amortized-cost patterns
- [ ] Shareable/exportable analysis results

## Contributing

Issues and pull requests are welcome — particularly adversarial code samples that trip up the heuristic engine.

## License

[MIT](LICENSE)
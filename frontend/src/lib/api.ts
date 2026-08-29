export interface ComplexityResult {
  time_complexity: string;
  space_complexity: string | null;
  confidence: number;
  explanation: string;
  heuristic_signals: Record<string, unknown>;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000';

export async function analyzeCode(
  code: string,
  language: string,
): Promise<ComplexityResult> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed (${response.status})`);
  }

  return response.json();
}

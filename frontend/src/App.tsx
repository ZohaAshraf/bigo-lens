import { useState } from 'react';
import CodeInput from './components/CodeInput';
import ResultPanel from './components/ResultPanel';
import { analyzeCode, type ComplexityResult } from './lib/api';

const PLACEHOLDER_CODE: Record<string, string> = {
  python: 'def fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)',
  javascript: '',
  java: '',
  cpp: '',
};

export default function App() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(PLACEHOLDER_CODE.python);
  const [result, setResult] = useState<ComplexityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyzeCode(code, language);
      setResult(res);
    } catch {
      setError(
        "Couldn't reach the analysis backend. Is it running on http://127.0.0.1:8000?",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-blueprint-grid/40 px-6 py-5">
        <h1 className="font-mono-display text-xl font-bold tracking-tight">
          BIGO LENS
        </h1>
        <p className="text-blueprint-muted text-sm mt-1">
          An instrument for reading your code's growth.
        </p>
      </header>

      <main className="flex-1 grid md:grid-cols-2 gap-px bg-blueprint-grid/40">
        <section className="bg-blueprint-bg p-6">
          <CodeInput
            code={code}
            onCodeChange={setCode}
            language={language}
            onLanguageChange={(lang) => {
              setLanguage(lang);
              setCode(PLACEHOLDER_CODE[lang] ?? '');
              setResult(null);
              setError(null);
            }}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />
        </section>

        <section className="bg-blueprint-bg p-6 min-h-[400px]">
          <ResultPanel result={result} error={error} />
        </section>
      </main>
    </div>
  );
}

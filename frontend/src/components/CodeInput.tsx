interface CodeInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const LANGUAGES = ['python', 'javascript', 'java', 'cpp'];

export default function CodeInput({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  onAnalyze,
  isLoading,
}: CodeInputProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 mb-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={`px-3 py-1.5 text-xs font-mono-display uppercase tracking-wide rounded-t-sm border-b-2 transition-colors ${
              language === lang
                ? 'border-blueprint-amber text-blueprint-text'
                : 'border-transparent text-blueprint-muted hover:text-blueprint-text'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      <div className="grid-paper rounded-sm flex-1 min-h-[280px] p-4 border border-blueprint-grid/40">
        <textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder={`// paste your ${language} function here`}
          spellCheck={false}
          className="w-full h-full min-h-[240px] bg-transparent resize-none outline-none font-mono-display text-sm text-blueprint-text placeholder:text-blueprint-muted/60 leading-relaxed"
        />
      </div>

      <button
        onClick={onAnalyze}
        disabled={isLoading || !code.trim()}
        className="mt-4 self-start px-5 py-2.5 bg-blueprint-amber text-blueprint-bg font-mono-display text-sm font-semibold uppercase tracking-wide rounded-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint-text"
      >
        {isLoading ? 'Measuring…' : 'Analyze'}
      </button>
    </div>
  );
}

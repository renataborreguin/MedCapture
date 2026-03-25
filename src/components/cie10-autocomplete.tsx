"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, CheckCircle2, X } from "lucide-react";

interface Diagnostico {
  codigo: string;
  descripcion: string;
}

interface CIE10AutocompleteProps {
  selected: Diagnostico[];
  onSelect: (diagnosticos: Diagnostico[]) => void;
}

export function CIE10Autocomplete({ selected, onSelect }: CIE10AutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Diagnostico[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/cie10?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.results || []).filter(
          (r: Diagnostico) => !selected.some((s) => s.codigo === r.codigo)
        );
        setResults(filtered);
        setIsOpen(filtered.length > 0);
      }
    } catch {
      setResults([]);
    }
  }, [selected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (dx: Diagnostico) => {
    onSelect([...selected, dx]);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleRemove = (index: number) => {
    onSelect(selected.filter((_, i) => i !== index));
  };

  const toggleVoice = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "es-MX";
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
      search(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
    setListening(true);
  };

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="gastritis aguda..."
          className="w-full pr-10"
        />
        {voiceSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
            style={{ background: listening ? "var(--primary-light)" : "transparent" }}
            title={listening ? "Detener dictado" : "Dictar diagnóstico"}
          >
            {listening ? (
              <MicOff className="h-4 w-4" style={{ color: "var(--primary)" }} />
            ) : (
              <Mic className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
            )}
            {listening && (
              <span
                className="absolute -top-1 -right-1 h-2 w-2 rounded-full animate-pulse"
                style={{ background: "var(--error, #ef4444)" }}
              />
            )}
          </button>
        )}

        {isOpen && results.length > 0 && (
          <div className="cie10-dropdown">
            {results.map((dx) => (
              <button
                key={dx.codigo}
                className="cie10-item w-full text-left"
                onClick={() => handleSelect(dx)}
              >
                <span
                  className="font-mono text-xs font-semibold min-w-[52px]"
                  style={{ color: "var(--primary)" }}
                >
                  {dx.codigo}
                </span>
                <span className="text-sm">{dx.descripcion}</span>
                <CheckCircle2
                  className="h-4 w-4 ml-auto shrink-0"
                  style={{ color: "var(--primary)", opacity: 0.4 }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div className="space-y-1.5">
          {selected.map((dx, i) => (
            <div
              key={i}
              className="ai-expansion flex items-center gap-3 text-sm"
            >
              <span
                className="font-mono text-xs font-semibold min-w-[48px]"
                style={{ color: "var(--primary)" }}
              >
                {dx.codigo}
              </span>
              <span className="flex-1">{dx.descripcion}</span>
              <button
                onClick={() => handleRemove(i)}
                className="p-0.5 rounded hover:bg-gray-100"
                title="Quitar diagnóstico"
              >
                <X className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

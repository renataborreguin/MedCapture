"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, CheckCircle2, AlertTriangle, Info, ShieldAlert, Zap, Pencil } from "lucide-react";

interface Referencia {
  tipo: "alerta" | "info" | "precaucion";
  texto: string;
}

export interface SnippetMatch {
  atajo: string;
  texto: string;
}

interface KeywordFieldProps {
  section: string;
  placeholder?: string;
  onExpansion?: (text: string) => void;
  initialExpansion?: string;
  snippets?: SnippetMatch[];
}

const REF_ICONS = {
  alerta: AlertTriangle,
  precaucion: ShieldAlert,
  info: Info,
};

const REF_STYLES = {
  alerta: { bg: "var(--warning-bg)", border: "var(--warning-border)", color: "var(--warning)" },
  precaucion: { bg: "var(--danger-bg)", border: "#f5c6ba", color: "var(--danger)" },
  info: { bg: "var(--primary-light)", border: "var(--ai-border)", color: "var(--primary)" },
};

export function KeywordField({
  section,
  placeholder = "Dicta o escribe...",
  onExpansion,
  initialExpansion,
  snippets,
}: KeywordFieldProps) {
  const [keywords, setKeywords] = useState("");
  const [expansion, setExpansion] = useState(initialExpansion || "");
  const [expandedViaSnippet, setExpandedViaSnippet] = useState(false);
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const preExpandSnippets = useCallback(
    (raw: string): { text: string; snippetOnly: boolean } => {
      if (!snippets || snippets.length === 0)
        return { text: raw, snippetOnly: false };

      const trimmed = raw.trim().toLowerCase();

      const exact = snippets.find((s) => s.atajo === trimmed);
      if (exact) return { text: exact.texto, snippetOnly: true };

      const tokens = trimmed.split(/\s+/);
      if (tokens.length <= 1)
        return { text: raw, snippetOnly: false };

      let anyMatch = false;
      const expanded = tokens.map((token) => {
        const m = snippets.find((s) => s.atajo === token);
        if (m) {
          anyMatch = true;
          return m.texto;
        }
        return token;
      });

      if (!anyMatch) return { text: raw, snippetOnly: false };

      // Join with ", " so the AI gets a coherent input
      return { text: expanded.join(", "), snippetOnly: false };
    },
    [snippets]
  );

  const triggerExpansion = useCallback(
    async (text: string) => {
      if (!text.trim() || text.trim().length < 3) return;

      const { text: processed, snippetOnly } = preExpandSnippets(text);

      if (snippetOnly) {
        setExpansion(processed);
        setExpandedViaSnippet(true);
        setReferencias([]);
        onExpansion?.(processed);
        return;
      }

      setExpandedViaSnippet(false);
      setIsLoading(true);
      try {
        const res = await fetch("/api/expand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: processed, section }),
        });
        if (res.ok) {
          const data = await res.json();
          setExpansion(data.expansion);
          onExpansion?.(data.expansion);
          if (data.referencias?.length > 0) {
            setReferencias(data.referencias);
          }
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    },
    [section, onExpansion, preExpandSnippets]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setKeywords(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => triggerExpansion(val), 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      triggerExpansion(keywords);
    }
  };

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "es-MX";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const newText = keywords ? `${keywords}, ${transcript}` : transcript;
      setKeywords(newText);
      triggerExpansion(newText);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, keywords, triggerExpansion]);

  return (
    <div className="space-y-2">
      <div className="relative">
        {keywords && (
          <span className="keyword-badge absolute left-3 top-1/2 -translate-y-1/2 z-10">
            Keywords:
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={keywords}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pr-12"
          style={{
            paddingLeft: keywords ? "88px" : "12px",
            borderColor: expansion ? "var(--ai-border)" : undefined,
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2
              className="h-4 w-4 animate-spin"
              style={{ color: "var(--primary)" }}
            />
          )}
          {voiceSupported && (
            <button
              onClick={toggleVoice}
              className="p-1 rounded-md transition-colors hover:bg-gray-100"
              title={isListening ? "Detener dictado" : "Dictar"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
              )}
            </button>
          )}
        </div>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          Escuchando...
        </div>
      )}

      {expansion && (
        <div className="ai-expansion flex gap-3">
          {expandedViaSnippet ? (
            <Zap
              className="h-4 w-4 shrink-0 mt-2"
              style={{ color: "var(--ai-icon)" }}
            />
          ) : (
            <CheckCircle2
              className="h-4 w-4 shrink-0 mt-2"
              style={{ color: "var(--ai-icon)" }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium"
                style={{ color: "var(--primary)" }}
              >
                {expandedViaSnippet ? "Snippet aplicado" : "Generado por IA"}
              </span>
              <Pencil
                className="h-3 w-3"
                style={{ color: "var(--text-muted)" }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Editable
              </span>
            </div>
            <textarea
              value={expansion}
              onChange={(e) => {
                setExpansion(e.target.value);
                onExpansion?.(e.target.value);
              }}
              rows={Math.max(2, Math.ceil(expansion.length / 80))}
              className="w-full text-sm leading-relaxed resize-y"
              style={{
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: "6px",
                padding: "6px 8px",
                margin: "-6px -8px",
                color: "var(--text-primary)",
                outline: "none",
                transition: "border-color 150ms ease, background 150ms ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--ai-border)";
                e.currentTarget.style.background = "rgba(255,255,255,0.6)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.background = "transparent";
              }}
            />
          </div>
        </div>
      )}

      {referencias.length > 0 && (
        <div className="space-y-1.5 mt-1">
          {referencias.map((ref, i) => {
            const tipo = (ref.tipo || "info") as keyof typeof REF_ICONS;
            const Icon = REF_ICONS[tipo] || Info;
            const style = REF_STYLES[tipo] || REF_STYLES.info;
            return (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs leading-relaxed"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                }}
              >
                <Icon
                  className="h-3.5 w-3.5 shrink-0 mt-0.5"
                  style={{ color: style.color }}
                />
                <span style={{ color: "var(--text-primary)" }}>{ref.texto}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

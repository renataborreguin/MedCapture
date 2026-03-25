"use client";

import { useState, useRef } from "react";
import { Search, Loader2, BookOpen, X } from "lucide-react";

export function ReferenceSearch() {
  const [query, setQuery] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setRespuesta("");
    try {
      const res = await fetch("/api/referencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data = await res.json();
        setRespuesta(data.respuesta);
      }
    } catch {
      setRespuesta("Error al buscar. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg transition-colors w-full"
        style={{
          background: "var(--primary-light)",
          color: "var(--primary)",
          border: "1px solid var(--ai-border)",
        }}
      >
        <BookOpen className="h-4 w-4" />
        Consulta de referencia rapida
      </button>
    );
  }

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--ai-border)",
        boxShadow: "0 2px 8px rgba(61, 155, 143, 0.08)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--primary)" }}>
          <BookOpen className="h-4 w-4" />
          Referencia Clinica
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setQuery("");
            setRespuesta("");
          }}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          <X className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        </button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="dosis pediatrica amoxicilina, contraindicaciones metformina..."
          className="w-full pl-10 pr-4 text-sm"
        />
      </div>

      <button
        onClick={handleSearch}
        disabled={!query.trim() || isLoading}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
        style={{ background: "var(--primary)" }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            <Search className="h-3.5 w-3.5" />
            Buscar
          </>
        )}
      </button>

      {respuesta && (
        <div
          className="rounded-lg p-3 text-sm leading-relaxed"
          style={{
            background: "var(--primary-light)",
            border: "1px solid var(--ai-border)",
          }}
        >
          {respuesta}
        </div>
      )}

      {!respuesta && !isLoading && (
        <div className="flex flex-wrap gap-1.5">
          {[
            "dosis metformina",
            "interacciones losartan",
            "valores normales BH",
            "contraindicaciones ibuprofeno",
          ].map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                setTimeout(handleSearch, 50);
              }}
              className="text-xs px-2.5 py-1 rounded-full transition-colors"
              style={{
                background: "var(--bg-page)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

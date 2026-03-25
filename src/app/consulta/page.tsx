"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Mic, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { getInitials } from "@/lib/format";

interface Patient {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  grupo_etnico: string | null; // stores CURP temporarily
}

export default function PatientSearchPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const searchPatients = useCallback(async (term: string) => {
    if (!term.trim()) {
      setPatients([]);
      setSelectedId(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(term.trim())}`);
      const data = await res.json();
      setPatients(data.patients || []);
    } catch {
      showToast("Error al buscar pacientes", "warning");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchPatients(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchPatients]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleVoiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      showToast("Tu navegador no soporta búsqueda por voz", "warning");
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = "es-MX";
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
      showToast("Búsqueda por voz completada", "success");
    };

    recognition.onerror = () => {
      setListening(false);
      showToast("No se pudo capturar audio", "warning");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    setListening(true);
    showToast("Escuchando... habla ahora", "info");
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    router.push(`/consulta/${id}`);
  };

  const handleStart = () => {
    if (selectedId) {
      router.push(`/consulta/${selectedId}`);
    } else if (patients.length === 1) {
      router.push(`/consulta/${patients[0].id}`);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div className="w-full max-w-lg space-y-6 text-center">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Buscar Paciente
        </h1>

        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre o teléfono del paciente..."
            className="w-full pl-12 pr-12 py-3 text-base rounded-xl"
            style={{ border: "1px solid var(--border)" }}
            autoFocus
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors"
            title="Buscar por voz"
            onClick={handleVoiceSearch}
            style={{
              background: listening ? "var(--primary-light)" : "transparent",
            }}
          >
            <Mic
              className="h-5 w-5"
              style={{ color: listening ? "var(--primary)" : "var(--text-muted)" }}
            />
            {listening && (
              <span
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full animate-pulse"
                style={{ background: "var(--error, #ef4444)" }}
              />
            )}
          </button>
        </div>

        {loading && (
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            Buscando...
          </div>
        )}

        {patients.length > 0 && (
          <div
            className="rounded-xl overflow-hidden text-left"
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                style={{
                  borderColor: "var(--border)",
                  background: selectedId === p.id ? "var(--primary-light)" : undefined,
                }}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                  style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                >
                  {getInitials(p.nombre_completo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.nombre_completo}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {p.telefono || "Sin teléfono"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.trim() && !loading && patients.length === 0 && (
          <div className="text-sm py-4" style={{ color: "var(--text-muted)" }}>
            No se encontraron pacientes. Puedes registrar uno nuevo.
          </div>
        )}

        <button
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-base font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ background: "var(--primary)" }}
          onClick={handleStart}
          disabled={!selectedId && patients.length !== 1}
        >
          Empezar
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>o</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <Link
          href="/consulta/nuevo-paciente"
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-medium transition-colors"
          style={{ background: "var(--bg-card)", color: "var(--primary)", border: "1px solid var(--primary)" }}
        >
          <UserPlus className="h-4 w-4" />
          Registrar nuevo paciente
        </Link>
      </div>
    </div>
  );
}

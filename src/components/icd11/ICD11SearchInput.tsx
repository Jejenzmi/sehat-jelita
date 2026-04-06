/**
 * ICD11SearchInput — reusable autocomplete for WHO ICD-11 diagnosis codes
 *
 * Calls GET /api/icd11/search?q=...&lang=id
 * Displays: ICD-11 code + Indonesian title (+ English fallback)
 *
 * Usage:
 *   <ICD11SearchInput
 *     onSelect={(entry) => addDiagnosis(entry)}
 *     placeholder="Cari diagnosis ICD-11..."
 *   />
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

export interface ICD11Entity {
  entity_id: string | null;
  icd11_code: string | null;
  icd10_code: string | null;
  title: string;
  definition: string;
  synonyms: string[];
  chapter: string | null;
  is_leaf: boolean;
  lang: string;
}

interface ICD11SearchInputProps {
  onSelect: (entity: ICD11Entity) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function ICD11SearchInput({
  onSelect,
  placeholder = "Cari kode ICD-11 atau nama penyakit…",
  disabled = false,
  className,
  autoFocus = false,
}: ICD11SearchInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ["icd11-search", query],
    queryFn: async (): Promise<ICD11Entity[]> => {
      if (query.trim().length < 2) return [];
      const res = await fetch(
        `${API_BASE}/icd11/search?q=${encodeURIComponent(query)}&lang=id&limit=15`,
        FETCH_OPTS
      );
      const json = await res.json().catch(() => ({}));
      return json.data ?? [];
    },
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5,   // cache 5 min
    placeholderData: (prev) => prev,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = useCallback((entity: ICD11Entity) => {
    onSelect(entity);
    setQuery("");
    setOpen(false);
    setActiveIdx(0);
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIdx]) handleSelect(results[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none" />
        )}
        <Input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(0); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="pl-9 pr-9"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Dropdown */}
      {open && query.trim().length >= 2 && (
        <div
          ref={dropRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto"
        >
          {isError && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Gagal terhubung ke WHO ICD-11 API. Periksa konfigurasi di Pengaturan.</span>
            </div>
          )}

          {!isError && !isFetching && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground text-center">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </div>
          )}

          {results.map((entity, idx) => (
            <button
              key={entity.entity_id ?? idx}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2.5 text-sm hover:bg-accent focus:bg-accent outline-none border-b last:border-b-0 border-border/50 transition-colors",
                idx === activeIdx && "bg-accent"
              )}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => handleSelect(entity)}
            >
              <div className="flex items-start gap-2">
                {/* Code badges */}
                <div className="flex flex-col gap-0.5 pt-0.5 flex-shrink-0">
                  {entity.icd11_code && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/90 font-mono">
                      {entity.icd11_code}
                    </Badge>
                  )}
                  {entity.icd10_code && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                      ICD-10: {entity.icd10_code}
                    </Badge>
                  )}
                </div>
                {/* Title + definition */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-snug truncate">{entity.title}</p>
                  {entity.definition && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                      {entity.definition}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Attribution footer */}
          <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30 border-t">
            Data © WHO ICD-11 — <span className="font-medium">icd.who.int</span>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Search, UserCircle, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { searchCustomers } from "../customers/actions";
import { CustomerDialog } from "../customers/customer-dialog";

interface SelectedCustomer {
  id: string;
  firstName: string;
  lastName: string | null;
  docNumber: string;
}

interface CustomerPickerProps {
  value: SelectedCustomer | null;
  onChange: (c: SelectedCustomer | null) => void;
}

export function CustomerPicker({ value, onChange }: CustomerPickerProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SelectedCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click fuera cierra
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const r = await searchCustomers(q);
        setResults(r as SelectedCustomer[]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-card/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">
              {value.firstName} {value.lastName ?? ""}
            </p>
            <p className="text-[11px] text-muted-foreground">{value.docNumber}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente por nombre o DNI..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9"
        />
      </div>

      {open && (q.trim().length >= 2 || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
          {loading && results.length === 0 ? (
            <div className="space-y-1 p-1">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Sin resultados
            </div>
          ) : (
            results.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium">
                  {c.firstName} {c.lastName ?? ""}
                </span>
                <span className="text-[11px] text-muted-foreground">{c.docNumber}</span>
              </button>
            ))
          )}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">o</span>
        <CustomerDialog
          trigger={
            <Button type="button" variant="outline" size="sm">
              <UserPlus className="h-4 w-4" />
              Crear nuevo
            </Button>
          }
          onCreated={(c) => onChange(c)}
        />
      </div>
    </div>
  );
}

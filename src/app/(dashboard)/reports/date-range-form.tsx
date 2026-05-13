"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  initialFrom: string;
  initialTo: string;
}

const presets: { label: string; days: number }[] = [
  { label: "Hoy", days: 0 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export function DateRangeForm({ initialFrom, initialTo }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function apply(f: string, t: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("from", f);
    sp.set("to", t);
    router.push(`/reports?${sp.toString()}`);
  }

  function setPreset(days: number) {
    const t = new Date();
    const f = new Date();
    f.setDate(f.getDate() - days);
    const fStr = f.toISOString().slice(0, 10);
    const tStr = t.toISOString().slice(0, 10);
    setFrom(fStr);
    setTo(tStr);
    apply(fStr, tStr);
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-card/40 p-3">
      <div className="space-y-1">
        <Label className="text-xs">Desde</Label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Hasta</Label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
      </div>
      <Button size="sm" onClick={() => apply(from, to)}>
        Aplicar
      </Button>
      <div className="ml-auto flex gap-1">
        {presets.map((p) => (
          <Button key={p.label} size="sm" variant="outline" onClick={() => setPreset(p.days)}>
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

import { Minus, Plus } from "lucide-react";

export function QtyStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex h-11 items-center rounded-full border border-border">
      <button type="button" aria-label="Diminuir quantidade" onClick={() => onChange(Math.max(1, value - 1))} className="grid h-11 w-11 place-items-center">
        <Minus className="h-4 w-4" />
      </button>
      <input
        aria-label="Quantidade"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isFinite(n) ? Math.min(99, Math.max(1, n)) : 1);
        }}
        className="w-10 bg-transparent text-center text-sm outline-none"
      />
      <button type="button" aria-label="Aumentar quantidade" onClick={() => onChange(Math.min(99, value + 1))} className="grid h-11 w-11 place-items-center">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

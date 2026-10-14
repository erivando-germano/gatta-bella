import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  color: string | null;
  size: string | null;
  shade: string | null;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  add: (item: Omit<CartItem, "key">) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "bellagatta-cart-v1";
const Ctx = createContext<CartCtx | null>(null);

const keyOf = (i: Pick<CartItem, "productId" | "color" | "size" | "shade">) =>
  [i.productId, i.color ?? "", i.size ?? "", i.shade ?? ""].join("|");

const clampQty = (n: number) => Math.min(99, Math.max(1, Math.floor(Number.isFinite(n) ? n : 1)));

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignora carrinho corrompido */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      hydrated,
      count: items.reduce((s, i) => s + i.qty, 0),
      add: (item) =>
        setItems((prev) => {
          const key = keyOf(item);
          const existing = prev.find((p) => p.key === key);
          if (existing)
            return prev.map((p) => (p.key === key ? { ...p, qty: clampQty(p.qty + item.qty) } : p));
          return [...prev, { ...item, key, qty: clampQty(item.qty) }];
        }),
      setQty: (key, qty) =>
        setItems((prev) => prev.map((p) => (p.key === key ? { ...p, qty: clampQty(qty) } : p))),
      remove: (key) => setItems((prev) => prev.filter((p) => p.key !== key)),
      clear: () => setItems([]),
    }),
    [items, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}

export const variantLabel = (i: Pick<CartItem, "color" | "size" | "shade">) =>
  [i.color && `Cor: ${i.color}`, i.size && `Tamanho: ${i.size}`, i.shade && `Tonalidade: ${i.shade}`]
    .filter(Boolean)
    .join(" · ");

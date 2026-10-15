import { useQuery } from "@tanstack/react-query";
import { useCart, type CartItem } from "./cart";
import { currentPrice, fetchProductsByIds, type Product } from "./catalog";

export interface CartLine extends CartItem {
  unitPrice: number;
  subtotal: number;
  product: Product | undefined;
  problem: string | null;
}

/** Combina o carrinho local com preços e disponibilidade atuais do banco. */
export function useCartLines() {
  const cart = useCart();
  const ids = [...new Set(cart.items.map((i) => i.productId))].sort();
  const q = useQuery({
    queryKey: ["cart-products", ids],
    queryFn: () => fetchProductsByIds(ids),
    enabled: cart.hydrated && ids.length > 0,
  });

  const lines: CartLine[] = cart.items.map((i) => {
    const product = q.data?.find((p) => p.id === i.productId);
    const unitPrice = product ? currentPrice(product) : 0;
    let problem: string | null = null;
    if (q.data && !product) problem = "Produto não está mais no catálogo.";
    else if (product && !product.available) problem = "Produto indisponível no momento.";
    return { ...i, name: product?.name ?? i.name, unitPrice, subtotal: unitPrice * i.qty, product, problem };
  });
  const total = Math.round(lines.reduce((s, l) => s + (l.problem ? 0 : l.subtotal), 0) * 100) / 100;
  const hasProblem = lines.some((l) => l.problem);
  return { cart, lines, total, hasProblem, isLoading: !cart.hydrated || (ids.length > 0 && q.isLoading), isError: q.isError, refetch: q.refetch };
}

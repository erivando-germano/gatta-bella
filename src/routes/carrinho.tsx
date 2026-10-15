import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageOff, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { QtyStepper } from "@/components/site/QtyStepper";
import { variantLabel } from "@/lib/cart";
import { formatBRL } from "@/lib/catalog";
import { useCartLines } from "@/lib/use-cart-lines";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Bella Gatta" },
      { name: "description", content: "Revise os itens escolhidos antes de enviar o pedido pelo WhatsApp." },
      { property: "og:title", content: "Carrinho — Bella Gatta" },
      { property: "og:description", content: "Seu carrinho na Bella Gatta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, lines, total, hasProblem, isLoading, isError } = useCartLines();

  return (
    <SiteLayout>
      <div className="container-page py-10 md:py-14">
        <h1 className="text-4xl md:text-5xl">Seu carrinho</h1>
        {isLoading ? (
          <div className="mt-8 h-32 animate-pulse rounded-md bg-secondary" />
        ) : lines.length === 0 ? (
          <div className="mt-10 rounded-md border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">Seu carrinho está vazio.</p>
            <Link to="/categorias" className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground">
              Explorar o catálogo
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
            <ul className="divide-y divide-border border-y border-border">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-5">
                  <Link to="/produto/$slug" params={{ slug: l.slug }} className="h-28 w-22 shrink-0 overflow-hidden rounded bg-secondary">
                    {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <ImageOff className="m-auto mt-10 h-5 w-5 text-muted-foreground" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <Link to="/produto/$slug" params={{ slug: l.slug }} className="font-medium">{l.name}</Link>
                        {variantLabel(l) && <p className="text-xs text-muted-foreground">{variantLabel(l)}</p>}
                        <p className="mt-1 text-sm">{formatBRL(l.unitPrice)} <span className="text-muted-foreground">cada</span></p>
                      </div>
                      <button onClick={() => cart.remove(l.key)} aria-label={`Remover ${l.name}`} className="grid h-10 w-10 shrink-0 place-items-center text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {l.problem && <p className="text-xs text-destructive">{l.problem} Remova para continuar.</p>}
                    <div className="mt-auto flex items-center justify-between">
                      <QtyStepper value={l.qty} onChange={(n) => cart.setQty(l.key, n)} />
                      <span className="font-semibold">{formatBRL(l.subtotal)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="h-fit rounded-md bg-secondary p-6">
              <div className="flex justify-between text-lg">
                <span>Total</span>
                <span className="font-semibold">{formatBRL(total)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Frete, pagamento e entrega ou retirada são combinados com a loja pelo WhatsApp.</p>
              {isError && <p className="mt-3 text-sm text-destructive">Não foi possível conferir os preços atuais. Atualize a página.</p>}
              {hasProblem || isError ? (
                <button disabled className="mt-6 h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground opacity-40">Finalizar pedido</button>
              ) : (
                <Link to="/finalizar" className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Finalizar pedido
                </Link>
              )}
              <Link to="/categorias" className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-primary text-sm font-medium">
                Continuar comprando
              </Link>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

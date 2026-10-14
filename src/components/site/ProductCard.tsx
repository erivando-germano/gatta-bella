import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import { currentPrice, formatBRL, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const img = product.product_images[0]?.url;
  const promo = product.promo_price != null && product.promo_price < product.price;
  return (
    <Link to="/produto/$slug" params={{ slug: product.slug }} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-secondary">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${product.available ? "" : "opacity-60 grayscale"}`}
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <ImageOff className="h-6 w-6" aria-hidden />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.is_demo && <Tag className="bg-accent text-accent-foreground">Demonstração</Tag>}
          {product.is_new && <Tag className="bg-background text-foreground">Novidade</Tag>}
          {promo && <Tag className="bg-promo text-primary-foreground">Promoção</Tag>}
        </div>
        {!product.available && (
          <span className="absolute inset-x-2 bottom-2 rounded bg-primary/85 py-1.5 text-center text-xs font-medium text-primary-foreground">
            Indisponível
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-sans text-sm font-normal leading-snug">{product.name}</h3>
        <p className="flex items-baseline gap-2 text-sm">
          <span className={promo ? "font-semibold text-promo" : "font-semibold"}>
            {formatBRL(currentPrice(product))}
          </span>
          {promo && <s className="text-xs text-muted-foreground">{formatBRL(product.price)}</s>}
        </p>
      </div>
    </Link>
  );
}

function Tag({ children, className }: { children: string; className: string }) {
  return (
    <span className={`rounded-sm px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider ${className}`}>
      {children}
    </span>
  );
}

export function ProductGrid({ products, empty }: { products: Product[]; empty?: string }) {
  if (products.length === 0)
    return (
      <p className="rounded-md border border-dashed border-border py-16 text-center text-muted-foreground">
        {empty ?? "Nenhum produto encontrado."}
      </p>
    );
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Carregando produtos">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-md bg-secondary" />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GridSkeleton, ProductGrid } from "./ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/catalog";

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function CatalogView({ categorySlug, initialQuery }: { categorySlug?: string; initialQuery?: string }) {
  const { data: products, isLoading, isError } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const [q, setQ] = useState(initialQuery ?? "");
  const category = categories?.find((c) => c.slug === categorySlug);

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (categorySlug) list = list.filter((p) => p.category_id === category?.id);
    if (q.trim()) list = list.filter((p) => norm(p.name).includes(norm(q.trim())));
    return list;
  }, [products, categorySlug, category, q]);

  return (
    <div className="container-page py-10 md:py-14">
      <p className="eyebrow">Catálogo</p>
      <h1 className="mt-2 text-4xl md:text-5xl">{categorySlug ? category?.name ?? "Categoria" : "Todos os produtos"}</h1>
      {category?.description && <p className="mt-2 text-muted-foreground">{category.description}</p>}

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Categorias" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Chip to="/categorias" active={!categorySlug}>Todas</Chip>
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className={chipCls(c.slug === categorySlug)}
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <label className="md:w-72">
          <span className="sr-only">Buscar por nome</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome"
            className="h-11 w-full rounded-full border border-input bg-card px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>

      <div className="mt-10">
        {isLoading ? (
          <GridSkeleton />
        ) : isError ? (
          <p className="py-10 text-center text-destructive">Não foi possível carregar os produtos.</p>
        ) : (
          <ProductGrid products={filtered} empty={q ? `Nenhum produto encontrado para “${q}”.` : "Nenhum produto cadastrado nesta categoria ainda."} />
        )}
      </div>
    </div>
  );
}

const chipCls = (active: boolean) =>
  `shrink-0 rounded-full border px-4 py-2 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`;

function Chip({ to, active, children }: { to: "/categorias"; active: boolean; children: string }) {
  return (
    <Link to={to} search={{}} className={chipCls(active)}>
      {children}
    </Link>
  );
}

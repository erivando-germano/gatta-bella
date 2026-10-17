import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ImageOff } from "lucide-react";
import { QtyStepper } from "@/components/site/QtyStepper";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCart } from "@/lib/cart";
import { categoriesQuery, currentPrice, formatBRL, optionsOf, productsQuery, type Product } from "@/lib/catalog";

export const Route = createFileRoute("/produto/$slug")({
  head: () => ({
    meta: [
      { title: "Produto — Bella Gatta" },
      { name: "description", content: "Detalhes do produto no catálogo Bella Gatta." },
      { property: "og:title", content: "Produto — Bella Gatta" },
      { property: "og:description", content: "Escolha cor, tamanho e monte seu pedido pelo WhatsApp." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products, isLoading } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const product = products?.find((p) => p.slug === slug);

  if (isLoading)
    return (
      <SiteLayout>
        <div className="container-page grid gap-10 py-10 md:grid-cols-2">
          <div className="aspect-[4/5] animate-pulse rounded-md bg-secondary" />
          <div className="h-40 animate-pulse rounded-md bg-secondary" />
        </div>
      </SiteLayout>
    );

  if (!product)
    return (
      <SiteLayout>
        <div className="container-page py-24 text-center">
          <h1 className="text-4xl">Produto não encontrado</h1>
          <Link to="/categorias" className="mt-6 inline-block underline">Voltar ao catálogo</Link>
        </div>
      </SiteLayout>
    );

  const category = categories?.find((c) => c.id === product.category_id);
  return (
    <SiteLayout>
      <ProductDetail key={product.id} product={product} categoryName={category?.name} categorySlug={category?.slug} />
    </SiteLayout>
  );
}

function ProductDetail({
  product,
  categoryName,
  categorySlug,
}: {
  product: Product;
  categoryName?: string | undefined;
  categorySlug?: string | undefined;
}) {
  const cart = useCart();
  const navigate = useNavigate();
  const colors = optionsOf(product, "color");
  const sizes = optionsOf(product, "size");
  const shades = optionsOf(product, "shade");
  const [imgIdx, setImgIdx] = useState(0);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0]! : null);
  const [size, setSize] = useState<string | null>(sizes.length === 1 ? sizes[0]! : null);
  const [shade, setShade] = useState<string | null>(shades.length === 1 ? shades[0]! : null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const promo = product.promo_price != null && product.promo_price < product.price;
  const images = product.product_images;

  const add = (goToCart: boolean) => {
    if (!product.available) return;
    if (colors.length && !color) { setError("Escolha uma cor."); return; }
    if (sizes.length && !size) { setError("Escolha um tamanho."); return; }
    if (shades.length && !shade) { setError("Escolha uma tonalidade."); return; }
    setError(null);
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: images[0]?.url ?? null,
      color,
      size,
      shade,
      qty,
    });
    toast.success("Adicionado ao carrinho");
    if (goToCart) navigate({ to: "/carrinho" });
  };

  return (
    <div className="container-page py-8 md:py-14">
      <nav aria-label="Trilha" className="mb-6 text-xs text-muted-foreground">
        <Link to="/categorias">Catálogo</Link>
        {categorySlug && (
          <>
            {" / "}
            <Link to="/categoria/$slug" params={{ slug: categorySlug }}>{categoryName}</Link>
          </>
        )}
      </nav>
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-md bg-secondary">
            {images[imgIdx] ? (
              <img src={images[imgIdx].url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground"><ImageOff className="h-8 w-8" /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((im, i) => (
                <button
                  key={im.id}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded border-2 ${i === imgIdx ? "border-primary" : "border-transparent"}`}
                >
                  <img src={im.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.is_demo && (
            <p className="mb-3 inline-block rounded-sm bg-accent px-2 py-1 text-xs font-medium uppercase tracking-wider">
              Produto de demonstração
            </p>
          )}
          <h1 className="text-4xl leading-tight md:text-5xl">{product.name}</h1>
          <p className="mt-4 flex items-baseline gap-3">
            <span className={`text-2xl font-semibold ${promo ? "text-promo" : ""}`}>{formatBRL(currentPrice(product))}</span>
            {promo && <s className="text-muted-foreground">{formatBRL(product.price)}</s>}
          </p>
          {!product.available && (
            <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Este produto está indisponível no momento.
            </p>
          )}
          {product.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>}

          <div className="mt-8 space-y-6">
            <OptionPicker label="Cor" values={colors} value={color} onChange={setColor} />
            <OptionPicker label="Tamanho" values={sizes} value={size} onChange={setSize} />
            <OptionPicker label="Tonalidade" values={shades} value={shade} onChange={setShade} />

            <div>
              <p className="mb-2 text-sm font-medium">Quantidade</p>
              <QtyStepper value={qty} onChange={setQty} />
            </div>
          </div>

          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={!product.available}
              onClick={() => add(false)}
              className="h-12 flex-1 rounded-full border border-primary text-sm font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Adicionar ao carrinho
            </button>
            <button
              disabled={!product.available}
              onClick={() => add(true)}
              className="h-12 flex-1 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Comprar agora
            </button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">A disponibilidade é confirmada pela loja no WhatsApp.</p>
        </div>
      </div>
    </div>
  );
}

function OptionPicker({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  if (!values.length) return null;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">
        {label}
        {value && <span className="font-normal text-muted-foreground">: {value}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`min-h-11 min-w-11 rounded-full border px-4 text-sm ${value === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
          >
            {v}
          </button>
        ))}
      </div>
    </fieldset>
  );
}


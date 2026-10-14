import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Instagram, MessageCircle } from "lucide-react";
import heroDefault from "@/assets/hero.jpg";
import { SiteLayout } from "@/components/site/SiteLayout";
import { GridSkeleton, ProductGrid } from "@/components/site/ProductCard";
import { categoriesQuery, instagramUrl, productsQuery, settingsQuery, whatsappUrl } from "@/lib/catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bella Gatta — Moda feminina, lingerie e maquiagens" },
      { name: "description", content: "Conheça a Bella Gatta: roupas femininas, lingeries e maquiagens. Escolha suas peças e finalize pelo WhatsApp." },
      { property: "og:title", content: "Bella Gatta — Catálogo virtual" },
      { property: "og:description", content: "Roupas femininas, lingeries e maquiagens. Pedidos pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const { data: products, isLoading, isError } = useQuery(productsQuery);

  const novidades = (products ?? []).filter((p) => p.is_new).slice(0, 4);
  const destaques = (products ?? []).filter((p) => p.featured).slice(0, 8);

  return (
    <SiteLayout>
      <section className="relative">
        <img
          src={settings?.banner_url || heroDefault}
          alt=""
          width={1600}
          height={1008}
          className="h-[68vh] min-h-[420px] w-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="container-page absolute inset-0 flex flex-col justify-center">
          <p className="eyebrow">Nova coleção</p>
          <h1 className="mt-3 max-w-md text-5xl leading-[1.05] md:text-7xl">
            {settings?.banner_title || "Delicadeza em cada detalhe"}
          </h1>
          <p className="mt-4 max-w-sm text-muted-foreground">
            {settings?.banner_subtitle || "Moda feminina, lingerie e maquiagens para você se sentir linda."}
          </p>
          <Link
            to="/categorias"
            className="mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ver catálogo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="container-page mt-16">
        <h2 className="text-3xl md:text-4xl">Categorias</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className="group flex items-center justify-between rounded-md bg-secondary px-6 py-8 transition-colors hover:bg-accent"
            >
              <div>
                <span className="font-display text-2xl">{c.name}</span>
                {c.description && <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>}
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <Section title="Novidades">
        {isLoading ? <GridSkeleton /> : isError ? <LoadError /> : <ProductGrid products={novidades} empty="Em breve, novidades por aqui." />}
      </Section>

      <Section title="Destaques">
        {isLoading ? <GridSkeleton /> : isError ? <LoadError /> : <ProductGrid products={destaques} empty="Nenhum destaque no momento." />}
        <div className="mt-10 text-center">
          <Link to="/categorias" className="inline-flex h-12 items-center gap-2 rounded-full border border-primary px-7 text-sm font-medium hover:bg-primary hover:text-primary-foreground">
            Conhecer o catálogo completo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {settings && (
        <section className="container-page mt-20">
          <div className="grid gap-3 rounded-md bg-secondary p-8 md:grid-cols-[1fr_auto_auto] md:items-center md:p-12">
            <div>
              <h2 className="text-3xl">Vamos conversar?</h2>
              <p className="mt-2 text-muted-foreground">Tire dúvidas, veja novidades e acompanhe a loja.</p>
            </div>
            <a href={instagramUrl(settings.instagram_handle)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-primary px-6 text-sm font-medium hover:bg-primary hover:text-primary-foreground">
              <Instagram className="h-4 w-4" /> @{settings.instagram_handle.replace(/^@/, "")}
            </a>
            <a href={whatsappUrl(settings.whatsapp_number)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="container-page mt-20">
      <h2 className="mb-8 text-3xl md:text-4xl">{title}</h2>
      {children}
    </section>
  );
}

export function LoadError() {
  return <p className="py-10 text-center text-destructive">Não foi possível carregar os produtos. Tente atualizar a página.</p>;
}

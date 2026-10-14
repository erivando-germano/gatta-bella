import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CatalogView } from "@/components/site/CatalogView";

const TITLES: Record<string, string> = {
  roupas: "Roupas femininas",
  lingerie: "Lingerie",
  maquiagens: "Maquiagens",
};

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => {
    const t = TITLES[params.slug] ?? "Categoria";
    return {
      meta: [
        { title: `${t} — Bella Gatta` },
        { name: "description", content: `${t} no catálogo virtual da Bella Gatta.` },
        { property: "og:title", content: `${t} — Bella Gatta` },
        { property: "og:description", content: `Confira ${t.toLowerCase()} da Bella Gatta.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  return (
    <SiteLayout>
      <CatalogView key={slug} categorySlug={slug} />
    </SiteLayout>
  );
}

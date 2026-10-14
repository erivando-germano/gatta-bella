import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CatalogView } from "@/components/site/CatalogView";

export const Route = createFileRoute("/categorias")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Catálogo completo — Bella Gatta" },
      { name: "description", content: "Todos os produtos da Bella Gatta: roupas femininas, lingeries e maquiagens." },
      { property: "og:title", content: "Catálogo completo — Bella Gatta" },
      { property: "og:description", content: "Roupas femininas, lingeries e maquiagens." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const { q } = Route.useSearch();
  return (
    <SiteLayout>
      <CatalogView key={q ?? ""} initialQuery={q} />
    </SiteLayout>
  );
}

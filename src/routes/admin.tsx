import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    if (!(await isAdmin())) throw redirect({ to: "/admin/login" });
  },
  head: () => ({
    meta: [
      { title: "Painel — Bella Gatta" },
      { name: "description", content: "Painel administrativo da Bella Gatta." },
      { property: "og:title", content: "Painel — Bella Gatta" },
      { property: "og:description", content: "Área restrita." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };
  const tab = "rounded-full px-4 py-2 text-sm hover:bg-secondary";
  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-background">
        <div className="container-page flex flex-wrap items-center gap-2 py-3">
          <Link to="/" className="mr-4 font-display text-xl">Bella Gatta <span className="text-sm text-muted-foreground">· painel</span></Link>
          <nav className="flex flex-1 gap-1 overflow-x-auto" aria-label="Painel">
            <Link to="/admin" activeOptions={{ exact: true }} className={tab} activeProps={{ className: "bg-secondary font-medium" }}>Produtos</Link>
            <Link to="/admin/categorias" className={tab} activeProps={{ className: "bg-secondary font-medium" }}>Categorias</Link>
            <Link to="/admin/configuracoes" className={tab} activeProps={{ className: "bg-secondary font-medium" }}>Configurações</Link>
          </nav>
          <button onClick={signOut} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>
      <main className="container-page py-8">
        <Outlet />
      </main>
    </div>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Menu, MessageCircle, Search, ShoppingBag, X } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useCart } from "@/lib/cart";
import { instagramUrl, settingsQuery, whatsappUrl } from "@/lib/catalog";

const NAV = [
  { to: "/categoria/$slug", params: { slug: "roupas" }, label: "Roupas" },
  { to: "/categoria/$slug", params: { slug: "lingerie" }, label: "Lingerie" },
  { to: "/categoria/$slug", params: { slug: "maquiagens" }, label: "Maquiagens" },
] as const;

export function Logo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) return <img src={logoUrl} alt={name} className="h-10 w-auto object-contain" />;
  return (
    <span className="font-display text-2xl leading-none tracking-wide md:text-3xl">
      {name.split(" ")[0]} <em className="font-light">{name.split(" ").slice(1).join(" ")}</em>
    </span>
  );
}

function SearchForm({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/categorias", search: { q: q.trim() || undefined } });
    onDone?.();
  };
  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor="busca" className="sr-only">
        Buscar produtos
      </label>
      <input
        id="busca"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar produtos"
        className="h-11 w-full rounded-full border border-input bg-card pl-4 pr-11 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

export function SiteHeader() {
  const { count, hydrated } = useCart();
  const { data: settings } = useQuery(settingsQuery);
  const [open, setOpen] = useState(false);
  const name = settings?.store_name ?? "Bella Gatta";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3 md:h-20">
        <button
          className="grid h-11 w-11 place-items-center md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/" className="mr-auto md:mr-0" aria-label={`${name} — início`}>
          <Logo name={name} logoUrl={settings?.logo_url} />
        </Link>
        <nav className="ml-8 hidden items-center gap-6 text-sm md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.label}
              to={n.to}
              params={n.params}
              className="hover:text-promo"
              activeProps={{ className: "text-promo" }}
            >
              {n.label}
            </Link>
          ))}
          <Link to="/categorias" className="hover:text-promo" activeProps={{ className: "text-promo" }}>
            Catálogo
          </Link>
        </nav>
        <div className="ml-auto hidden w-64 md:block">
          <SearchForm />
        </div>
        <Link
          to="/carrinho"
          className="relative grid h-11 w-11 place-items-center"
          aria-label={`Carrinho com ${count} ${count === 1 ? "item" : "itens"}`}
        >
          <ShoppingBag className="h-5 w-5" />
          {hydrated && count > 0 && (
            <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container-page space-y-1 py-4">
            <SearchForm onDone={() => setOpen(false)} />
            <nav className="flex flex-col pt-2" aria-label="Menu móvel">
              {NAV.map((n) => (
                <Link
                  key={n.label}
                  to={n.to}
                  params={n.params}
                  onClick={() => setOpen(false)}
                  className="border-b border-border py-3 font-display text-xl"
                >
                  {n.label}
                </Link>
              ))}
              <Link to="/categorias" onClick={() => setOpen(false)} className="py-3 font-display text-xl">
                Catálogo completo
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { data: s } = useQuery(settingsQuery);
  const name = s?.store_name ?? "Bella Gatta";
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <Logo name={name} />
          <p className="mt-3 max-w-xs text-sm opacity-75">Moda feminina, lingerie e maquiagens.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-col gap-2 text-sm">
          <span className="mb-1 text-xs uppercase tracking-[0.2em] opacity-60">Navegação</span>
          {NAV.map((n) => (
            <Link key={n.label} to={n.to} params={n.params} className="opacity-85 hover:opacity-100">
              {n.label}
            </Link>
          ))}
          <Link to="/categorias" className="opacity-85 hover:opacity-100">Catálogo completo</Link>
          <Link to="/carrinho" className="opacity-85 hover:opacity-100">Carrinho</Link>
        </nav>
        <div className="flex flex-col gap-3 text-sm">
          <span className="mb-1 text-xs uppercase tracking-[0.2em] opacity-60">Contato</span>
          {s && (
            <>
              <a href={instagramUrl(s.instagram_handle)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 opacity-85 hover:opacity-100">
                <Instagram className="h-4 w-4" /> @{s.instagram_handle.replace(/^@/, "")}
              </a>
              <a href={whatsappUrl(s.whatsapp_number)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 opacity-85 hover:opacity-100">
                <MessageCircle className="h-4 w-4" /> Fale pelo WhatsApp
              </a>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="container-page flex flex-wrap justify-between gap-2 py-5 text-xs opacity-60">
          <span>© {new Date().getFullYear()} {name}</span>
          <Link to="/admin/login" className="hover:opacity-100">Área administrativa</Link>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

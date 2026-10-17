import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, currentPrice, formatBRL, productsQuery, type Product } from "@/lib/catalog";
import { errMsg, removeStored } from "@/lib/admin";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/")({ component: ProductsAdmin });

function ProductsAdmin() {
  const qc = useQueryClient();
  const { data: products, isLoading, isError } = useQuery(productsQuery);
  const { data: categories } = useQuery(categoriesQuery);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [avail, setAvail] = useState("");
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const list = useMemo(
    () =>
      (products ?? []).filter(
        (p) =>
          (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
          (!cat || p.category_id === cat) &&
          (!avail || String(p.available) === avail),
      ),
    [products, q, cat, avail],
  );

  const toggle = async (p: Product) => {
    const { error } = await supabase.from("products").update({ available: !p.available }).eq("id", p.id);
    if (error) { toast.error("Não foi possível alterar: " + errMsg(error)); return; }
    toast.success(!p.available ? "Marcado como disponível" : "Marcado como indisponível");
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const doDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("products").delete().eq("id", toDelete.id);
    if (error) { toast.error("Não foi possível excluir: " + errMsg(error)); return; }
    await Promise.all(toDelete.product_images.map((i) => removeStored("product-images", i.storage_path)));
    toast.success("Produto excluído");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const sel = "h-11 rounded-md border border-input bg-background px-3 text-sm";
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Produtos</h1>
        <Link to="/admin/produtos/$id" params={{ id: "novo" }} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
          <Plus className="h-4 w-4" /> Novo produto
        </Link>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <input placeholder="Pesquisar por nome" value={q} onChange={(e) => setQ(e.target.value)} className={sel} aria-label="Pesquisar" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={sel} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={avail} onChange={(e) => setAvail(e.target.value)} className={sel} aria-label="Disponibilidade">
          <option value="">Qualquer disponibilidade</option>
          <option value="true">Disponíveis</option>
          <option value="false">Indisponíveis</option>
        </select>
      </div>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Carregando…</p>
      ) : isError ? (
        <p className="mt-8 text-destructive">Erro ao carregar produtos.</p>
      ) : list.length === 0 ? (
        <p className="mt-8 rounded-md border border-dashed border-border bg-background py-12 text-center text-muted-foreground">Nenhum produto encontrado.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-background">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <div className="h-16 w-13 shrink-0 overflow-hidden rounded bg-secondary">
                {p.product_images[0] && <img src={p.product_images[0].url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {categories?.find((c) => c.id === p.category_id)?.name ?? "Sem categoria"} · {formatBRL(currentPrice(p))}
                  {p.featured && " · Destaque"}{p.is_new && " · Novidade"}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={p.available} onCheckedChange={() => toggle(p)} aria-label="Disponível" />
                <span className="hidden sm:inline">{p.available ? "Disponível" : "Indisponível"}</span>
              </label>
              <Link to="/admin/produtos/$id" params={{ id: p.id }} aria-label={`Editar ${p.name}`} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary">
                <Pencil className="h-4 w-4" />
              </Link>
              <button onClick={() => setToDelete(p)} aria-label={`Excluir ${p.name}`} className="grid h-10 w-10 place-items-center rounded-full text-destructive hover:bg-secondary">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>“{toDelete?.name}” e suas fotos serão removidos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

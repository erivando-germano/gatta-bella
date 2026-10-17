import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, productsQuery, slugify, type Category } from "@/lib/catalog";
import { errMsg } from "@/lib/admin";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/categorias")({ component: CategoriesAdmin });

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data: categories, isLoading } = useQuery(categoriesQuery);
  const { data: products } = useQuery(productsQuery);
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const create = async () => {
    const n = name.trim();
    if (n.length < 2) { toast.error("Informe o nome da categoria."); return; }
    const { error } = await supabase.from("categories").insert({ name: n, slug: slugify(n), sort_order: (categories?.length ?? 0) + 1 });
    if (error) { toast.error("Não foi possível criar: " + (error.code === "23505" ? "já existe uma categoria com esse nome." : errMsg(error))); return; }
    setName("");
    toast.success("Categoria criada");
    refresh();
  };

  const update = async (c: Category, patch: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    if (error) { toast.error("Não foi possível salvar: " + errMsg(error)); return; }
    toast.success("Categoria salva");
    refresh();
  };

  const del = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from("categories").delete().eq("id", toDelete.id);
    if (error) { toast.error("Não foi possível excluir: " + errMsg(error)); return; }
    toast.success("Categoria excluída");
    setToDelete(null);
    refresh();
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl">Categorias</h1>
      <p className="mt-1 text-sm text-muted-foreground">O endereço da categoria é definido na criação e não muda ao renomear.</p>
      <div className="mt-6 flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nova categoria" className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm" />
        <button onClick={create} className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">Criar</button>
      </div>
      {isLoading ? <p className="mt-6">Carregando…</p> : (
        <ul className="mt-6 space-y-3">
          {categories?.map((c) => <Row key={c.id} c={c} count={products?.filter((p) => p.category_id === c.id).length ?? 0} onSave={(p) => update(c, p)} onDelete={() => setToDelete(c)} />)}
        </ul>
      )}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>Os produtos de “{toDelete?.name}” não serão apagados, mas ficarão sem categoria.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={del} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ c, count, onSave, onDelete }: { c: Category; count: number; onSave: (p: Partial<Category>) => void; onDelete: () => void }) {
  const [name, setName] = useState(c.name);
  const [desc, setDesc] = useState(c.description ?? "");
  const dirty = name !== c.name || desc !== (c.description ?? "");
  return (
    <li className="space-y-2 rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>/categoria/{c.slug}</span><span>{count} produto(s)</span></div>
      <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Nome" className="h-11 w-full rounded-md border border-input px-3 text-sm" />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição curta (opcional)" aria-label="Descrição" className="h-11 w-full rounded-md border border-input px-3 text-sm" />
      <div className="flex gap-2">
        <button disabled={!dirty || name.trim().length < 2} onClick={() => onSave({ name: name.trim(), description: desc.trim() || null })} className="h-10 rounded-full bg-primary px-4 text-sm text-primary-foreground disabled:opacity-40">Salvar</button>
        <button onClick={onDelete} className="h-10 rounded-full px-4 text-sm text-destructive hover:bg-secondary">Excluir</button>
      </div>
    </li>
  );
}

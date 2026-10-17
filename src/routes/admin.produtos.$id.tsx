import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUp, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery, productsQuery, slugify, type OptionKind, type Product } from "@/lib/catalog";
import { errMsg, removeStored, uploadImage } from "@/lib/admin";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/produtos/$id")({ component: EditPage });

function EditPage() {
  const { id } = Route.useParams();
  const { data: products, isLoading } = useQuery(productsQuery);
  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  const product = id === "novo" ? undefined : products?.find((p) => p.id === id);
  if (id !== "novo" && !product) return <p>Produto não encontrado.</p>;
  return <ProductForm key={id} product={product} />;
}

type Img = { id?: string; url: string; storage_path: string | null };

function ProductForm({ product }: { product?: Product | undefined }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: categories } = useQuery(categoriesQuery);
  const opt = (k: OptionKind) => product?.product_options.filter((o) => o.kind === k).map((o) => o.value) ?? [];

  const [f, setF] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category_id: product?.category_id ?? "",
    price: product ? String(product.price).replace(".", ",") : "",
    promo_price: product?.promo_price != null ? String(product.promo_price).replace(".", ",") : "",
    available: product?.available ?? true,
    featured: product?.featured ?? false,
    is_new: product?.is_new ?? false,
  });
  const [colors, setColors] = useState(opt("color"));
  const [sizes, setSizes] = useState(opt("size"));
  const [shades, setShades] = useState(opt("shade"));
  const [images, setImages] = useState<Img[]>(product?.product_images.map((i) => ({ id: i.id, url: i.url, storage_path: i.storage_path })) ?? []);
  const [removed, setRemoved] = useState<Img[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const r = await uploadImage("product-images", file);
        setImages((prev) => [...prev, { url: r.url, storage_path: r.path }]);
      }
      toast.success("Foto enviada. Salve o produto para confirmar.");
    } catch (e) {
      toast.error("Falha no envio: " + errMsg(e));
    } finally {
      setUploading(false);
    }
  };

  const parseMoney = (s: string) => {
    const n = Number(s.replace(/\./g, "").replace(",", ".").trim());
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const price = parseMoney(f.price);
    const promo = f.promo_price.trim() ? parseMoney(f.promo_price) : null;
    if (f.name.trim().length < 2) { setError("Informe o nome do produto."); return; }
    if (!f.category_id) { setError("Escolha a categoria."); return; }
    if (!(price > 0)) { setError("Informe um preço válido."); return; }
    if (promo != null && !(promo > 0 && promo < price)) { setError("O preço promocional deve ser menor que o preço de venda."); return; }

    setSaving(true);
    try {
      const row = {
        name: f.name.trim(),
        description: f.description.trim(),
        category_id: f.category_id,
        price,
        promo_price: promo,
        available: f.available,
        featured: f.featured,
        is_new: f.is_new,
      };
      let pid = product?.id;
      if (pid) {
        const { error } = await supabase.from("products").update(row).eq("id", pid);
        if (error) throw error;
      } else {
        const slug = `${slugify(row.name) || "produto"}-${Math.random().toString(36).slice(2, 7)}`;
        const { data, error } = await supabase.from("products").insert({ ...row, slug }).select("id").single();
        if (error) throw error;
        pid = data.id;
      }
      // opções: substitui o conjunto
      const { error: dErr } = await supabase.from("product_options").delete().eq("product_id", pid);
      if (dErr) throw dErr;
      const optRows = [
        ...colors.map((v, i) => ({ product_id: pid!, kind: "color", value: v, sort_order: i })),
        ...sizes.map((v, i) => ({ product_id: pid!, kind: "size", value: v, sort_order: i })),
        ...shades.map((v, i) => ({ product_id: pid!, kind: "shade", value: v, sort_order: i })),
      ];
      if (optRows.length) {
        const { error } = await supabase.from("product_options").insert(optRows);
        if (error) throw error;
      }
      // imagens: substitui o conjunto, mantendo a ordem
      const { error: iErr } = await supabase.from("product_images").delete().eq("product_id", pid);
      if (iErr) throw iErr;
      if (images.length) {
        const { error } = await supabase
          .from("product_images")
          .insert(images.map((im, i) => ({ product_id: pid!, url: im.url, storage_path: im.storage_path, sort_order: i })));
        if (error) throw error;
      }
      await Promise.all(removed.map((r) => removeStored("product-images", r.storage_path)));
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto salvo");
      navigate({ to: "/admin" });
    } catch (err) {
      setError("Não foi possível salvar: " + errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const input = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm";
  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" /> Produtos</Link>
      <h1 className="text-3xl">{product ? "Editar produto" : "Novo produto"}</h1>

      <Card title="Informações">
        <L label="Nome *"><input className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></L>
        <L label="Categoria *">
          <select className={input} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
            <option value="">Escolha…</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </L>
        <L label="Descrição"><textarea rows={4} className={`${input} h-auto py-2`} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></L>
        <div className="grid gap-4 sm:grid-cols-2">
          <L label="Preço de venda (R$) *"><input inputMode="decimal" placeholder="99,90" className={input} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></L>
          <L label="Preço promocional (opcional)"><input inputMode="decimal" placeholder="79,90" className={input} value={f.promo_price} onChange={(e) => setF({ ...f, promo_price: e.target.value })} /></L>
        </div>
        <div className="flex flex-wrap gap-6 pt-2 text-sm">
          <Toggle label="Disponível" checked={f.available} onChange={(v) => setF({ ...f, available: v })} />
          <Toggle label="Destaque" checked={f.featured} onChange={(v) => setF({ ...f, featured: v })} />
          <Toggle label="Novidade" checked={f.is_new} onChange={(v) => setF({ ...f, is_new: v })} />
        </div>
      </Card>

      <Card title="Fotos">
        <div className="flex flex-wrap gap-3">
          {images.map((im, i) => (
            <div key={im.url} className="relative h-32 w-26 overflow-hidden rounded border border-border">
              <img src={im.url} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-background px-1 text-[0.6rem]">Capa</span>}
              <div className="absolute right-1 top-1 flex gap-1">
                {i > 0 && (
                  <button type="button" aria-label="Mover para frente" onClick={() => setImages((p) => { const c = [...p]; [c[i - 1], c[i]] = [c[i]!, c[i - 1]!]; return c; })} className="grid h-7 w-7 place-items-center rounded-full bg-background">
                    <ArrowUp className="h-3 w-3 -rotate-90" />
                  </button>
                )}
                <button type="button" aria-label="Remover foto" onClick={() => { setImages((p) => p.filter((_, j) => j !== i)); setRemoved((r) => [...r, im]); }} className="grid h-7 w-7 place-items-center rounded-full bg-background text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          <label className="grid h-32 w-26 cursor-pointer place-items-center rounded border border-dashed border-border text-center text-xs text-muted-foreground hover:bg-secondary">
            <span><Upload className="mx-auto mb-1 h-5 w-5" />{uploading ? "Enviando…" : "Adicionar"}</span>
            <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">A primeira foto é a capa. Até 8 MB por foto.</p>
      </Card>

      <Card title="Opções (deixe vazio se não se aplicar)">
        <Tags label="Cores" values={colors} onChange={setColors} placeholder="Ex.: Nude" />
        <Tags label="Tamanhos" values={sizes} onChange={setSizes} placeholder="Ex.: P, M, G, 38" />
        <Tags label="Tonalidades (maquiagem)" values={shades} onChange={setShades} placeholder="Ex.: Rose Nude" />
      </Card>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving || uploading} className="h-12 flex-1 rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50">
          {saving ? "Salvando…" : "Salvar produto"}
        </button>
        <Link to="/admin" className="grid h-12 place-items-center rounded-full border border-border px-6 text-sm">Cancelar</Link>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-4 rounded-md border border-border bg-background p-5"><h2 className="font-sans text-base font-semibold">{title}</h2>{children}</section>;
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2"><Switch checked={checked} onCheckedChange={onChange} />{label}</label>;
}
function Tags({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  const add = () => {
    const parts = v.split(",").map((s) => s.trim()).filter(Boolean).filter((s) => !values.includes(s));
    if (parts.length) onChange([...values, ...parts]);
    setV("");
  };
  return (
    <div className="space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((x) => (
          <span key={x} className="inline-flex items-center gap-1 rounded-full bg-secondary py-1 pl-3 pr-1">
            {x}
            <button type="button" aria-label={`Remover ${x}`} onClick={() => onChange(values.filter((y) => y !== x))} className="grid h-6 w-6 place-items-center rounded-full hover:bg-accent"><X className="h-3 w-3" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} className="h-11 flex-1 rounded-md border border-input bg-background px-3" />
        <button type="button" onClick={add} className="h-11 rounded-md border border-border px-4">Adicionar</button>
      </div>
    </div>
  );
}

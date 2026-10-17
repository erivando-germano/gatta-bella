import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { MessageCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { variantLabel } from "@/lib/cart";
import { fetchProductsByIds, fetchSettings, currentPrice, formatBRL, whatsappUrl } from "@/lib/catalog";
import { useCartLines } from "@/lib/use-cart-lines";

export const Route = createFileRoute("/finalizar")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Bella Gatta" },
      { name: "description", content: "Confira o resumo e envie seu pedido pelo WhatsApp da Bella Gatta." },
      { property: "og:title", content: "Finalizar pedido — Bella Gatta" },
      { property: "og:description", content: "Envie seu pedido pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80, "Nome muito longo."),
  phone: z
    .string()
    .trim()
    .refine((v) => {
      const d = v.replace(/\D/g, "");
      return d.length >= 10 && d.length <= 13;
    }, "Informe um telefone com DDD."),
  notes: z.string().trim().max(500, "Máximo de 500 caracteres.").optional(),
});

function Checkout() {
  const { lines, total, hasProblem, isLoading } = useCartLines();
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setFail(null);
    const r = schema.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    // abre a janela de imediato (evita bloqueio de pop-up) e define o endereço após validar
    const win = window.open("", "_blank");
    setBusy(true);
    try {
      const [settings, fresh] = await Promise.all([
        fetchSettings(),
        fetchProductsByIds([...new Set(lines.map((l) => l.productId))]),
      ]);
      let sum = 0;
      const rows: string[] = [];
      for (const l of lines) {
        const p = fresh.find((x) => x.id === l.productId);
        if (!p || !p.available) throw new Error(`"${l.name}" está indisponível. Volte ao carrinho e remova o item.`);
        const unit = currentPrice(p);
        const sub = Math.round(unit * l.qty * 100) / 100;
        sum += sub;
        const v = variantLabel(l);
        rows.push(
          `• *${p.name}*${v ? `\n   ${v.replace(/ · /g, " | ")}` : ""}\n   ${l.qty} x ${formatBRL(unit)} = ${formatBRL(sub)}`,
        );
      }
      sum = Math.round(sum * 100) / 100;
      const text = [
        `Olá, ${settings.store_name}! Gostaria de fazer um pedido:`,
        "",
        ...rows,
        "",
        `*Total dos produtos: ${formatBRL(sum)}*`,
        "",
        `Nome: ${r.data.name}`,
        `Telefone: ${r.data.phone}`,
        r.data.notes ? `Observações: ${r.data.notes}` : null,
        "",
        "Aguardo a confirmação de disponibilidade, pagamento e entrega/retirada.",
      ]
        .filter((x) => x !== null)
        .join("\n");
      const url = whatsappUrl(settings.whatsapp_number, text);
      if (win) win.location.href = url;
      else window.location.href = url;
      setOpened(true);
    } catch (err) {
      win?.close();
      setFail(err instanceof Error ? err.message : "Não foi possível gerar o pedido. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  if (!isLoading && lines.length === 0)
    return (
      <SiteLayout>
        <div className="container-page py-24 text-center">
          <h1 className="text-4xl">Seu carrinho está vazio</h1>
          <Link to="/categorias" className="mt-6 inline-block underline">Ver catálogo</Link>
        </div>
      </SiteLayout>
    );

  return (
    <SiteLayout>
      <div className="container-page grid gap-10 py-10 md:py-14 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submit} noValidate className="max-w-xl space-y-5">
          <h1 className="text-4xl md:text-5xl">Finalizar pedido</h1>
          <p className="text-muted-foreground">Preencha seus dados. Vamos abrir o WhatsApp com a mensagem pronta para você revisar e enviar.</p>
          <Field label="Seu nome *" error={errors["name"]}>
            <input autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Telefone para contato (com DDD) *" error={errors["phone"]}>
            <input type="tel" autoComplete="tel" inputMode="tel" placeholder="(11) 90000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Observações (opcional)" error={errors["notes"]}>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputCls} h-auto py-3`} />
          </Field>
          {fail && <p role="alert" className="text-sm text-destructive">{fail}</p>}
          <button
            type="submit"
            disabled={busy || hasProblem || isLoading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <MessageCircle className="h-4 w-4" /> {busy ? "Preparando…" : "Enviar pedido pelo WhatsApp"}
          </button>
          {opened ? (
            <p role="status" className="rounded-md bg-accent p-4 text-sm">
              O WhatsApp foi aberto com sua mensagem. <strong>Lembre-se de tocar em enviar</strong> e aguarde a loja confirmar disponibilidade, pagamento e entrega ou retirada. O pedido ainda não foi confirmado.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Seus dados não ficam salvos no site: eles servem apenas para montar a mensagem. O pedido só é confirmado após a resposta da loja.
            </p>
          )}
        </form>

        <aside className="h-fit rounded-md bg-secondary p-6">
          <h2 className="text-2xl">Resumo</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3">
                <div>
                  <p>{l.qty}× {l.name}</p>
                  {variantLabel(l) && <p className="text-xs text-muted-foreground">{variantLabel(l)}</p>}
                  {l.problem && <p className="text-xs text-destructive">{l.problem}</p>}
                </div>
                <span className="shrink-0">{formatBRL(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
          <Link to="/carrinho" className="mt-4 inline-block text-sm underline">Editar carrinho</Link>
        </aside>
      </div>
    </SiteLayout>
  );
}

const inputCls = "h-12 w-full rounded-md border border-input bg-card px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-destructive">{error}</span>}
    </label>
  );
}

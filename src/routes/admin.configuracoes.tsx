import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { normalizeWhatsapp, settingsQuery, whatsappUrl, type StoreSettings } from "@/lib/catalog";
import { errMsg, uploadImage } from "@/lib/admin";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/configuracoes")({ component: SettingsPage });

function SettingsPage() {
  const { data, isLoading, isError } = useQuery(settingsQuery);
  if (isLoading) return <p>Carregando…</p>;
  if (isError || !data) return <p className="text-destructive">Não foi possível carregar as configurações.</p>;
  return <SettingsForm s={data} />;
}

function SettingsForm({ s }: { s: StoreSettings }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    store_name: s.store_name,
    instagram_handle: s.instagram_handle,
    whatsapp_number: s.whatsapp_number,
    banner_title: s.banner_title ?? "",
    banner_subtitle: s.banner_subtitle ?? "",
    logo_url: s.logo_url,
    banner_url: s.banner_url,
  });
  const [confirm, setConfirm] = useState<null | (Omit<StoreSettings, never>)>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async (key: "logo_url" | "banner_url", file?: File) => {
    if (!file) return;
    setUploading(key);
    try {
      const r = await uploadImage("store-assets", file);
      setF((p) => ({ ...p, [key]: r.url }));
      toast.success("Imagem enviada. Salve para aplicar.");
    } catch (e) {
      toast.error("Falha no envio: " + errMsg(e));
    } finally {
      setUploading(null);
    }
  };

  const prepare = () => {
    setError(null);
    const wa = normalizeWhatsapp(f.whatsapp_number);
    if (!wa) return setError("WhatsApp inválido. Use código do país + DDD + número, ex.: 55 11 94936-9601.");
    if (f.store_name.trim().length < 2) return setError("Informe o nome da loja.");
    const ig = f.instagram_handle.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
    if (!/^[a-zA-Z0-9._]{1,30}$/.test(ig)) return setError("Instagram inválido.");
    setConfirm({
      store_name: f.store_name.trim(),
      instagram_handle: ig,
      whatsapp_number: wa,
      banner_title: f.banner_title.trim() || null,
      banner_subtitle: f.banner_subtitle.trim() || null,
      logo_url: f.logo_url,
      banner_url: f.banner_url,
    });
  };

  const save = async () => {
    if (!confirm) return;
    setBusy(true);
    const { data, error } = await supabase.from("store_settings").update(confirm).eq("id", 1).select().single();
    setBusy(false);
    setConfirm(null);
    if (error || !data) return toast.error("Não foi possível salvar: " + errMsg(error));
    setF((p) => ({ ...p, whatsapp_number: data.whatsapp_number, instagram_handle: data.instagram_handle }));
    qc.setQueryData(settingsQuery.queryKey, data);
    toast.success("Configurações salvas");
  };

  const input = "h-11 w-full rounded-md border border-input bg-background px-3 text-sm";
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl">Configurações da loja</h1>
      <section className="space-y-4 rounded-md border border-border bg-background p-5">
        <L label="Nome da loja"><input className={input} value={f.store_name} onChange={(e) => setF({ ...f, store_name: e.target.value })} /></L>
        <L label="Instagram (usuário)"><input className={input} value={f.instagram_handle} onChange={(e) => setF({ ...f, instagram_handle: e.target.value })} /></L>
        <L label="WhatsApp que recebe os pedidos">
          <input className={input} inputMode="tel" value={f.whatsapp_number} onChange={(e) => setF({ ...f, whatsapp_number: e.target.value })} />
          <span className="block text-xs text-muted-foreground">Código do país + DDD + número. Atual: <a className="underline" href={whatsappUrl(s.whatsapp_number)} target="_blank" rel="noreferrer">{s.whatsapp_number}</a></span>
        </L>
      </section>

      <section className="space-y-4 rounded-md border border-border bg-background p-5">
        <h2 className="font-sans text-base font-semibold">Imagens</h2>
        <ImageField label="Logotipo" url={f.logo_url} busy={uploading === "logo_url"} onFile={(file) => upload("logo_url", file)} onClear={() => setF({ ...f, logo_url: null })} />
        <ImageField label="Banner principal" url={f.banner_url} busy={uploading === "banner_url"} onFile={(file) => upload("banner_url", file)} onClear={() => setF({ ...f, banner_url: null })} />
        <L label="Título do banner"><input className={input} placeholder="Delicadeza em cada detalhe" value={f.banner_title} onChange={(e) => setF({ ...f, banner_title: e.target.value })} /></L>
        <L label="Subtítulo do banner"><input className={input} value={f.banner_subtitle} onChange={(e) => setF({ ...f, banner_subtitle: e.target.value })} /></L>
      </section>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button onClick={prepare} disabled={busy || !!uploading} className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50">Salvar configurações</button>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Os novos pedidos serão enviados para o WhatsApp <strong>{confirm?.whatsapp_number}</strong>. As mudanças aparecem no site imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={save}>Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}

function ImageField({ label, url, busy, onFile, onClear }: { label: string; url: string | null; busy: boolean; onFile: (f?: File) => void; onClear: () => void }) {
  return (
    <div className="space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-32 place-items-center overflow-hidden rounded border border-border bg-secondary text-xs text-muted-foreground">
          {url ? <img src={url} alt="" className="h-full w-full object-contain" /> : "Padrão"}
        </div>
        <label className="cursor-pointer rounded-full border border-border px-4 py-2 hover:bg-secondary">
          {busy ? "Enviando…" : "Trocar"}
          <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {url && <button type="button" onClick={onClear} className="text-destructive underline">Usar padrão</button>}
      </div>
    </div>
  );
}

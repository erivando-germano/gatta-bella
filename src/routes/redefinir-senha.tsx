import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errMsg } from "@/lib/admin";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Definir nova senha — Bella Gatta" },
      { name: "description", content: "Defina uma nova senha de acesso." },
      { property: "og:title", content: "Definir nova senha — Bella Gatta" },
      { property: "og:description", content: "Área restrita." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.");
    if (pw !== pw2) return setError("As senhas não coincidem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(errMsg(error) + " O link pode ter expirado; solicite outro.");
    toast.success("Senha atualizada.");
    navigate({ to: "/admin" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-md bg-card p-8 shadow-sm">
        <h1 className="text-center text-2xl">Definir nova senha</h1>
        <input type="password" placeholder="Nova senha" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-12 w-full rounded-md border border-input bg-background px-3" />
        <input type="password" placeholder="Repita a senha" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className="h-12 w-full rounded-md border border-input bg-background px-3" />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50">Salvar senha</button>
      </form>
    </div>
  );
}

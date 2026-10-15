import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin, errMsg } from "@/lib/admin";
import { Logo } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso administrativo — Bella Gatta" },
      { name: "description", content: "Área restrita para administradoras da Bella Gatta." },
      { property: "og:title", content: "Acesso administrativo — Bella Gatta" },
      { property: "og:description", content: "Área restrita." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/redefinir-senha`,
        });
        if (error) throw error;
        toast.success("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
        setMode("login");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error("E-mail ou senha incorretos.");
      if (!(await isAdmin())) {
        await supabase.auth.signOut();
        throw new Error("Esta conta não tem permissão de administradora.");
      }
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-secondary px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-md bg-card p-8 shadow-sm">
        <div className="text-center"><Logo name="Bella Gatta" /></div>
        <h1 className="text-center text-2xl">{mode === "login" ? "Área administrativa" : "Recuperar senha"}</h1>
        <label className="block text-sm">
          E-mail
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3" />
        </label>
        {mode === "login" && (
          <label className="block text-sm">
            Senha
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3" />
          </label>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50">
          {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Enviar link"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setError(null); }} className="w-full text-sm underline">
          {mode === "login" ? "Esqueci minha senha" : "Voltar ao login"}
        </button>
      </form>
    </div>
  );
}

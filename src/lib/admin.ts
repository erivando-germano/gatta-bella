import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Envia uma imagem ao armazenamento (somente admins pelas regras de segurança) e retorna um link de leitura. */
export async function uploadImage(bucket: "product-images" | "store-assets", file: File) {
  if (!file.type.startsWith("image/")) throw new Error("O arquivo precisa ser uma imagem.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Imagem maior que 8 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from(bucket).createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw e2 ?? new Error("Falha ao gerar link da imagem.");
  return { path, url: data.signedUrl };
}

export async function removeStored(bucket: "product-images" | "store-assets", path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}

export async function isAdmin(): Promise<boolean> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return false;
  const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  return data === true;
}

export const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Erro inesperado.";

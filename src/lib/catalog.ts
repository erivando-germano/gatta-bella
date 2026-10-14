import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OptionKind = "color" | "size" | "shade";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
}

export interface ProductOption {
  id: string;
  kind: OptionKind;
  value: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  price: number;
  promo_price: number | null;
  available: boolean;
  featured: boolean;
  is_new: boolean;
  is_demo: boolean;
  created_at: string;
  product_images: ProductImage[];
  product_options: ProductOption[];
}

export interface StoreSettings {
  store_name: string;
  logo_url: string | null;
  banner_url: string | null;
  banner_title: string | null;
  banner_subtitle: string | null;
  instagram_handle: string;
  whatsapp_number: string;
}

const PRODUCT_SELECT =
  "id,name,slug,description,category_id,price,promo_price,available,featured,is_new,is_demo,created_at,product_images(id,url,storage_path,sort_order),product_options(id,kind,value,sort_order)";

function normalize(p: Record<string, unknown>): Product {
  const prod = p as unknown as Product;
  return {
    ...prod,
    price: Number(prod.price),
    promo_price: prod.promo_price == null ? null : Number(prod.promo_price),
    product_images: [...(prod.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    product_options: [...(prod.product_options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => normalize(p as Record<string, unknown>));
}

export async function fetchProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).in("id", ids);
  if (error) throw error;
  return (data ?? []).map((p) => normalize(p as Record<string, unknown>));
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export const productsQuery = queryOptions({ queryKey: ["products"], queryFn: fetchProducts });
export const categoriesQuery = queryOptions({ queryKey: ["categories"], queryFn: fetchCategories });
export const settingsQuery = queryOptions({ queryKey: ["settings"], queryFn: fetchSettings });

export const currentPrice = (p: Pick<Product, "price" | "promo_price">) =>
  p.promo_price != null && p.promo_price < p.price ? p.promo_price : p.price;

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (n: number) => brl.format(n);

export const optionsOf = (p: Product, kind: OptionKind) =>
  p.product_options.filter((o) => o.kind === kind).map((o) => o.value);

export const instagramUrl = (handle: string) =>
  `https://www.instagram.com/${handle.replace(/^@/, "")}/`;

export const whatsappUrl = (number: string, text?: string) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Normaliza número para formato internacional (somente dígitos). Retorna null se inválido. */
export function normalizeWhatsapp(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d; // DDD + número brasileiro
  return /^[1-9]\d{11,13}$/.test(d) ? d : null;
}

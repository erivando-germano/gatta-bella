import { describe, expect, it } from "vitest";
import { currentPrice, normalizeWhatsapp, whatsappUrl } from "@/lib/catalog";

describe("WhatsApp da loja", () => {
  it("aceita número com código do país e remove símbolos", () => {
    expect(normalizeWhatsapp("+55 (11) 94936-9601")).toBe("5511949369601");
  });
  it("completa com 55 quando informado só DDD + número", () => {
    expect(normalizeWhatsapp("11 94936-9601")).toBe("5511949369601");
  });
  it("rejeita número curto", () => {
    expect(normalizeWhatsapp("9493")).toBeNull();
  });
  it("gera link wa.me com mensagem codificada", () => {
    expect(whatsappUrl("5511949369601", "Olá & tchau")).toBe("https://wa.me/5511949369601?text=Ol%C3%A1%20%26%20tchau");
  });
});

describe("preço atual", () => {
  it("usa o promocional quando menor que o preço de venda", () => {
    expect(currentPrice({ price: 189.9, promo_price: 159.9 })).toBe(159.9);
  });
  it("ignora promocional ausente", () => {
    expect(currentPrice({ price: 49.9, promo_price: null })).toBe(49.9);
  });
});

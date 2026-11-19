import { describe, expect, it } from "vitest";
import { blackNovemberNoAr, formatarPreco, linkWhatsapp, OFERTAS } from "./blackNovember";

describe("Black November", () => {
	it("fica no ar até o fim do dia 30/11 em Brasília", () => {
		expect(blackNovemberNoAr(new Date("2026-11-19T12:00:00Z"))).toBe(true);
		// 23h59 de 30/11 em Brasília
		expect(blackNovemberNoAr(new Date("2026-12-01T02:59:00Z"))).toBe(true);
		expect(blackNovemberNoAr(new Date("2026-12-01T03:00:00Z"))).toBe(false);
	});

	it("monta o link do WhatsApp com o plano", () => {
		expect(linkWhatsapp("Spinning")).toBe(
			"https://wa.me/5561993190568?text=Ol%C3%A1!%20Quero%20o%20plano%20Spinning%20da%20Black%20November.",
		);
		expect(linkWhatsapp()).toContain("ofertas%20da%20Black%20November");
	});

	it("formata o preço em reais", () => {
		expect(formatarPreco(119)).toBe("R$ 119,00");
	});

	it("tem as 6 ofertas das artes", () => {
		expect(OFERTAS.map((o) => o.preco)).toEqual([119, 99, 99, 99, 199, 399]);
	});
});

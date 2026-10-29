import { describe, expect, it } from "vitest";
import { cenasDaBailarina, ehCena, PROGRAMA, type ItemPrograma } from "./programa";

describe("cenasDaBailarina", () => {
	const kansas = { titulo: "Kansas", faixas: ["01"], nomes: ["Cecília B.", "Alice M."] };
	const papoulas = { titulo: "Papoulas", faixas: ["07"], nomes: ["Alice M."] };
	const itens: ItemPrograma[] = [{ ato: "1º Ato" }, kansas, { intervalo: "Intervalo" }, papoulas];

	it("acha sem acento e sem diferenciar maiúsculas", () => {
		expect(cenasDaBailarina(itens, "cecilia")).toEqual(new Set([kansas]));
		expect(cenasDaBailarina(itens, "ALICE")).toEqual(new Set([kansas, papoulas]));
	});

	it("precisa de 2 letras", () => {
		expect(cenasDaBailarina(itens, "a").size).toBe(0);
	});
});

describe("PROGRAMA", () => {
	it("não repete faixa entre cenas", () => {
		const faixas = PROGRAMA.filter(ehCena).flatMap((c) => c.faixas);
		expect(new Set(faixas).size).toBe(faixas.length);
	});
});

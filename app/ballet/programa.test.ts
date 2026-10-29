import { describe, expect, it } from "vitest";
import { cenasDaBailarina, cenasDoLugar, ehCena, PROGRAMA, type ItemPrograma } from "./programa";

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

describe("cenasDoLugar", () => {
	it("conta as cenas até o próximo lugar", () => {
		const itens: ItemPrograma[] = [
			{ lugar: "Kansas", imagem: "kansas" },
			{ titulo: "Tia Anne", faixas: ["02"], nomes: [] },
			{ titulo: "Solo Dorothy", faixas: ["03"], nomes: [] },
			{ lugar: "O tornado", imagem: "tornado" },
			{ titulo: "A Tempestade", faixas: ["04"], nomes: [] },
		];
		expect(cenasDoLugar(itens, 0)).toBe(2);
		expect(cenasDoLugar(itens, 3)).toBe(1);
	});

	it("os lugares cobrem as 30 cenas do programa", () => {
		const soma = PROGRAMA.reduce((total, item, i) => total + ("lugar" in item ? cenasDoLugar(PROGRAMA, i) : 0), 0);
		expect(soma).toBe(PROGRAMA.filter(ehCena).length);
		expect(soma).toBe(30);
	});
});

import { describe, expect, it } from "vitest";
import { formatarDuracao, formatarTotal, somarDuracoes } from "./duracao";

describe("formatarDuracao", () => {
	it.each([
		[191.05, "3:11"],
		[59.6, "1:00"],
		[5, "0:05"],
		[3725, "1:02:05"],
	])("%s → %s", (s, texto) => expect(formatarDuracao(s)).toBe(texto));
});

describe("formatarTotal", () => {
	it.each([
		[4350, "1h 13min"],
		[3600, "1h"],
		[2400, "40min"],
	])("%s → %s", (s, texto) => expect(formatarTotal(s)).toBe(texto));
});

describe("somarDuracoes", () => {
	const faixas = [
		{ numero: "18", nome: "Leoa", drive: "a" },
		{ numero: "18.1", nome: "Leoa", drive: "b", obs: "outra versão" },
		{ numero: "19", nome: "Leoazinhas", drive: "c" },
		{ numero: "20", nome: "Dorothy", drive: "d" },
	];

	it("soma todas, inclusive as outras versões, e conta as que faltam", () => {
		expect(somarDuracoes(faixas, { a: 100, b: 75, c: 50 })).toEqual({ segundos: 225, faltam: 1 });
	});
});

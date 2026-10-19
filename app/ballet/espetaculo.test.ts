import { describe, expect, it } from "vitest";
import { diasParaEspetaculo, espetaculoEmDivulgacao, textoContagem } from "./espetaculo";

describe("contagem do espetáculo", () => {
	it("conta os dias pelo calendário de Brasília", () => {
		expect(diasParaEspetaculo(new Date("2026-10-19T13:00:00Z"))).toBe(27);
		// 23h de 14/11 em Brasília já é 15/11 em UTC, mas ainda falta 1 dia
		expect(diasParaEspetaculo(new Date("2026-11-15T02:00:00Z"))).toBe(1);
		expect(diasParaEspetaculo(new Date("2026-11-15T03:00:00Z"))).toBe(0);
		expect(diasParaEspetaculo(new Date("2026-11-16T12:00:00Z"))).toBe(-1);
	});

	it("escreve o texto da contagem", () => {
		expect(textoContagem(27)).toBe("Faltam 27 dias");
		expect(textoContagem(1)).toBe("É amanhã!");
		expect(textoContagem(0)).toBe("É hoje!");
		expect(textoContagem(-1)).toBeNull();
	});

	it("divulga até o fim do dia 15/11 em Brasília", () => {
		expect(espetaculoEmDivulgacao(new Date("2026-11-16T02:59:00Z"))).toBe(true);
		expect(espetaculoEmDivulgacao(new Date("2026-11-16T03:00:00Z"))).toBe(false);
	});
});

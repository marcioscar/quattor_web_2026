import { describe, expect, it } from "vitest";
import { validarObservacao } from "./observacoes";

const faixas = new Set(["abc"]);

describe("validarObservacao", () => {
	it("aceita ok sem texto e limpa o nome", () => {
		expect(validarObservacao({ faixa: "abc", situacao: "ok", professor: "  Ana   Paula ", texto: " " }, faixas)).toEqual({
			ok: true,
			dados: { faixa: "abc", situacao: "ok", professor: "Ana Paula", texto: null },
		});
	});

	it("pede o que ajustar", () => {
		expect(validarObservacao({ faixa: "abc", situacao: "ajustar", professor: "Ana" }, faixas)).toEqual({
			ok: false,
			erro: "Conte o que precisa ajustar.",
		});
	});

	it("recusa faixa desconhecida, situação inválida e nome vazio", () => {
		expect(validarObservacao({ faixa: "x", situacao: "ok", professor: "Ana" }, faixas).ok).toBe(false);
		expect(validarObservacao({ faixa: "abc", situacao: "talvez", professor: "Ana" }, faixas).ok).toBe(false);
		expect(validarObservacao({ faixa: "abc", situacao: "ok", professor: " " }, faixas).ok).toBe(false);
	});
});

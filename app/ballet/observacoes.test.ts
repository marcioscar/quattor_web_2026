import { describe, expect, it } from "vitest";
import { situacaoDaFaixa, validarObservacao, validarResolucao } from "./observacoes";

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

describe("validarResolucao", () => {
	it("pede id válido e nome", () => {
		expect(validarResolucao({ id: "6ad8afa4bbcd25f8d8135022", professor: " Ana " })).toEqual({
			ok: true,
			id: "6ad8afa4bbcd25f8d8135022",
			professor: "Ana",
		});
		expect(validarResolucao({ id: "x", professor: "Ana" }).ok).toBe(false);
		expect(validarResolucao({ id: "6ad8afa4bbcd25f8d8135022", professor: "" }).ok).toBe(false);
	});
});

describe("situacaoDaFaixa", () => {
	const ok = { situacao: "ok" as const, resolvidoEm: null };
	const ajustar = { situacao: "ajustar" as const, resolvidoEm: null };
	const resolvido = { situacao: "ajustar" as const, resolvidoEm: "2026-10-21T12:00:00.000Z" };

	it("sem avaliação não mostra selo", () => {
		expect(situacaoDaFaixa([])).toBeNull();
	});

	it("ajuste pendente vence um ok mais novo", () => {
		expect(situacaoDaFaixa([ok, ajustar, ajustar])).toEqual({ situacao: "ajustar", pendentes: 2 });
	});

	it("tudo resolvido volta para ok", () => {
		expect(situacaoDaFaixa([resolvido])).toEqual({ situacao: "ok", pendentes: 0 });
	});
});

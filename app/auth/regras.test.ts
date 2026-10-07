import { describe, expect, it } from "vitest";
import {
	CODIGO_MAX_TENTATIVAS,
	agoraRelogioBrasilia,
	avaliarCodigo,
	conferirSegredo,
	formatarDataBrasilia,
	formatarDataHistorico,
	gerarCodigo,
	hashSegredo,
	inicioDoDiaBrasilia,
	normalizarEmail,
	podeReenviar,
	validarNovaSenha,
	wherePlanoVigente,
	type RegistroCodigo,
} from "./regras";

describe("normalizarEmail", () => {
	it("tira espaços das pontas e põe em minúsculo", () => {
		expect(normalizarEmail("  Fulano.Silva@Gmail.COM ")).toBe("fulano.silva@gmail.com");
	});
	it("trata vazio e nulo", () => {
		expect(normalizarEmail(null)).toBe("");
		expect(normalizarEmail(undefined)).toBe("");
		expect(normalizarEmail("   ")).toBe("");
	});
});

describe("hash de senha no formato do recepção", () => {
	// Gerado com o mesmo código de hashSenha (recepcao/apps/web/app/lib/auth.server.ts).
	const HASH_RECEPCAO =
		"1f06f0638939657b5174e41f855700b0:aafe5f40059398f3517e385973787eba00a564f66b67bbe5bd9b1556a2476fd6576162bbc930f80924ce257bf523a6a58e820403ba95a513897c41f9bb9eff28";

	it("confere uma senha gravada pelo recepção", () => {
		expect(conferirSegredo("Quattor#2026", HASH_RECEPCAO)).toBe(true);
		expect(conferirSegredo("quattor#2026", HASH_RECEPCAO)).toBe(false);
	});

	it("gera salt:hash em hex com 16 e 64 bytes", () => {
		const h = hashSegredo("minhasenha");
		expect(h).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
		expect(conferirSegredo("minhasenha", h)).toBe(true);
		expect(hashSegredo("minhasenha")).not.toBe(h); // salt aleatório
	});

	it("hash vazio ou malformado não confere", () => {
		expect(conferirSegredo("x", null)).toBe(false);
		expect(conferirSegredo("x", "")).toBe(false);
		expect(conferirSegredo("x", "semdoispontos")).toBe(false);
		expect(conferirSegredo("x", "abcd:1234")).toBe(false);
	});
});

describe("código de acesso", () => {
	const agora = new Date("2026-10-07T12:00:00Z");
	const registro = (parcial: Partial<RegistroCodigo> = {}): RegistroCodigo => ({
		codigoHash: hashSegredo("042137"),
		expiraEm: new Date(agora.getTime() + 15 * 60 * 1000),
		tentativas: 0,
		usadoEm: null,
		...parcial,
	});

	it("gera 6 dígitos", () => {
		for (let i = 0; i < 50; i++) expect(gerarCodigo()).toMatch(/^\d{6}$/);
	});

	it("aceita o código certo, inclusive com espaço digitado no meio", () => {
		expect(avaliarCodigo(registro(), "042137", agora)).toBe("ok");
		expect(avaliarCodigo(registro(), "042 137", agora)).toBe("ok");
	});

	it("recusa o código errado", () => {
		expect(avaliarCodigo(registro(), "042138", agora)).toBe("invalido");
		expect(avaliarCodigo(registro(), "42137", agora)).toBe("invalido");
	});

	it("sem registro, usado, vencido ou bloqueado", () => {
		expect(avaliarCodigo(null, "042137", agora)).toBe("inexistente");
		expect(avaliarCodigo(registro({ usadoEm: agora }), "042137", agora)).toBe("usado");
		expect(avaliarCodigo(registro({ expiraEm: new Date(agora.getTime() - 1) }), "042137", agora)).toBe(
			"expirado",
		);
		expect(avaliarCodigo(registro({ tentativas: CODIGO_MAX_TENTATIVAS }), "042137", agora)).toBe(
			"bloqueado",
		);
	});

	it("a 5ª tentativa ainda vale; depois de 5 erros, bloqueia", () => {
		expect(avaliarCodigo(registro({ tentativas: CODIGO_MAX_TENTATIVAS - 1 }), "042137", agora)).toBe("ok");
	});

	it("reenvio só depois de 60 segundos", () => {
		expect(podeReenviar(null, agora)).toBe(true);
		expect(podeReenviar(new Date(agora.getTime() - 59_999), agora)).toBe(false);
		expect(podeReenviar(new Date(agora.getTime() - 60_000), agora)).toBe(true);
	});
});

describe("validarNovaSenha", () => {
	it("exige 8 caracteres e as duas iguais", () => {
		expect(validarNovaSenha("1234567", "1234567")).toMatch(/8 caracteres/);
		expect(validarNovaSenha("12345678", "12345679")).toMatch(/não são iguais/);
		expect(validarNovaSenha("12345678", "12345678")).toBeNull();
	});
});

describe("dia de Brasília", () => {
	it("às 22h de Brasília (01h UTC do dia seguinte) ainda é o mesmo dia", () => {
		const agora = new Date("2026-10-08T01:00:00Z"); // 07/10 22:00 em Brasília
		expect(inicioDoDiaBrasilia(agora).toISOString()).toBe("2026-10-07T03:00:00.000Z");
		expect(formatarDataBrasilia(agora)).toBe("07/10/2026");
	});

	it("vencimento de hoje (gravado 03:00Z) continua vigente até 23:59 de Brasília", () => {
		const where = wherePlanoVigente(new Date("2026-10-08T02:59:00Z"));
		const venceHoje = new Date("2026-10-07T03:00:00Z");
		expect(venceHoje.getTime() >= where.OR[2].vencimento!.gte!.getTime()).toBe(true);
	});

	it("contratação de amanhã fica de fora", () => {
		const where = wherePlanoVigente(new Date("2026-10-07T15:00:00Z"));
		expect(where.dataContratacao.lte.toISOString()).toBe("2026-10-08T02:59:59.999Z");
		expect(where.status.in).toEqual(["active", "suspended"]);
	});
});

describe("data do histórico", () => {
	it("grava o relógio de Brasília e formata como a API (dd/mm/aa)", () => {
		const agora = new Date("2026-10-08T01:30:00Z"); // 07/10 22:30 em Brasília
		const gravada = agoraRelogioBrasilia(agora);
		expect(gravada.toISOString()).toBe("2026-10-07T22:30:00.000Z");
		expect(formatarDataHistorico(gravada)).toBe("07/10/26");
	});
});

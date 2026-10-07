/**
 * Regras puras do login de aluno — sem banco, sem e-mail, para dar pra testar.
 *
 * O formato da senha é o MESMO do recepção (apps/web/app/lib/auth.server.ts,
 * hashSenha/verificarSenha): "<salt>:<hash>", os dois em hex, com
 * hash = scrypt(senha, salt-em-texto-hex, 64). O recepção e este projeto
 * gravam no mesmo campo Aluno.senhaHash, então qualquer divergência aqui
 * tranca o aluno para fora.
 */
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

/** E-mail do jeito que comparamos: minúsculo e sem espaços nas pontas. */
export function normalizarEmail(email: string | null | undefined): string {
	return (email ?? "").trim().toLowerCase();
}

/** Hash no formato do recepção — serve para a senha e para o código de acesso. */
export function hashSegredo(segredo: string): string {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(segredo, salt, 64).toString("hex");
	return `${salt}:${hash}`;
}

/** Confere em tempo constante. Hash vazio ou malformado = não confere. */
export function conferirSegredo(segredo: string, segredoHash: string | null | undefined): boolean {
	if (!segredoHash) return false;
	const [salt, hash] = segredoHash.split(":");
	if (!salt || !hash) return false;
	const calculado = scryptSync(segredo, salt, 64);
	const esperado = Buffer.from(hash, "hex");
	return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

// ── Código de primeiro acesso / esqueci a senha ─────────────────────────────

export const CODIGO_VALIDADE_MS = 15 * 60 * 1000;
export const CODIGO_MAX_TENTATIVAS = 5;
export const CODIGO_INTERVALO_REENVIO_MS = 60 * 1000;

/** 6 dígitos, com zero à esquerda. */
export function gerarCodigo(): string {
	return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export interface RegistroCodigo {
	codigoHash: string;
	expiraEm: Date;
	tentativas: number;
	usadoEm: Date | null;
}

export type ResultadoCodigo = "ok" | "inexistente" | "usado" | "expirado" | "bloqueado" | "invalido";

/**
 * Situação do código digitado contra o registro mais recente do e-mail.
 * A ordem importa: código usado, vencido ou bloqueado nem chega a ser
 * comparado (e "invalido" é o único caso que conta tentativa).
 */
export function avaliarCodigo(
	registro: RegistroCodigo | null,
	codigoDigitado: string,
	agora: Date = new Date(),
): ResultadoCodigo {
	if (!registro) return "inexistente";
	if (registro.usadoEm) return "usado";
	if (agora.getTime() > registro.expiraEm.getTime()) return "expirado";
	if (registro.tentativas >= CODIGO_MAX_TENTATIVAS) return "bloqueado";
	const codigo = codigoDigitado.replace(/\D/g, "");
	if (codigo.length !== 6 || !conferirSegredo(codigo, registro.codigoHash)) return "invalido";
	return "ok";
}

/** Só se pede outro código 60 s depois do último. */
export function podeReenviar(ultimoCriadoEm: Date | null | undefined, agora: Date = new Date()): boolean {
	if (!ultimoCriadoEm) return true;
	return agora.getTime() - ultimoCriadoEm.getTime() >= CODIGO_INTERVALO_REENVIO_MS;
}

// ── Nova senha ──────────────────────────────────────────────────────────────

export const SENHA_MIN_CARACTERES = 8;

/** null = pode; senão, a mensagem para a tela. */
export function validarNovaSenha(senha: string, confirmacao: string): string | null {
	if (senha.length < SENHA_MIN_CARACTERES) {
		return `A senha precisa ter pelo menos ${SENHA_MIN_CARACTERES} caracteres.`;
	}
	if (senha !== confirmacao) return "As duas senhas não são iguais.";
	return null;
}

// ── Dia no horário de Brasília ─────────────────────────────────────────────
//
// O servidor roda em UTC (contêiner), mas "hoje" é o dia de Brasília: os
// vencimentos estão gravados à meia-noite de Brasília (03:00Z), e com o corte
// em UTC um plano que vence hoje apareceria vencido das 21h às 24h.
// Brasília não tem horário de verão desde 2019: UTC−3 fixo.

const OFFSET_BRASILIA_MS = 3 * 60 * 60 * 1000;
const MS_DIA = 24 * 60 * 60 * 1000;

/** 00:00 de Brasília do dia de `data`, como instante UTC. */
export function inicioDoDiaBrasilia(data: Date = new Date()): Date {
	const relogio = new Date(data.getTime() - OFFSET_BRASILIA_MS);
	return new Date(
		Date.UTC(relogio.getUTCFullYear(), relogio.getUTCMonth(), relogio.getUTCDate()) +
			OFFSET_BRASILIA_MS,
	);
}

/** dd/mm/aaaa no dia de Brasília. */
export function formatarDataBrasilia(data: Date): string {
	const relogio = new Date(data.getTime() - OFFSET_BRASILIA_MS);
	const dd = String(relogio.getUTCDate()).padStart(2, "0");
	const mm = String(relogio.getUTCMonth() + 1).padStart(2, "0");
	return `${dd}/${mm}/${relogio.getUTCFullYear()}`;
}

// ── Matrícula vigente ──────────────────────────────────────────────────────

/** Status que contam como matrícula viva — igual a STATUS_PLANO_VIGENTE do recepção. */
export const STATUS_PLANO_VIGENTE = ["active", "suspended"];

/**
 * `where` do Prisma equivalente a `whereVigenteEm` do recepção
 * (apps/web/app/features/alunos/situacao-plano.ts):
 * - vence hoje ainda vale hoje (corte no início do dia);
 * - sem vencimento conta como vigente — no Mongo `{ vencimento: null }` não
 *   acha o documento sem o campo, por isso o `isSet: false` junto;
 * - renovação que só começa amanhã (`dataContratacao` futura) ainda não vale.
 */
export function wherePlanoVigente(agora: Date = new Date()) {
	const inicio = inicioDoDiaBrasilia(agora);
	const fim = new Date(inicio.getTime() + MS_DIA - 1);
	return {
		status: { in: STATUS_PLANO_VIGENTE },
		dataContratacao: { lte: fim },
		OR: [{ vencimento: null }, { vencimento: { isSet: false } }, { vencimento: { gte: inicio } }],
	};
}

/**
 * Aluno Wellhub não tem PlanoContratado: entra se tiver `wellhubId` e um
 * check-in nos últimos N dias — sinal de que o convênio dele segue ativo.
 */
export const WELLHUB_JANELA_DIAS = 30;

export function inicioJanelaWellhub(agora: Date = new Date()): Date {
	return new Date(agora.getTime() - WELLHUB_JANELA_DIAS * MS_DIA);
}

// ── E-mail no Mongo ────────────────────────────────────────────────────────

/** Aluno cujo e-mail, normalizado no banco, é igual a `emailNormalizado`. */
export function filtroEmail(emailNormalizado: string) {
	return {
		$expr: {
			$eq: [{ $toLower: { $trim: { input: { $ifNull: ["$email", ""] } } } }, emailNormalizado],
		},
	};
}

// ── Histórico de treino ────────────────────────────────────────────────────
//
// A API antiga (Flask) gravava `histexe[].data` com `datetime.now()` sem fuso
// num servidor em Brasília: o Mongo guarda o RELÓGIO de Brasília como se fosse
// UTC. Este projeto grava igual, para a coleção não misturar dois formatos, e
// lê com os getters UTC — o mesmo `strftime("%d/%m/%y")` da API.

/** "Agora" no formato do histórico: relógio de Brasília gravado como UTC. */
export function agoraRelogioBrasilia(agora: Date = new Date()): Date {
	return new Date(agora.getTime() - OFFSET_BRASILIA_MS);
}

/** dd/mm/aa de uma data do histórico (lida com os getters UTC). */
export function formatarDataHistorico(data: Date): string {
	const dd = String(data.getUTCDate()).padStart(2, "0");
	const mm = String(data.getUTCMonth() + 1).padStart(2, "0");
	const aa = String(data.getUTCFullYear()).slice(-2);
	return `${dd}/${mm}/${aa}`;
}

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cookies ASSINADOS com HMAC (SESSION_SECRET). Antes o cookie era a matrícula
 * em texto puro: bastava editar `quattor_session=1234` para entrar como outro
 * aluno. Agora o valor é `<conteúdo>.<assinatura>` e o que não confere é
 * ignorado (vira "não logado").
 */
const COOKIE_NAME = "quattor_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

/** Lista de alunos de um e-mail de família, enquanto a pessoa escolhe qual. */
const COOKIE_ESCOLHA = "quattor_escolha";
const MAX_AGE_ESCOLHA = 5 * 60; // 5 minutos

function segredo(): string {
	const s = process.env.SESSION_SECRET;
	if (!s) throw new Error("SESSION_SECRET não configurado");
	return s;
}

function assinar(valor: string): string {
	const assinatura = createHmac("sha256", segredo()).update(valor).digest("base64url");
	return `${valor}.${assinatura}`;
}

function conferirAssinatura(assinado: string): string | null {
	const ponto = assinado.lastIndexOf(".");
	if (ponto <= 0) return null;
	const valor = assinado.slice(0, ponto);
	const recebida = Buffer.from(assinado.slice(ponto + 1));
	const esperada = Buffer.from(assinar(valor).slice(ponto + 1));
	if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return null;
	return valor;
}

function lerCookie(request: Request, nome: string): string | null {
	const cookieHeader = request.headers.get("Cookie");
	if (!cookieHeader) return null;
	const match = cookieHeader.match(new RegExp(`(?:^|;)\\s*${nome}=([^;]*)`));
	if (!match) return null;
	const value = decodeURIComponent(match[1].trim());
	return value || null;
}

function montarCookie(nome: string, valor: string, maxAge: number): string {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
	return `${nome}=${encodeURIComponent(valor)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

// ── Sessão: guarda a matrícula (Aluno.idMembro) ─────────────────────────────

export function getSessionRegistration(request: Request): string | null {
	const bruto = lerCookie(request, COOKIE_NAME);
	if (!bruto) return null;
	const registration = conferirAssinatura(bruto);
	return registration && /^\d+$/.test(registration) ? registration : null;
}

export function createSessionCookie(registration: string): string {
	return montarCookie(COOKIE_NAME, assinar(registration), MAX_AGE);
}

export function destroySessionCookie(): string {
	return montarCookie(COOKIE_NAME, "", 0);
}

// ── Escolha do aluno (e-mail de família) ────────────────────────────────────

type Escolha = { matriculas: number[]; expiraEm: number };

export function createEscolhaCookie(matriculas: number[]): string {
	const conteudo: Escolha = { matriculas, expiraEm: Date.now() + MAX_AGE_ESCOLHA * 1000 };
	const valor = Buffer.from(JSON.stringify(conteudo)).toString("base64url");
	return montarCookie(COOKIE_ESCOLHA, assinar(valor), MAX_AGE_ESCOLHA);
}

/** Matrículas que o login liberou para escolha — vazio se faltar, vencer ou não conferir. */
export function getEscolhaMatriculas(request: Request): number[] {
	const bruto = lerCookie(request, COOKIE_ESCOLHA);
	const valor = bruto ? conferirAssinatura(bruto) : null;
	if (!valor) return [];
	try {
		const conteudo = JSON.parse(Buffer.from(valor, "base64url").toString()) as Escolha;
		if (Date.now() > conteudo.expiraEm) return [];
		return conteudo.matriculas.filter((m) => Number.isInteger(m));
	} catch {
		return [];
	}
}

export function destroyEscolhaCookie(): string {
	return montarCookie(COOKIE_ESCOLHA, "", 0);
}

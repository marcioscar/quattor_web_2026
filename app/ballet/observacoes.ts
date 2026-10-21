/** Observação de um professor sobre uma faixa — validação do formulário de /musicas. */
export const SITUACOES = ["ok", "ajustar"] as const;
export type Situacao = (typeof SITUACOES)[number];

export type NovaObservacao = { faixa: string; situacao: Situacao; professor: string; texto: string | null };

export function validarObservacao(
	form: { faixa?: unknown; situacao?: unknown; professor?: unknown; texto?: unknown },
	faixasValidas: Set<string>,
): { ok: true; dados: NovaObservacao } | { ok: false; erro: string } {
	const faixa = String(form.faixa ?? "");
	const situacao = String(form.situacao ?? "");
	const professor = limparNome(form.professor);
	const texto = String(form.texto ?? "").trim();

	if (!faixasValidas.has(faixa)) return { ok: false, erro: "Música não encontrada." };
	if (!(SITUACOES as readonly string[]).includes(situacao)) return { ok: false, erro: "Marque se a música está ok ou precisa ajustar." };
	if (!professor) return { ok: false, erro: "Coloque o seu nome." };
	if (professor.length > 60) return { ok: false, erro: "Nome muito longo." };
	if (situacao === "ajustar" && !texto) return { ok: false, erro: "Conte o que precisa ajustar." };
	if (texto.length > 1000) return { ok: false, erro: "Observação muito longa (até 1000 letras)." };

	return { ok: true, dados: { faixa, situacao: situacao as Situacao, professor, texto: texto || null } };
}

/** Nome de quem está agindo: sem espaços sobrando, até 60 letras. */
function limparNome(nome: unknown): string {
	return String(nome ?? "").trim().replace(/\s+/g, " ");
}

export function validarResolucao(form: {
	id?: unknown;
	professor?: unknown;
}): { ok: true; id: string; professor: string } | { ok: false; erro: string } {
	const id = String(form.id ?? "");
	const professor = limparNome(form.professor);
	if (!/^[0-9a-f]{24}$/.test(id)) return { ok: false, erro: "Observação não encontrada." };
	if (!professor) return { ok: false, erro: "Coloque o seu nome no campo acima para marcar como resolvido." };
	if (professor.length > 60) return { ok: false, erro: "Nome muito longo." };
	return { ok: true, id, professor };
}

/**
 * Situação da faixa na lista: "ajustar" enquanto houver pedido de ajuste sem
 * resolver; "ok" se já foi avaliada e não há pendência; null se ninguém avaliou.
 */
export function situacaoDaFaixa(
	observacoes: { situacao: Situacao; resolvidoEm: string | null }[],
): { situacao: Situacao; pendentes: number } | null {
	if (observacoes.length === 0) return null;
	const pendentes = observacoes.filter((o) => o.situacao === "ajustar" && !o.resolvidoEm).length;
	return { situacao: pendentes > 0 ? "ajustar" : "ok", pendentes };
}

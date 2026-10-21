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
	const professor = String(form.professor ?? "").trim().replace(/\s+/g, " ");
	const texto = String(form.texto ?? "").trim();

	if (!faixasValidas.has(faixa)) return { ok: false, erro: "Música não encontrada." };
	if (!(SITUACOES as readonly string[]).includes(situacao)) return { ok: false, erro: "Marque se a música está ok ou precisa ajustar." };
	if (!professor) return { ok: false, erro: "Coloque o seu nome." };
	if (professor.length > 60) return { ok: false, erro: "Nome muito longo." };
	if (situacao === "ajustar" && !texto) return { ok: false, erro: "Conte o que precisa ajustar." };
	if (texto.length > 1000) return { ok: false, erro: "Observação muito longa (até 1000 letras)." };

	return { ok: true, dados: { faixa, situacao: situacao as Situacao, professor, texto: texto || null } };
}

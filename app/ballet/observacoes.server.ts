import { db } from "../db.server";
import type { NovaObservacao, Situacao } from "./observacoes";

export type Observacao = { id: string; faixa: string; situacao: Situacao; professor: string; texto: string | null; criadoEm: string };

/** Todas as observações, da mais nova para a mais antiga. */
export async function listarObservacoes(): Promise<Observacao[]> {
	const linhas = await db.webMusicaObservacao.findMany({ orderBy: { criadoEm: "desc" } });
	return linhas.map((l) => ({
		id: l.id,
		faixa: l.faixa,
		situacao: l.situacao === "ajustar" ? "ajustar" : "ok",
		professor: l.professor,
		texto: l.texto ?? null,
		criadoEm: l.criadoEm.toISOString(),
	}));
}

export async function criarObservacao(dados: NovaObservacao): Promise<void> {
	await db.webMusicaObservacao.create({ data: dados });
}

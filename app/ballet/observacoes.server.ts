import { db } from "../db.server";
import type { NovaObservacao, Situacao } from "./observacoes";

export type Observacao = {
	id: string;
	faixa: string;
	situacao: Situacao;
	professor: string;
	texto: string | null;
	criadoEm: string;
	resolvidoEm: string | null;
	resolvidoPor: string | null;
};

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
		resolvidoEm: l.resolvidoEm?.toISOString() ?? null,
		resolvidoPor: l.resolvidoPor ?? null,
	}));
}

export async function criarObservacao(dados: NovaObservacao): Promise<void> {
	await db.webMusicaObservacao.create({ data: dados });
}

/** Marca um pedido de ajuste como resolvido; o primeiro a marcar fica registrado. */
export async function resolverObservacao(id: string, professor: string): Promise<void> {
	await db.webMusicaObservacao.updateMany({
		// Observações antigas nem têm o campo: no Mongo, "null" não pega campo ausente.
		where: { id, situacao: "ajustar", OR: [{ resolvidoEm: null }, { resolvidoEm: { isSet: false } }] },
		data: { resolvidoEm: new Date(), resolvidoPor: professor },
	});
}

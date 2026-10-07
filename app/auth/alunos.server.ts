/**
 * Acesso ao banco do login de aluno. As regras (normalizar e-mail, validade do
 * código, hash) ficam em regras.ts; aqui só as consultas.
 *
 * Em Aluno, este projeto só GRAVA `senhaHash` e `senhaDefinidaEm` — ver o
 * aviso no topo de prisma/schema.prisma.
 */
import { db } from "~/db.server";
import {
	CODIGO_VALIDADE_MS,
	filtroEmail,
	inicioJanelaWellhub,
	wherePlanoVigente,
} from "./regras";

export type AlunoDoEmail = {
	id: string;
	nome: string;
	sobrenome: string;
	idMembro: number | null;
	wellhubId: string | null;
	senhaHash: string | null;
};

/**
 * Alunos de um e-mail (família = vários). A comparação normalizada é feita
 * no Mongo com $expr, porque o e-mail está gravado como veio da EVO.
 */
export async function alunosDoEmail(emailNormalizado: string): Promise<AlunoDoEmail[]> {
	if (!emailNormalizado) return [];
	const brutos = (await db.aluno.findRaw({
		filter: filtroEmail(emailNormalizado),
		options: { projection: { _id: 1 } },
	})) as unknown as { _id: { $oid: string } }[];
	const ids = brutos.map((b) => b._id.$oid);
	if (ids.length === 0) return [];
	const alunos = await db.aluno.findMany({
		where: { id: { in: ids } },
		select: { id: true, nome: true, sobrenome: true, idMembro: true, wellhubId: true, senhaHash: true },
	});
	return alunos.map((a) => ({
		...a,
		nome: a.nome ?? "",
		sobrenome: a.sobrenome ?? "",
	}));
}

/**
 * Dos alunos dados, os que podem entrar: plano vigente (mesma regra do
 * recepção) ou Wellhub com check-in recente. Sem número de membro não entra —
 * é a matrícula que vai na sessão.
 */
export async function alunosLiberados<T extends AlunoDoEmail>(alunos: T[], agora = new Date()): Promise<T[]> {
	const comNumero = alunos.filter((a) => a.idMembro != null);
	if (comNumero.length === 0) return [];

	const planos = await db.planoContratado.findMany({
		where: { alunoId: { in: comNumero.map((a) => a.id) }, ...wherePlanoVigente(agora) },
		select: { alunoId: true },
	});
	const comPlano = new Set(planos.map((p) => p.alunoId));

	const tokens = comNumero.map((a) => a.wellhubId?.trim()).filter((t): t is string => !!t);
	const checkins = tokens.length
		? await db.wellhubCheckin.findMany({
				where: { gympassId: { in: tokens }, recebidoEm: { gte: inicioJanelaWellhub(agora) } },
				select: { gympassId: true },
			})
		: [];
	const wellhubAtivo = new Set(checkins.map((c) => c.gympassId));

	return comNumero.filter((a) => comPlano.has(a.id) || (a.wellhubId && wellhubAtivo.has(a.wellhubId.trim())));
}

/**
 * Uma senha por e-mail: grava o mesmo hash em TODOS os alunos dele. O Prisma
 * traduz o updateMany num `$set` só destes dois campos.
 */
export async function gravarSenhaDoEmail(emailNormalizado: string, senhaHash: string): Promise<number> {
	const alunos = await alunosDoEmail(emailNormalizado);
	if (alunos.length === 0) return 0;
	const { count } = await db.aluno.updateMany({
		where: { id: { in: alunos.map((a) => a.id) } },
		data: { senhaHash, senhaDefinidaEm: new Date() },
	});
	return count;
}

// ── Código de acesso (coleção WebAlunoCodigoAcesso, deste projeto) ─────────

export function ultimoCodigo(emailNormalizado: string) {
	return db.webAlunoCodigoAcesso.findFirst({
		where: { email: emailNormalizado },
		orderBy: { criadoEm: "desc" },
	});
}

export async function criarCodigo(emailNormalizado: string, codigoHash: string, agora = new Date()) {
	await db.webAlunoCodigoAcesso.create({
		data: {
			email: emailNormalizado,
			codigoHash,
			expiraEm: new Date(agora.getTime() + CODIGO_VALIDADE_MS),
			tentativas: 0,
			usadoEm: null,
			criadoEm: agora,
		},
	});
}

export async function registrarTentativaErrada(id: string) {
	await db.webAlunoCodigoAcesso.updateMany({
		where: { id, usadoEm: null },
		data: { tentativas: { increment: 1 } },
	});
}

/** Marca como usado só se ainda não foi — dois envios ao mesmo tempo não usam o mesmo código. */
export async function consumirCodigo(id: string): Promise<boolean> {
	const { count } = await db.webAlunoCodigoAcesso.updateMany({
		where: { id, usadoEm: null },
		data: { usadoEm: new Date() },
	});
	return count === 1;
}

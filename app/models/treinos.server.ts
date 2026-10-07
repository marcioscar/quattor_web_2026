/**
 * Dados do aluno e dos treinos, direto do banco — substitui as chamadas à
 * api.quattoracademia.com (antigo api_access.ts). Os formatos devolvidos são
 * os mesmos que a API devolvia, para as telas não mudarem.
 */
import { db } from "~/db.server";
import {
	agoraRelogioBrasilia,
	formatarDataBrasilia,
	formatarDataHistorico,
	inicioJanelaWellhub,
	wherePlanoVigente,
} from "~/auth/regras";

export type AlunoResumo = {
	name: string;
	photo: string;
	plano: string;
	endDate: string;
	registration: number;
	status: string;
};

/** Nome, foto e plano vigente (ou Wellhub) — o que a API montava a partir da EVO. */
export async function buscarAluno(registration: number): Promise<AlunoResumo | null> {
	const aluno = await db.aluno.findFirst({
		where: { idMembro: registration },
		select: { id: true, nome: true, fotoUrl: true, wellhubId: true },
	});
	if (!aluno) return null;

	const plano = await db.planoContratado.findFirst({
		where: { alunoId: aluno.id, ...wherePlanoVigente() },
		orderBy: { vencimento: "desc" },
		select: { nomePlano: true, vencimento: true },
	});

	let wellhub = false;
	if (!plano && aluno.wellhubId?.trim()) {
		wellhub =
			(await db.wellhubCheckin.count({
				where: { gympassId: aluno.wellhubId.trim(), recebidoEm: { gte: inicioJanelaWellhub() } },
			})) > 0;
	}

	return {
		name: aluno.nome ?? "",
		photo: aluno.fotoUrl ?? "",
		plano: plano?.nomePlano ?? (wellhub ? "wellhub" : ""),
		endDate: plano?.vencimento ? formatarDataBrasilia(plano.vencimento) : "",
		registration,
		status: plano || wellhub ? "active" : "Inactive",
	};
}

/** Exercícios do grupo na semana (coleção `treinos`) — como o GET /exercicio/ da API. */
export async function buscarExercicios(semana: string, grupo: string): Promise<unknown[]> {
	const treino = await db.treino.findFirst({
		where: { semana: Number(semana), grupo },
		select: { exercicios: true },
	});
	if (!treino) throw { type: "NOT_FOUND", message: "Exercícios não encontrados" };
	return Array.isArray(treino.exercicios) ? treino.exercicios : [];
}

// ── historicoExercicios ─────────────────────────────────────────────────────
//
// Sem model no Prisma (tipos misturados, ver prisma/schema.prisma): lido e
// gravado com $runCommandRaw, que fala Extended JSON — datas chegam como
// { $date: ... } e números longos vão como { $numberLong: ... }.

type ItemHistoricoBruto = { grupo?: unknown; data?: unknown; nome?: unknown; carga?: unknown };

function lerDataEjson(valor: unknown): Date | null {
	if (valor && typeof valor === "object" && "$date" in valor) {
		const d = (valor as { $date: unknown }).$date;
		if (typeof d === "string") return new Date(d);
		if (d && typeof d === "object" && "$numberLong" in d) return new Date(Number((d as { $numberLong: string }).$numberLong));
	}
	return null;
}

/**
 * Histórico do aluno no formato da API: `{ histexe: [{ grupo, data, nome, carga }] }`
 * com `data` em dd/mm/aa. Sem documento devolve lista vazia (a API dava 404).
 */
export async function buscarHistorico(registration: number): Promise<{ histexe: Record<string, unknown>[] }> {
	const resposta = (await db.$runCommandRaw({
		find: "historicoExercicios",
		filter: { aluno: { $in: [registration, String(registration)] } },
		limit: 1,
	})) as { cursor?: { firstBatch?: { histexe?: ItemHistoricoBruto[] }[] } };

	const itens = resposta.cursor?.firstBatch?.[0]?.histexe ?? [];
	return {
		histexe: itens.map((item) => {
			const data = lerDataEjson(item.data);
			return {
				grupo: item.grupo ?? "",
				nome: item.nome ?? "",
				carga: item.carga ?? "",
				// Texto antigo (ex.: "16/01/25") passa como está.
				data: data ? formatarDataHistorico(data) : String(item.data ?? ""),
			};
		}),
	};
}

/** Acrescenta um exercício feito — o mesmo $push com upsert do POST /registrar/ da API. */
export async function registrarTreino(registration: number, grupo: string, nome: string, carga = ""): Promise<void> {
	await db.$runCommandRaw({
		update: "historicoExercicios",
		updates: [
			{
				q: { aluno: { $numberLong: String(registration) } },
				u: {
					$push: {
						histexe: {
							grupo,
							data: { $date: agoraRelogioBrasilia().toISOString() },
							nome,
							carga,
						},
					},
				},
				upsert: true,
			},
		],
	});
}

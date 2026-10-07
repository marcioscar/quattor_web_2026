/**
 * Aulas do dia para a home, direto do banco — substitui o GET /aulas_by_date/
 * da API, que repassava o cronograma da EVO.
 *
 * Mesma camada de dados de `listarAgenda` do recepção
 * (features/aulas/sessoes.server.ts): busca Turma + AulaSessao + Feriado e
 * delega ao motor `./sessoes.ts` (cópia do recepção). A ocupação é a mesma
 * das telas do recepção: matrículas ATIVAS no dia em `TurmaMatricula`.
 */
import { db } from "~/db.server";
import { inicioDoDiaBrasilia } from "~/auth/regras";
import {
	ocorrenciasNoIntervalo,
	resolverOcorrencias,
	type FeriadoDia,
	type RegraTurma,
	type SessaoGravada,
} from "./sessoes";

/** Formato que a home já usava (o da EVO). */
export type Aula = {
	activityDate: string;
	/** null = turma sem limite cadastrado */
	capacity: number | null;
	endTime: string;
	idActivity: number;
	instructor: string;
	name: string;
	startTime: string;
	ocupation: number;
};

/**
 * Fora da home, como antes: Musculação (sala livre, um registro por horário
 * só para manter a grade — o recepção também esconde) e Quattor Prime, que a
 * home filtrava pelo idActivity 39 da EVO.
 */
const NOMES_FORA = ["Musculação"];
const ID_ACTIVITY_FORA = [19, 39];

const MS_DIA = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" de hoje em Brasília. */
export function hojeBrasilia(agora: Date = new Date()): string {
	return new Date(inicioDoDiaBrasilia(agora).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function aulasDoDia(dia: string): Promise<Aula[]> {
	const inicio = new Date(`${dia}T03:00:00.000Z`); // 00:00 em Brasília
	const fimExclusivo = new Date(inicio.getTime() + MS_DIA);

	const [turmas, sessoes, feriados] = await Promise.all([
		db.turma.findMany({ where: { ativo: true, nome: { notIn: NOMES_FORA } } }),
		db.aulaSessao.findMany({ where: { dia } }),
		db.feriado.findMany({ where: { dia } }),
	]);

	const regras: RegraTurma[] = turmas
		.filter((t) => t.diaSemana != null && t.horaInicio && t.horaFim)
		.map((t) => ({
			id: t.id,
			nome: t.nome ?? "",
			diaSemana: t.diaSemana as number,
			horaInicio: t.horaInicio as string,
			horaFim: t.horaFim as string,
			professorId: null,
			professorNome: t.professor?.trim() || null,
			capacidade: t.capacidade ?? null,
			ativo: true,
			centroReceitaId: t.centroReceitaId ?? null,
			vigenciaInicio: t.vigenciaInicio ?? null,
			vigenciaFim: t.vigenciaFim ?? null,
		}));

	// Só sessões das turmas que a home mostra: as órfãs (turma inativa,
	// Musculação) são registro de chamada, não aula a anunciar.
	const idsRegras = new Set(regras.map((r) => r.id));
	const gravadas: SessaoGravada[] = sessoes
		.filter((s) => idsRegras.has(s.turmaId))
		.map((s) => ({
			id: s.id,
			turmaId: s.turmaId,
			dia: s.dia,
			horaInicio: s.horaInicio ?? "",
			horaFim: s.horaFim ?? "",
			professorId: null,
			professorNome: s.professorNome ?? null,
			capacidade: s.capacidade ?? null,
			status: s.status === "cancelada" ? "cancelada" : "realizada",
			motivoCancelamento: null,
			substituicao: false,
			chamadaFeitaEm: null,
		}));

	const feriadosDia: FeriadoDia[] = feriados.map((f) => ({
		dia: f.dia,
		nome: f.nome ?? "",
		tipo: f.tipo ?? "feriado",
		atingeTodas: f.atingeTodas ?? true,
		centroReceitaIds: f.centroReceitaIds,
		cancelaAPartirDe: f.cancelaAPartirDe ?? null,
	}));

	const ocorrencias = resolverOcorrencias(ocorrenciasNoIntervalo(regras, dia, dia), gravadas, feriadosDia, regras)
		.filter((o) => o.status !== "cancelada");

	// Matrícula ativa no dia — espelho de `whereAtivaEm` do recepção: `inicio`
	// até o fim do dia, `fim` vazio/ausente ou a partir do início do dia.
	const matriculas = await db.turmaMatricula.groupBy({
		by: ["turmaId"],
		where: {
			turmaId: { in: ocorrencias.map((o) => o.turmaId) },
			status: "ativa",
			inicio: { lt: fimExclusivo },
			OR: [{ fim: null }, { fim: { isSet: false } }, { fim: { gte: inicio } }],
		},
		_count: { _all: true },
	});
	const ocupacao = new Map(matriculas.map((m) => [m.turmaId, m._count._all]));
	const idActivity = new Map(turmas.map((t) => [t.id, t.evoIdActivity ?? 0]));

	return ocorrencias
		.filter((o) => !ID_ACTIVITY_FORA.includes(idActivity.get(o.turmaId) ?? 0))
		.map((o) => ({
			activityDate: `${o.dia}T00:00:00`,
			capacity: o.capacidade,
			endTime: o.horaFim,
			idActivity: idActivity.get(o.turmaId) ?? 0,
			instructor: o.professorNome ?? "",
			name: o.turmaNome,
			startTime: o.horaInicio,
			ocupation: ocupacao.get(o.turmaId) ?? 0,
		}));
}

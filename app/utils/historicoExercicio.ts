/**
 * Histórico de treinos: matching por nome, filtro por período e “feito hoje”.
 * Regras explícitas para evitar falsos positivos (substring curta) e duplicatas (mesmo dia).
 */

export type TreinoHistorico = {
	carga?: string;
	data: string;
	grupo?: string;
	nome: string;
	/** Se a API enviar (ex.: Mongo), usamos para nunca fundir registros distintos. */
	_id?: string;
	id?: string | number;
};

export type HistoricoExercicioItem = {
	data: string;
	nome: string;
	carga: string;
};

function normalizarTexto(valor: string): string {
	return valor
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();
}

/** Remove sufixo tipo " 3x10" ou " 3 x 10" no final do nome. */
function removerSeriesRepeticoes(valor: string): string {
	return valor.replace(/\s+\d+\s*[x×]\s*\d+.*$/i, "").trim();
}

export function chaveExercicio(nomeExercicio: string): string {
	return normalizarTexto(removerSeriesRepeticoes(nomeExercicio));
}

function partesNomeComposto(nome: string): string[] {
	return nome
		.split("+")
		.map((p) => p.trim())
		.filter(Boolean);
}

/**
 * Verifica se o nome do exercício na lista corresponde a uma parte vinda do histórico
 * (evita "gl" bater em "gluteo" por includes solto; exige igualdade ou prefixo com espaço).
 */
export function nomesExercicioCompativeis(
	nomeLista: string,
	parteHistorico: string,
): boolean {
	const a = chaveExercicio(nomeLista);
	const b = chaveExercicio(parteHistorico);
	if (!a || !b) return false;
	if (a === b) return true;

	const menor = a.length <= b.length ? a : b;
	const maior = a.length > b.length ? a : b;
	if (menor.length < 4) return false;

	return maior.startsWith(menor + " ") || maior === menor;
}

export function parseDataHistorico(dataStr: string): Date | null {
	if (!dataStr) return null;

	const isoMatch = dataStr.match(/^\d{4}-\d{2}-\d{2}/);
	if (isoMatch) {
		const dataIso = new Date(dataStr);
		return Number.isNaN(dataIso.getTime()) ? null : dataIso;
	}

	const partes = dataStr.trim().split("/");
	if (partes.length !== 3) return null;

	const dia = Number.parseInt(partes[0], 10);
	const mes = Number.parseInt(partes[1], 10) - 1;
	let ano = Number.parseInt(partes[2], 10);
	if (ano < 100) ano += 2000;
	if (!Number.isFinite(dia) || !Number.isFinite(mes) || !Number.isFinite(ano)) {
		return null;
	}

	const data = new Date(ano, mes, dia);
	if (data.getDate() !== dia || data.getMonth() !== mes) return null;
	return data;
}

/** Chave YYYY-MM-DD no fuso local para deduplicar o mesmo dia. */
export function chaveDiaLocal(dataStr: string): string | null {
	const d = parseDataHistorico(dataStr);
	if (!d) return null;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

/** Mesmo formato que a API costuma usar (dd/MM/aa), no fuso local — evita duplicar ISO vs BR. */
export function dataAgoraFormatoHistorico(): string {
	const d = new Date();
	const dd = String(d.getDate()).padStart(2, "0");
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const aa = String(d.getFullYear()).slice(-2);
	return `${dd}/${mm}/${aa}`;
}

/** Exibição única na lista (sempre dd/MM/yyyy). */
export function formatarDataHistoricoExibicao(dataStr: string): string {
	const d = parseDataHistorico(dataStr);
	if (!d) return dataStr;
	return d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function ehUltimos30Dias(data: Date): boolean {
	const agora = new Date();
	const trintaDiasAtras = new Date(agora);
	trintaDiasAtras.setDate(agora.getDate() - 30);
	return (
		data.getTime() >= trintaDiasAtras.getTime() &&
		data.getTime() <= agora.getTime()
	);
}

function ehMesmoDia(dataA: Date, dataB: Date): boolean {
	return (
		dataA.getFullYear() === dataB.getFullYear() &&
		dataA.getMonth() === dataB.getMonth() &&
		dataA.getDate() === dataB.getDate()
	);
}

function historicoCombinaComNomeLista(
	nomeLista: string,
	nomeHistoricoCompleto: string,
): boolean {
	const partes = partesNomeComposto(nomeHistoricoCompleto);
	if (partes.length === 0) return false;
	return partes.some((parte) => nomesExercicioCompativeis(nomeLista, parte));
}

function dataCampoComoString(val: unknown): string | null {
	if (val == null) return null;
	if (typeof val === "string") return val;
	if (typeof val === "number" && Number.isFinite(val)) return String(val);
	if (val instanceof Date && !Number.isNaN(val.getTime())) return val.toISOString();
	return null;
}

/** Ordem importa: novo formato da API usa `histexe`. */
const CHAVES_ARRAY_HISTORICO = [
	"histexe",
	"data",
	"historico",
	"treinos",
	"items",
	"registros",
	"result",
] as const;

function extrairArrayHistoricoApi(data: unknown): unknown[] {
	if (!data) return [];
	if (Array.isArray(data)) return data;
	if (typeof data !== "object" || data === null) return [];
	const o = data as Record<string, unknown>;
	for (const k of CHAVES_ARRAY_HISTORICO) {
		const v = o[k];
		if (Array.isArray(v)) return v;
	}
	for (const k of CHAVES_ARRAY_HISTORICO) {
		const v = o[k];
		if (v != null && typeof v === "object" && !Array.isArray(v)) {
			const nested = extrairArrayHistoricoApi(v);
			if (nested.length > 0) return nested;
		}
	}
	return [];
}

function mapearItemTreinoHistorico(item: unknown): TreinoHistorico | null {
	if (item == null || typeof item !== "object") return null;
	const o = item as Record<string, unknown>;
	const grupoRaw = o.grupo;
	const grupo =
		typeof grupoRaw === "string"
			? grupoRaw
			: grupoRaw != null
				? String(grupoRaw)
				: undefined;
	const grupoTrim = grupo?.trim() ?? "";

	const nomeRaw = o.nome ?? o.exercicio ?? o.titulo ?? o.descricao;
	let nome =
		typeof nomeRaw === "string"
			? nomeRaw
			: typeof nomeRaw === "number"
				? String(nomeRaw)
				: "";
	nome = nome.trim();
	if (!nome) {
		nome = grupoTrim ? `Treino (${grupoTrim})` : "(sem nome)";
	}
	const dataStr =
		dataCampoComoString(o.data) ??
		dataCampoComoString(o.dt) ??
		dataCampoComoString(o.dataTreino) ??
		dataCampoComoString(o.createdAt);
	if (!dataStr) return null;
	const cargaRaw = o.carga;
	const carga =
		typeof cargaRaw === "string"
			? cargaRaw
			: cargaRaw != null
				? String(cargaRaw)
				: undefined;
	const _id = typeof o._id === "string" ? o._id : undefined;
	const id = o.id as string | number | undefined;

	return {
		nome: nome.trim(),
		data: dataStr,
		grupo,
		carga,
		_id,
		id,
	};
}

export function normalizarHistoricoTreinos(data: unknown): TreinoHistorico[] {
	const arr = extrairArrayHistoricoApi(data);
	const resultado: TreinoHistorico[] = [];
	for (const item of arr) {
		const m = mapearItemTreinoHistorico(item);
		if (m) resultado.push(m);
	}
	return resultado;
}

/**
 * Uma linha por dia + exercício da lista (evita ISO + DD/MM/YY duplicados).
 */
export function filtrarHistoricoExercicioUltimoMes(
	historico: TreinoHistorico[],
	nomeExercicio: string,
): HistoricoExercicioItem[] {
	const chaveLista = chaveExercicio(nomeExercicio);
	if (!chaveLista) return [];

	const porChaveDia = new Map<string, HistoricoExercicioItem>();

	for (const item of historico) {
		const data = parseDataHistorico(item.data);
		if (!data || !ehUltimos30Dias(data)) continue;
		if (!historicoCombinaComNomeLista(nomeExercicio, item.nome)) continue;

		const dia = chaveDiaLocal(item.data);
		if (!dia) continue;

		const chaveUnica = `${dia}|${chaveLista}`;
		if (porChaveDia.has(chaveUnica)) continue;

		porChaveDia.set(chaveUnica, {
			data: item.data,
			nome: item.nome,
			carga: item.carga?.trim() || "-",
		});
	}

	return Array.from(porChaveDia.values()).sort((a, b) => {
		const da = parseDataHistorico(a.data)?.getTime() ?? 0;
		const db = parseDataHistorico(b.data)?.getTime() ?? 0;
		return db - da;
	});
}

export function exercicioFoiTreinadoHoje(
	historico: TreinoHistorico[],
	nomeExercicio: string,
): boolean {
	const hoje = new Date();
	return historico.some((item) => {
		const data = parseDataHistorico(item.data);
		if (!data || !ehMesmoDia(data, hoje)) return false;
		return historicoCombinaComNomeLista(nomeExercicio, item.nome);
	});
}

/**
 * Chave estável por registro: prioriza id da API; senão linha exata (não funde treinos diferentes).
 */
export function chaveDedupHistorico(item: TreinoHistorico): string {
	const idApi = item._id ?? item.id;
	if (idApi != null && String(idApi).trim() !== "") {
		return `id:${String(idApi)}`;
	}
	const dataRaw = String(item.data ?? "").trim();
	const g = (item.grupo ?? "").trim();
	const n = String(item.nome ?? "").trim();
	return `${dataRaw}|${g}|${n}`;
}

function escolherRegistroPreferido(
	a: TreinoHistorico,
	b: TreinoHistorico,
): TreinoHistorico {
	const idA = a._id ?? a.id;
	const idB = b._id ?? b.id;
	if (idA != null && idB == null) return a;
	if (idB != null && idA == null) return b;
	const lenA = String(a.data ?? "").length;
	const lenB = String(b.data ?? "").length;
	return lenA >= lenB ? a : b;
}

/**
 * Junta linhas com o mesmo dia + grupo + nome (ex.: otimista `08/04/26` + API `08/04/2026`).
 * Mantém um registro por “treino lógico”, sem apagar outros exercícios do mesmo dia.
 */
function dedupeMesmoDiaGrupoNome(items: TreinoHistorico[]): TreinoHistorico[] {
	const mapa = new Map<string, TreinoHistorico>();
	const semDiaParseavel: TreinoHistorico[] = [];

	for (const item of items) {
		const dia = chaveDiaLocal(item.data);
		if (!dia) {
			semDiaParseavel.push(item);
			continue;
		}
		const g = (item.grupo ?? "").trim();
		const n = chaveExercicio(item.nome);
		const chaveLogica = `${dia}|${g}|${n}`;
		const atual = mapa.get(chaveLogica);
		if (!atual) {
			mapa.set(chaveLogica, item);
			continue;
		}
		mapa.set(chaveLogica, escolherRegistroPreferido(atual, item));
	}
	return [...Array.from(mapa.values()), ...semDiaParseavel];
}

/**
 * Mescla histórico da API com otimista: não funde registros distintos (só duplicata exata ou mesmo dia+nome+grupo).
 */
export function mergeHistoricoDedup(
	api: TreinoHistorico[],
	...extras: TreinoHistorico[]
): TreinoHistorico[] {
	const mapa = new Map<string, TreinoHistorico>();

	const inserir = (item: TreinoHistorico) => {
		const k = chaveDedupHistorico(item);
		if (!mapa.has(k)) mapa.set(k, item);
	};

	for (const item of api) inserir(item);
	for (const item of extras) inserir(item);

	const fundido = dedupeMesmoDiaGrupoNome(Array.from(mapa.values()));

	return fundido.sort((a, b) => {
		const ta = parseDataHistorico(a.data)?.getTime() ?? 0;
		const tb = parseDataHistorico(b.data)?.getTime() ?? 0;
		return tb - ta;
	});
}

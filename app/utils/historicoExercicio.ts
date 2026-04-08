export type TreinoHistorico = {
	carga?: string;
	data: string;
	grupo?: string;
	nome: string;
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

function removerSeriesRepeticoes(valor: string): string {
	return valor.replace(/\s+\d+\s*[x×]\s*\d+.*$/i, "").trim();
}

export function chaveExercicio(nomeExercicio: string): string {
	return normalizarTexto(removerSeriesRepeticoes(nomeExercicio));
}

function parseDataHistorico(dataStr: string): Date | null {
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

function ehUltimos30Dias(data: Date): boolean {
	const agora = new Date();
	const trintaDiasAtras = new Date(agora);
	trintaDiasAtras.setDate(agora.getDate() - 30);
	return data.getTime() >= trintaDiasAtras.getTime() && data.getTime() <= agora.getTime();
}

function ehMesmoDia(dataA: Date, dataB: Date): boolean {
	return (
		dataA.getFullYear() === dataB.getFullYear() &&
		dataA.getMonth() === dataB.getMonth() &&
		dataA.getDate() === dataB.getDate()
	);
}

function correspondeNomeExercicio(
	nomeExercicio: string,
	nomeHistorico: string,
): boolean {
	const exercicioNormalizado = chaveExercicio(nomeExercicio);
	const historicoNormalizado = chaveExercicio(nomeHistorico);
	if (!exercicioNormalizado || !historicoNormalizado) return false;
	return (
		historicoNormalizado.includes(exercicioNormalizado) ||
		exercicioNormalizado.includes(historicoNormalizado)
	);
}

export function normalizarHistoricoTreinos(data: unknown): TreinoHistorico[] {
	if (!data) return [];
	if (Array.isArray(data)) {
		return data.filter(
			(item): item is TreinoHistorico =>
				item != null &&
				typeof item === "object" &&
				"nome" in item &&
				typeof (item as { nome: unknown }).nome === "string" &&
				"data" in item &&
				typeof (item as { data: unknown }).data === "string",
		);
	}

	if (typeof data === "object" && data !== null && "data" in data) {
		return normalizarHistoricoTreinos((data as { data: unknown }).data);
	}

	return [];
}

export function filtrarHistoricoExercicioUltimoMes(
	historico: TreinoHistorico[],
	nomeExercicio: string,
): HistoricoExercicioItem[] {
	const filtrado = historico
		.filter((item) => {
			const data = parseDataHistorico(item.data);
			if (!data || !ehUltimos30Dias(data)) return false;
			const partesNome = item.nome
				.split("+")
				.map((parte) => parte.trim())
				.filter(Boolean);
			return partesNome.some((parte) =>
				correspondeNomeExercicio(nomeExercicio, parte),
			);
		})
		.map((item) => ({
			data: item.data,
			nome: item.nome,
			carga: item.carga?.trim() || "-",
		}));

	return filtrado.sort((a, b) => {
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
		const partesNome = item.nome
			.split("+")
			.map((parte) => parte.trim())
			.filter(Boolean);
		return partesNome.some((parte) =>
			correspondeNomeExercicio(nomeExercicio, parte),
		);
	});
}

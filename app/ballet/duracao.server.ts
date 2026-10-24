import { parseWebStream } from "music-metadata";
import type { Faixa } from "./musicas";

/**
 * Duração de cada áudio da pasta. O Drive não informa duração de áudio, então
 * o servidor baixa o arquivo (download público) e lê o cabeçalho. Cada arquivo
 * é lido uma vez; a chave inclui o "modificado" da pasta, então um áudio
 * trocado em "Gerenciar versões" é relido.
 */

const SIMULTANEOS = 3;
const ESPERA_MS = 3000;
const TENTAR_DE_NOVO_MS = 10 * 60 * 1000;

const duracoes = new Map<string, number>();
const falhas = new Map<string, number>(); // chave → quando falhou
const lendo = new Map<string, Promise<void>>();
const fila: Array<() => void> = [];
let ativos = 0;

const chave = (f: Faixa) => `${f.drive}|${f.modificado ?? ""}`;

async function vez<T>(tarefa: () => Promise<T>): Promise<T> {
	if (ativos >= SIMULTANEOS) await new Promise<void>((liberar) => fila.push(liberar));
	ativos++;
	try {
		return await tarefa();
	} finally {
		ativos--;
		fila.shift()?.();
	}
}

async function medir(drive: string): Promise<number> {
	const resposta = await fetch(`https://drive.google.com/uc?export=download&id=${drive}`, {
		signal: AbortSignal.timeout(60_000),
	});
	const tipo = resposta.headers.get("content-type") ?? "";
	// Arquivo grande demais ou sem acesso: o Drive devolve uma página HTML.
	if (!resposta.ok || !resposta.body || tipo.startsWith("text/")) {
		await resposta.body?.cancel();
		throw new Error(`download indisponível (HTTP ${resposta.status}, ${tipo})`);
	}
	try {
		const meta = await parseWebStream(
			resposta.body,
			{ mimeType: tipo, size: Number(resposta.headers.get("content-length")) || undefined },
			{ duration: true, skipCovers: true },
		);
		if (!meta.format.duration) throw new Error("arquivo sem duração");
		return meta.format.duration;
	} finally {
		await resposta.body.cancel().catch(() => {});
	}
}

function ler(f: Faixa): Promise<void> {
	const k = chave(f);
	let p = lendo.get(k);
	if (!p) {
		p = vez(() => medir(f.drive))
			.then((segundos) => {
				duracoes.set(k, segundos);
				falhas.delete(k);
			})
			.catch((erro) => {
				console.error(`[musicas] falha ao ler a duração de ${f.numero} ${f.nome}:`, erro);
				falhas.set(k, Date.now());
			})
			.finally(() => lendo.delete(k));
		lendo.set(k, p);
	}
	return p;
}

/**
 * Durações conhecidas, em segundos, por id do Drive. Dispara a leitura das que
 * faltam e espera no máximo 3s por elas; as mais lentas aparecem no próximo acesso.
 */
export async function duracoesDasFaixas(faixas: Faixa[]): Promise<Record<string, number>> {
	const pendentes = faixas
		.filter((f) => !duracoes.has(chave(f)) && Date.now() - (falhas.get(chave(f)) ?? 0) > TENTAR_DE_NOVO_MS)
		.map(ler);
	if (pendentes.length) {
		await Promise.race([Promise.all(pendentes), new Promise((r) => setTimeout(r, ESPERA_MS))]);
	}
	const resultado: Record<string, number> = {};
	for (const f of faixas) {
		const d = duracoes.get(chave(f));
		if (d !== undefined) resultado[f.drive] = d;
	}
	return resultado;
}

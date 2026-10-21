import { FAIXAS, PASTA_ID, type Faixa } from "./musicas";
import { faixasDaPasta } from "./pastaDrive";

const VALIDADE_MS = 5 * 60 * 1000;

/** Última leitura boa da pasta. Começa com a lista fixa de musicas.ts. */
let cache: { faixas: Faixa[]; lidoEm: number } = { faixas: FAIXAS, lidoEm: 0 };
let lendo: Promise<void> | null = null;

async function atualizar(): Promise<void> {
	try {
		const resposta = await fetch(`https://drive.google.com/embeddedfolderview?id=${PASTA_ID}`, {
			signal: AbortSignal.timeout(5000),
		});
		if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
		const faixas = faixasDaPasta(await resposta.text());
		// Lista vazia = pasta vazia ou o Google mudou a página: fica com a anterior.
		if (faixas.length === 0) throw new Error("nenhuma faixa encontrada na pasta");
		cache = { faixas, lidoEm: Date.now() };
	} catch (erro) {
		console.error("[musicas] falha ao ler a pasta do Drive; mantendo a última lista:", erro);
		cache = { ...cache, lidoEm: Date.now() }; // espera a validade antes de tentar de novo
	}
}

/** Faixas da pasta do Drive, relidas no máximo a cada 5 minutos. */
export async function faixasDoDrive(): Promise<Faixa[]> {
	if (Date.now() - cache.lidoEm > VALIDADE_MS) {
		lendo ??= atualizar().finally(() => (lendo = null));
		await lendo;
	}
	return cache.faixas;
}

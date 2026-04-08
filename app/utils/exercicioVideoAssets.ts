/**
 * Mapeia nomes de arquivo retornados pela API (ex.: `producao.gif`) para URLs
 * geradas pelo Vite a partir de `app/assets/`.
 */
const modulosUrl = import.meta.glob<string>("../assets/**/*.{gif,png,jpg,jpeg,webp,svg}", {
	eager: true,
	query: "?url",
	import: "default",
});

function normalizarChaveArquivo(nome: string): string {
	return nome
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/\s+/g, "_")
		.replace(/[^a-z0-9._-]/g, "");
}

function construirMapaNomeParaUrl(): Map<string, string> {
	const mapa = new Map<string, string>();
	for (const caminho of Object.keys(modulosUrl)) {
		const url = modulosUrl[caminho];
		const nomeArquivo = caminho.split("/").pop();
		if (!nomeArquivo || !url) continue;
		mapa.set(nomeArquivo, url);
		mapa.set(nomeArquivo.toLowerCase(), url);
		mapa.set(normalizarChaveArquivo(nomeArquivo), url);
	}
	return mapa;
}

const urlPorNomeArquivo = construirMapaNomeParaUrl();

/**
 * Resolve o valor do campo `video` da API para uma URL servida pelo app.
 * Aceita só o nome do arquivo (ex.: `producao.gif`) igual aos arquivos em `app/assets/`.
 */
export function resolverUrlVideoLocal(referencia: string): string | undefined {
	const nome = referencia.trim().replace(/^\/+/, "");
	if (!nome) return undefined;
	return (
		urlPorNomeArquivo.get(nome) ??
		urlPorNomeArquivo.get(nome.toLowerCase()) ??
		urlPorNomeArquivo.get(normalizarChaveArquivo(nome))
	);
}

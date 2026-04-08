import { buildUrlMidiaExercicio } from "~/models/api_access";
import { resolverUrlVideoLocal } from "~/utils/exercicioVideoAssets";

export type DetalhesExercicio = {
	nome: string;
	repeticoes?: string;
	/** URL absoluta para exibir vídeo/GIF ou link. */
	videoUrl?: string;
	notas?: string;
};

/** GIF placeholder “vídeo em produção” — não exibir na UI. */
function ehPlaceholderProducao(referencia: string): boolean {
	const t = referencia.trim().split("?")[0];
	const nome = t.split(/[/\\]/).pop()?.toLowerCase() ?? "";
	return nome === "producao.gif" || nome === "_producao.gif";
}

/** Prioriza arquivo em `app/assets/`; senão URL http(s); senão URL na API. */
function resolverUrlVideo(referencia: string): string | undefined {
	const t = referencia.trim();
	if (!t) return undefined;
	if (/^https?:\/\//i.test(t)) return t;
	const local = resolverUrlVideoLocal(t);
	if (local) return local;
	return buildUrlMidiaExercicio(t) || undefined;
}

function primeiroTexto(
	o: Record<string, unknown>,
	chaves: string[],
): string | undefined {
	for (const k of chaves) {
		const v = o[k];
		if (typeof v === "string" && v.trim()) return v.trim();
		if (typeof v === "number" && Number.isFinite(v)) return String(v);
	}
	return undefined;
}

/** Interpreta um item da API de exercícios (inclui `Repeticoes`, `obs`, `video` relativos). */
export function extrairDetalhesExercicio(item: unknown): DetalhesExercicio {
	if (item == null) {
		return { nome: "—" };
	}
	if (typeof item !== "object") {
		return { nome: String(item) };
	}
	const o = item as Record<string, unknown>;
	const nome =
		primeiroTexto(o, ["nome", "exercicio", "titulo", "descricao"]) ?? "Exercício";

	const repeticoes = primeiroTexto(o, [
		"Repeticoes",
		"repeticoes",
		"repetições",
		"repeticao",
		"series",
		"serie",
		"seriesTreino",
	]);

	const rawVideo = primeiroTexto(o, [
		"video",
		"url_video",
		"urlVideo",
		"link_video",
		"linkVideo",
		"youtube",
		"url",
	]);
	const videoUrl =
		rawVideo && !ehPlaceholderProducao(rawVideo)
			? resolverUrlVideo(rawVideo)
			: undefined;

	const notas = primeiroTexto(o, [
		"obs",
		"observacao",
		"observação",
		"notas",
		"detalhes",
	]);

	return {
		nome,
		repeticoes,
		videoUrl,
		notas,
	};
}

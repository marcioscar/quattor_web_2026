import type { Faixa } from "./musicas";

/** 191.05 → "3:11"; 3725 → "1:02:05". */
export function formatarDuracao(segundos: number): string {
	const total = Math.round(segundos);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = String(total % 60).padStart(2, "0");
	return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** 4350 → "1h 13min"; 2400 → "40min". */
export function formatarTotal(segundos: number): string {
	const minutos = Math.round(segundos / 60);
	const h = Math.floor(minutos / 60);
	const m = minutos % 60;
	return h ? `${h}h${m ? ` ${m}min` : ""}` : `${m}min`;
}

/**
 * Soma do espetáculo: as "outras versões" (18.1 ao lado da 18) não entram,
 * porque só uma das duas vai tocar. `faltam` = faixas ainda sem duração.
 */
export function somarDuracoes(faixas: Faixa[], duracoes: Record<string, number>) {
	let segundos = 0;
	let faltam = 0;
	for (const f of faixas) {
		if (f.obs === "outra versão") continue;
		const d = duracoes[f.drive];
		if (d === undefined) faltam++;
		else segundos += d;
	}
	return { segundos, faltam };
}

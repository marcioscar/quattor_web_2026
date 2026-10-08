/**
 * Número da semana ISO 8601 (1–53) para uma data.
 * Alinhado à convenção comum de “semana do ano” em APIs.
 */
export function semanaISO8601(data: Date): number {
	const d = new Date(data.getTime());
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
	const week1 = new Date(d.getFullYear(), 0, 4);
	return (
		1 +
		Math.round(
			((d.getTime() - week1.getTime()) / 86400000 -
				3 +
				((week1.getDay() + 6) % 7)) /
				7,
		)
	);
}

/**
 * Ano ISO 8601 da semana: o ano da quinta-feira dela. Difere do ano civil na
 * virada (01/01/2027 ainda é a semana 53 de 2026; 29/12/2025 já é a semana 1
 * de 2026). Os treinos são gravados com esse ano, junto com a semana.
 */
export function anoISO8601(data: Date): number {
	const d = new Date(data.getTime());
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
	return d.getFullYear();
}

/** Valor enviado à API em `semana` (semana ISO da data atual no servidor). */
export function semanaDoAnoAtualParaApi(): string {
	return String(semanaISO8601(new Date()));
}

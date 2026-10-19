/** Espetáculo de ballet de fim de ano — "O Mágico de Oz", 15/11/2026. */
export const ESPETACULO = {
	titulo: "O Mágico de Oz",
	data: "15 de novembro de 2026",
	dataCurta: "15/11",
	diaSemana: "Domingo",
	local: "Teatro Caesb",
	mapa: "https://www.google.com/maps/search/?api=1&query=Teatro+Caesb+Brasilia",
	sessoes: [
		{
			hora: "16h30",
			ingresso:
				"https://www.bilheteriadigital.com/espetaculo-de-ballet-classico-quattor-o-magico-de-oz-sessao-16h30-15-de-novembro",
		},
		{
			hora: "19h",
			ingresso:
				"https://www.bilheteriadigital.com/espetaculo-de-ballet-classico-quattor-o-magico-de-oz-15-de-novembro-sessao-19-horas",
		},
	],
};

/** Até o fim do dia do espetáculo em Brasília (16/11 00:00 = 03:00 UTC). */
const FIM_DIVULGACAO = Date.parse("2026-11-16T03:00:00.000Z");

export function espetaculoEmDivulgacao(agora: Date = new Date()): boolean {
	return agora.getTime() < FIM_DIVULGACAO;
}

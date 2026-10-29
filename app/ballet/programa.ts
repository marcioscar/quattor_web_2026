/**
 * Conteúdo do programa do espetáculo (/programa_ballet).
 *
 * RASCUNHO montado a partir da lista de músicas do Drive (29/10/2026): uma cena
 * por faixa, com "faixas" guardando os números das músicas de origem. Turmas,
 * bailarinas, elenco e equipe ainda estão por preencher. `conferir` aparece na
 * página só enquanto RASCUNHO for true.
 *
 * Nomes das bailarinas: primeiro nome + inicial do sobrenome (página aberta a
 * quem tem o link, e a maioria é criança).
 */

export const RASCUNHO = true;

export type Cena = {
	titulo: string;
	faixas: string[];
	turma?: string;
	estilo?: string;
	nomes: string[];
	conferir?: string;
};

export type ItemPrograma = Cena | { ato: string } | { intervalo: string };

export const PROGRAMA: ItemPrograma[] = [
	{ titulo: "Narração e abertura das cortinas", faixas: ["01"], nomes: [] },
	{ titulo: "Tia Anne e Tio Henry", faixas: ["02"], nomes: [] },
	{ titulo: "Solo Dorothy", faixas: ["03"], nomes: [] },
	{ titulo: "A Tempestade", faixas: ["04"], nomes: [] },
	{ titulo: "Dorothy no Mundo de Oz", faixas: ["05"], nomes: [] },
	{ titulo: "Elfas", faixas: ["06"], nomes: [] },
	{ titulo: "Papoulas", faixas: ["07"], nomes: [] },
	{ titulo: "Camponesa", faixas: ["08"], nomes: [] },
	{ titulo: "Amigas e amigo da Bruxa Boa", faixas: ["09"], nomes: [] },
	{ titulo: "Bruxa Boa", faixas: ["10"], nomes: [] },
	{ titulo: "Bruxa Boa, Bruxa Má e os Sapatinhos Vermelhos", faixas: ["11"], nomes: [] },
	{ titulo: "Estrada de Tijolos Amarelos", faixas: ["12"], nomes: [] },
	{ titulo: "Milharal", faixas: ["13"], nomes: [] },
	{ titulo: "Espantalho", faixas: ["14"], nomes: [] },
	{ titulo: "Espantalhinhas", faixas: ["15"], nomes: [] },
	{ titulo: "Mulher de Lata", faixas: ["16"], nomes: [] },
	{ titulo: "Latinhas", faixas: ["17"], nomes: [] },
	{
		titulo: "Leoa Medrosa",
		faixas: ["18", "18.1"],
		nomes: [],
		conferir: "Juntei as faixas 18 (Cena) e 18.1 (Cena + Solo) numa cena só.",
	},
	{
		titulo: "Leoazinhas",
		faixas: ["19.1", "19.2"],
		nomes: [],
		conferir: "Juntei as faixas 19.1 e 19.2 numa cena só.",
	},
	{ titulo: "Dorothy e seus Amigos", faixas: ["20"], nomes: [] },
	{ titulo: "Cidade das Esmeraldas", faixas: ["21"], nomes: [] },
	{ titulo: "Corte da Cidade das Esmeraldas", faixas: ["22"], nomes: [] },
	{ titulo: "Dorothy e o Mágico de Oz", faixas: ["23"], nomes: [] },
	{ titulo: "A Missão", faixas: ["24"], nomes: [] },
	{ titulo: "Abelhas Gigantes", faixas: ["25"], nomes: [] },
	{ titulo: "As Bruxas, a Derrota da Bruxa Má e a Libertação", faixas: ["27"], nomes: [] },
	{ titulo: "O Mágico de Oz e sua história", faixas: ["28"], nomes: [] },
	{ titulo: "Os Presentes do Mágico", faixas: ["29"], nomes: [] },
	{ titulo: "Camila", faixas: ["30"], nomes: [], conferir: "Qual é o nome desta cena no programa?" },
	{ titulo: "Agradecimentos", faixas: ["31"], turma: "Todo o elenco", nomes: [] },
];

/** Personagem, quem dança (vazio = a definir), cor da faixa lateral. */
export const ELENCO: Array<[personagem: string, bailarina: string, cor: string]> = [
	["Dorothy", "", "#6aa3ff"],
	["Tia Anne", "", "#d9b38c"],
	["Tio Henry", "", "#b08d6a"],
	["Bruxa Boa", "", "#f29ac8"],
	["Bruxa Má", "", "#2fd28c"],
	["Espantalho", "", "#e8c25a"],
	["Mulher de Lata", "", "#c9d1d6"],
	["Leoa Medrosa", "", "#f0a640"],
	["Mágico de Oz", "", "#e0263f"],
];

/** Função, nome (vazio = a definir). */
export const EQUIPE: Array<[funcao: string, nome: string]> = [
	["Direção artística", ""],
	["Coreografia", ""],
	["Figurino", ""],
	["Cenário e iluminação", ""],
	["Produção", "Quattor Academia"],
];

export function ehCena(item: ItemPrograma): item is Cena {
	return "titulo" in item;
}

/** "Alice M." → "alice m."; tira acentos para a busca achar "Cecilia" em "Cecília". */
export function normalizarNome(texto: string): string {
	return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Cenas em que aparece alguém cujo nome contém o termo (mín. 2 letras). */
export function cenasDaBailarina(itens: ItemPrograma[], termo: string): Set<Cena> {
	const t = normalizarNome(termo);
	const achadas = new Set<Cena>();
	if (t.length < 2) return achadas;
	for (const item of itens) {
		if (ehCena(item) && item.nomes.some((n) => normalizarNome(n).includes(t))) achadas.add(item);
	}
	return achadas;
}

/**
 * Conteúdo do programa do espetáculo (/programa_ballet).
 *
 * RASCUNHO montado a partir da lista de músicas do Drive (29/10/2026): uma cena
 * por faixa, com "faixas" guardando os números das músicas de origem. As
 * sinopses saíram do nome das músicas e do livro, e a direção ainda precisa
 * revisar. Turmas, bailarinas, elenco e equipe ainda estão por preencher. `conferir` aparece na
 * página só enquanto RASCUNHO for true.
 *
 * Nomes das bailarinas: primeiro nome + inicial do sobrenome (página aberta a
 * quem tem o link, e a maioria é criança).
 */

export const RASCUNHO = true;

export type Cena = {
	titulo: string;
	/** Uma frase do que acontece na cena, para a plateia acompanhar a história. */
	sinopse?: string;
	faixas: string[];
	turma?: string;
	estilo?: string;
	nomes: string[];
	conferir?: string;
};

export type ItemPrograma = Cena | { ato: string } | { intervalo: string };

export const PROGRAMA: ItemPrograma[] = [
	{ titulo: "Narração e abertura das cortinas", faixas: ["01"], nomes: [] },
	{ titulo: "Tia Anne e Tio Henry", sinopse: "Na fazenda, Dorothy vive com a Tia Anne e o Tio Henry, entre o trabalho no campo e os dias sempre iguais.", faixas: ["02"], nomes: [] },
	{ titulo: "Solo Dorothy", sinopse: "Dorothy sonha com um lugar além do arco-íris, onde tudo seja colorido e cheio de aventura.", faixas: ["03"], nomes: [] },
	{ titulo: "A Tempestade", sinopse: "Um tornado atravessa o Kansas e leva Dorothy, com casa e tudo, para muito longe.", faixas: ["04"], nomes: [] },
	{ titulo: "Dorothy no Mundo de Oz", sinopse: "Dorothy desperta numa terra encantada e descobre que não está mais no Kansas.", faixas: ["05"], nomes: [] },
	{ titulo: "Elfas", sinopse: "As elfas, pequenas moradoras de Oz, aparecem curiosas para conhecer a visitante.", faixas: ["06"], nomes: [] },
	{ titulo: "Papoulas", sinopse: "Campos de papoulas florescem e enchem a terra de Oz de cor.", faixas: ["07"], nomes: [] },
	{ titulo: "Camponesa", sinopse: "Uma camponesa de Oz recebe Dorothy com a alegria do lugar.", faixas: ["08"], nomes: [] },
	{ titulo: "Amigas e amigo da Bruxa Boa", sinopse: "Os amigos da Bruxa Boa anunciam que ela está chegando.", faixas: ["09"], nomes: [] },
	{ titulo: "Bruxa Boa", sinopse: "A Bruxa Boa surge, luminosa, para dar as boas-vindas a Dorothy.", faixas: ["10"], nomes: [] },
	{ titulo: "Bruxa Boa, Bruxa Má e os Sapatinhos Vermelhos", sinopse: "A Bruxa Má quer os sapatinhos vermelhos, mas a Bruxa Boa os entrega a Dorothy, que agora precisa protegê-los.", faixas: ["11"], nomes: [] },
	{ titulo: "Estrada de Tijolos Amarelos", sinopse: "Para voltar para casa, Dorothy deve seguir a estrada de tijolos amarelos até a Cidade das Esmeraldas.", faixas: ["12"], nomes: [] },
	{ titulo: "Milharal", sinopse: "No caminho, a estrada passa por um grande milharal.", faixas: ["13"], nomes: [] },
	{ titulo: "Espantalho", sinopse: "No milharal, Dorothy encontra o Espantalho, que sonha em ter um cérebro, e ele se junta à viagem.", faixas: ["14"], nomes: [] },
	{ titulo: "Espantalhinhas", sinopse: "As espantalhinhas dançam pelo milharal.", faixas: ["15"], nomes: [] },
	{ titulo: "Mulher de Lata", sinopse: "Parada e enferrujada na floresta, a Mulher de Lata volta a se mover e conta que deseja um coração.", faixas: ["16"], nomes: [] },
	{ titulo: "Latinhas", sinopse: "As latinhas dançam ao som do metal.", faixas: ["17"], nomes: [] },
	{
		titulo: "Leoa Medrosa",
		sinopse: "Com um rugido que não assusta ninguém, aparece a Leoa Medrosa, que quer encontrar sua coragem.",
		faixas: ["18", "18.1"],
		nomes: [],
		conferir: "Juntei as faixas 18 (Cena) e 18.1 (Cena + Solo) numa cena só.",
	},
	{
		titulo: "Leoazinhas",
		sinopse: "As leoazinhas dançam com a Leoa Medrosa.",
		faixas: ["19.1", "19.2"],
		nomes: [],
		conferir: "Juntei as faixas 19.1 e 19.2 numa cena só.",
	},
	{ titulo: "Dorothy e seus Amigos", sinopse: "Agora são quatro amigos, seguindo juntos pela estrada amarela.", faixas: ["20"], nomes: [] },
	{ titulo: "Cidade das Esmeraldas", sinopse: "Enfim, as torres verdes da Cidade das Esmeraldas brilham no horizonte.", faixas: ["21"], nomes: [] },
	{ titulo: "Corte da Cidade das Esmeraldas", sinopse: "A corte da Cidade das Esmeraldas recebe os viajantes com toda a sua pompa.", faixas: ["22"], nomes: [] },
	{ titulo: "Dorothy e o Mágico de Oz", sinopse: "Diante do grande e poderoso Mágico de Oz, cada um faz o seu pedido.", faixas: ["23"], nomes: [] },
	{ titulo: "A Missão", sinopse: "O Mágico só atenderá os pedidos se o grupo vencer a Bruxa Má.", faixas: ["24"], nomes: [] },
	{ titulo: "Abelhas Gigantes", sinopse: "A Bruxa Má manda um enxame de abelhas gigantes para deter os amigos.", faixas: ["25"], nomes: [] },
	{ titulo: "As Bruxas, a Derrota da Bruxa Má e a Libertação", sinopse: "Os amigos enfrentam a Bruxa Má, ela é derrotada e quem vivia sob o seu domínio fica livre.", faixas: ["27"], nomes: [] },
	{ titulo: "O Mágico de Oz e sua história", sinopse: "Atrás da cortina, o Mágico revela quem realmente é e conta como chegou a Oz.", faixas: ["28"], nomes: [] },
	{ titulo: "Os Presentes do Mágico", sinopse: "O Mágico entrega os presentes e mostra que o cérebro, o coração e a coragem sempre estiveram com eles.", faixas: ["29"], nomes: [] },
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

/**
 * Conteúdo do programa do espetáculo (/programa_ballet).
 *
 * RASCUNHO montado a partir da lista de músicas do Drive (29/10/2026): uma cena
 * por faixa, com "faixas" guardando os números das músicas de origem. As
 * sinopses saíram do nome das músicas e do livro, e a direção ainda precisa
 * revisar. Turmas e equipe ainda estão por preencher. `conferir` aparece na
 * página só enquanto RASCUNHO for true.
 *
 * Nomes das bailarinas: vêm da planilha "Espetaculo Magico de Oz/nomes.numbers",
 * com nome completo (só os nomes do meio abreviados), como no telão.
 */

export const RASCUNHO = false;

export type Sessao = "16h30" | "19h";

/** Quem dança a cena; `sessao` só quando a pessoa está em uma das sessões. */
export type Pessoa = { nome: string; papel?: string; sessao?: Sessao };

/** Foto do ensaio, em /espetaculo/fotos/<src>; a mesma do telão. */
export type Foto = { src: string; legenda?: string };

export type Cena = {
	titulo: string;
	/** Uma frase do que acontece na cena, para a plateia acompanhar a história. */
	sinopse?: string;
	faixas: string[];
	fotos?: Foto[];
	turma?: string;
	estilo?: string;
	nomes: Pessoa[];
	/** A planilha marca a cena como "cena": quem dança já aparece em outras cenas. */
	semNomes?: boolean;
	conferir?: string;
	/** Mostra só o número e o título, sem turma nem bailarinas. */
	apenasTitulo?: boolean;
};

/** Lugar da história que abre um grupo de cenas; a ilustração fica em /espetaculo/oz/<imagem>.webp. */
export type Lugar = { lugar: string; imagem: string };

export type ItemPrograma = Cena | Lugar | { ato: string } | { intervalo: string };

export const PROGRAMA: ItemPrograma[] = [
	{ lugar: "Kansas", imagem: "kansas" },
	{ titulo: "Tia Anne e Tio Henry", sinopse: "Na fazenda, Dorothy vive com a Tia Anne e o Tio Henry, entre o trabalho no campo e os dias sempre iguais.", faixas: ["02"], fotos: [{ src: "c02a.jpg", legenda: "Tia Anne e Tio Henry" }, { src: "c02b.jpg", legenda: "Tio Henry" }], nomes: [{ nome: "Warley Castro", papel: "Tio Henry" }, { nome: "Flavia Guimaraes", papel: "Tia Anne" }] },
	{ titulo: "Solo Dorothy", sinopse: "Dorothy sonha com um lugar além do arco-íris, onde tudo seja colorido e cheio de aventura.", faixas: ["03"], fotos: [{ src: "dorothy1630.jpg", legenda: "Dorothy · sessão das 16h30" }, { src: "dorothy19.jpg", legenda: "Dorothy · sessão das 19h" }], nomes: [{ nome: "Camila Silva Carneiro", papel: "Dorothy", sessao: "19h" }, { nome: "Maria Fernanda Bastos", papel: "Dorothy", sessao: "16h30" }] },
	{ lugar: "O tornado", imagem: "tornado" },
	{ titulo: "A Tempestade", sinopse: "Um tornado atravessa o Kansas e leva Dorothy, com casa e tudo, para muito longe.", faixas: ["04"], fotos: [{ src: "c04.jpg" }], nomes: [{ nome: "Camila Silva Carneiro" }, { nome: "Amanda Porto" }, { nome: "Beatriz Menon" }, { nome: "Ana Paula Araujo" }, { nome: "Fernanda Bezzi" }, { nome: "Larissa Drumont" }, { nome: "Marina Coimbra" }] },
	{ titulo: "Dorothy no Mundo de Oz", sinopse: "Dorothy desperta numa terra encantada e descobre que não está mais no Kansas.", faixas: ["05"], fotos: [{ src: "dorothy1630.jpg", legenda: "Dorothy · sessão das 16h30" }, { src: "dorothy19.jpg", legenda: "Dorothy · sessão das 19h" }], nomes: [{ nome: "Camila Silva Carneiro", papel: "Dorothy", sessao: "19h" }, { nome: "Maria Fernanda Bastos", papel: "Dorothy", sessao: "16h30" }] },
	{ lugar: "A terra de Oz", imagem: "oz" },
	{ titulo: "Elfas", sinopse: "As elfas, pequenas moradoras de Oz, aparecem curiosas para conhecer a visitante.", faixas: ["06"], fotos: [{ src: "c06.jpg" }], nomes: [{ nome: "Lis Sales de Calçado" }, { nome: "Isis Sales de Calçado" }] },
	{ titulo: "Papoulas", sinopse: "Campos de papoulas florescem e enchem a terra de Oz de cor.", faixas: ["07"], fotos: [{ src: "c07.jpg" }], nomes: [{ nome: "Giovanna Rodrigues da Mota" }, { nome: "Ana Luiza A. Farias" }] },
	{ titulo: "Camponesa", sinopse: "Uma camponesa de Oz recebe Dorothy com a alegria do lugar.", faixas: ["08"], nomes: [{ nome: "Larissa Stefane" }, { nome: "Débora Ester" }, { nome: "Karine Mayara" }, { nome: "Jéssica Cristina" }, { nome: "Mariana Lustosa" }] },
	{ lugar: "As bruxas", imagem: "bruxas" },
	{ titulo: "Amigas e amigo da Bruxa Boa", sinopse: "Os amigos da Bruxa Boa anunciam que ela está chegando.", faixas: ["09"], fotos: [{ src: "c09.jpg" }], nomes: [{ nome: "Vanessa Vitória" }, { nome: "Paulo Arthur" }, { nome: "Míriam Carneiro" }, { nome: "Dayanne Teixeira" }, { nome: "Valdelice Silva" }] },
	{ titulo: "Bruxa Boa", sinopse: "A Bruxa Boa surge, luminosa, para dar as boas-vindas a Dorothy.", faixas: ["10"], fotos: [{ src: "c10a.jpg", legenda: "Bruxa Boa · sessão das 16h30" }, { src: "c10b.jpg", legenda: "Bruxa Boa · sessão das 19h" }], nomes: [{ nome: "Maria Eduarda Takao", papel: "Bruxa Boa", sessao: "16h30" }, { nome: "Alice de Oliveira", papel: "Bruxa Boa", sessao: "19h" }] },
	{ titulo: "Bruxa Boa, Bruxa Má e os Sapatinhos Vermelhos", sinopse: "A Bruxa Má quer os sapatinhos vermelhos, mas a Bruxa Boa os entrega a Dorothy, que agora precisa protegê-los.", faixas: ["11"], fotos: [{ src: "c11a.jpg", legenda: "Bruxas · sessão das 16h30" }, { src: "c11b.jpg", legenda: "Bruxa Má · sessão das 16h30" }, { src: "c11c.jpg", legenda: "Bruxas · sessão das 19h" }, { src: "c11d.jpg", legenda: "Bruxa Má · sessão das 19h" }], nomes: [], semNomes: true },
	{ lugar: "O milharal", imagem: "milharal" },
	{ titulo: "Estrada de Tijolos Amarelos", sinopse: "Para voltar para casa, Dorothy deve seguir a estrada de tijolos amarelos até a Cidade das Esmeraldas.", faixas: ["12"], fotos: [{ src: "c12.jpg" }], nomes: [{ nome: "Beatriz Menon" }, { nome: "Amanda Porto" }, { nome: "Fernanda Bezzi" }, { nome: "Marina Coimbra" }, { nome: "Camila Silva Carneiro" }, { nome: "Larissa Drumont" }, { nome: "Dhennyfer Yasmin" }] },
	{ titulo: "Milharal", sinopse: "No caminho, a estrada passa por um grande milharal.", faixas: ["13"], fotos: [{ src: "c13.jpg" }], nomes: [{ nome: "Nicole Gabrielly" }, { nome: "Amanda Lira" }, { nome: "Jessika Benalia" }, { nome: "Luma Bergmann" }, { nome: "Natalie Santos" }, { nome: "Valentina Fuzo" }, { nome: "Laura Oliveira" }, { nome: "Ana Júlia Dourado" }, { nome: "Alice de Oliveira" }, { nome: "Fernanda Bezzi" }, { nome: "Ana Paula Araujo" }, { nome: "Beatriz Menon" }] },
	{ titulo: "Espantalha", sinopse: "No milharal, Dorothy encontra a Espantalha, que sonha em ter um cérebro, e ela se junta à viagem.", faixas: ["14"], fotos: [{ src: "c14a.jpg", legenda: "Espantalha · sessão das 16h30" }, { src: "c14b.jpg", legenda: "Espantalha · sessão das 19h" }], nomes: [{ nome: "Sarah Emanuelle", papel: "Espantalha", sessao: "16h30" }, { nome: "Amanda Porto", papel: "Espantalha", sessao: "19h" }] },
	{ titulo: "Espantalhinhas", sinopse: "As espantalhinhas dançam pelo milharal.", faixas: ["15"], fotos: [{ src: "c15.jpg" }], nomes: [{ nome: "Maria Helena A. de Melo" }, { nome: "Ester Bernardi Conde" }, { nome: "Olívia Vieira Calgaro" }, { nome: "Julia Magalhães de Wilken" }, { nome: "Laura S. O. Lira" }, { nome: "Marina de Souza Martins" }] },
	{ lugar: "A floresta", imagem: "floresta" },
	{ titulo: "Mulher de Lata", sinopse: "Parada e enferrujada na floresta, a Mulher de Lata volta a se mover e conta que deseja um coração.", faixas: ["16"], fotos: [{ src: "c16a.jpg", legenda: "Mulher de Lata · sessão das 16h30" }, { src: "c16b.jpg", legenda: "Mulher de Lata · sessão das 19h" }], nomes: [{ nome: "Julia Carneiro", papel: "Mulher de Lata", sessao: "16h30" }, { nome: "Fernanda Bezzi", papel: "Mulher de Lata", sessao: "19h" }] },
	{ titulo: "Latinhas", sinopse: "As latinhas dançam ao som do metal.", faixas: ["17"], fotos: [{ src: "c17.jpg" }], nomes: [{ nome: "Helena Vieira Sacchq" }, { nome: "Giovanna Bouson Claudio" }, { nome: "Helena Calis Cavalcante" }, { nome: "Isadora Calis de Freitas" }, { nome: "Maite Alves Oliveira" }, { nome: "Theodora Augusta Palazzio" }, { nome: "Ana Flor Vitoria" }, { nome: "Teresa D'Avila A. Farias" }] },
	{
		titulo: "Leoa Medrosa",
		sinopse: "Com um rugido que não assusta ninguém, aparece a Leoa Medrosa, que quer encontrar sua coragem.",
		faixas: ["18", "18.1"], fotos: [{ src: "c18a.jpg", legenda: "Leoa Medrosa · sessão das 16h30" }, { src: "c18b.jpg", legenda: "Leoa Medrosa · sessão das 19h" }],
		nomes: [{ nome: "Laura Lemos", papel: "Leoa Medrosa", sessao: "16h30" }, { nome: "Ana Paula Araujo", papel: "Leoa Medrosa", sessao: "19h" }],
		conferir: "Juntei as faixas 18 (Cena) e 18.1 (Cena + Solo) numa cena só.",
	},
	{
		titulo: "Leoazinhas",
		sinopse: "As leoazinhas dançam com a Leoa Medrosa.",
		faixas: ["19.1", "19.2"], fotos: [{ src: "c19.jpg" }],
		nomes: [{ nome: "Maria Alice O. Carvalho" }, { nome: "Carolina Vieira Calgaro" }, { nome: "Mariah Almeida Toda" }, { nome: "Amanda Guimarães Cantelli" }, { nome: "Isis Sales de Calçado" }, { nome: "Lis Sales de Calçado" }, { nome: "Isabella Felix" }],
		conferir: "Juntei as faixas 19.1 e 19.2 numa cena só.",
	},
	{ lugar: "Cidade das Esmeraldas", imagem: "esmeraldas" },
	{ titulo: "Dorothy e seus Amigos", sinopse: "Agora são quatro amigos, seguindo juntos pela estrada amarela.", faixas: ["20"], fotos: [{ src: "dorothy1630.jpg", legenda: "Dorothy · sessão das 16h30" }, { src: "dorothy19.jpg", legenda: "Dorothy · sessão das 19h" }], nomes: [{ nome: "Camila Silva Carneiro", papel: "Dorothy", sessao: "19h" }, { nome: "Maria Fernanda Bastos", papel: "Dorothy", sessao: "16h30" }, { nome: "Julia Carneiro", sessao: "16h30" }, { nome: "Fernanda Bezzi", sessao: "19h" }, { nome: "Sarah Emanuelle", sessao: "16h30" }, { nome: "Amanda Porto", sessao: "19h" }, { nome: "Ana Paula Araujo", sessao: "19h" }, { nome: "Laura Lemos", sessao: "16h30" }] },
	{ titulo: "Cidade das Esmeraldas", sinopse: "Enfim, as torres verdes da Cidade das Esmeraldas brilham no horizonte.", faixas: ["21"], fotos: [{ src: "c21.jpg" }], nomes: [{ nome: "Melissa Maciel" }, { nome: "Pâmela Nikole" }, { nome: "Marlua Correia" }, { nome: "Maria Eduarda Silva" }, { nome: "Eliane Timm" }, { nome: "Mariana da Silva" }, { nome: "Jessica Almeida" }] },
	{ titulo: "Corte da Cidade das Esmeraldas", sinopse: "A corte da Cidade das Esmeraldas recebe os viajantes com toda a sua pompa.", faixas: ["22"], fotos: [{ src: "c22.jpg" }], nomes: [{ nome: "Thais Franco" }, { nome: "Mariana Barbosa" }, { nome: "Manuela Silveira" }, { nome: "Sofia Santos" }, { nome: "Larissa Drumont" }, { nome: "Flavia Guimaraes" }, { nome: "Nicole Carpina" }, { nome: "Vanessa Farias" }] },
	{ titulo: "Dorothy e a Mágica de Oz", sinopse: "Diante da grande e poderosa Mágica de Oz, cada um faz o seu pedido.", faixas: ["23"], fotos: [{ src: "dorothy1630.jpg", legenda: "Dorothy · sessão das 16h30" }, { src: "dorothy19.jpg", legenda: "Dorothy · sessão das 19h" }], nomes: [{ nome: "Camila Silva Carneiro", papel: "Dorothy", sessao: "19h" }, { nome: "Maria Fernanda Bastos", papel: "Dorothy", sessao: "16h30" }, { nome: "Beatriz Menon", papel: "Mágica de Oz" }] },
	{ lugar: "O castelo da Bruxa Má", imagem: "castelo" },
	{ titulo: "A Missão", sinopse: "A Mágica só atenderá os pedidos se o grupo vencer a Bruxa Má.", faixas: ["24"], nomes: [] },
	{ titulo: "Abelhas Gigantes", sinopse: "A Bruxa Má manda um enxame de abelhas gigantes para deter os amigos.", faixas: ["25"], nomes: [{ nome: "Alice Sakata" }, { nome: "Amanda Christino" }, { nome: "Mariana Lara" }, { nome: "Maria Clara Pereira" }, { nome: "Leticia Araújo" }, { nome: "Jade Cardoso" }, { nome: "Júlia Barbosa" }, { nome: "Luísa Florêncio" }, { nome: "Laura Duarte" }, { nome: "Julia Mognatti" }, { nome: "Barbara Luize" }, { nome: "Arthur Timm" }] },
	{ titulo: "As Bruxas, a Derrota da Bruxa Má e a Libertação", sinopse: "Os amigos enfrentam a Bruxa Má, ela é derrotada e quem vivia sob o seu domínio fica livre.", faixas: ["27"], fotos: [{ src: "c11a.jpg", legenda: "Bruxas · sessão das 16h30" }, { src: "c26b.jpg", legenda: "Bruxas · sessão das 19h" }], nomes: [{ nome: "Sofia Mafra", papel: "Bruxa Má", sessao: "16h30" }, { nome: "Marina Coimbra", papel: "Bruxa Má", sessao: "19h" }, { nome: "Sofia Luiza", sessao: "19h" }, { nome: "Rafaela Noleto", sessao: "19h" }, { nome: "Sarah Emanuelle", sessao: "19h" }, { nome: "Laura Lemos", sessao: "19h" }, { nome: "Maria Fernanda Bastos", sessao: "19h" }, { nome: "Maria Eduarda Takao", sessao: "19h" }, { nome: "Carolina de Lima", sessao: "19h" }, { nome: "Julia Carneiro", sessao: "19h" }, { nome: "Amanda Porto", sessao: "16h30" }, { nome: "Beatriz Menon", sessao: "16h30" }, { nome: "Fernanda Bezzi", sessao: "16h30" }, { nome: "Ana Paula Araujo", sessao: "16h30" }, { nome: "Marina Coimbra", sessao: "16h30" }, { nome: "Camila Silva Carneiro", sessao: "16h30" }, { nome: "Alice de Oliveira", sessao: "16h30" }] },
	{ lugar: "O grande final", imagem: "final" },
	{ titulo: "A Mágica de Oz e sua história", sinopse: "Atrás da cortina, a Mágica revela quem realmente é e conta como chegou a Oz.", faixas: ["28"], fotos: [{ src: "c27.jpg", legenda: "Mágica de Oz · nas duas sessões" }], nomes: [{ nome: "Beatriz Menon", papel: "Mágica de Oz" }] },
	{ titulo: "Os Presentes da Mágica", sinopse: "A Mágica entrega os presentes e mostra que o cérebro, o coração e a coragem sempre estiveram com eles.", faixas: ["29"], nomes: [] },
	{ titulo: "Volta para casa", sinopse: "Com a ajuda dos sapatinhos vermelhos, Dorothy se despede dos amigos e volta para casa, no Kansas.", faixas: ["30"], fotos: [{ src: "dorothy1630.jpg", legenda: "Dorothy · sessão das 16h30" }, { src: "dorothy19.jpg", legenda: "Dorothy · sessão das 19h" }], nomes: [{ nome: "Camila Silva Carneiro", papel: "Dorothy", sessao: "19h" }, { nome: "Maria Fernanda Bastos", papel: "Dorothy", sessao: "16h30" }] },
	{ titulo: "Agradecimentos", faixas: ["31"], nomes: [], apenasTitulo: true },
];

/** Personagem, quem dança (sem sessão = nas duas), cor da faixa lateral. */
export const ELENCO: Array<[personagem: string, bailarinas: Pessoa[], cor: string]> = [
	["Dorothy", [{ nome: "Maria Fernanda Bastos", sessao: "16h30" }, { nome: "Camila Silva Carneiro", sessao: "19h" }], "#6aa3ff"],
	["Tia Anne", [{ nome: "Flavia Guimaraes" }], "#d9b38c"],
	["Tio Henry", [{ nome: "Warley Castro" }], "#b08d6a"],
	["Bruxa Boa", [{ nome: "Maria Eduarda Takao", sessao: "16h30" }, { nome: "Alice de Oliveira", sessao: "19h" }], "#f29ac8"],
	["Bruxa Má", [{ nome: "Sofia Mafra", sessao: "16h30" }, { nome: "Marina Coimbra", sessao: "19h" }], "#2fd28c"],
	["Espantalha", [{ nome: "Sarah Emanuelle", sessao: "16h30" }, { nome: "Amanda Porto", sessao: "19h" }], "#e8c25a"],
	["Mulher de Lata", [{ nome: "Julia Carneiro", sessao: "16h30" }, { nome: "Fernanda Bezzi", sessao: "19h" }], "#c9d1d6"],
	["Leoa Medrosa", [{ nome: "Laura Lemos", sessao: "16h30" }, { nome: "Ana Paula Araujo", sessao: "19h" }], "#f0a640"],
	["Mágica de Oz", [{ nome: "Beatriz Menon" }], "#e0263f"],
];

/** Função, nome (vazio = a definir). */
export const EQUIPE: Array<[funcao: string, nome: string]> = [
	["Direção artística", "Warley Castro"],
	["Coreógrafos e professores", "Marcelo Nazaré, Mylla Kathaleen, Delfina Olivari e Maria Nauane Lima"],
	["Realização", "Quattor Academia"],
];

export function ehCena(item: ItemPrograma): item is Cena {
	return "titulo" in item;
}

/** Quantas cenas vêm depois de cada lugar, até o próximo lugar, ato ou intervalo. */
export function cenasDoLugar(itens: ItemPrograma[], indice: number): number {
	let total = 0;
	for (let i = indice + 1; i < itens.length && ehCena(itens[i]); i++) total++;
	return total;
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
		if (ehCena(item) && item.nomes.some((p) => normalizarNome(p.nome).includes(t))) achadas.add(item);
	}
	return achadas;
}

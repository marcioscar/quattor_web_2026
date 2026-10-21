/** Pasta pública do Drive com as músicas do espetáculo. A página lê a lista dela (pastaDrive.server.ts). */
export const PASTA_ID = "11AnQjZ5vWpSx19G4_LFMArCgFBozPthb";
export const PASTA_MUSICAS = `https://drive.google.com/drive/folders/${PASTA_ID}?usp=sharing`;

export type Faixa = { numero: string; nome: string; drive: string; obs?: string };

/** Lista de reserva: vale até a primeira leitura da pasta dar certo (ou se o Drive falhar desde o início). */
export const FAIXAS: Faixa[] = [
	{ numero: "01", nome: "Narração + Abertura das cortinas", drive: "16jm4ZKzB2GkTwfXVchuL4It_zvcA0IWy" },
	{ numero: "02", nome: "Tia Anne e Tio Henry", drive: "1KUMC9XYV3a4yoFFXxfl5xeAL6SENy21H" },
	{ numero: "03", nome: "Solo Dorothy", drive: "1q0fHn1Ialb-944TWRb964kV7YnwdpKl_" },
	{ numero: "04", nome: "A Tempestade", drive: "1joa0RNx2X0JQlp7KjiFqdGAH9RmdJpSD" },
	{ numero: "05", nome: "Dorothy no Mundo de Oz", drive: "1LREnAC8pe0mCSPAtK2aSDU_w9O876u3q" },
	{ numero: "06", nome: "Elfas", drive: "1D0m-68HvE_cZOch2Fud4wpWpXNiRmP4n" },
	{ numero: "07", nome: "Papoulas", drive: "1Ud-KfcFbk4Jc7A9sJ8NsYhRpAF6biRyO" },
	{ numero: "08", nome: "Camponesa", drive: "1RFzskd_dzCrHV7ZMUb9sH8oyI_ppEk5w" },
	{ numero: "09", nome: "Amigas e amigo da Bruxa Boa", drive: "1-XPBC5zE4t3GiQzwRGTUKTSU8n--rZQr" },
	{ numero: "10", nome: "Bruxa Boa", drive: "1eFwEj4KtGuxT_BzFIr9fnSnzVw2MPsFo" },
	{ numero: "11", nome: "Cena: Bruxa Boa e Bruxa Má + Sapatinhos vermelhos", drive: "1RlCtjxb92AIIuiYmDMkA20YHeV4ndD1u" },
	{ numero: "12", nome: "Estrada de Tijolos Amarelos", drive: "1IHRZKXxq2qppfyzlWV9jPY1i8FXHYYwl" },
	{ numero: "13", nome: "Milharal", drive: "1DRohXTfB8haXyUTPvBJdSqPHPPgrEVsK" },
	{ numero: "14", nome: "Espantalho (cena)", drive: "1M7-gndJ1eHfAO8aGYPPUa3FqbfHTNDkG" },
	{ numero: "15", nome: "Espantalhinhas", drive: "1hkKnQUo0L8CMiayIVnLdAUj3MTcebikw" },
	{ numero: "16", nome: "Mulher de Lata (solo)", drive: "183IRw3PQq5YlrrYTjFCP2AE-LfNk8s-o" },
	{ numero: "17", nome: "Latinhas", drive: "1ja21aS2S077daeYvgHti1XdxKnoSUwGN" },
	{ numero: "18", nome: "Leoa Medrosa: cena + solo", drive: "1q5niAVNhL6CWm75MGwvYwdiBkRMttRKD" },
	{ numero: "18.1", nome: "Leoa Medrosa: cena + solo", drive: "1XLeAZdvtcR29BbCilwcyO7TKsXeWkqf_", obs: "outra versão" },
	{ numero: "19", nome: "Leoazinhas", drive: "1veOmCPNHUb6vvszCRWLFO_85w8PMEOg7" },
	{ numero: "20", nome: "Dorothy e seus Amigos", drive: "1hAHeueVs9ikOBHPzoIEma-9Bvor534po" },
	{ numero: "21", nome: "Cidade das Esmeraldas", drive: "1X_w3nTS7kqWq1sV1me2N_msDANjMMZiZ" },
	{ numero: "22", nome: "Corte da Cidade das Esmeraldas", drive: "1VgxRDVuTlxrpmS1os97W2vMlZNu7WilC" },
	{ numero: "25", nome: "Abelhas Gigantes", drive: "1QVUfBvYWdQmsQj9WgqmbjSHhx6f7Wj_v" },
	{ numero: "27", nome: "Bruxas + Bruxa Má + Derrota + Libertação", drive: "1yBM_OD7l9Cu8i0H8okVZgc1JFkqEe_pj" },
	{ numero: "28", nome: "O Mágico de Oz e sua história", drive: "12onrAC_9nySMprzaCEl0yEjhvje0Ij_7" },
	{ numero: "29", nome: "Os Presentes do Mágico", drive: "1JcxQijqZGYqz7V551iWCypNN-EHX92Gg" },
	{ numero: "30", nome: "Dorothy volta para casa", drive: "1R5Y0mqyV2KOH2RBnJ7suaJvCJIbiX5ol" },
	{ numero: "31", nome: "Camila", drive: "1o-za_8rXCFCZFyQje1D2hbsMv9EpNRPL" },
];

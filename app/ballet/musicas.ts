/** Pasta pública do Drive com as músicas do espetáculo. A página lê a lista dela (pastaDrive.server.ts). */
export const PASTA_ID = "11AnQjZ5vWpSx19G4_LFMArCgFBozPthb";
export const PASTA_MUSICAS = `https://drive.google.com/drive/folders/${PASTA_ID}?usp=sharing`;

export type Faixa = {
	numero: string;
	nome: string;
	drive: string;
	obs?: string;
	/** "Modificado" que a pasta do Drive mostra ("5:35 am", "Sep 29"); muda quando o áudio é trocado. */
	modificado?: string;
};

/** Lista de reserva: vale até a primeira leitura da pasta dar certo (ou se o Drive falhar desde o início). */
export const FAIXAS: Faixa[] = [
	{ numero: "01", nome: "Narração + Abertura das cortinas", drive: "112zKP8_Pyp04PhaJ2TFnoFGD7HKoMfHC" },
	{ numero: "02", nome: "Tia Anne e Tio Henry", drive: "1HQerpcDp2cjMCu4C0GJ9LKYuZRrm03Td" },
	{ numero: "03", nome: "Solo Dorothy", drive: "15ZAS4FHqovLv7xHPMIw1FX796DdiPRBM" },
	{ numero: "04", nome: "A Tempestade", drive: "1w_zc3WjrCH5mXyQ_AdhDW02CulJAAkHe" },
	{ numero: "05", nome: "Dorothy no Mundo de Oz", drive: "1bQ4TcpvNpvG_0k87-zrohwJJQjg8dEI4" },
	{ numero: "06", nome: "Elfas", drive: "1GM2W5ND6h9uFl7Ir135GFt1EsU0CkhXt" },
	{ numero: "07", nome: "Papoulas", drive: "1GJtxSTeVgWi6uApBzwWDMulk4Qd-6r0v" },
	{ numero: "08", nome: "Camponesa", drive: "1D3gHG5ljZNkS1j6JLkk3a6kljZ7u8rSo" },
	{ numero: "09", nome: "Amigas e amigo da Bruxa Boa", drive: "1T-txionH6aZlUpeQXW0khbO73ix2YOnZ" },
	{ numero: "10", nome: "Bruxa Boa", drive: "1nkmR4atOyW7dW_4UkATXXfW10SCoUjN3" },
	{ numero: "11", nome: "Cena — Bruxa Boa e Bruxa Má + Sapatinhos vermelhos", drive: "1ZTlgAjYFhHnu3YeHoUJHNYCNHPJQ_uCz" },
	{ numero: "12", nome: "Estrada de Tijolos Amarelos", drive: "1CHLirkH5kuYUN4HuFhuKBQ2UW2KHA6G-" },
	{ numero: "13", nome: "Milharal", drive: "18jqTLR41Edva22UhSrmubGgraqrsmWq7" },
	{ numero: "14", nome: "Espantalho — Cena", drive: "1I5RZruLV8LrAJ_lx3nvq3zthNOCmrbgK" },
	{ numero: "15", nome: "Espantalhinhas", drive: "1x1BvNT5qp9o2kJbAEwDPSZXNnWKzJHTk" },
	{ numero: "16", nome: "Mulher de Lata — Solo", drive: "1inAKECOwJiAlZo9tHDcxiy-23jKuExNo" },
	{ numero: "17", nome: "Latinhas", drive: "18VcQwT8o5J02jLQmtVz45jawYrg75MV5" },
	{ numero: "18", nome: "Leoa Medrosa — Cena + Solo", drive: "1QiSLWCkQPnfY248WRcVA8BN_D-micUFh" },
	{ numero: "18.1", nome: "Leoa Medrosa — Cena + Solo", drive: "1_zJsaWA-jW-LGbOE7dEZcYFEsHn-QT7R", obs: "outra versão" },
	{ numero: "19.1", nome: "Leoazinhas", drive: "1Ra6sAooixT1et3bYTHjNdPKgZCELPEnh" },
	{ numero: "19.2", nome: "Leoazinhas", drive: "1OmjbcuCszm7xlx_H8RwWVnrEHuWJtqvI" },
	{ numero: "20", nome: "Dorothy e seus Amigos", drive: "1FxGk1vhYebNVdP5qiwFyqMPiRVQkTMFG" },
	{ numero: "21", nome: "Cidade das Esmeraldas", drive: "1NrGay_5IJO8wOcgMKB2m_gHLp3bnwlTY" },
	{ numero: "22", nome: "Corte da Cidade das Esmeraldas", drive: "1sedWLgMQrU6e0rt5TlgtkdNurgSsFIrE" },
	{ numero: "23", nome: "Dorothy e o Mágico de Oz", drive: "1s4LqrOGMrgmuKG_fzwR6Cu1edWqZqejS" },
	{ numero: "24", nome: "Cena — A missão", drive: "1TJrkWmqLG4rAziDr8hZUkc_G55x1JSvc" },
	{ numero: "25", nome: "Abelhas Gigantes", drive: "1mRfoZi56dGg-HpElK4pLjMFLMBUqnl15" },
	{ numero: "27", nome: "Bruxas + Bruxa Má + Derrota + Libertação", drive: "1unWE2_IgoTOv3o5WT3ky0bsDd3fGuuUl" },
	{ numero: "28", nome: "O Mágico de Oz e sua história", drive: "1cHxCq9nYeP0aqVDX3_oxbAr92slma6JG" },
	{ numero: "29", nome: "Os Presentes do Mágico", drive: "1Hd2C_FfKpRUCFtuaxRrWHXNoJTg1fpcC" },
	{ numero: "30", nome: "Camila", drive: "1nHcLe3RPx6Ox9zh_zxbRup-11_qN4QPO" },
];

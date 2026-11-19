/** Black November 2026 — preços de novembro, válidos até 30/11. Artes em /black-november/<arte>.webp. */

export const WHATSAPP_NUMERO = "5561993190568";

export type Oferta = {
	plano: string;
	detalhe?: string;
	preco: number;
	/** Cor da bolinha, igual à da arte. */
	cor: string;
	arte: string;
};

export const OFERTAS: Oferta[] = [
	{ plano: "Musculação", detalhe: "Plano mensal", preco: 119, cor: "bg-quattor-laranja", arte: "musculacao" },
	{ plano: "Fitdance", detalhe: "Plano mensal", preco: 99, cor: "bg-quattor-vermelho", arte: "fitdance" },
	{ plano: "Spinning", detalhe: "Plano mensal", preco: 99, cor: "bg-quattor-azul", arte: "spinning" },
	{ plano: "Alongamento e Mobilidade", detalhe: "Plano mensal", preco: 99, cor: "bg-quattor-verde", arte: "alongamento" },
	{ plano: "Plano Fitness", detalhe: "Musculação + aulas coletivas", preco: 199, cor: "bg-white", arte: "plano-fitness" },
	{ plano: "Quattor Prime 2x/semana", detalhe: "Com personal trainer", preco: 399, cor: "bg-[#d9b54a]", arte: "quattor-prime" },
];

export const AVISO = "Valores por mês, válidos para contratação de até 2 meses.";

/** Até o fim do dia 30/11 em Brasília (01/12 00:00 = 03:00 UTC). */
const FIM = Date.parse("2026-12-01T03:00:00.000Z");

export function blackNovemberNoAr(agora: Date = new Date()): boolean {
	return agora.getTime() < FIM;
}

/** Link do WhatsApp com a mensagem pronta para o plano (ou para a promoção em geral). */
export function linkWhatsapp(plano?: string): string {
	const texto = plano
		? `Olá! Quero o plano ${plano} da Black November.`
		: "Olá! Quero saber das ofertas da Black November.";
	return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}

export function formatarPreco(valor: number): string {
	return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

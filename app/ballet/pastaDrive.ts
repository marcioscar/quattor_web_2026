import type { Faixa } from "./musicas";

/**
 * Lê a lista de músicas da página pública da pasta do Drive
 * (drive.google.com/embeddedfolderview). Não é API oficial: se o Google mudar
 * o HTML, `faixasDaPasta` devolve [] e quem chama mantém a última lista boa.
 */

const EXTENSOES_AUDIO = /\.(mp3|m4a|wav|aac|ogg|oga|flac|wma)$/i;

function decodificarHtml(texto: string): string {
	return texto
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
}

/**
 * "12 - Estrada de Tijolos Amarelos.m4a" → { numero: "12", nome: "Estrada de Tijolos Amarelos" }.
 * Aceita traço faltando ("22 Corte…"), colado ("29 -Os…"), número sem zero
 * ("8 - camponesa" → "08", "Camponesa") e sem número nenhum (numero "").
 */
export function lerNomeArquivo(arquivo: string): { numero: string; nome: string } {
	const semExtensao = arquivo.replace(/\.[a-z0-9]{2,4}$/i, "").trim();
	const m = semExtensao.match(/^(\d+(?:\.\d+)?)\s*[-–—_.]?\s*(.*)$/);
	const numeroCru = m ? m[1] : "";
	const resto = (m ? m[2] : semExtensao).trim() || semExtensao;
	const numero = numeroCru ? numeroCru.replace(/^(\d)(?=$|\.)/, "0$1") : "";
	const nome = resto.charAt(0).toLocaleUpperCase("pt-BR") + resto.slice(1);
	return { numero, nome };
}

function ordemDoNumero(numero: string): number {
	return numero ? Number(numero) : Number.POSITIVE_INFINITY;
}

/** Faixas de áudio da pasta, ordenadas pelo número; "18.1" ao lado de "18" vira "outra versão". */
export function faixasDaPasta(html: string): Faixa[] {
	const faixas: Faixa[] = [];
	const entrada = /<div class="flip-entry" id="entry-([\w-]+)"[\s\S]*?<a href="([^"]*)"[\s\S]*?<img src="[^"]*\/type\/([^"]+)"[\s\S]*?<div class="flip-entry-title">([\s\S]*?)<\/div>(?:<\/a><\/div><div class="flip-entry-last-modified"><div>([^<]*))?/g;
	for (const [, drive, link, tipo, tituloHtml, modificado] of html.matchAll(entrada)) {
		const arquivo = decodificarHtml(tituloHtml).trim();
		if (!link.includes("/file/d/")) continue; // subpasta
		if (!tipo.startsWith("audio/") && !EXTENSOES_AUDIO.test(arquivo)) continue;
		faixas.push({ ...lerNomeArquivo(arquivo), drive, ...(modificado ? { modificado: modificado.trim() } : {}) });
	}

	faixas.sort(
		(a, b) => ordemDoNumero(a.numero) - ordemDoNumero(b.numero) || a.nome.localeCompare(b.nome, "pt-BR"),
	);

	const numeros = new Set(faixas.map((f) => f.numero));
	for (const f of faixas) {
		const base = f.numero.split(".")[0];
		if (f.numero.includes(".") && numeros.has(base)) f.obs = "outra versão";
	}
	return faixas;
}

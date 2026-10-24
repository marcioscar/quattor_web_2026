import { describe, expect, it } from "vitest";
import { faixasDaPasta, lerNomeArquivo } from "./pastaDrive";

function entrada(id: string, titulo: string, tipo = "audio/x-m4a", link = `https://drive.google.com/file/d/${id}/view?usp=drive_web`) {
	return `<div class="flip-entry" id="entry-${id}" tabindex="0" role="link"><div class="flip-entry-info"><a href="${link}" target="_blank"><div class="flip-entry-visual"><div class="flip-entry-visual-card"><div class="flip-entry-icon"><img src="https://drive-thirdparty.googleusercontent.com/128/type/${tipo}" alt="Audio"/></div></div></div><div class="flip-entry-list-icon"><img src="https://drive-thirdparty.googleusercontent.com/16/type/${tipo}" alt=""/></div><div class="flip-entry-title">${titulo}</div></a></div><div class="flip-entry-last-modified"><div>4:54 am</div></div></div>`;
}

describe("lerNomeArquivo", () => {
	it.each([
		["01 - Narração + Abertura das cortinas.mp3", "01", "Narração + Abertura das cortinas"],
		["22 Corte da Cidade das Esmeraldas.m4a", "22", "Corte da Cidade das Esmeraldas"],
		["29 -Os Presentes do Mágico.m4a", "29", "Os Presentes do Mágico"],
		["8 - camponesa.m4a", "08", "Camponesa"],
		["18.1 - Leoa Medrosa — Cena + Solo.m4a", "18.1", "Leoa Medrosa — Cena + Solo"],
		["Aquecimento.mp3", "", "Aquecimento"],
	])("%s", (arquivo, numero, nome) => {
		expect(lerNomeArquivo(arquivo)).toEqual({ numero, nome });
	});
});

describe("faixasDaPasta", () => {
	it("ordena pelo número, ignora subpasta e não-áudio, marca a outra versão só com o mesmo nome", () => {
		const html = [
			entrada("c", "31 - camila.m4a"),
			entrada("pasta", "Antigas", "folder", "https://drive.google.com/drive/folders/pasta"),
			entrada("pdf", "Roteiro.pdf", "application/pdf"),
			entrada("b2", "18.1 - Leoa.m4a"),
			entrada("a", "8 - camponesa.m4a"),
			entrada("b", "18 - Leoa.m4a"),
			entrada("d", "17 - Latinhas.m4a"),
			entrada("d2", "17.1 - Latinhas solo.m4a"),
			entrada("e", "Bruxa &amp; Cia.mp3", "audio/mpeg"),
		].join("");
		expect(faixasDaPasta(html)).toEqual([
			{ numero: "08", nome: "Camponesa", drive: "a", modificado: "4:54 am" },
			{ numero: "17", nome: "Latinhas", drive: "d", modificado: "4:54 am" },
			{ numero: "17.1", nome: "Latinhas solo", drive: "d2", modificado: "4:54 am" },
			{ numero: "18", nome: "Leoa", drive: "b", modificado: "4:54 am" },
			{ numero: "18.1", nome: "Leoa", drive: "b2", modificado: "4:54 am", obs: "outra versão" },
			{ numero: "31", nome: "Camila", drive: "c", modificado: "4:54 am" },
			{ numero: "", nome: "Bruxa & Cia", drive: "e", modificado: "4:54 am" },
		]);
	});

	it("HTML sem entradas devolve lista vazia", () => {
		expect(faixasDaPasta("<html>mudou tudo</html>")).toEqual([]);
	});
});

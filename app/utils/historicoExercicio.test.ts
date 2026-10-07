import { describe, expect, it } from "vitest";
import {
	chaveExercicio,
	exercicioFoiTreinadoHoje,
	nomesExercicioCompativeis,
	type TreinoHistorico,
} from "./historicoExercicio";

function hojeDDMMAA(): string {
	const d = new Date();
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
}

const registro = (nome: string): TreinoHistorico => ({ nome, data: hojeDDMMAA(), grupo: "BICEPS" });

describe("nomesExercicioCompativeis", () => {
	it("ignora acento, caixa e o sufixo de séries", () => {
		expect(nomesExercicioCompativeis("Tríceps Pulley Corda", "TRICEPS PULLEY CORDA")).toBe(true);
		expect(nomesExercicioCompativeis("Leg 45º", "LEG 45º 4X10")).toBe(true);
	});

	it("prefixo não é o mesmo exercício", () => {
		expect(nomesExercicioCompativeis("Rosca Direta Polia Baixa Corda", "Rosca Direta")).toBe(false);
		expect(nomesExercicioCompativeis("Rosca Direta", "Rosca Direta Polia Baixa Corda")).toBe(false);
	});

	it("nome vazio nunca bate", () => {
		expect(nomesExercicioCompativeis("", "")).toBe(false);
	});
});

describe("chaveExercicio", () => {
	it("tira o sufixo de séries de cada parte do composto", () => {
		expect(chaveExercicio("Supino 4X10 + Crucifixo 4X10")).toBe("supino + crucifixo");
		expect(chaveExercicio("Supino 4X10 + Crucifixo 4X10")).not.toBe(chaveExercicio("Supino"));
	});
});

describe("exercicioFoiTreinadoHoje", () => {
	it("registrar Rosca Direta não marca Rosca Direta Polia Baixa Corda", () => {
		const historico = [registro("Rosca Direta")];
		expect(exercicioFoiTreinadoHoje(historico, "Rosca Direta")).toBe(true);
		expect(exercicioFoiTreinadoHoje(historico, "Rosca Direta Polia Baixa Corda")).toBe(false);
	});

	it("exercício composto reconhece o próprio registro", () => {
		const nome = "Tríceps Pulley Barra + Tríceps Pulley Corda";
		expect(exercicioFoiTreinadoHoje([registro(nome)], nome)).toBe(true);
	});

	it("registro composto conta para cada parte avulsa", () => {
		const historico = [registro("Tríceps Pulley Barra + Tríceps Pulley Corda")];
		expect(exercicioFoiTreinadoHoje(historico, "Tríceps Pulley Corda")).toBe(true);
		expect(exercicioFoiTreinadoHoje(historico, "Tríceps Testa")).toBe(false);
	});

	it("registro de uma parte não marca o composto inteiro", () => {
		expect(exercicioFoiTreinadoHoje([registro("Tríceps Pulley Barra")], "Tríceps Pulley Barra + Tríceps Pulley Corda")).toBe(
			false,
		);
	});
});

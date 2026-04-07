import { Form, redirect } from "react-router";
import MainNavbar from "../components/MainNavbar";
import {
	GRUPOS_MUSCULARES,
	type GrupoMuscular,
} from "../constants/gruposMusculares";
import { bd } from "../models/api_access";
import { getSessionRegistration } from "../session.server";
import { semanaDoAnoAtualParaApi } from "../utils/semanaDoAno";
import type { Route } from "./+types/treinos";

export type TreinosLoaderData = {
	registration: number;
	semana: string;
	ano: number;
	grupo: GrupoMuscular;
	exercicios: unknown[];
	erroExercicios: string | null;
};

export async function loader({ params, request }: Route.LoaderArgs) {
	const registration = Number(params.registration);
	if (!params.registration || Number.isNaN(registration)) {
		throw new Response("Matrícula inválida", { status: 404 });
	}

	const sessionRegistration = getSessionRegistration(request);
	if (!sessionRegistration || sessionRegistration !== String(registration)) {
		const url = new URL(request.url);
		throw redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	const url = new URL(request.url);
	const semana = semanaDoAnoAtualParaApi();
	const ano = new Date().getFullYear();
	const grupo = parseGrupo(url.searchParams.get("grupo"));

	let exercicios: unknown[] = [];
	let erroExercicios: string | null = null;
	try {
		const raw = await bd.fetchExercicios(semana, grupo);
		exercicios = normalizarListaExercicios(raw);
	} catch (error) {
		erroExercicios = extrairMensagemErro(error);
	}

	return {
		registration,
		semana,
		ano,
		grupo,
		exercicios,
		erroExercicios,
	} satisfies TreinosLoaderData;
}

function parseGrupo(valor: string | null): GrupoMuscular {
	if (valor && isGrupoMuscular(valor)) {
		return valor;
	}
	return GRUPOS_MUSCULARES[0];
}

function isGrupoMuscular(s: string): s is GrupoMuscular {
	return (GRUPOS_MUSCULARES as readonly string[]).includes(s);
}

function normalizarListaExercicios(data: unknown): unknown[] {
	if (!data) return [];
	if (Array.isArray(data)) return data;
	if (typeof data === "object" && data !== null && "data" in data) {
		const nested = (data as Record<string, unknown>).data;
		return Array.isArray(nested) ? nested : [];
	}
	return [];
}

function extrairMensagemErro(error: unknown): string {
	if (
		error &&
		typeof error === "object" &&
		"message" in error &&
		typeof (error as { message: unknown }).message === "string"
	) {
		return (error as { message: string }).message;
	}
	return "Erro ao buscar exercícios";
}

function rotuloExercicio(item: unknown): string {
	if (item != null && typeof item === "object" && "nome" in item) {
		const n = (item as { nome: unknown }).nome;
		if (typeof n === "string") return n;
		if (n != null) return String(n);
	}
	return JSON.stringify(item);
}

export default function Treinos({ loaderData }: Route.ComponentProps) {
	const { registration, semana, ano, grupo, exercicios, erroExercicios } =
		loaderData as TreinosLoaderData;

	return (
		<>
			<MainNavbar />
			<div className='min-h-screen bg-quattor-fundo px-4 py-6 md:px-8'>
				<div className='mx-auto max-w-2xl'>
					<h1 className='text-2xl font-bold text-quattor-azul-escuro'>
						Treinos
					</h1>
					<p className='mt-1 text-sm text-gray-500'>
						Semana {semana} Escolha o grupo muscular para ver os exercícios.
					</p>

					<Form
						method='get'
						action={`/treinos/${registration}`}
						className='mt-6 space-y-4 rounded-2xl bg-quattor-cinza-claro p-4 shadow-sm'>
						<label className='flex flex-col gap-1.5 text-sm font-medium text-quattor-azul-escuro'>
							Grupo muscular
							<select
								name='grupo'
								defaultValue={grupo}
								className='rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 shadow-sm focus:border-quattor-azul focus:outline-none focus:ring-2 focus:ring-quattor-azul/30'>
								{GRUPOS_MUSCULARES.map((g) => (
									<option key={g} value={g}>
										{g}
									</option>
								))}
							</select>
						</label>
						<div className='flex justify-end'>
							<button
								type='submit'
								className='rounded-xl bg-quattor-azul px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-quattor-azul focus-visible:ring-offset-2'>
								Buscar exercícios
							</button>
						</div>
					</Form>

					<div className='mt-8'>
						{erroExercicios ? (
							<p
								className='rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
								role='alert'>
								{erroExercicios}
							</p>
						) : exercicios.length === 0 ? (
							<p className='text-sm text-gray-500'>
								Nenhum exercício encontrado para esta combinação.
							</p>
						) : (
							<ul className='space-y-2' role='list'>
								{exercicios.map((item, index) => (
									<li
										key={index}
										className='rounded-xl border border-gray-200 bg-white px-4 py-3 text-quattor-azul-escuro shadow-sm'>
										{rotuloExercicio(item)}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</>
	);
}

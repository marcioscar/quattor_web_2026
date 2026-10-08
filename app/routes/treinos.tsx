import { Link, redirect } from "react-router";
import { AlertCircle, ArrowLeft, Dumbbell } from "lucide-react";
import { ListaExerciciosTreinos } from "../components/ListaExerciciosTreinos";
import MainNavbar from "../components/MainNavbar";
import { TreinosGrupoForm, nomeGrupoExibicao } from "../components/TreinosGrupoForm";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
	GRUPOS_MUSCULARES,
	type GrupoMuscular,
} from "../constants/gruposMusculares";
import { buscarExercicios, buscarHistorico, registrarTreino } from "../models/treinos.server";
import { getSessionRegistration } from "../session.server";
import {
	normalizarHistoricoTreinos,
	parseDataHistorico,
	type TreinoHistorico,
} from "../utils/historicoExercicio";
import { anoISO8601, semanaDoAnoAtualParaApi } from "../utils/semanaDoAno";
import type { Route } from "./+types/treinos";

export type TreinosLoaderData = {
	registration: number;
	semana: string;
	ano: number;
	grupo: GrupoMuscular;
	exercicios: unknown[];
	historicoTreinos: TreinoHistorico[];
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
	const ano = anoISO8601(new Date());
	const grupo = parseGrupo(url.searchParams.get("grupo"));

	let exercicios: unknown[] = [];
	let erroExercicios: string | null = null;
	let historicoTreinos: TreinoHistorico[] = [];
	try {
		const raw = await buscarExercicios(semana, ano, grupo);
		exercicios = normalizarListaExercicios(raw);
	} catch (error) {
		erroExercicios = extrairMensagemErro(error);
	}
	try {
		const rawHistorico = await buscarHistorico(registration);
		historicoTreinos = normalizarHistoricoTreinos(rawHistorico);
	} catch {
		historicoTreinos = [];
	}

	return {
		registration,
		semana,
		ano,
		grupo,
		exercicios,
		historicoTreinos,
		erroExercicios,
	} satisfies TreinosLoaderData;
}

function lerCampoTexto(
	formData: FormData,
	nomeCampo: string,
): string | undefined {
	const valor = formData.get(nomeCampo);
	return typeof valor === "string" && valor.trim() ? valor.trim() : undefined;
}

export async function action({ params, request }: Route.ActionArgs) {
	const registration = Number(params.registration);
	if (!params.registration || Number.isNaN(registration)) {
		return Response.json(
			{ ok: false, message: "Matrícula inválida." },
			{ status: 400 },
		);
	}

	const sessionRegistration = getSessionRegistration(request);
	if (!sessionRegistration || sessionRegistration !== String(registration)) {
		return Response.json({ ok: false, message: "Não autorizado." }, { status: 401 });
	}

	const formData = await request.formData();
	const intent = lerCampoTexto(formData, "intent");
	if (intent !== "registrarTreino") {
		return Response.json({ ok: false, message: "Ação inválida." }, { status: 400 });
	}

	const grupo = lerCampoTexto(formData, "grupo");
	const nome = lerCampoTexto(formData, "nome");
	const carga = lerCampoTexto(formData, "carga") ?? "";

	if (!grupo || !nome) {
		return Response.json(
			{ ok: false, message: "Dados incompletos para registrar treino." },
			{ status: 400 },
		);
	}

	try {
		await registrarTreino(registration, grupo, nome, carga);
		return Response.json({ ok: true });
	} catch (error) {
		const message =
			error &&
			typeof error === "object" &&
			"message" in error &&
			typeof (error as { message: unknown }).message === "string"
				? (error as { message: string }).message
				: "Erro ao registrar treino.";
		return Response.json({ ok: false, message }, { status: 500 });
	}
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

/** Grupos com exercício registrado desde a segunda-feira desta semana. */
function gruposTreinadosNaSemana(historico: TreinoHistorico[]): string[] {
	const segunda = new Date();
	segunda.setHours(0, 0, 0, 0);
	segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));
	const grupos = new Set<string>();
	for (const t of historico) {
		const d = parseDataHistorico(t.data);
		if (d && d >= segunda && t.grupo?.trim()) grupos.add(t.grupo.trim());
	}
	return [...grupos];
}

export default function Treinos({ loaderData }: Route.ComponentProps) {
	const { registration, semana, grupo, exercicios, historicoTreinos, erroExercicios } =
		loaderData as TreinosLoaderData;

	return (
		<>
			<MainNavbar />
			<main className='min-h-screen bg-quattor-fundo px-4 pb-12 pt-6'>
				<div className='mx-auto flex w-full max-w-3xl flex-col gap-5'>
					{/* Topo */}
					<section className='rounded-3xl bg-quattor-azul-escuro p-5 text-white shadow-lg sm:p-6'>
						<Link
							to={`/aluno/${registration}`}
							className='mb-3 inline-flex items-center gap-1 text-sm font-medium text-white/70 hover:text-white'>
							<ArrowLeft className='h-4 w-4' />
							Voltar
						</Link>
						<p className='text-xs font-semibold uppercase tracking-wider text-quattor-laranja'>
							Treino da semana {semana}
						</p>
						<h1 className='mt-1 text-2xl font-bold sm:text-3xl'>{nomeGrupoExibicao(grupo)}</h1>
						<p className='mt-1 text-sm text-white/60'>
							Toque num exercício para ver o vídeo, marcar as séries e registrar.
						</p>
						<div className='mt-4'>
							<TreinosGrupoForm
								registration={registration}
								grupoInicial={grupo}
								gruposDaSemana={gruposTreinadosNaSemana(historicoTreinos)}
							/>
						</div>
					</section>

					{erroExercicios ? (
						<Alert variant='destructive'>
							<AlertCircle />
							<AlertTitle>Não foi possível carregar</AlertTitle>
							<AlertDescription>{erroExercicios}</AlertDescription>
						</Alert>
					) : exercicios.length === 0 ? (
						<section className='flex flex-col items-center rounded-3xl bg-white px-5 py-12 text-center shadow-sm ring-1 ring-gray-100'>
							<span className='mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-quattor-fundo'>
								<Dumbbell className='h-7 w-7 text-gray-400' />
							</span>
							<p className='font-medium text-quattor-azul-escuro'>Sem treino deste grupo nesta semana</p>
							<p className='mt-1 max-w-xs text-sm text-gray-500'>Escolha outro grupo muscular acima.</p>
						</section>
					) : (
						<ListaExerciciosTreinos
							key={grupo}
							itens={exercicios}
							registration={registration}
							grupo={grupo}
							historicoTreinos={historicoTreinos}
						/>
					)}
				</div>
			</main>
		</>
	);
}

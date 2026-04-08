import { redirect } from "react-router";
import { AlertCircle } from "lucide-react";
import { ListaExerciciosTreinos } from "../components/ListaExerciciosTreinos";
import MainNavbar from "../components/MainNavbar";
import { TreinosGrupoForm } from "../components/TreinosGrupoForm";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Card, CardContent } from "~/components/ui/card";
import {
	GRUPOS_MUSCULARES,
	type GrupoMuscular,
} from "../constants/gruposMusculares";
import { bd } from "../models/api_access";
import { getSessionRegistration } from "../session.server";
import {
	normalizarHistoricoTreinos,
	type TreinoHistorico,
} from "../utils/historicoExercicio";
import { semanaDoAnoAtualParaApi } from "../utils/semanaDoAno";
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
	const ano = new Date().getFullYear();
	const grupo = parseGrupo(url.searchParams.get("grupo"));

	let exercicios: unknown[] = [];
	let erroExercicios: string | null = null;
	let historicoTreinos: TreinoHistorico[] = [];
	try {
		const raw = await bd.fetchExercicios(semana, grupo);
		exercicios = normalizarListaExercicios(raw);
	} catch (error) {
		erroExercicios = extrairMensagemErro(error);
	}
	try {
		const rawHistorico = await bd.fetchHistorico(String(registration));
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
		await bd.fetchRegistrarTreino(String(registration), grupo, nome, carga);
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

export default function Treinos({ loaderData }: Route.ComponentProps) {
	const {
		registration,
		semana,
		ano,
		grupo,
		exercicios,
		historicoTreinos,
		erroExercicios,
	} =
		loaderData as TreinosLoaderData;

	return (
		<>
			<MainNavbar />
			<div className='min-h-screen bg-quattor-fundo px-4 py-6 md:px-8'>
				<div className='mx-auto flex max-w-2xl flex-col gap-6'>
					<div className='flex flex-col gap-1'>
						<h1 className='font-heading text-2xl font-semibold text-quattor-azul-escuro'>
							Treinos
						</h1>
						<p className='text-sm text-muted-foreground'>
							Escolha o grupo muscular para ver os exercícios.
						</p>
					</div>

					<TreinosGrupoForm registration={registration} grupoInicial={grupo} />

					{erroExercicios ? (
						<Alert variant='destructive'>
							<AlertCircle />
							<AlertTitle>Não foi possível carregar</AlertTitle>
							<AlertDescription>{erroExercicios}</AlertDescription>
						</Alert>
					) : exercicios.length === 0 ? (
						<Card>
							<CardContent className='pt-6'>
								<p className='text-sm text-muted-foreground'>
									Nenhum exercício encontrado para esta combinação.
								</p>
							</CardContent>
						</Card>
					) : (
						<ListaExerciciosTreinos
							itens={exercicios}
							registration={registration}
							grupo={grupo}
							historicoTreinos={historicoTreinos}
						/>
					)}
				</div>
			</div>
		</>
	);
}

import type { Route } from "./+types/aluno";
import {
	HiArrowRight,
	HiCalendarDays,
	HiCheckCircle,
	HiFire,
	HiIdentification,
	HiOutlineClipboardDocumentList,
	HiPlay,
	HiRectangleStack,
} from "react-icons/hi2";
import { Link, redirect } from "react-router";
import MainNavbar from "../components/MainNavbar";
import { buscarAluno, buscarHistorico } from "../models/treinos.server";
import { getSessionRegistration } from "../session.server";
import {
	normalizarHistoricoTreinos,
	type TreinoHistorico,
} from "../utils/historicoExercicio";

type aluno = {
	endDate: string;
	name: string;
	photo: string;
	plano: string;
	registration: number;
	status: string;
};

function filtrarTreinosMesAtual(historico: TreinoHistorico[]): TreinoHistorico[] {
	const agora = new Date();
	const anoAtual = agora.getFullYear();
	const mesAtual = agora.getMonth();
	return historico.filter((treino) => {
		const d = parseDataBR(treino.data);
		return d && d.getFullYear() === anoAtual && d.getMonth() === mesAtual;
	});
}

/** Chave de agrupamento no fuso local (evita colapsar dias ao usar UTC com toISOString). */
function chaveDiaLocalAgrupamento(data: Date): string {
	return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

/** Parse DD/MM/YY, DD/MM/YYYY ou ISO (YYYY-MM-DD/DateTime) da API */
function parseDataBR(dataStr: string): Date | null {
	if (!dataStr || typeof dataStr !== "string") return null;
	const isoMatch = dataStr.match(/^\d{4}-\d{2}-\d{2}/);
	if (isoMatch) {
		const dIso = new Date(dataStr);
		if (!Number.isNaN(dIso.getTime())) return dIso;
	}
	const partes = dataStr.trim().split("/");
	if (partes.length !== 3) return null;
	const dia = parseInt(partes[0], 10);
	const mes = parseInt(partes[1], 10) - 1;
	let ano = parseInt(partes[2], 10);
	if (ano < 100) ano += 2000;
	if (Number.isNaN(dia) || Number.isNaN(mes) || Number.isNaN(ano)) return null;
	const d = new Date(ano, mes, dia);
	if (d.getDate() !== dia || d.getMonth() !== mes) return null;
	return d;
}

function contarDiasTreinadosNoMes(historico: TreinoHistorico[]): number {
	const agora = new Date();
	const anoAtual = agora.getFullYear();
	const mesAtual = agora.getMonth();
	const diasUnicos = new Set<string>();
	for (const treino of historico) {
		const d = parseDataBR(treino.data);
		if (!d) continue;
		if (d.getFullYear() === anoAtual && d.getMonth() === mesAtual) {
			diasUnicos.add(
				`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
			);
		}
	}
	return diasUnicos.size;
}

function contarGruposTreinadosNoMes(historico: TreinoHistorico[]): number {
	const agora = new Date();
	const anoAtual = agora.getFullYear();
	const mesAtual = agora.getMonth();
	const gruposUnicos = new Set<string>();
	for (const treino of historico) {
		const d = parseDataBR(treino.data);
		if (!d) continue;
		if (d.getFullYear() === anoAtual && d.getMonth() === mesAtual) {
			const grupo = treino.grupo?.trim();
			if (grupo) gruposUnicos.add(grupo);
		}
	}
	return gruposUnicos.size;
}

/** Conta exercícios no mês. Nomes com " + " são divididos (ex: "A 4X10 + B 4X10" = 2). */
function contarExerciciosTreinadosNoMes(historico: TreinoHistorico[]): number {
	const agora = new Date();
	const anoAtual = agora.getFullYear();
	const mesAtual = agora.getMonth();
	let total = 0;
	for (const treino of historico) {
		const d = parseDataBR(treino.data);
		if (!d) continue;
		if (d.getFullYear() === anoAtual && d.getMonth() === mesAtual) {
			const exercicios = (treino.nome ?? "")
				.split("+")
				.map((s) => s.trim())
				.filter(Boolean);
			total += exercicios.length || (treino.nome?.trim() ? 1 : 0);
		}
	}
	return total;
}

function formatarDataBR(data: Date): string {
	return data.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function agruparTreinosPorData(historico: TreinoHistorico[]) {
	const mapa = new Map<
		string,
		{
			data: Date | null;
			grupos: Map<string, TreinoHistorico[]>;
		}
	>();
	for (const treino of historico) {
		const data = parseDataBR(treino.data);
		const chave = data
			? chaveDiaLocalAgrupamento(data)
			: (treino.data || "Sem data").trim();
		const atual = mapa.get(chave) ?? {
			data,
			grupos: new Map<string, TreinoHistorico[]>(),
		};
		const nomeGrupo = treino.grupo?.trim() || "Sem grupo";
		const lista = atual.grupos.get(nomeGrupo) ?? [];
		lista.push(treino);
		atual.grupos.set(nomeGrupo, lista);
		mapa.set(chave, atual);
	}
	return Array.from(mapa.entries())
		.sort(([, a], [, b]) => {
			const ta = a.data?.getTime() ?? 0;
			const tb = b.data?.getTime() ?? 0;
			return tb - ta;
		})
		.map(([chave, item]) => ({
			data: item.data ? formatarDataBR(item.data) : chave,
			grupos: Array.from(item.grupos.entries())
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([nome, treinos]) => ({ nome, treinos })),
			totalTreinos: Array.from(item.grupos.values()).reduce(
				(total, treinos) => total + treinos.length,
				0,
			),
		}));
}

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

	const [historico, aluno] = await Promise.all([
		historicoLoader(registration),
		alunoLoader(registration),
	]);
	return { historico, aluno };
}

/** Histórico completo; o mês atual é filtrado na tela (`filtrarTreinosMesAtual`). */
async function historicoLoader(registration: number) {
	const raw = await buscarHistorico(registration);
	return normalizarHistoricoTreinos(raw);
}

async function alunoLoader(registration: number): Promise<aluno | null> {
	return buscarAluno(registration);
}

/** "outubro" — rótulo dos números do mês. */
function nomeMesAtual(): string {
	return new Date().toLocaleDateString("pt-BR", { month: "long" });
}

/** "qua, 07/10" a partir de "07/10/2026". */
function rotuloDia(dataBR: string): string {
	const d = parseDataBR(dataBR);
	if (!d) return dataBR;
	const semana = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
	return `${semana}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const AVATAR_GENERICO =
	"data:image/svg+xml;utf8," +
	"<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>" +
	"<rect width='100%25' height='100%25' fill='%23e5e7eb'/>" +
	"<circle cx='64' cy='50' r='24' fill='%239ca3af'/>" +
	"<rect x='32' y='78' width='64' height='32' rx='16' fill='%239ca3af'/>" +
	"</svg>";

function Estatistica({
	icone,
	valor,
	rotulo,
	cor,
}: {
	icone: React.ReactNode;
	valor: number;
	rotulo: string;
	cor: string;
}) {
	return (
		<div className='flex flex-col items-center rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100 sm:p-4'>
			<span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${cor}`}>{icone}</span>
			<span className='text-2xl font-bold leading-none text-quattor-azul-escuro'>{valor}</span>
			<span className='mt-1 text-xs leading-tight text-gray-500'>{rotulo}</span>
		</div>
	);
}

export default function Aluno({ loaderData }: Route.ComponentProps) {
	const { aluno, historico } = loaderData;
	const diasTreinadosNoMes = contarDiasTreinadosNoMes(historico ?? []);
	const gruposTreinadosNoMes = contarGruposTreinadosNoMes(historico ?? []);
	const exerciciosTreinadosNoMes = contarExerciciosTreinadosNoMes(historico ?? []);
	const historicoPorData = agruparTreinosPorData(filtrarTreinosMesAtual(historico ?? []));
	const mes = nomeMesAtual();

	if (!aluno) {
		return (
			<>
				<MainNavbar />
				<div className='min-h-screen flex items-center justify-center bg-quattor-fundo p-6'>
					<p className='text-gray-500'>Aluno não encontrado.</p>
				</div>
			</>
		);
	}

	return (
		<>
			<MainNavbar />
			<main className='min-h-screen bg-quattor-fundo px-4 pb-10 pt-6'>
				{/* Celular: uma coluna. Desktop: aluno + números à esquerda, treinos à direita. */}
				<div className='mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-6'>
					<div className='space-y-4 lg:sticky lg:top-24'>
						{/* Cartão do aluno */}
						<section className='overflow-hidden rounded-3xl bg-quattor-azul-escuro text-white shadow-lg'>
							<div className='flex items-center gap-4 p-5'>
								<img
									src={aluno.photo || AVATAR_GENERICO}
									alt={aluno.name}
									className='h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-white/15 sm:h-24 sm:w-24'
									onError={(event) => {
										event.currentTarget.src = AVATAR_GENERICO;
									}}
								/>
								<div className='min-w-0'>
									<p className='text-sm text-white/60'>Olá,</p>
									<h1 className='truncate text-2xl font-bold capitalize leading-tight'>
										{aluno.name.toLowerCase()}
									</h1>
									<p className='mt-1 inline-flex items-center gap-1.5 text-xs text-white/60'>
										<HiIdentification className='h-4 w-4' />
										Matrícula {aluno.registration}
									</p>
								</div>
							</div>

							{(aluno.plano || aluno.endDate) && (
								<div className='mx-5 mb-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/10 px-4 py-3'>
									<div className='min-w-0'>
										<p className='text-[11px] uppercase tracking-wider text-white/50'>Plano</p>
										<p className='truncate text-sm font-semibold capitalize'>
											{aluno.plano.toLowerCase() || "—"}
										</p>
									</div>
									{aluno.endDate && (
										<div className='text-right'>
											<p className='text-[11px] uppercase tracking-wider text-white/50'>Válido até</p>
											<p className='text-sm font-semibold'>{aluno.endDate}</p>
										</div>
									)}
								</div>
							)}

							<Link
								to={`/treinos/${aluno.registration}`}
								className='flex items-center justify-center gap-2 bg-quattor-laranja px-5 py-4 text-base font-semibold text-white transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white'>
								<HiPlay className='h-5 w-5' />
								Treinar agora
							</Link>
						</section>

						{/* Números do mês */}
						<section>
							<h2 className='mb-2 px-1 text-sm font-semibold text-gray-500'>
								Seu mês de {mes}
							</h2>
							<div className='grid grid-cols-3 gap-3'>
								<Estatistica
									icone={<HiFire className='h-5 w-5 text-quattor-laranja' />}
									cor='bg-quattor-laranja/10'
									valor={diasTreinadosNoMes}
									rotulo={diasTreinadosNoMes === 1 ? "dia de treino" : "dias de treino"}
								/>
								<Estatistica
									icone={<HiRectangleStack className='h-5 w-5 text-quattor-azul' />}
									cor='bg-quattor-azul/10'
									valor={gruposTreinadosNoMes}
									rotulo={gruposTreinadosNoMes === 1 ? "grupo muscular" : "grupos musculares"}
								/>
								<Estatistica
									icone={<HiCheckCircle className='h-5 w-5 text-quattor-verde' />}
									cor='bg-quattor-verde/10'
									valor={exerciciosTreinadosNoMes}
									rotulo={exerciciosTreinadosNoMes === 1 ? "exercício" : "exercícios"}
								/>
							</div>
						</section>

					</div>

					{/* Treinos do mês */}
					<section className='rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100'>
						<div className='mb-4 flex items-center justify-between'>
							<h2 className='flex items-center gap-2 text-base font-bold text-quattor-azul-escuro'>
								<HiCalendarDays className='h-5 w-5 text-quattor-azul' />
								<span>Treinos de {mes}</span>
							</h2>
							<Link
								to={`/historico/${aluno.registration}`}
								className='inline-flex items-center gap-1 text-xs font-semibold text-quattor-azul hover:underline'>
								Ver tudo
								<HiArrowRight className='h-3.5 w-3.5' />
							</Link>
						</div>

						{historicoPorData.length === 0 ? (
							<div className='flex flex-col items-center py-8 text-center'>
								<span className='mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-quattor-fundo'>
									<HiOutlineClipboardDocumentList className='h-7 w-7 text-gray-400' />
								</span>
								<p className='font-medium text-quattor-azul-escuro'>Nenhum treino neste mês ainda</p>
								<p className='mt-1 max-w-xs text-sm text-gray-500'>
									Toque em “Treinar agora” e marque os exercícios que fizer — eles aparecem aqui.
								</p>
							</div>
						) : (
							<ol className='space-y-5'>
								{historicoPorData.map((dia) => (
									<li key={dia.data}>
										<div className='mb-2 flex items-baseline justify-between border-b border-gray-100 pb-1'>
											<span className='text-sm font-semibold capitalize text-quattor-azul-escuro'>
												{rotuloDia(dia.data)}
											</span>
											<span className='text-xs text-gray-400'>
												{dia.totalTreinos} {dia.totalTreinos === 1 ? "exercício" : "exercícios"}
											</span>
										</div>
										<div className='space-y-3'>
											{dia.grupos.map((grupo) => (
												<div key={`${dia.data}-${grupo.nome}`}>
													<span className='inline-block rounded-full bg-quattor-verde/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-quattor-verde'>
														{grupo.nome}
													</span>
													<ul className='mt-1.5 space-y-1'>
														{grupo.treinos.map((treino, index) => (
															<li
																key={`${dia.data}-${grupo.nome}-${treino.nome}-${index}`}
																className='flex items-start gap-2 text-sm text-gray-700'>
																<HiCheckCircle className='mt-0.5 h-4 w-4 shrink-0 text-quattor-azul' />
																<span className='flex-1'>{treino.nome}</span>
																{treino.carga && treino.carga !== "-" && (
																	<span className='shrink-0 rounded-md bg-quattor-fundo px-1.5 py-0.5 text-xs text-gray-500'>
																		{treino.carga}
																	</span>
																)}
															</li>
														))}
													</ul>
												</div>
											))}
										</div>
									</li>
								))}
							</ol>
						)}
					</section>
				</div>
			</main>
		</>
	);
}

import type { Route } from "./+types/historico";
import { useMemo, useState } from "react";
import { Link, redirect } from "react-router";
import {
	HiArrowLeft,
	HiCalendarDays,
	HiCheckCircle,
	HiFire,
	HiOutlineClipboardDocumentList,
	HiPlay,
	HiRectangleStack,
} from "react-icons/hi2";
import MainNavbar from "../components/MainNavbar";
import { buscarHistorico } from "../models/treinos.server";
import { getSessionRegistration } from "../session.server";
import {
	chaveDiaLocal,
	normalizarHistoricoTreinos,
	parseDataHistorico,
	type TreinoHistorico,
} from "../utils/historicoExercicio";

export async function loader({ params, request }: Route.LoaderArgs) {
	const sessionRegistration = getSessionRegistration(request);
	if (!sessionRegistration || sessionRegistration !== params.registration) {
		const url = new URL(request.url);
		throw redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	const raw = await buscarHistorico(Number(params.registration));
	return {
		treinos: normalizarHistoricoTreinos(raw),
		matricula: params.registration,
	};
}

type Dia = {
	chave: string;
	data: Date;
	grupos: { nome: string; treinos: TreinoHistorico[] }[];
	total: number;
};

type Mes = { chave: string; titulo: string; dias: Dia[] };

/** Mês → dia → grupo, do mais recente para o mais antigo. Sem data legível fica de fora. */
function agruparPorMes(treinos: TreinoHistorico[]): Mes[] {
	const dias = new Map<string, { data: Date; grupos: Map<string, TreinoHistorico[]> }>();
	for (const t of treinos) {
		const data = parseDataHistorico(t.data);
		const chave = chaveDiaLocal(t.data);
		if (!data || !chave) continue;
		const dia = dias.get(chave) ?? { data, grupos: new Map() };
		const grupo = t.grupo?.trim() || "Sem grupo";
		dia.grupos.set(grupo, [...(dia.grupos.get(grupo) ?? []), t]);
		dias.set(chave, dia);
	}

	const meses = new Map<string, Mes>();
	for (const [chave, dia] of [...dias.entries()].sort(([a], [b]) => b.localeCompare(a))) {
		const chaveMes = chave.slice(0, 7);
		const mes = meses.get(chaveMes) ?? {
			chave: chaveMes,
			titulo: maiusculaInicial(dia.data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })),
			dias: [],
		};
		const grupos = [...dia.grupos.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([nome, lista]) => ({ nome, treinos: lista }));
		mes.dias.push({ chave, data: dia.data, grupos, total: grupos.reduce((n, g) => n + g.treinos.length, 0) });
		meses.set(chaveMes, mes);
	}
	return [...meses.values()];
}

/** "outubro de 2024" → "Outubro de 2024" (o `capitalize` do CSS faria "De"). */
function maiusculaInicial(texto: string): string {
	return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Seg, 14/10" */
function rotuloDia(data: Date): string {
	const semana = data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
	return `${semana}, ${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function Resumo({ icone, cor, valor, rotulo }: { icone: React.ReactNode; cor: string; valor: string | number; rotulo: string }) {
	return (
		<div className='flex flex-col items-center rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-gray-100 sm:p-4'>
			<span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full ${cor}`}>{icone}</span>
			<span className='text-xl font-bold leading-none text-quattor-azul-escuro sm:text-2xl'>{valor}</span>
			<span className='mt-1 text-xs leading-tight text-gray-500'>{rotulo}</span>
		</div>
	);
}

export default function Historico({ loaderData }: Route.ComponentProps) {
	const { treinos, matricula } = loaderData ?? { treinos: [], matricula: "" };
	const [grupoFiltro, setGrupoFiltro] = useState<string | null>(null);

	const gruposDisponiveis = useMemo(
		() => [...new Set(treinos.map((t) => t.grupo?.trim() || "Sem grupo"))].sort((a, b) => a.localeCompare(b)),
		[treinos],
	);
	const filtrados = useMemo(
		() => (grupoFiltro ? treinos.filter((t) => (t.grupo?.trim() || "Sem grupo") === grupoFiltro) : treinos),
		[treinos, grupoFiltro],
	);
	const meses = useMemo(() => agruparPorMes(filtrados), [filtrados]);

	const totalDias = meses.reduce((n, m) => n + m.dias.length, 0);
	const totalExercicios = meses.reduce((n, m) => n + m.dias.reduce((k, d) => k + d.total, 0), 0);
	const primeiroDia = meses.at(-1)?.dias.at(-1)?.data;

	return (
		<>
			<MainNavbar />
			<main className='min-h-screen bg-quattor-fundo px-4 pb-10 pt-6'>
				<div className='mx-auto w-full max-w-5xl space-y-5'>
					{/* Cabeçalho */}
					<div className='flex flex-wrap items-end justify-between gap-3'>
						<div>
							<Link
								to={`/aluno/${matricula}`}
								className='mb-2 inline-flex items-center gap-1 text-sm font-medium text-quattor-azul hover:underline'>
								<HiArrowLeft className='h-4 w-4' />
								Voltar
							</Link>
							<h1 className='text-2xl font-bold text-quattor-azul-escuro'>Histórico de treinos</h1>
							{primeiroDia && (
								<p className='text-sm text-gray-500'>
									Desde {primeiroDia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
								</p>
							)}
						</div>
						<Link
							to={`/treinos/${matricula}`}
							className='inline-flex items-center gap-2 rounded-xl bg-quattor-laranja px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105'>
							<HiPlay className='h-4 w-4' />
							Treinar agora
						</Link>
					</div>

					{treinos.length === 0 ? (
						<section className='flex flex-col items-center rounded-3xl bg-white px-5 py-12 text-center shadow-sm ring-1 ring-gray-100'>
							<span className='mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-quattor-fundo'>
								<HiOutlineClipboardDocumentList className='h-7 w-7 text-gray-400' />
							</span>
							<p className='font-medium text-quattor-azul-escuro'>Nenhum treino registrado ainda</p>
							<p className='mt-1 max-w-xs text-sm text-gray-500'>
								Toque em “Treinar agora” e marque os exercícios que fizer — eles aparecem aqui.
							</p>
						</section>
					) : (
						<>
							{/* Resumo */}
							<div className='grid grid-cols-3 gap-3'>
								<Resumo
									icone={<HiFire className='h-5 w-5 text-quattor-laranja' />}
									cor='bg-quattor-laranja/10'
									valor={totalDias}
									rotulo={totalDias === 1 ? "dia de treino" : "dias de treino"}
								/>
								<Resumo
									icone={<HiCheckCircle className='h-5 w-5 text-quattor-verde' />}
									cor='bg-quattor-verde/10'
									valor={totalExercicios}
									rotulo={totalExercicios === 1 ? "exercício" : "exercícios"}
								/>
								<Resumo
									icone={<HiRectangleStack className='h-5 w-5 text-quattor-azul' />}
									cor='bg-quattor-azul/10'
									valor={meses.length}
									rotulo={meses.length === 1 ? "mês" : "meses"}
								/>
							</div>

							{/* Filtro por grupo — rola de lado no celular */}
							{gruposDisponiveis.length > 1 && (
								<div className='-mx-4 overflow-x-auto px-4'>
									<div className='flex w-max gap-2 pb-1'>
										{[null, ...gruposDisponiveis].map((grupo) => {
											const ativo = grupoFiltro === grupo;
											return (
												<button
													key={grupo ?? "todos"}
													type='button'
													onClick={() => setGrupoFiltro(grupo)}
													className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
														ativo
															? "bg-quattor-azul-escuro text-white"
															: "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-quattor-azul"
													}`}>
													{grupo ?? "Todos"}
												</button>
											);
										})}
									</div>
								</div>
							)}

							{/* Meses */}
							{meses.map((mes) => (
								<section key={mes.chave}>
									<h2 className='mb-3 flex items-center gap-2 px-1 text-base font-bold text-quattor-azul-escuro'>
										<HiCalendarDays className='h-5 w-5 text-quattor-azul' />
										{mes.titulo}
										<span className='text-xs font-normal text-gray-400'>
											· {mes.dias.length} {mes.dias.length === 1 ? "dia" : "dias"}
										</span>
									</h2>
									<div className='grid items-start gap-3 md:grid-cols-2'>
										{mes.dias.map((dia) => (
											<article key={dia.chave} className='rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
												<div className='mb-2 flex items-baseline justify-between border-b border-gray-100 pb-1'>
													<span className='text-sm font-semibold capitalize text-quattor-azul-escuro'>
														{rotuloDia(dia.data)}
													</span>
													<span className='text-xs text-gray-400'>
														{dia.total} {dia.total === 1 ? "exercício" : "exercícios"}
													</span>
												</div>
												<div className='space-y-3'>
													{dia.grupos.map((grupo) => (
														<div key={grupo.nome}>
															<span className='inline-block rounded-full bg-quattor-verde/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-quattor-verde'>
																{grupo.nome}
															</span>
															<ul className='mt-1.5 space-y-1'>
																{grupo.treinos.map((treino, index) => (
																	<li
																		key={`${treino.nome}-${index}`}
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
											</article>
										))}
									</div>
								</section>
							))}
						</>
					)}
				</div>
			</main>
		</>
	);
}

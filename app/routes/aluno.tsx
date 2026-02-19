import type { Route } from "./+types/aluno";
import {
	HiIdentification,
	HiFire,
	HiSquaresPlus,
	HiMiniWallet,
	HiCheckCircle,
} from "react-icons/hi2";
import { GiMuscleUp } from "react-icons/gi";
import { redirect } from "react-router";
import MainNavbar from "../components/MainNavbar";
import { getSessionRegistration } from "../session.server";

type aluno = {
	endDate: string;
	name: string;
	photo: string;
	plano: string;
	registration: number;
	status: string;
};
type TreinoHistorico = {
	carga: string;
	data: string;
	grupo: string;
	nome: string;
};

function normalizarTreinos(data: unknown): TreinoHistorico[] {
	if (!data) return [];
	if (Array.isArray(data)) {
		return data.filter(
			(item): item is TreinoHistorico =>
				item != null &&
				typeof item === "object" &&
				"nome" in item &&
				"data" in item,
		) as TreinoHistorico[];
	}
	if (typeof data === "object" && "data" in (data as object)) {
		const aninhado = (data as Record<string, unknown>).data;
		return Array.isArray(aninhado) ? normalizarTreinos(aninhado) : [];
	}
	return [];
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
			? data.toISOString().slice(0, 10)
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

export async function historicoLoader(registration: number) {
	const response = await fetch(
		`https://api.quattoracademia.com/historico/?matricula=${registration}`,
	);
	const data: unknown = await response.json();
	return normalizarTreinos(data);
}

export async function alunoLoader(registration: number) {
	const response = await fetch(
		`https://api.quattoracademia.com/alunos/?matricula=${registration}`,
	);
	const data = (await response.json()) as aluno;
	return data;
}

export default function Aluno({ loaderData }: Route.ComponentProps) {
	const { aluno, historico } = loaderData;
	const diasTreinadosNoMes = contarDiasTreinadosNoMes(historico ?? []);
	const gruposTreinadosNoMes = contarGruposTreinadosNoMes(historico ?? []);
	const exerciciosTreinadosNoMes = contarExerciciosTreinadosNoMes(
		historico ?? [],
	);
	const historicoPorData = agruparTreinosPorData(historico ?? []);
	const avatarGenerico =
		"data:image/svg+xml;utf8," +
		"<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>" +
		"<rect width='100%25' height='100%25' fill='%23e5e7eb'/>" +
		"<circle cx='64' cy='50' r='24' fill='%239ca3af'/>" +
		"<rect x='32' y='78' width='64' height='32' rx='16' fill='%239ca3af'/>" +
		"</svg>";

	if (!aluno) {
		return (
			<div className='min-h-screen flex items-center justify-center p-6'>
				<p className='text-gray-500 dark:text-gray-400'>
					Aluno não encontrado.
				</p>
			</div>
		);
	}

	return (
		<>
			<MainNavbar />
			<div className='flex flex-col items-center justify-center min-h-screen bg-quattor-fundo'>
				<div className='  m-4'>
					<div className='w-full mx-auto grid gap-4 grid-cols-1'>
						<div className='flex flex-col sticky top-0 z-10'>
							<div className='bg-quattor-cinza-claro shadow-sm md:min-w-xl mx-auto  rounded-2xl p-4'>
								<div className='flex-none sm:flex'>
									<div className=' relative h-32 w-32   sm:mb-0 mb-3'>
										<img
											src={aluno.photo || avatarGenerico}
											alt='aluno'
											className=' w-32 h-32 object-cover rounded-2xl'
											onError={(event) => {
												event.currentTarget.src = avatarGenerico;
											}}
										/>
									</div>
									<div className='flex-auto sm:ml-5 justify-evenly'>
										<div className='flex items-center justify-between sm:mt-2'>
											<div className='flex items-center'>
												<div className='flex flex-col'>
													<div className='w-full flex-none text-lg text-quattor-azul-escuro font-bold leading-none'>
														{aluno.name}
													</div>
													<div className='flex-auto text-gray-400 my-1'>
														<span className='mr-3 '>{aluno.plano}</span>
														<span className='mr-3 border-r border-gray-600  max-h-0'></span>
														<span>{aluno.endDate}</span>
													</div>
												</div>
											</div>
										</div>
										<div className='flex flex-row items-center'></div>
										<div className='flex pt-2  text-sm text-gray-400'>
											<div className='flex-1 inline-flex items-center'>
												<HiIdentification className='w-5 h-5 mr-2' />
												<p className=''>{aluno.registration}</p>
											</div>
											<div className='flex-1 inline-flex items-center'>
												<HiFire className='w-5 h-5 mr-2' />
												<p className=''>
													{diasTreinadosNoMes}{" "}
													{diasTreinadosNoMes === 1 || diasTreinadosNoMes === 0
														? "dia de treino no mês"
														: "dias de treino no mês"}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						{/* stats */}
						<div className='grid grid-cols-12 gap-4 '>
							<div className='col-span-12 sm:col-span-6'>
								<div className='p-4 relative  bg-quattor-cinza-claro  shadow-sm  rounded-2xl'>
									<HiSquaresPlus className='w-14 h-14  absolute bottom-4 right-3 text-quattor-verde' />
									<div className='text-2xl text-quattor-azul-escuro font-medium leading-8 mt-5'>
										{gruposTreinadosNoMes}
									</div>
									<div className='text-sm text-gray-500'>Grupos Musculares</div>
								</div>
							</div>
							<div className='col-span-12 sm:col-span-6'>
								<div className='p-4 relative  bg-quattor-cinza-claro shadow-sm  rounded-2xl'>
									<GiMuscleUp className='w-14 h-14  absolute bottom-4 right-3 text-quattor-vermelho' />
									<div className='flex justify-between items-center '>
										<i className='fab fa-behance text-xl text-gray-400'></i>
									</div>
									<div className='text-2xl text-quattor-azul-escuro font-medium leading-8 mt-5'>
										{exerciciosTreinadosNoMes}
									</div>
									<div className='text-sm text-gray-500'>Exercícios no mês</div>
								</div>
							</div>
						</div>
						<div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
							<div className='flex flex-col w-full p-4 col-span-12 relative items-center justify-center bg-quattor-cinza-claro shadow-sm rounded-2xl'>
								<div className=''>
									<div className='text-center p-1 flex-auto justify-center'>
										<HiMiniWallet className='w-10 h-10 flex items-center text-gray-600 mx-auto' />

										<h2 className='text-xl font-bold py-4 text-quattor-azul-escuro'>
											Histórico de treinos
										</h2>
									</div>
									<div className='mt-4  max-h-80 overflow-auto  space-y-4 px-2 text-left'>
										{historicoPorData.length === 0 ? (
											<p className='text-sm text-gray-500'>
												Nenhum treino encontrado no historico.
											</p>
										) : (
											historicoPorData.map((dia) => (
												<div key={dia.data} className='pt-3'>
													<div className='text-sm font-semibold text-quattor-laranja'>
														{dia.data} ({dia.totalTreinos})
													</div>
													<div className='mt-3 space-y-4'>
														{dia.grupos.map((grupo) => (
															<div key={`${dia.data}-${grupo.nome}`}>
																<div className='text-sm  text-quattor-verde '>
																	{grupo.nome} ({grupo.treinos.length})
																</div>

																<ul className='mt-2 ' role='list'>
																	{grupo.treinos.map((treino, index) => (
																		<li
																			key={`${dia.data}-${grupo.nome}-${treino.nome}-${index}`}
																			className='rounded-lg p-2'>
																			<div className='flex flex-wrap items-baseline justify-between '>
																				<span className='flex items-center gap-2 text-quattor-azul-escuro'>
																					<HiCheckCircle className='h-4 w-4 text-quattor-azul' />
																					{treino.nome}
																				</span>
																				<span className='text-xs text-gray-500'>
																					{dia.data}
																				</span>
																			</div>
																		</li>
																	))}
																</ul>
																<hr className='my-2 border-gray-200' />
															</div>
														))}
													</div>
												</div>
											))
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

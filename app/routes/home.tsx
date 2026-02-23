import { useState, useMemo } from "react";
import { useLoaderData } from "react-router";
import MainNavbar from "../components/MainNavbar";
import type { Route } from "./+types/home";
import { FaWhatsapp, FaInstagram, FaCalendarCheck } from "react-icons/fa";
import { HiEnvelope, HiMiniUserPlus } from "react-icons/hi2";
import { RiCalendarScheduleFill } from "react-icons/ri";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Quattor Academia" },
		{ name: "description", content: "bem vindo ao quattor academia" },
	];
}
type Aula = {
	activityDate: string;
	capacity: number;
	endTime: string;
	idActivity: number;
	instructor: string;
	name: string;
	startTime: string;
	ocupation: number;
};

/** Mapeia idActivity para cor da bolinha (Tailwind) */
const CORES_AULAS: Record<number, string> = {
	23: "bg-blue-500",
	24: "bg-blue-400",
	25: "bg-red-600",
	26: "bg-orange-600",
	27: "bg-amber-700",
	28: "bg-amber-800",
	30: "bg-cyan-500",
	31: "bg-emerald-600",
	33: "bg-fuchsia-500",
	34: "bg-violet-500",
	38: "bg-purple-600",
	39: "bg-teal-500",
	41: "bg-red-700",
	42: "bg-pink-500",
	43: "bg-pink-400",
	53: "bg-rose-400",
	54: "bg-rose-300",
	55: "bg-pink-600",
	56: "bg-pink-500",
	57: "bg-fuchsia-600",
	58: "bg-pink-400",
	62: "bg-pink-500",
	63: "bg-slate-700",
	64: "bg-pink-500",
	65: "bg-fuchsia-500",
	66: "bg-fuchsia-600",
	67: "bg-indigo-500",
	68: "bg-teal-600",
	69: "bg-amber-600",
};

function corAula(idActivity: number): string {
	return CORES_AULAS[idActivity] ?? "bg-quattor-verde";
}

const CODIGOS_AULAS = {
	1: "Musculação",
	23: "Natação adulto",
	24: "Natação infantil",
	25: "Boxe",
	26: "Muay Thai",
	27: "Jiu Jitsu",
	28: "Judo",
	30: "Hidroginastica",
	31: "Spinning",
	33: "FiDance",
	34: "Pilates Solo",
	38: "Pilates Studio",
	39: "Quattor Prime",
	41: "Karatê",
	42: "Ballet adulto",
	43: "Ballet infantil",
	53: "Baby 1 - Ballet",
	54: "Baby 2 - Ballet",
	55: "Teens com pontas",
	56: "Ballet Adulto Base",
	57: "Ballet Intermediário + pontas",
	58: "Ballet Iniciação Adulto do Zero",
	62: "BALLET ADULTO BÁSICO 2",
	63: "KRAV MAGA",
	64: "BALLET INICIAÇÃO(SEG E QUARTA)19h",
	65: "BALLET BASE + PONTAS(1:30 DE AULA",
	66: "BALLET INTERMEDIÁRIO + PONTAS(1:30 DE AULA)",
	67: "Dança Comtemporânea",
	68: "PRIME 2X",
	69: "KUNG FU",
};

function primeiroNome(nomeCompleto: string): string {
	return nomeCompleto.trim().split(/\s+/)[0] ?? nomeCompleto;
}

function formatarDataExibicao(dataStr: string): string {
	if (!dataStr) return "";
	const d = new Date(dataStr);
	const dias = [
		"Domingo",
		"Segunda",
		"Terça",
		"Quarta",
		"Quinta",
		"Sexta",
		"Sábado",
	];
	const diaSemana = dias[d.getDay()] ?? "";
	const dia = d.getDate();
	const mes = String(d.getMonth() + 1).padStart(2, "0");
	return `${diaSemana} ${dia}/${mes}`;
}

function agruparAulasPorData(aulas: Aula[]): Map<string, Aula[]> {
	const map = new Map<string, Aula[]>();
	for (const aula of aulas) {
		const key = aula.activityDate;
		const list = map.get(key) ?? [];
		list.push(aula);
		map.set(key, list);
	}
	for (const list of map.values()) {
		list.sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
	}
	return map;
}

/** Extrai YYYY-MM-DD de activityDate (API pode retornar "2026-02-18T00:00:00") */
function extrairData(activityDate: string): string {
	return activityDate.slice(0, 10);
}

/** Retorna aulas cujo horário de início é >= hora atual (hoje) ou em datas futuras */
function filtrarAulasProximas(aulas: Aula[]): Aula[] {
	const now = new Date();
	const hoje = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	const horaAtual = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

	return aulas.filter((a) => {
		const dataAula = extrairData(a.activityDate);
		if (dataAula > hoje) return true;
		if (dataAula < hoje) return false;
		return a.startTime >= horaAtual;
	});
}

function apenasCamposAula(item: Record<string, unknown>): Aula {
	const idActivity =
		Number(item.idActivity ?? item.id_activity ?? item.id_aula ?? 0) || 0;
	return {
		activityDate: String(item.activityDate ?? ""),
		capacity: Number(item.capacity ?? 0),
		endTime: String(item.endTime ?? ""),
		idActivity,
		instructor: String(item.instructor ?? ""),
		name: String(item.name ?? ""),
		startTime: String(item.startTime ?? ""),
		ocupation: Number(item.ocupation ?? 0),
	};
}

function dataHojeISO(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function loader() {
	const aulas = await getAulas(dataHojeISO());
	return aulas as Aula[];
}

async function getAulas(dataMes: string) {
	const response = await fetch(
		//`https://api.quattoracademia.com/aulas_data_mes/?id_aula=${idAula}&data_mes=${dataMes}`,

		`https://api.quattoracademia.com/aulas_by_date/?data=${dataMes}`,
	);
	const data = (await response.json()) as unknown;
	const raw = Array.isArray(data) ? data : [];

	return raw
		.filter(
			(item): item is Record<string, unknown> =>
				item != null && typeof item === "object",
		)
		.map(apenasCamposAula)
		.filter(
			(aula) => aula.idActivity !== 19 && aula.idActivity !== 39,
		) as Aula[];
}

export default function Home() {
	const aulas = useLoaderData<typeof loader>() as Aula[];
	const aulasPorData = agruparAulasPorData(aulas);
	const aulasPorDataProximas = agruparAulasPorData(filtrarAulasProximas(aulas));
	const [filtroAulaHoje, setFiltroAulaHoje] = useState<string>("todas");

	const nomesAulasHoje = useMemo(() => {
		const nomes = new Set<string>();
		for (const aulasDoDia of aulasPorData.values()) {
			for (const a of aulasDoDia) {
				nomes.add(a.name);
			}
		}
		return Array.from(nomes).sort((a, b) => a.localeCompare(b));
	}, [aulasPorData]);
	return (
		<>
			<MainNavbar />

			{/* component */}
			<section className='bg-quattor-cinza-claro dark:bg-gray-950'>
				<div className='py-10'>
					<div className='mx-auto px-6 max-w-6xl text-gray-500'>
						<div className='relative'>
							<div className='relative z-10 grid gap-3 grid-cols-6'>
								<div
									className='col-span-full shadow-sm lg:col-span-6 overflow-hidden flex relative min-h-[280px] rounded-xl bg-cover bg-center'
									style={{
										backgroundImage: `url('/backgroud%20quattor.webp')`,
									}}>
									<div className='absolute bottom-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-sm rounded-b-xl px-1 py-4 flex flex-wrap items-center justify-center gap-6 sm:gap-8'>
										<p className='text-sm font-bold text-quattor-laranja'>
											RUA 5 SUL - ÁGUAS CLARAS
										</p>
										<a
											href='https://wa.me/5561993190568'
											target='_blank'
											rel='noreferrer'
											className='flex items-center gap-2 text-white hover:text-[#25D366] transition-colors'>
											<FaWhatsapp className='w-7 h-7 text-[#25D366]' />
											<span className='font-bold'>(61) 99319-0568</span>
										</a>

										<div className='flex gap-4'>
											<a
												href='https://www.instagram.com/quattor_academia/'
												target='_blank'
												rel='noreferrer'
												className='text-white/80 hover:text-pink-400 transition-colors'>
												<FaInstagram className='w-6 h-6' />
											</a>
											<a
												href='mailto:recepcao@quattoracademia.com'
												className='text-white/80 hover:text-blue-400 transition-colors'>
												<HiEnvelope className='w-6 h-6' />
											</a>
										</div>
									</div>
								</div>
								<div className='col-span-full   shadow-sm sm:col-span-3 lg:col-span-3 overflow-hidden relative p-8 rounded-xl bg-white border border-gray-200 dark:border-gray-800 dark:bg-gray-900'>
									<div>
										<RiCalendarScheduleFill className='mx-auto w-10 h-10 text-quattor-vermelho' />
										<div className='mt-6 text-center relative z-10 space-y-3'>
											<h2 className='text-lg font-medium text-gray-800 transition group-hover:text-purple-950 dark:text-white'>
												Horário de Funcionamento
											</h2>
											<div className='space-y-2 text-sm dark:text-gray-300 text-quattor-azul-escuro'>
												<p className='font-semibold'>
													Segunda a Sexta: 5h às 23h
												</p>
												<p className='font-semibold'>
													Sáb | Dom | Feriados: 8h às 12h
												</p>
											</div>
										</div>
									</div>
								</div>

								<div className='col-span-full shadow-sm sm:col-span-3 lg:col-span-3 overflow-hidden relative p-8 rounded-xl bg-white border border-gray-200 dark:border-gray-800 dark:bg-gray-900'>
									<div>
										<FaCalendarCheck className='mx-auto w-10 h-10 text-quattor-verde' />
										<div className='mt-14 text-center relative z-10 space-y-4'>
											<h2 className='text-lg font-medium text-gray-800 transition group-hover:text-purple-950 dark:text-white'>
												Agende sua aula
											</h2>
											<div className='flex justify-center'>
												<button
													onClick={() =>
														window.open("https://wa.me/5561993190568", "_blank")
													}
													className='inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-quattor-verde text-white font-bold shadow-md hover:bg-[#20bd5a] hover:shadow-lg transition-all'>
													<FaWhatsapp className='w-6 h-6' />
													<span>(61) 99319-0568</span>
												</button>
											</div>
										</div>
									</div>
								</div>
								<div className='col-span-full grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div className='shadow-sm overflow-hidden relative p-6 rounded-xl bg-white border border-gray-200 dark:border-gray-800 dark:bg-gray-900'>
										<div className='p-4'>
											<FaCalendarCheck className='mx-auto w-8 h-8 text-quattor-azul mb-3' />
											<h2 className='text-base font-medium text-gray-800 dark:text-white mb-4 text-center'>
												Próximas aulas
											</h2>
											{aulasPorDataProximas.size === 0 ? (
												<p className='text-center text-xs text-gray-500 dark:text-gray-400'>
													Nenhuma aula programada.
												</p>
											) : (
												<div className='space-y-4'>
													{Array.from(aulasPorDataProximas.entries()).map(
														([data, aulasDoDia]) => (
															<div key={data}>
																<span className='text-gray-900 dark:text-white inline-block uppercase font-medium tracking-wider text-xs mb-2'>
																	{formatarDataExibicao(data)}
																</span>
																{aulasDoDia.map((aula, idx) => (
																	<div
																		key={`${aula.activityDate}-${aula.startTime}-${aula.name}-${idx}`}
																		className='flex flex-col md:flex-row md:items-center gap-0.5 md:gap-0 mb-2'>
																		<div className='w-full md:w-4/12 md:min-w-14'>
																			<span className='text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap'>
																				{aula.startTime}
																			</span>
																		</div>
																		<div className='w-full md:w-8/12 flex items-center gap-2'>
																			<span
																				className={`shrink-0 w-2 h-2 rounded-full ${corAula(aula.idActivity)}`}
																				aria-hidden
																			/>
																			<span className='text-xs font-medium text-gray-800 dark:text-white'>
																				{aula.name}
																			</span>
																		</div>
																	</div>
																))}
															</div>
														),
													)}
												</div>
											)}
										</div>
									</div>

									<div className='shadow-sm overflow-hidden relative p-6 rounded-xl bg-white border border-gray-200 dark:border-gray-800 dark:bg-gray-900'>
										<div className='p-4'>
											<FaCalendarCheck className='mx-auto w-8 h-8 text-quattor-laranja mb-3' />
											<h2 className='text-base font-medium text-gray-800 dark:text-white mb-4 text-center'>
												Aulas de hoje
											</h2>
											{aulasPorData.size === 0 ? (
												<p className='text-center text-xs text-gray-500 dark:text-gray-400'>
													Nenhuma aula agendada.
												</p>
											) : (
												<>
													<select
														value={filtroAulaHoje}
														onChange={(e) => setFiltroAulaHoje(e.target.value)}
														className='w-full mb-4 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2 focus:ring-2 focus:ring-quattor-laranja focus:border-transparent'>
														<option value='todas'>Todas as aulas</option>
														{nomesAulasHoje.map((nome) => (
															<option key={nome} value={nome}>
																{nome}
															</option>
														))}
													</select>
													<div className='space-y-4'>
														{Array.from(aulasPorData.entries()).map(
															([data, aulasDoDia]) => {
																const aulasFiltradas =
																	filtroAulaHoje === "todas"
																		? aulasDoDia
																		: aulasDoDia.filter(
																				(a) => a.name === filtroAulaHoje,
																			);
																if (aulasFiltradas.length === 0) return null;
																return (
																	<div key={data}>
																		<span className='text-gray-900 dark:text-white inline-block uppercase font-medium tracking-wider text-xs mb-2'>
																			{formatarDataExibicao(data)}
																		</span>
																		{aulasFiltradas.map((aula, idx) => (
																			<div
																				key={`${aula.activityDate}-${aula.startTime}-${aula.name}-${idx}`}
																				className='flex flex-col md:flex-row md:items-center gap-0.5 md:gap-0 mb-2'>
																				<div className='w-full md:w-4/12 md:min-w-14'>
																					<span className='text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap'>
																						{aula.startTime}
																					</span>
																				</div>
																				<div className='w-full md:w-8/12 flex items-center gap-2'>
																					<span
																						className={`shrink-0 w-2 h-2 rounded-full ${corAula(aula.idActivity)}`}
																						aria-hidden
																					/>
																					<span className='text-xs font-medium text-gray-800 dark:text-white'>
																						{aula.name}
																					</span>
																					{aula.capacity - aula.ocupation >
																					0 ? (
																						<span className='inline-flex items-center justify-center shrink-0 min-w-8 h-6 px-1.5 rounded-full  text-quattor-verde dark:bg-quattor-verde/25 text-xs font-medium gap-1'>
																							<HiMiniUserPlus
																								className='w-3 h-3 shrink-0'
																								aria-hidden
																							/>
																							{/* <span>
																								{aula.capacity - aula.ocupation}
																							</span> */}
																						</span>
																					) : null}
																				</div>
																			</div>
																		))}
																	</div>
																);
															},
														)}
													</div>
												</>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Modalidades / Atividades */}
			<section className='py-10 bg-quattor-cinza-claro dark:bg-gray-950'>
				<div className='mx-auto px-6 max-w-6xl'>
					<h2 className='text-2xl font-bold text-center text-gray-800 dark:text-white mb-8'>
						Nossas Modalidades
					</h2>
					<div className='flex flex-wrap -mx-4'>
						{[
							{
								title: "Musculação",
								subtitle: "Método exclusivo e Treinos semanais",
								coverImg: "/musc.webp",
								avatarImg: "/bola_quattor.svg",
								badge: "Método Quattor",
							},
							{
								title: "Natação",
								subtitle: "Piscina salinizada e aquecida",
								coverImg: "/natacao.webp",
								avatarImg: "/bola_quattor.svg",
								badge: "Piscina salinizada",
							},
							{
								title: "Ballet",
								subtitle: "Infantil , Adulto e Contemporâneo",
								coverImg: "/ballet.webp",
								avatarImg: "/bola_quattor.svg",
								badge: "Infantil e Adulto ",
							},
							{
								title: "Boxe",
								subtitle: "Boxe Fitness",
								coverImg: "/boxe.webp",
								avatarImg: "/bola_quattor.svg",
								badge: "Boxe Fitness",
							},
						].map((item) => (
							<div
								key={item.title}
								className='w-full md:w-1/2 lg:w-1/3 py-2 px-2'>
								<a href='/aulas'>
									<div className='bg-white dark:bg-gray-900 relative shadow p-2 rounded-xl text-gray-800 dark:text-gray-200 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800'>
										<div className='right-0 mt-4 rounded-l-full absolute text-center font-bold text-xs text-white px-2 py-1 bg-quattor-laranja'>
											{item.badge}
										</div>
										<img
											src={item.coverImg}
											alt={item.title}
											className='h-32 rounded-lg w-full object-cover'
										/>
										<div className='flex justify-center'>
											<img
												src={item.avatarImg}
												alt={item.title}
												className='rounded-full -mt-6 border-4 object-center object-contain border-white dark:border-gray-900 bg-white p-1 h-16 w-16'
											/>
										</div>
										<div className='py-2 px-2'>
											<div className='font-bold text-center text-gray-800 dark:text-white'>
												{item.title}
											</div>
											<div className='text-sm font-light text-center my-2 text-gray-600 dark:text-gray-400'>
												{item.subtitle}
											</div>
										</div>
									</div>
								</a>
							</div>
						))}
					</div>
				</div>
			</section>
		</>
	);
}

import { useMemo, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { ArrowRight, CalendarDays, Clock, LogIn, Mail, MapPin, Search, UserPlus, X } from "lucide-react";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";
import MainNavbar from "../components/MainNavbar";
import type { Route } from "./+types/home";
import { aulasDoDia, hojeBrasilia, type Aula } from "../aulas/agenda.server";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Quattor Academia" },
		{ name: "description", content: "bem vindo ao quattor academia" },
	];
}

/** Aulas de hoje (dia de Brasília), direto da grade do banco. */
export async function loader() {
	return aulasDoDia(hojeBrasilia());
}

const WHATSAPP = "https://wa.me/5561993190568";
const TELEFONE = "(61) 99319-0568";

/**
 * Modalidade da aula pelo nome da turma: "Natação - iniciação (6 a 10 anos)"
 * → "Natação", "Pilates Studio" → "Pilates". É por ela que a busca agrupa.
 */
function modalidadeDa(nome: string): string {
	const limpo = nome.split(" - ")[0].trim();
	if (/^fit\s*dance/i.test(limpo)) return "Fit Dance";
	const primeira = limpo.split(/\s+/)[0] ?? limpo;
	return primeira.charAt(0).toUpperCase() + primeira.slice(1).toLowerCase();
}

/** Cor fixa das modalidades principais, só com as cores da marca. */
const COR_FIXA: Record<string, string> = {
	Natação: "bg-quattor-azul",
	Pilates: "bg-quattor-verde",
	Ballet: "bg-quattor-laranja",
	Boxe: "bg-quattor-vermelho",
	Spinning: "bg-quattor-azul-escuro",
	"Fit Dance": "bg-quattor-laranja/50",
	Yoga: "bg-quattor-verde/50",
	Judô: "bg-quattor-azul/50",
	Karatê: "bg-quattor-vermelho/50",
	Jiujitsu: "bg-quattor-azul-escuro/50",
};

/** Modalidade nova, sem cor fixa: cor estável pelo nome. */
const CORES_MODALIDADE = [
	"bg-quattor-azul",
	"bg-quattor-laranja",
	"bg-quattor-verde",
	"bg-quattor-vermelho",
	"bg-quattor-azul-escuro",
];
function corDaModalidade(modalidade: string): string {
	if (COR_FIXA[modalidade]) return COR_FIXA[modalidade];
	let h = 0;
	for (const c of modalidade) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	return CORES_MODALIDADE[h % CORES_MODALIDADE.length];
}

/** Sem acento e minúsculo — "natacao" acha "Natação". */
function normalizar(texto: string): string {
	return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * "HH:MM" agora em Brasília. Igual no servidor (UTC) e no navegador, então
 * "só as próximas" não muda de resultado na hidratação.
 */
function horaAgoraBrasilia(): string {
	return new Intl.DateTimeFormat("pt-BR", {
		timeZone: "America/Sao_Paulo",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date());
}

function primeiroNome(nomeCompleto: string): string {
	const primeiro = nomeCompleto.trim().split(/\s+/)[0] ?? "";
	return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}

const MODALIDADES = [
	{
		titulo: "Musculação",
		subtitulo: "Método Quattor, com treinos novos toda semana",
		imagem: "/musc.webp",
		selo: "Método Quattor",
		busca: null, // sala livre: não tem grade de aulas
	},
	{
		titulo: "Natação",
		subtitulo: "Piscina salinizada e aquecida, infantil e adulto",
		imagem: "/natacao.webp",
		selo: "Piscina aquecida",
		busca: "Natação",
	},
	{
		titulo: "Ballet",
		subtitulo: "Do baby ao adulto, com pontas e contemporâneo",
		imagem: "/ballet.webp",
		selo: "Infantil e adulto",
		busca: "Ballet",
	},
	{
		titulo: "Boxe",
		subtitulo: "Boxe fitness para condicionamento e técnica",
		imagem: "/boxe.webp",
		selo: "Boxe fitness",
		busca: "Boxe",
	},
];

/** Quadrado colorido com ícone — mesmo padrão das páginas do aluno. */
function IconeBento({ cor, children }: { cor: string; children: React.ReactNode }) {
	return <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cor}`}>{children}</span>;
}

const AULAS_INICIAIS = 9; // 3 linhas de 3 no desktop

export default function Home() {
	const aulas: Aula[] = useLoaderData<typeof loader>();
	const [busca, setBusca] = useState("");
	const [modalidade, setModalidade] = useState<string | null>(null);
	const [soProximas, setSoProximas] = useState(true);
	const [verTodas, setVerTodas] = useState(false);
	const secaoAulas = useRef<HTMLElement>(null);

	const modalidades = useMemo(
		() => [...new Set(aulas.map((a) => modalidadeDa(a.name)))].sort((a, b) => a.localeCompare(b)),
		[aulas],
	);

	const agora = horaAgoraBrasilia();
	const filtradas = useMemo(() => {
		const termo = normalizar(busca.trim());
		return aulas
			.filter((a) => !soProximas || a.startTime >= agora)
			.filter((a) => !modalidade || modalidadeDa(a.name) === modalidade)
			.filter((a) => !termo || normalizar(`${a.name} ${a.instructor}`).includes(termo))
			.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.name.localeCompare(b.name));
	}, [aulas, busca, modalidade, soProximas, agora]);
	const visiveis = verTodas ? filtradas : filtradas.slice(0, AULAS_INICIAIS);
	const filtrando = !!busca.trim() || !!modalidade;

	function filtrarPorModalidade(nome: string) {
		const existe = modalidades.find((m) => normalizar(m) === normalizar(nome));
		setModalidade(existe ?? null);
		setBusca(existe ? "" : nome);
		setSoProximas(false);
		setVerTodas(true);
		secaoAulas.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	}

	function limparFiltros() {
		setBusca("");
		setModalidade(null);
	}

	return (
		<>
			<MainNavbar />
			<main className='bg-quattor-fundo'>
				<div className='mx-auto max-w-6xl space-y-10 px-4 py-6 sm:py-10'>
					{/* Bento: destaque + horário + contato */}
					<section className='grid gap-4 lg:grid-cols-3'>
						<div
							className='relative flex min-h-[300px] overflow-hidden rounded-3xl bg-cover bg-center shadow-lg lg:col-span-2 lg:row-span-2 lg:min-h-[420px]'
							style={{ backgroundImage: `url('/backgroud%20quattor.webp')` }}>
							<div className='absolute inset-0 bg-gradient-to-t from-quattor-azul-escuro via-quattor-azul-escuro/70 to-quattor-azul-escuro/10' />
							<div className='relative mt-auto w-full p-6 sm:p-8'>
								<p className='mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur'>
									<MapPin className='h-3.5 w-3.5' />
									Águas Claras · Brasília
								</p>
								<h1 className='max-w-lg text-3xl font-bold leading-tight text-white sm:text-4xl'>
									Musculação, natação, lutas e dança no mesmo lugar.
								</h1>
								<div className='mt-5 flex flex-wrap gap-3'>
									<a
										href={WHATSAPP}
										target='_blank'
										rel='noreferrer'
										className='inline-flex items-center gap-2 rounded-xl bg-quattor-laranja px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-105'>
										<UserPlus className='h-4 w-4' />
										Agendar aula experimental
									</a>
									<Link
										to='/login'
										className='inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/40 backdrop-blur transition hover:bg-white/20'>
										<LogIn className='h-4 w-4' />
										Área do aluno
									</Link>
								</div>
							</div>
						</div>

						<div className='rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
							<div className='flex items-center gap-3'>
								<IconeBento cor='bg-quattor-azul/10'>
									<Clock className='h-5 w-5 text-quattor-azul' />
								</IconeBento>
								<h2 className='font-bold text-quattor-azul-escuro'>Horário de funcionamento</h2>
							</div>
							<dl className='mt-5 space-y-3 text-sm'>
								<div className='flex items-center justify-between border-b border-gray-100 pb-3'>
									<dt className='text-gray-500'>Segunda a sexta</dt>
									<dd className='font-semibold text-quattor-azul-escuro'>5h às 23h</dd>
								</div>
								<div className='flex items-center justify-between'>
									<dt className='text-gray-500'>Sáb, dom e feriados</dt>
									<dd className='font-semibold text-quattor-azul-escuro'>8h às 12h</dd>
								</div>
							</dl>
						</div>

						<div className='rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100'>
							<div className='flex items-center gap-3'>
								<IconeBento cor='bg-quattor-laranja/10'>
									<MapPin className='h-5 w-5 text-quattor-laranja' />
								</IconeBento>
								<div>
									<h2 className='font-bold text-quattor-azul-escuro'>Onde estamos</h2>
									<p className='text-sm text-gray-500'>Rua 5 Sul · Águas Claras</p>
								</div>
							</div>
							<div className='mt-5 space-y-2'>
								<a
									href={WHATSAPP}
									target='_blank'
									rel='noreferrer'
									className='flex items-center justify-between rounded-xl bg-quattor-verde px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105'>
									<span className='inline-flex items-center gap-2'>
										<FaWhatsapp className='h-5 w-5' />
										{TELEFONE}
									</span>
									<ArrowRight className='h-4 w-4' />
								</a>
								<div className='grid grid-cols-2 gap-2'>
									<a
										href='https://www.instagram.com/quattor_academia/'
										target='_blank'
										rel='noreferrer'
										className='inline-flex items-center justify-center gap-2 rounded-xl bg-quattor-fundo px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:text-quattor-azul'>
										<FaInstagram className='h-4 w-4' />
										Instagram
									</a>
									<a
										href='mailto:recepcao@quattoracademia.com'
										className='inline-flex items-center justify-center gap-2 rounded-xl bg-quattor-fundo px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:text-quattor-azul'>
										<Mail className='h-4 w-4' />
										E-mail
									</a>
								</div>
							</div>
						</div>
					</section>

					{/* Modalidades */}
					<section>
						<div className='mb-4 flex items-end justify-between'>
							<h2 className='text-xl font-bold text-quattor-azul-escuro sm:text-2xl'>Nossas modalidades</h2>
						</div>
						<div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'>
							{MODALIDADES.map((m) => {
								const conteudo = (
									<>
										<img
											src={m.imagem}
											alt=''
											className='absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105'
										/>
										<div className='absolute inset-0 bg-gradient-to-t from-quattor-azul-escuro/95 via-quattor-azul-escuro/40 to-transparent' />
										<span className='absolute left-3 top-3 rounded-full bg-quattor-laranja px-2.5 py-1 text-[11px] font-semibold text-white'>
											{m.selo}
										</span>
										<div className='relative mt-auto p-4 text-left'>
											<h3 className='text-lg font-bold text-white'>{m.titulo}</h3>
											<p className='mt-0.5 hidden text-xs text-white/75 sm:block'>{m.subtitulo}</p>
											<p className='mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white'>
												{m.busca ? "Ver aulas de hoje" : "Livre no horário de funcionamento"}
												{m.busca && <ArrowRight className='h-3.5 w-3.5' />}
											</p>
										</div>
									</>
								);
								const classe =
									"group relative flex aspect-[4/5] overflow-hidden rounded-3xl shadow-sm sm:aspect-[3/4]";
								return m.busca ? (
									<button key={m.titulo} type='button' onClick={() => filtrarPorModalidade(m.busca)} className={classe}>
										{conteudo}
									</button>
								) : (
									<div key={m.titulo} className={classe}>
										{conteudo}
									</div>
								);
							})}
						</div>
					</section>

					{/* Aulas de hoje, com busca */}
					<section ref={secaoAulas} className='scroll-mt-24 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-6'>
						<div className='flex flex-wrap items-center justify-between gap-3'>
							<div className='flex items-center gap-3'>
								<IconeBento cor='bg-quattor-azul/10'>
									<CalendarDays className='h-5 w-5 text-quattor-azul' />
								</IconeBento>
								<div>
									<h2 className='font-bold text-quattor-azul-escuro'>Aulas de hoje</h2>
									<p className='text-sm text-gray-500'>
										{aulas.length} {aulas.length === 1 ? "aula" : "aulas"} na grade
									</p>
								</div>
							</div>
							<div className='inline-flex rounded-xl bg-quattor-fundo p-1 text-xs font-semibold'>
								{[
									{ valor: true, rotulo: "Próximas" },
									{ valor: false, rotulo: "O dia todo" },
								].map((opcao) => (
									<button
										key={opcao.rotulo}
										type='button'
										onClick={() => setSoProximas(opcao.valor)}
										className={`rounded-lg px-3 py-1.5 transition ${
											soProximas === opcao.valor ? "bg-white text-quattor-azul-escuro shadow-sm" : "text-gray-500"
										}`}>
										{opcao.rotulo}
									</button>
								))}
							</div>
						</div>

						<label className='relative mt-5 block'>
							<span className='sr-only'>Buscar aula</span>
							<Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
							<input
								type='search'
								value={busca}
								onChange={(e) => setBusca(e.target.value)}
								placeholder='Buscar aula ou professor (ex.: natação, pilates)'
								className='w-full rounded-xl border border-gray-200 bg-quattor-fundo py-3 pl-10 pr-4 text-sm text-quattor-azul-escuro placeholder-gray-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-quattor-azul'
							/>
						</label>

						{modalidades.length > 1 && (
							<div className='-mx-5 mt-3 overflow-x-auto px-5 sm:-mx-6 sm:px-6'>
								<div className='flex w-max gap-2 pb-1'>
									{[null, ...modalidades].map((m) => {
										const ativo = modalidade === m;
										return (
											<button
												key={m ?? "todas"}
												type='button'
												onClick={() => setModalidade(m)}
												className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
													ativo
														? "bg-quattor-azul-escuro text-white"
														: "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-quattor-azul"
												}`}>
												{m && <span className={`h-2 w-2 rounded-full ${corDaModalidade(m)}`} />}
												{m ?? "Todas"}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{filtradas.length === 0 ? (
							<div className='flex flex-col items-center py-10 text-center'>
								<p className='font-medium text-quattor-azul-escuro'>
									{aulas.length === 0
										? "Nenhuma aula na grade de hoje."
										: soProximas && !filtrando
											? "As aulas de hoje já terminaram."
											: "Nenhuma aula encontrada."}
								</p>
								{(filtrando || soProximas) && aulas.length > 0 && (
									<button
										type='button'
										onClick={() => {
											limparFiltros();
											setSoProximas(false);
										}}
										className='mt-3 inline-flex items-center gap-1 text-sm font-semibold text-quattor-azul hover:underline'>
										<X className='h-4 w-4' />
										Ver todas as aulas do dia
									</button>
								)}
							</div>
						) : (
							<>
								<ul className='mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3'>
									{visiveis.map((aula, idx) => {
										const mod = modalidadeDa(aula.name);
										return (
											<li
												key={`${aula.startTime}-${aula.name}-${idx}`}
												className='flex items-start gap-3 rounded-2xl bg-quattor-fundo p-3'>
												<div className='w-12 shrink-0 pt-0.5 text-sm font-bold tabular-nums text-quattor-azul-escuro'>
													{aula.startTime}
												</div>
												<div className='min-w-0 flex-1'>
													<p className='flex items-start gap-1.5 text-sm font-semibold leading-snug text-quattor-azul-escuro'>
														<span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${corDaModalidade(mod)}`} aria-hidden />
														<span className='line-clamp-2'>{aula.name}</span>
													</p>
													<p className='mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500'>
														{aula.instructor && <span>{primeiroNome(aula.instructor)}</span>}
														{aula.endTime && <span>até {aula.endTime}</span>}
													</p>
												</div>
											</li>
										);
									})}
								</ul>
								{filtradas.length > AULAS_INICIAIS && (
									<div className='mt-4 text-center'>
										<button
											type='button'
											onClick={() => setVerTodas((v) => !v)}
											className='text-sm font-semibold text-quattor-azul hover:underline'>
											{verTodas ? "Mostrar menos" : `Ver todas (${filtradas.length})`}
										</button>
									</div>
								)}
							</>
						)}
					</section>
				</div>
			</main>
		</>
	);
}

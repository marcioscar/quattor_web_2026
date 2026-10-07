import type { Route } from "./+types/historico";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, redirect } from "react-router";
import {
	HiArrowLeft,
	HiCalendarDays,
	HiCheckCircle,
	HiChevronLeft,
	HiChevronRight,
	HiFire,
	HiOutlineClipboardDocumentList,
	HiPlay,
	HiRectangleStack,
} from "react-icons/hi2";
import { TrendingUp } from "lucide-react";
import MainNavbar from "../components/MainNavbar";
import { buscarHistorico } from "../models/treinos.server";
import { getSessionRegistration } from "../session.server";
import {
	chaveDiaLocal,
	chaveExercicio,
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

// ── Calendário do mês ───────────────────────────────────────────────────────

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** "2026-10" → 1º de outubro de 2026 (fuso local, igual a chaveDiaLocal). */
function inicioDoMes(chaveMes: string): Date {
	const [ano, mes] = chaveMes.split("-").map(Number);
	return new Date(ano, mes - 1, 1);
}

function chaveMesDe(data: Date): string {
	return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Grade do mês com os dias treinados em verde. Navega entre o primeiro mês
 * com treino e o mês atual; tocar num dia rola até o cartão dele na lista.
 */
function CalendarioTreinos({ meses }: { meses: Mes[] }) {
	const diasPorChave = useMemo(() => {
		const mapa = new Map<string, Dia>();
		for (const m of meses) for (const d of m.dias) mapa.set(d.chave, d);
		return mapa;
	}, [meses]);

	// As setas pulam direto entre os meses com treino (e o mês atual), sem
	// passar por meses vazios.
	const navegaveis = useMemo(
		() => [...new Set([...meses.map((m) => m.chave), chaveMesDe(new Date())])].sort(),
		[meses],
	);
	const maisRecente = meses[0]?.chave ?? chaveMesDe(new Date());
	const [mes, setMes] = useState(maisRecente);
	useEffect(() => setMes(maisRecente), [maisRecente]);
	const posicao = navegaveis.indexOf(mes);

	const primeiro = inicioDoMes(mes);
	const deslocamento = (primeiro.getDay() + 6) % 7; // semana começa na segunda
	const totalDias = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0).getDate();
	const hoje = chaveDiaLocal(new Date().toISOString()) ?? "";
	const treinadosNoMes = [...diasPorChave.keys()].filter((k) => k.startsWith(mes)).length;
	const titulo = maiusculaInicial(primeiro.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));

	function irParaDia(chave: string) {
		document.getElementById(`dia-${chave}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
	}

	return (
		<section className='rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100'>
			<div className='mb-4 flex items-center justify-between'>
				<div>
					<h2 className='font-bold text-quattor-azul-escuro'>{titulo}</h2>
					<p className='text-xs text-gray-500'>
						{treinadosNoMes} {treinadosNoMes === 1 ? "dia de treino" : "dias de treino"}
					</p>
				</div>
				<div className='flex gap-1'>
					<button
						type='button'
						onClick={() => setMes(navegaveis[posicao - 1])}
						disabled={posicao <= 0}
						aria-label='Mês anterior'
						className='flex h-9 w-9 items-center justify-center rounded-xl bg-quattor-fundo text-quattor-azul-escuro transition hover:bg-gray-200 disabled:opacity-30'>
						<HiChevronLeft className='h-4 w-4' />
					</button>
					<button
						type='button'
						onClick={() => setMes(navegaveis[posicao + 1])}
						disabled={posicao >= navegaveis.length - 1}
						aria-label='Próximo mês'
						className='flex h-9 w-9 items-center justify-center rounded-xl bg-quattor-fundo text-quattor-azul-escuro transition hover:bg-gray-200 disabled:opacity-30'>
						<HiChevronRight className='h-4 w-4' />
					</button>
				</div>
			</div>

			<div className='grid grid-cols-7 gap-1 text-center'>
				{DIAS_SEMANA.map((d) => (
					<span key={d} className='pb-1 text-[11px] font-semibold uppercase text-gray-400'>
						{d}
					</span>
				))}
				{Array.from({ length: deslocamento }, (_, i) => (
					<span key={`vazio-${i}`} />
				))}
				{Array.from({ length: totalDias }, (_, i) => {
					const numero = i + 1;
					const chave = `${mes}-${String(numero).padStart(2, "0")}`;
					const dia = diasPorChave.get(chave);
					const ehHoje = chave === hoje;
					if (!dia) {
						return (
							<span
								key={chave}
								className={`flex aspect-square items-center justify-center rounded-xl text-sm text-gray-400 ${
									ehHoje ? "ring-2 ring-quattor-azul" : ""
								}`}>
								{numero}
							</span>
						);
					}
					const grupos = dia.grupos.map((g) => g.nome).join(", ");
					return (
						<button
							key={chave}
							type='button'
							onClick={() => irParaDia(chave)}
							title={`${dia.total} ${dia.total === 1 ? "exercício" : "exercícios"} · ${grupos}`}
							aria-label={`Dia ${numero}: ${dia.total} exercícios (${grupos})`}
							className={`flex aspect-square items-center justify-center rounded-xl bg-quattor-verde text-sm font-bold text-white transition hover:brightness-110 ${
								ehHoje ? "ring-2 ring-quattor-azul ring-offset-2" : ""
							}`}>
							{numero}
						</button>
					);
				})}
			</div>
			<p className='mt-3 flex items-center gap-2 text-xs text-gray-500'>
				<span className='h-3 w-3 rounded bg-quattor-verde' /> dia com treino · toque para ver
			</p>
		</section>
	);
}

// ── Evolução de carga ───────────────────────────────────────────────────────

type PontoCarga = { data: Date; valor: number; texto: string };

/** Acima disso é erro de digitação (havia "44444 kg" no banco) e fica fora do gráfico. */
const CARGA_MAXIMA_KG = 1000;

/**
 * Primeiro número da carga digitada: "20 kg" → 20, "12,5kg" → 12.5,
 * "72, depois 50 kg" → 72. Sem número (" kg", "undefined kg") → null.
 */
function numeroDaCarga(carga: string | undefined): number | null {
	const m = (carga ?? "").match(/\d+(?:[.,]\d+)?/);
	if (!m) return null;
	const n = Number(m[0].replace(",", "."));
	return Number.isFinite(n) && n > 0 && n <= CARGA_MAXIMA_KG ? n : null;
}

/** Exercícios com pelo menos uma carga numérica, o registrado por último primeiro. */
function seriesDeCarga(treinos: TreinoHistorico[]) {
	const porExercicio = new Map<string, { nome: string; pontos: PontoCarga[] }>();
	for (const t of treinos) {
		const valor = numeroDaCarga(t.carga);
		const data = parseDataHistorico(t.data);
		const chave = chaveExercicio(t.nome);
		if (valor == null || !data || !chave) continue;
		const serie = porExercicio.get(chave) ?? { nome: t.nome.trim(), pontos: [] };
		serie.pontos.push({ data, valor, texto: (t.carga ?? "").trim() });
		porExercicio.set(chave, serie);
	}
	return [...porExercicio.entries()]
		.map(([chave, s]) => ({ chave, nome: s.nome, pontos: s.pontos.sort((a, b) => a.data.getTime() - b.data.getTime()) }))
		.sort(
			(a, b) =>
				b.pontos[b.pontos.length - 1].data.getTime() - a.pontos[a.pontos.length - 1].data.getTime() ||
				a.nome.localeCompare(b.nome),
		);
}

function formatarKg(valor: number): string {
	return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}

function dataCurta(data: Date): string {
	return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** Ticks "redondos" entre min e max (ex.: 40, 50, 60, 70). */
function ticksY(min: number, max: number): number[] {
	const intervalo = Math.max(max - min, 1);
	const bruto = intervalo / 3;
	const base = 10 ** Math.floor(Math.log10(bruto));
	const passo = [1, 2, 2.5, 5, 10].map((m) => m * base).find((p) => p >= bruto) ?? bruto;
	const inicio = Math.floor(min / passo) * passo;
	const ticks: number[] = [];
	for (let v = inicio; v <= max + passo * 0.001; v += passo) ticks.push(Number(v.toFixed(2)));
	if (ticks[ticks.length - 1] < max) ticks.push(Number((ticks[ticks.length - 1] + passo).toFixed(2)));
	return ticks;
}

const COR_LINHA = "#009edf"; // quattor-azul

function GraficoCarga({ pontos }: { pontos: PontoCarga[] }) {
	const caixa = useRef<HTMLDivElement>(null);
	// Começa pequeno: o SVG não pode empurrar a coluna antes da primeira medição.
	const [largura, setLargura] = useState(280);
	const [foco, setFoco] = useState<number | null>(null);

	useEffect(() => {
		const el = caixa.current;
		if (!el) return;
		const ro = new ResizeObserver(([e]) => setLargura(Math.max(260, Math.round(e.contentRect.width))));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const altura = 220;
	const valores = pontos.map((p) => p.valor);
	const ticks = ticksY(Math.min(...valores), Math.max(...valores));
	// Margem esquerda do tamanho do maior rótulo do eixo (≈7px por caractere a 11px).
	const maiorRotulo = Math.max(...ticks.map((t) => t.toLocaleString("pt-BR").length));
	const margem = { topo: 16, direita: 64, base: 28, esquerda: maiorRotulo * 7 + 14 };
	const yMin = ticks[0];
	const yMax = ticks[ticks.length - 1];
	const t0 = pontos[0].data.getTime();
	const t1 = pontos[pontos.length - 1].data.getTime();
	const larguraUtil = largura - margem.esquerda - margem.direita;
	const alturaUtil = altura - margem.topo - margem.base;
	const x = (d: Date) =>
		margem.esquerda + (t1 === t0 ? larguraUtil / 2 : ((d.getTime() - t0) / (t1 - t0)) * larguraUtil);
	const y = (v: number) => margem.topo + (1 - (v - yMin) / (yMax - yMin || 1)) * alturaUtil;

	const linha = pontos.map((p, i) => `${i ? "L" : "M"}${x(p.data).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");
	const area = `${linha} L${x(pontos[pontos.length - 1].data).toFixed(1)},${margem.topo + alturaUtil} L${x(pontos[0].data).toFixed(1)},${margem.topo + alturaUtil} Z`;
	const ultimo = pontos[pontos.length - 1];
	const pontoFoco = foco != null ? pontos[foco] : null;

	function aoMover(evento: React.PointerEvent<SVGSVGElement>) {
		const rect = evento.currentTarget.getBoundingClientRect();
		const px = evento.clientX - rect.left;
		let melhor = 0;
		for (let i = 1; i < pontos.length; i++) {
			if (Math.abs(x(pontos[i].data) - px) < Math.abs(x(pontos[melhor].data) - px)) melhor = i;
		}
		setFoco(melhor);
	}

	return (
		<div ref={caixa} className='relative w-full min-w-0'>
			<svg
				width={largura}
				height={altura}
				role='img'
				aria-label={`Carga de ${formatarKg(pontos[0].valor)} em ${dataCurta(pontos[0].data)} até ${formatarKg(ultimo.valor)} em ${dataCurta(ultimo.data)}`}
				onPointerMove={aoMover}
				onPointerLeave={() => setFoco(null)}
				className='touch-none select-none'>
				{ticks.map((t) => (
					<g key={t}>
						<line x1={margem.esquerda} x2={largura - margem.direita} y1={y(t)} y2={y(t)} stroke='#eef0f3' strokeWidth={1} />
						<text x={margem.esquerda - 8} y={y(t)} dy='0.32em' textAnchor='end' className='fill-gray-400 text-[11px]'>
							{t.toLocaleString("pt-BR")}
						</text>
					</g>
				))}
				<text x={margem.esquerda} y={altura - 8} textAnchor='start' className='fill-gray-400 text-[11px]'>
					{dataCurta(pontos[0].data)}
				</text>
				{pontos.length > 1 && (
					<text x={largura - margem.direita} y={altura - 8} textAnchor='end' className='fill-gray-400 text-[11px]'>
						{dataCurta(ultimo.data)}
					</text>
				)}

				{pontos.length > 1 && <path d={area} fill={COR_LINHA} opacity={0.1} />}
				{pontos.length > 1 && (
					<path d={linha} fill='none' stroke={COR_LINHA} strokeWidth={2} strokeLinejoin='round' strokeLinecap='round' />
				)}
				{pontoFoco && (
					<line
						x1={x(pontoFoco.data)}
						x2={x(pontoFoco.data)}
						y1={margem.topo}
						y2={margem.topo + alturaUtil}
						stroke='#c9ced6'
						strokeWidth={1}
					/>
				)}
				{pontos.map((p, i) => (
					<circle
						key={i}
						cx={x(p.data)}
						cy={y(p.valor)}
						r={foco === i ? 6 : 4}
						fill={COR_LINHA}
						stroke='#ffffff'
						strokeWidth={2}
					/>
				))}
				{/* Rótulo direto só no último ponto */}
				<text x={x(ultimo.data) + 10} y={y(ultimo.valor)} dy='0.32em' className='fill-quattor-azul-escuro text-xs font-semibold'>
					{formatarKg(ultimo.valor)}
				</text>
			</svg>

			{pontoFoco && (
				<div
					className='pointer-events-none absolute -translate-x-1/2 rounded-lg bg-quattor-azul-escuro px-2.5 py-1.5 text-xs text-white shadow-lg'
					// Centro preso a 48px das bordas: perto do primeiro/último ponto o balão não é cortado.
					style={{
						left: Math.min(Math.max(x(pontoFoco.data), 48), largura - 48),
						top: Math.max(0, y(pontoFoco.valor) - 48),
					}}>
					<p className='font-semibold'>{formatarKg(pontoFoco.valor)}</p>
					<p className='text-white/60'>{dataCurta(pontoFoco.data)}</p>
				</div>
			)}
		</div>
	);
}

function EvolucaoCarga({ treinos }: { treinos: TreinoHistorico[] }) {
	const series = useMemo(() => seriesDeCarga(treinos), [treinos]);
	const [escolhido, setEscolhido] = useState<string | null>(null);
	const serie = series.find((s) => s.chave === escolhido) ?? series[0];

	return (
		<section className='rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100'>
			<div className='mb-4 flex items-center gap-3'>
				<span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-quattor-azul/10'>
					<TrendingUp className='h-5 w-5 text-quattor-azul' />
				</span>
				<div>
					<h2 className='font-bold text-quattor-azul-escuro'>Evolução de carga</h2>
					<p className='text-xs text-gray-500'>Carga registrada em cada treino</p>
				</div>
			</div>

			{!serie ? (
				<div className='flex flex-col items-center rounded-2xl bg-quattor-fundo px-4 py-10 text-center'>
					<p className='font-medium text-quattor-azul-escuro'>Ainda sem cargas registradas</p>
					<p className='mt-1 max-w-xs text-sm text-gray-500'>
						Ao registrar um exercício, preencha a carga (ex.: 20 kg) — a evolução aparece aqui.
					</p>
				</div>
			) : (
				<>
					<label className='block'>
						<span className='sr-only'>Exercício</span>
						<select
							value={serie.chave}
							onChange={(e) => setEscolhido(e.target.value)}
							className='w-full rounded-xl border border-gray-200 bg-quattor-fundo px-3 py-2.5 text-sm font-medium text-quattor-azul-escuro focus:outline-none focus:ring-2 focus:ring-quattor-azul'>
							{series.map((s) => (
								<option key={s.chave} value={s.chave}>
									{s.nome} ({s.pontos.length})
								</option>
							))}
						</select>
					</label>

					<div className='mt-4 grid grid-cols-3 gap-2 text-center'>
						{[
							{ rotulo: "Primeira", valor: serie.pontos[0].valor },
							{ rotulo: "Última", valor: serie.pontos[serie.pontos.length - 1].valor },
							{ rotulo: "Recorde", valor: Math.max(...serie.pontos.map((p) => p.valor)) },
						].map((c) => (
							<div key={c.rotulo} className='rounded-xl bg-quattor-fundo px-2 py-2'>
								<p className='text-[11px] uppercase tracking-wider text-gray-500'>{c.rotulo}</p>
								<p className='text-base font-bold text-quattor-azul-escuro'>{formatarKg(c.valor)}</p>
							</div>
						))}
					</div>

					<div className='mt-4 overflow-hidden'>
						<GraficoCarga key={serie.chave} pontos={serie.pontos} />
					</div>

					{/* Os mesmos dados em lista: o gráfico não depende só da cor nem do hover */}
					<details className='mt-3 text-sm'>
						<summary className='cursor-pointer text-xs font-semibold text-quattor-azul'>Ver registros</summary>
						<ul className='mt-2 space-y-1'>
							{[...serie.pontos].reverse().map((p, i) => (
								<li key={i} className='flex justify-between rounded-lg bg-quattor-fundo px-3 py-1.5'>
									<span className='text-gray-600'>{dataCurta(p.data)}</span>
									<span className='font-semibold text-quattor-azul-escuro'>{p.texto}</span>
								</li>
							))}
						</ul>
					</details>
				</>
			)}
		</section>
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

							<div className='grid items-start gap-4 lg:grid-cols-2 [&>*]:min-w-0'>
								<CalendarioTreinos meses={meses} />
								<EvolucaoCarga treinos={filtrados} />
							</div>

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
											<article
												key={dia.chave}
												id={`dia-${dia.chave}`}
												className='scroll-mt-24 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
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

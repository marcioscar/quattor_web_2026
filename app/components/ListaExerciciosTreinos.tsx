"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { Check, ChevronDown, History, Plus, SkipForward, Timer } from "lucide-react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { extrairDetalhesExercicio } from "~/utils/exercicioDetalhes";
import {
	chaveExercicio,
	dataAgoraFormatoHistorico,
	exercicioFoiTreinadoHoje,
	filtrarHistoricoExercicioUltimoMes,
	formatarDataHistoricoExibicao,
	mergeHistoricoDedup,
	type TreinoHistorico,
} from "~/utils/historicoExercicio";

type ListaExerciciosTreinosProps = {
	itens: unknown[];
	registration: number;
	grupo: string;
	historicoTreinos: TreinoHistorico[];
};

function chaveStorageFeitosHoje(registration: number, grupo: string): string {
	return `treinos:feitos-hoje:${registration}:${grupo}`;
}

function lerSetStorage(chave: string): Set<string> {
	if (typeof window === "undefined") return new Set<string>();
	try {
		const bruto = window.sessionStorage.getItem(chave);
		if (!bruto) return new Set<string>();
		const arr = JSON.parse(bruto);
		if (!Array.isArray(arr)) return new Set<string>();
		return new Set(arr.filter((v): v is string => typeof v === "string"));
	} catch {
		return new Set<string>();
	}
}

function salvarSetStorage(chave: string, valores: Set<string>): void {
	if (typeof window === "undefined") return;
	try {
		window.sessionStorage.setItem(chave, JSON.stringify(Array.from(valores)));
	} catch {
		// Ignore quota/privacidade: fallback já fica em memória.
	}
}

function midiaEhImagem(url: string): boolean {
	return /\.(gif|png|jpe?g|webp|svg)(\?|$)/i.test(url);
}

function extrairQuantidadeSeries(repeticoes?: string): number | null {
	if (!repeticoes) return null;
	const texto = repeticoes.trim().toLowerCase();
	if (!texto) return null;

	const matchFormatoPadrao = texto.match(/(\d+)\s*[x×]/i);
	if (matchFormatoPadrao?.[1])
		return Number.parseInt(matchFormatoPadrao[1], 10);

	const matchInicioNumero = texto.match(/^(\d+)/);
	if (matchInicioNumero?.[1]) return Number.parseInt(matchInicioNumero[1], 10);

	return null;
}

const DESCANSO_PADRAO_SEGUNDOS = 60;
const ADICIONAR_DESCANSO_SEGUNDOS = 10;

function formatarTempoDescanso(totalSegundos: number): string {
	const m = Math.floor(totalSegundos / 60);
	const s = totalSegundos % 60;
	return `${m}:${s.toString().padStart(2, "0")}`;
}

type TimerDescansoPainelProps = {
	segundosRestantes: number;
	onAdicionarTempo: () => void;
	onPular: () => void;
};

function TimerDescansoPainel({
	segundosRestantes,
	onAdicionarTempo,
	onPular,
}: TimerDescansoPainelProps) {
	return (
		<div
			className='flex items-center justify-between gap-3 rounded-2xl bg-quattor-azul-escuro px-4 py-3 text-white'
			role='status'
			aria-live='polite'
			aria-label='Timer de descanso entre séries'>
			<div className='flex items-center gap-3'>
				<span className='flex h-9 w-9 items-center justify-center rounded-full bg-white/10'>
					<Timer className='h-4 w-4 text-quattor-laranja' aria-hidden />
				</span>
				<div>
					<p className='text-[11px] uppercase tracking-wider text-white/60'>Descanso</p>
					<p
						className='font-mono text-2xl font-bold tabular-nums leading-none'
						aria-label={`${segundosRestantes} segundos restantes`}>
						{formatarTempoDescanso(segundosRestantes)}
					</p>
				</div>
			</div>
			<div className='flex gap-2'>
				<button
					type='button'
					onClick={onAdicionarTempo}
					className='inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20'>
					<Plus className='h-3.5 w-3.5' />
					{ADICIONAR_DESCANSO_SEGUNDOS}s
				</button>
				<button
					type='button'
					onClick={onPular}
					className='inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20'>
					<SkipForward className='h-3.5 w-3.5' />
					Pular
				</button>
			</div>
		</div>
	);
}

type ChecklistSeriesProps = {
	quantidade: number;
	nomeExercicio: string;
	grupo: string;
	registration: number;
	onTreinoRegistrado: (treino: TreinoHistorico) => void;
};

function ChecklistSeries({
	quantidade,
	nomeExercicio,
	grupo,
	registration,
	onTreinoRegistrado,
}: ChecklistSeriesProps) {
	const fetcher = useFetcher<{ ok: boolean; message?: string }>();
	const [concluidas, setConcluidas] = useState<boolean[]>([]);
	const [salvando, setSalvando] = useState(false);
	const [statusSalvar, setStatusSalvar] = useState<"" | "ok" | "erro">("");
	const [mensagemErro, setMensagemErro] = useState("");
	const [descansoSegundos, setDescansoSegundos] = useState<number | null>(null);
	const [carga, setCarga] = useState("");

	useEffect(() => {
		setConcluidas(Array.from({ length: quantidade }, () => false));
		setStatusSalvar("");
		setMensagemErro("");
		setDescansoSegundos(null);
	}, [quantidade]);

	useEffect(() => {
		if (descansoSegundos === null) return;
		const id = window.setInterval(() => {
			setDescansoSegundos((s) => {
				if (s === null || s <= 1) return null;
				return s - 1;
			});
		}, 1000);
		return () => clearInterval(id);
	}, [descansoSegundos === null]);

	const totalConcluidas = useMemo(
		() => concluidas.filter(Boolean).length,
		[concluidas],
	);

	const alternarSerie = (indice: number) => {
		setConcluidas((anterior) => {
			const proximo = [...anterior];
			const estavaConcluida = Boolean(anterior[indice]);
			proximo[indice] = !proximo[indice];
			const agoraConcluida = proximo[indice];
			if (!estavaConcluida && agoraConcluida && indice < quantidade - 1) {
				queueMicrotask(() => setDescansoSegundos(DESCANSO_PADRAO_SEGUNDOS));
			}
			return proximo;
		});
		setStatusSalvar("");
		setMensagemErro("");
	};

	const adicionarDescanso = () => {
		setDescansoSegundos((s) =>
			s === null ? null : s + ADICIONAR_DESCANSO_SEGUNDOS,
		);
	};

	const pularDescanso = () => {
		setDescansoSegundos(null);
	};

	const treinoConcluido = totalConcluidas === quantidade;
	const fetcherEnviando = fetcher.state !== "idle";

	useEffect(() => {
		setSalvando(fetcherEnviando);
	}, [fetcherEnviando]);

	useEffect(() => {
		if (!fetcher.data) return;
		if (fetcher.data.ok) {
			setStatusSalvar("ok");
			setMensagemErro("");
			onTreinoRegistrado({
				nome: nomeExercicio,
				grupo,
				carga: carga.trim(),
				data: dataAgoraFormatoHistorico(),
			});
			return;
		}
		setStatusSalvar("erro");
		setMensagemErro(fetcher.data.message || "Erro ao registrar treino.");
		// `carga` fica de fora de propósito: só vale a do momento do envio.
	}, [fetcher.data, grupo, nomeExercicio, onTreinoRegistrado]);

	const registrarTreino = () => {
		const formData = new FormData();
		formData.set("intent", "registrarTreino");
		formData.set("grupo", grupo);
		formData.set("nome", nomeExercicio);
		formData.set("carga", carga.trim());
		setStatusSalvar("");
		setMensagemErro("");
		fetcher.submit(formData, { method: "post" });
	};

	return (
		<div className='space-y-3'>
			<div className='flex items-center justify-between'>
				<p className='text-xs font-semibold uppercase tracking-wider text-gray-500'>Séries</p>
				<p className='text-xs font-semibold text-quattor-azul-escuro'>
					{totalConcluidas}/{quantidade}
				</p>
			</div>
			<div
				className='grid gap-2'
				style={{ gridTemplateColumns: `repeat(${Math.min(quantidade, 4)}, minmax(0, 1fr))` }}>
				{Array.from({ length: quantidade }, (_, indice) => {
					const feita = Boolean(concluidas[indice]);
					return (
						<button
							key={`serie-${indice + 1}`}
							type='button'
							aria-pressed={feita}
							onClick={() => alternarSerie(indice)}
							className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-semibold transition ${
								feita
									? "bg-quattor-verde text-white shadow-sm"
									: "bg-quattor-fundo text-quattor-azul-escuro ring-1 ring-gray-200 hover:ring-quattor-verde"
							}`}>
							{feita && <Check className='h-4 w-4' />}
							Série {indice + 1}
						</button>
					);
				})}
			</div>

			{descansoSegundos !== null && descansoSegundos > 0 ? (
				<TimerDescansoPainel
					segundosRestantes={descansoSegundos}
					onAdicionarTempo={adicionarDescanso}
					onPular={pularDescanso}
				/>
			) : null}

			<div className='flex flex-col gap-2 sm:flex-row'>
				<label className='relative sm:w-40'>
					<span className='sr-only'>Carga (opcional)</span>
					<input
						type='text'
						inputMode='decimal'
						value={carga}
						onChange={(e) => setCarga(e.target.value)}
						placeholder='Carga (ex.: 20 kg)'
						maxLength={30}
						className='w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-quattor-azul-escuro placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-quattor-azul'
					/>
				</label>
				<button
					type='button'
					onClick={registrarTreino}
					disabled={!treinoConcluido || salvando}
					className='flex-1 rounded-xl bg-quattor-laranja px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none'>
					{salvando
						? "Registrando..."
						: treinoConcluido
							? "Registrar exercício"
							: `Marque as ${quantidade} séries para registrar`}
				</button>
			</div>
			{statusSalvar === "ok" ? (
				<p className='text-sm font-medium text-quattor-verde'>Exercício registrado no histórico.</p>
			) : null}
			{statusSalvar === "erro" ? (
				<p className='text-sm text-quattor-vermelho'>
					{mensagemErro || "Erro ao registrar. Tente novamente."}
				</p>
			) : null}
		</div>
	);
}

type ExercicioCollapsibleRowProps = {
	item: unknown;
	numero: number;
	registration: number;
	grupo: string;
	historicoTreinos: TreinoHistorico[];
	foiTreinadoHojeLocal: boolean;
	onTreinoRegistrado: (treino: TreinoHistorico) => void;
};

function ExercicioCollapsibleRow({
	item,
	numero,
	registration,
	grupo,
	historicoTreinos,
	foiTreinadoHojeLocal,
	onTreinoRegistrado,
}: ExercicioCollapsibleRowProps) {
	const [aberto, setAberto] = useState(false);
	const d = extrairDetalhesExercicio(item);
	const temDetalhe = Boolean(d.repeticoes || d.videoUrl || d.notas);
	const quantidadeSeries = extrairQuantidadeSeries(d.repeticoes);
	const historicoExercicio = useMemo(
		() => filtrarHistoricoExercicioUltimoMes(historicoTreinos, d.nome),
		[historicoTreinos, d.nome],
	);
	const foiTreinadoHojeHistorico = useMemo(
		() => exercicioFoiTreinadoHoje(historicoTreinos, d.nome),
		[historicoTreinos, d.nome],
	);
	const foiTreinadoHoje = foiTreinadoHojeHistorico || foiTreinadoHojeLocal;

	return (
		<li
			className={`overflow-hidden rounded-2xl bg-white shadow-sm transition ${
				foiTreinadoHoje ? "ring-2 ring-quattor-verde/60" : "ring-1 ring-gray-100"
			}`}>
			<Collapsible open={aberto} onOpenChange={setAberto}>
				<CollapsibleTrigger className='flex w-full items-center gap-3 px-4 py-4 text-left'>
					<span
						className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
							foiTreinadoHoje ? "bg-quattor-verde text-white" : "bg-quattor-fundo text-quattor-azul-escuro"
						}`}>
						{foiTreinadoHoje ? <Check className='h-4 w-4' /> : numero}
					</span>
					<span className='min-w-0 flex-1'>
						<span className='block font-semibold leading-snug text-quattor-azul-escuro'>{d.nome}</span>
						{quantidadeSeries ? (
							<span className='mt-0.5 block text-xs text-gray-500'>
								{quantidadeSeries} séries{foiTreinadoHoje ? " · feito hoje" : ""}
							</span>
						) : foiTreinadoHoje ? (
							<span className='mt-0.5 block text-xs text-quattor-verde'>feito hoje</span>
						) : null}
					</span>
					<ChevronDown
						className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${aberto ? "rotate-180" : ""}`}
					/>
				</CollapsibleTrigger>
				<CollapsibleContent className='space-y-4 border-t border-gray-100 px-4 pb-5 pt-4'>
					{!temDetalhe ? (
						<p className='text-sm italic text-gray-500'>Sem detalhes adicionais para este exercício.</p>
					) : (
						<>
							{d.videoUrl && midiaEhImagem(d.videoUrl) && (
								<div className='flex justify-center rounded-2xl bg-white ring-1 ring-gray-100'>
									<img
										src={d.videoUrl}
										alt={`Demonstração: ${d.nome}`}
										className='max-h-64 w-full max-w-sm object-contain'
										loading='lazy'
									/>
								</div>
							)}
							{d.repeticoes && (
								<div className='rounded-2xl bg-quattor-fundo px-4 py-3'>
									<p className='text-xs font-semibold uppercase tracking-wider text-gray-500'>Como fazer</p>
									<p className='mt-1 text-sm leading-relaxed text-quattor-azul-escuro'>{d.repeticoes}</p>
								</div>
							)}
							{d.notas && (
								<div className='rounded-2xl bg-quattor-laranja/10 px-4 py-3'>
									<p className='text-xs font-semibold uppercase tracking-wider text-quattor-laranja'>
										Observação
									</p>
									<p className='mt-1 text-sm text-quattor-azul-escuro'>{d.notas}</p>
								</div>
							)}
							{quantidadeSeries && quantidadeSeries > 0 ? (
								<ChecklistSeries
									quantidade={quantidadeSeries}
									nomeExercicio={d.nome}
									registration={registration}
									grupo={grupo}
									onTreinoRegistrado={onTreinoRegistrado}
								/>
							) : null}
							<div>
								<p className='mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500'>
									<History className='h-3.5 w-3.5' />
									Últimos 30 dias
								</p>
								{historicoExercicio.length === 0 ? (
									<p className='text-sm text-gray-400'>Nenhum registro deste exercício ainda.</p>
								) : (
									<ul className='space-y-1.5'>
										{historicoExercicio.slice(0, 5).map((registro, idx) => (
											<li
												key={`${registro.data}-${registro.nome}-${idx}`}
												className='flex items-center justify-between gap-2 rounded-xl bg-quattor-fundo px-3 py-2 text-sm'>
												<span className='text-gray-600'>
													{formatarDataHistoricoExibicao(registro.data)}
												</span>
												{registro.carga && registro.carga !== "-" && (
													<span className='font-semibold text-quattor-azul-escuro'>{registro.carga}</span>
												)}
											</li>
										))}
									</ul>
								)}
							</div>
						</>
					)}
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
}

export function ListaExerciciosTreinos({
	itens,
	registration,
	grupo,
	historicoTreinos,
}: ListaExerciciosTreinosProps) {
	const [historicoOtimista, setHistoricoOtimista] = useState<TreinoHistorico[]>(
		[],
	);
	const [exerciciosFeitosHojeLocal, setExerciciosFeitosHojeLocal] = useState<
		Set<string>
	>(new Set());
	const storageKey = useMemo(
		() => chaveStorageFeitosHoje(registration, grupo),
		[registration, grupo],
	);

	const historicoVisivel = useMemo(
		() => mergeHistoricoDedup(historicoTreinos, ...historicoOtimista),
		[historicoTreinos, historicoOtimista],
	);

	useEffect(() => {
		setExerciciosFeitosHojeLocal(lerSetStorage(storageKey));
	}, [storageKey]);

	const marcarTreinoComoFeito = useCallback(
		(treino: TreinoHistorico) => {
			const chave = chaveExercicio(treino.nome);
			if (!chave) return;
			setExerciciosFeitosHojeLocal((anterior) => {
				const proximo = new Set(anterior);
				proximo.add(chave);
				salvarSetStorage(storageKey, proximo);
				return proximo;
			});
			setHistoricoOtimista((anterior) => mergeHistoricoDedup(anterior, treino));
		},
		[storageKey],
	);

	const feitosHoje = itens.filter((item) => {
		const nome = extrairDetalhesExercicio(item).nome;
		const chave = chaveExercicio(nome);
		return (
			(chave.length > 0 && exerciciosFeitosHojeLocal.has(chave)) ||
			exercicioFoiTreinadoHoje(historicoVisivel, nome)
		);
	}).length;
	const percentual = itens.length ? Math.round((feitosHoje / itens.length) * 100) : 0;

	return (
		<section className='space-y-3'>
			<div className='rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100'>
				<div className='flex items-center justify-between text-sm'>
					<span className='font-semibold text-quattor-azul-escuro'>
						{feitosHoje === itens.length && itens.length > 0
							? "Treino completo! 💪"
							: `${feitosHoje} de ${itens.length} exercícios feitos hoje`}
					</span>
					<span className='text-xs font-semibold text-gray-400'>{percentual}%</span>
				</div>
				<div className='mt-2 h-2 overflow-hidden rounded-full bg-quattor-fundo'>
					<div
						className='h-full rounded-full bg-quattor-verde transition-all duration-500'
						style={{ width: `${percentual}%` }}
					/>
				</div>
			</div>
			<ul className='flex flex-col gap-3'>
				{itens.map((item, index) => {
					const detalhes = extrairDetalhesExercicio(item);
					const chaveLocal = chaveExercicio(detalhes.nome);
					const foiTreinadoHojeLocal =
						chaveLocal.length > 0 && exerciciosFeitosHojeLocal.has(chaveLocal);
					return (
						<ExercicioCollapsibleRow
							key={index}
							item={item}
							numero={index + 1}
							registration={registration}
							grupo={grupo}
							historicoTreinos={historicoVisivel}
							foiTreinadoHojeLocal={foiTreinadoHojeLocal}
							onTreinoRegistrado={marcarTreinoComoFeito}
						/>
					);
				})}
			</ul>
		</section>
	);
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { ChevronDown, Timer } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";
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

function DetalheLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
	return (
		<div>
			<span className=' text-muted-foreground'>{rotulo}</span>{" "}
			<span className='text-medium'>{valor}</span>
		</div>
	);
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
			className='flex w-full max-w-full flex-wrap items-center justify-between gap-x-2 gap-y-2 rounded-md border border-primary/30 bg-primary/5 px-2 py-2 sm:gap-x-3 sm:px-3 sm:py-2.5'
			role='status'
			aria-live='polite'
			aria-label='Timer de descanso entre séries'>
			<div className='flex items-center gap-1.5 text-muted-foreground sm:gap-2'>
				<Timer
					className='size-3.5 shrink-0 text-primary sm:size-4'
					aria-hidden
				/>
				<span className='hidden text-xs font-medium text-foreground sm:inline'>
					Descanso
				</span>
				<span
					className='font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl'
					aria-label={`${segundosRestantes} segundos restantes`}>
					{formatarTempoDescanso(segundosRestantes)}
				</span>
			</div>
			<div className='flex shrink-0 gap-1.5'>
				<Button
					type='button'
					variant='secondary'
					size='sm'
					className='h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm'
					onClick={onAdicionarTempo}>
					+{ADICIONAR_DESCANSO_SEGUNDOS}s
				</Button>
				<Button
					type='button'
					variant='outline'
					size='sm'
					className='h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm'
					onClick={onPular}>
					Pular
				</Button>
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
				carga: "",
				data: dataAgoraFormatoHistorico(),
			});
			return;
		}
		setStatusSalvar("erro");
		setMensagemErro(fetcher.data.message || "Erro ao registrar treino.");
	}, [fetcher.data, grupo, nomeExercicio, onTreinoRegistrado]);

	const registrarTreino = () => {
		const formData = new FormData();
		formData.set("intent", "registrarTreino");
		formData.set("grupo", grupo);
		formData.set("nome", nomeExercicio);
		formData.set("carga", "");
		setStatusSalvar("");
		setMensagemErro("");
		fetcher.submit(formData, { method: "post" });
	};

	return (
		<div className='mt-2 rounded-md border border-border/70 p-3'>
			<div className='mb-2 text-xs text-muted-foreground'>
				Progresso: {totalConcluidas}/{quantidade} séries concluídas
			</div>
			<div className='flex flex-wrap gap-3'>
				{Array.from({ length: quantidade }, (_, indice) => (
					<label
						key={`serie-${indice + 1}`}
						className='inline-flex cursor-pointer items-center gap-2 text-sm'>
						<input
							type='checkbox'
							checked={Boolean(concluidas[indice])}
							onChange={() => alternarSerie(indice)}
							className='size-4 accent-primary'
						/>
						<span className='text-sm  font-light'>Série {indice + 1}</span>
					</label>
				))}
			</div>
			{descansoSegundos !== null && descansoSegundos > 0 ? (
				<div className='mt-3 w-full'>
					<TimerDescansoPainel
						segundosRestantes={descansoSegundos}
						onAdicionarTempo={adicionarDescanso}
						onPular={pularDescanso}
					/>
				</div>
			) : null}
			<div className='mt-3 flex items-center gap-3'>
				<Button
					type='button'
					size='sm'
					onClick={registrarTreino}
					disabled={!treinoConcluido || salvando}>
					{salvando ? "Registrando..." : "Registrar treino"}
				</Button>
				{statusSalvar === "ok" ? (
					<span className='text-xs text-emerald-600'>
						Treino registrado no histórico.
					</span>
				) : null}
				{statusSalvar === "erro" ? (
					<span className='text-xs text-destructive'>
						{mensagemErro || "Erro ao registrar treino. Tente novamente."}
					</span>
				) : null}
			</div>
		</div>
	);
}

type ExercicioCollapsibleRowProps = {
	item: unknown;
	registration: number;
	grupo: string;
	historicoTreinos: TreinoHistorico[];
	foiTreinadoHojeLocal: boolean;
	onTreinoRegistrado: (treino: TreinoHistorico) => void;
};

function ExercicioCollapsibleRow({
	item,
	registration,
	grupo,
	historicoTreinos,
	foiTreinadoHojeLocal,
	onTreinoRegistrado,
}: ExercicioCollapsibleRowProps) {
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
			className='overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm'
			role='listitem'>
			<Collapsible className='group rounded-md data-[state=open]:bg-muted/40'>
				<CollapsibleTrigger
					className={cn(
						buttonVariants({ variant: "ghost" }),
						"h-auto min-h-10 w-full justify-between gap-2 px-4 py-3 text-left font-normal",
					)}>
					<div className='min-w-0 flex flex-1 items-center gap-2'>
						<span className='min-w-0 flex-1 truncate'>{d.nome}</span>
						{foiTreinadoHoje ? (
							<Badge
								variant='secondary'
								className='bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'>
								feito
							</Badge>
						) : null}
					</div>
					<ChevronDown className='size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180' />
				</CollapsibleTrigger>
				<CollapsibleContent className='flex flex-col gap-2 border-t border-border px-4 py-3 text-sm'>
					{temDetalhe ? (
						<>
							{d.repeticoes && (
								<div>
									<DetalheLinha rotulo='Séries:' valor={d.repeticoes} />
									{quantidadeSeries && quantidadeSeries > 0 ? (
										<ChecklistSeries
											quantidade={quantidadeSeries}
											nomeExercicio={d.nome}
											registration={registration}
											grupo={grupo}
											onTreinoRegistrado={onTreinoRegistrado}
										/>
									) : null}
								</div>
							)}
							{d.notas && (
								<DetalheLinha rotulo='Observações:' valor={d.notas} />
							)}
							{d.videoUrl && (
								<div className='flex flex-col gap-2'>
									<span className='font-medium text-muted-foreground'>
										Vídeo
									</span>
									{midiaEhImagem(d.videoUrl) ? (
										<img
											src={d.videoUrl}
											alt={`Demonstração: ${d.nome}`}
											className='max-h-56 w-full max-w-md rounded-md object-contain'
											loading='lazy'
										/>
									) : null}
								</div>
							)}
							<div className='mt-2 rounded-md border border-border/70 p-3'>
								<div className='text-xs font-medium text-muted-foreground'>
									Histórico (último mês)
								</div>
								{historicoExercicio.length === 0 ? (
									<p className='mt-2 text-xs text-muted-foreground italic'>
										Sem registros deste exercício nos últimos 30 dias.
									</p>
								) : (
									<ul className='mt-2 space-y-2'>
										{historicoExercicio.slice(0, 5).map((registro, idx) => (
											<li
												key={`${registro.data}-${registro.nome}-${idx}`}
												className='rounded-md bg-muted/40 px-2 py-1 text-xs'>
												<div
													className='font-medium truncate'
													title={`${formatarDataHistoricoExibicao(registro.data)} - ${registro.nome}`}>
													{formatarDataHistoricoExibicao(registro.data)} -{" "}
													{registro.nome}
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</>
					) : (
						<p className='text-xs text-muted-foreground italic'>
							Sem detalhes adicionais para este exercício.
						</p>
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

	return (
		<Card>
			<CardHeader>
				<CardTitle>Exercícios</CardTitle>
				<CardDescription>
					{itens.length} exercício{itens.length === 1 ? "" : "s"} encontrado
					{itens.length === 1 ? "" : "s"}. Toque para ver repetições e demais
					detalhes.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className='flex flex-col gap-2' role='list'>
					{itens.map((item, index) => {
						const detalhes = extrairDetalhesExercicio(item);
						const chaveLocal = chaveExercicio(detalhes.nome);
						const foiTreinadoHojeLocal =
							chaveLocal.length > 0 &&
							exerciciosFeitosHojeLocal.has(chaveLocal);
						return (
							<ExercicioCollapsibleRow
								key={index}
								item={item}
								registration={registration}
								grupo={grupo}
								historicoTreinos={historicoVisivel}
								foiTreinadoHojeLocal={foiTreinadoHojeLocal}
								onTreinoRegistrado={marcarTreinoComoFeito}
							/>
						);
					})}
				</ul>
			</CardContent>
		</Card>
	);
}

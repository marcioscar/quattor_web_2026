import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { CircleCheck, ExternalLink, FolderOpen, MessageSquare, Pause, Play, Search, Wrench } from "lucide-react";
import MainNavbar from "../components/MainNavbar";
import { FAIXAS, PASTA_MUSICAS } from "../ballet/musicas";
import { ESPETACULO } from "../ballet/espetaculo";
import { validarObservacao, type Situacao } from "../ballet/observacoes";
import { criarObservacao, listarObservacoes, type Observacao } from "../ballet/observacoes.server";
import type { Route } from "./+types/musicas";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: `Músicas · ${ESPETACULO.titulo}` },
		{ name: "description", content: "Músicas do espetáculo de ballet da Quattor, na ordem das cenas, para os ensaios." },
		// Página dos professores: acessa quem tem o link, sem aparecer no Google.
		{ name: "robots", content: "noindex, nofollow" },
	];
}

export async function loader() {
	try {
		return { observacoes: await listarObservacoes(), bancoFora: false };
	} catch (erro) {
		// Sem o banco as músicas continuam tocando; só as observações somem.
		console.error("[musicas] falha ao ler observações:", erro);
		return { observacoes: [] as Observacao[], bancoFora: true };
	}
}

const FAIXAS_VALIDAS = new Set(FAIXAS.map((f) => f.drive));

export async function action({ request }: Route.ActionArgs) {
	const form = Object.fromEntries(await request.formData());
	const faixa = String(form.faixa ?? "");
	const validacao = validarObservacao(form, FAIXAS_VALIDAS);
	if (!validacao.ok) return { faixa, erro: validacao.erro };
	try {
		await criarObservacao(validacao.dados);
	} catch (erro) {
		console.error("[musicas] falha ao salvar observação:", erro);
		return { faixa, erro: "Não foi possível salvar agora. Tente de novo em instantes." };
	}
	return { faixa, erro: null };
}

const CHAVE_NOME = "musicas.professor";

function lerNomeSalvo(): string {
	try {
		return localStorage.getItem(CHAVE_NOME) ?? "";
	} catch {
		return "";
	}
}

function salvarNome(nome: string) {
	try {
		localStorage.setItem(CHAVE_NOME, nome);
	} catch {
		// navegador sem armazenamento: o professor digita o nome de novo
	}
}

function quando(iso: string): string {
	return new Intl.DateTimeFormat("pt-BR", {
		timeZone: "America/Sao_Paulo",
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(iso));
}

/** Selo da última observação da faixa, na linha da lista. */
function SeloSituacao({ situacao, total }: { situacao: Situacao; total: number }) {
	const ok = situacao === "ok";
	return (
		<span
			className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
				ok ? "bg-[#2fd28c]/15 text-[#2fd28c]" : "bg-[#e8c25a]/15 text-[#e8c25a]"
			}`}
			title={`${total} ${total === 1 ? "observação" : "observações"}`}>
			{ok ? <CircleCheck className='h-3.5 w-3.5' /> : <Wrench className='h-3.5 w-3.5' />}
			<span className='hidden sm:inline'>{ok ? "Ok" : "Ajustar"}</span>
			{total > 1 && <span className='opacity-70'>· {total}</span>}
		</span>
	);
}

/** Formulário e histórico de observações, embaixo do player da faixa aberta. */
function Observacoes({ faixa, observacoes, bancoFora }: { faixa: string; observacoes: Observacao[]; bancoFora: boolean }) {
	const fetcher = useFetcher<typeof action>();
	const textoRef = useRef<HTMLTextAreaElement>(null);
	const [nome, setNome] = useState("");
	const [situacao, setSituacao] = useState<Situacao | null>(null);
	const enviando = fetcher.state !== "idle";
	const resposta = fetcher.data?.faixa === faixa ? fetcher.data : undefined;

	useEffect(() => setNome(lerNomeSalvo()), []);

	// Salvou: limpa o comentário e a marcação, mantém o nome.
	useEffect(() => {
		if (fetcher.state === "idle" && resposta && !resposta.erro) {
			setSituacao(null);
			if (textoRef.current) textoRef.current.value = "";
		}
	}, [fetcher.state, resposta]);

	return (
		<div className='space-y-4 border-t border-[#e8c25a]/10 bg-[#0a1310] px-3 py-4 sm:px-4'>
			{bancoFora ? (
				<p className='text-sm text-[#a3b2a9]'>As observações estão fora do ar no momento.</p>
			) : (
				<fetcher.Form method='post' className='space-y-3' onSubmit={() => salvarNome(nome.trim())}>
					<input type='hidden' name='faixa' value={faixa} />
					<input type='hidden' name='situacao' value={situacao ?? ""} />
					<div className='grid grid-cols-2 gap-2'>
						{(
							[
								{ valor: "ok", rotulo: "Está ok", Icone: CircleCheck, ativo: "bg-[#2fd28c] text-[#060b09]" },
								{ valor: "ajustar", rotulo: "Precisa ajustar", Icone: Wrench, ativo: "bg-[#e8c25a] text-[#060b09]" },
							] as const
						).map(({ valor, rotulo, Icone, ativo }) => (
							<button
								key={valor}
								type='button'
								onClick={() => setSituacao(valor)}
								aria-pressed={situacao === valor}
								className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
									situacao === valor ? ativo : "bg-[#13211b] text-[#a3b2a9] hover:text-[#f4efe1]"
								}`}>
								<Icone className='h-4 w-4' />
								{rotulo}
							</button>
						))}
					</div>
					<textarea
						ref={textoRef}
						name='texto'
						rows={2}
						maxLength={1000}
						placeholder={
							situacao === "ajustar" ? "O que precisa mudar? (ex.: cortar em 1:20, volume baixo no início)" : "Observação (opcional)"
						}
						className='w-full rounded-xl border border-[#e8c25a]/20 bg-[#0d1713] px-3 py-2.5 text-sm placeholder-[#a3b2a9] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2fd28c]'
					/>
					<div className='flex flex-wrap gap-2'>
						<input
							name='professor'
							value={nome}
							onChange={(e) => setNome(e.target.value)}
							maxLength={60}
							placeholder='Seu nome'
							autoComplete='name'
							className='min-w-0 flex-[1_1_160px] rounded-xl border border-[#e8c25a]/20 bg-[#0d1713] px-3 py-2.5 text-sm placeholder-[#a3b2a9] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2fd28c]'
						/>
						<button
							type='submit'
							disabled={enviando || !situacao}
							className='rounded-xl bg-[#e0263f] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50'>
							{enviando ? "Salvando…" : "Enviar"}
						</button>
					</div>
					{resposta?.erro && <p className='text-sm text-[#ff8a9a]'>{resposta.erro}</p>}
					{resposta && !resposta.erro && !enviando && <p className='text-sm text-[#2fd28c]'>Observação salva. Obrigado!</p>}
				</fetcher.Form>
			)}

			{observacoes.length > 0 && (
				<ul className='space-y-2'>
					{observacoes.map((o) => (
						<li key={o.id} className='rounded-xl bg-[#0d1713] p-3 text-sm'>
							<p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
								<SeloSituacao situacao={o.situacao} total={1} />
								<span className='font-semibold'>{o.professor}</span>
								<span className='text-xs text-[#a3b2a9]'>{quando(o.criadoEm)}</span>
							</p>
							{o.texto && <p className='mt-1.5 whitespace-pre-line text-[#d9d4c6]'>{o.texto}</p>}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

/** Sem acento e minúsculo — "leao" acha "Leoa", "papoula" acha "Papoulas". */
function normalizar(texto: string): string {
	return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function Musicas() {
	const [busca, setBusca] = useState("");
	const [tocando, setTocando] = useState<string | null>(null);
	const { observacoes, bancoFora } = useLoaderData<typeof loader>();

	const porFaixa = useMemo(() => {
		const mapa = new Map<string, Observacao[]>();
		for (const o of observacoes) mapa.set(o.faixa, [...(mapa.get(o.faixa) ?? []), o]);
		return mapa;
	}, [observacoes]);

	const visiveis = useMemo(() => {
		const termo = normalizar(busca.trim());
		return FAIXAS.filter((f) => !termo || normalizar(`${f.numero} ${f.nome}`).includes(termo));
	}, [busca]);

	return (
		<>
			<MainNavbar />
			<main className='min-h-screen bg-[#060b09] text-[#f4efe1]'>
				<div className='mx-auto max-w-3xl space-y-6 px-4 py-8 sm:py-12'>
					<header className='space-y-3'>
						<p className='text-xs font-semibold uppercase tracking-[0.12em] text-[#2fd28c]'>Ballet · Ensaios</p>
						<h1 className='text-3xl font-bold leading-tight sm:text-4xl'>Músicas do Mágico de Oz</h1>
						<div aria-hidden className='oz-estrada !h-3 w-32 ![mask-image:none]' />
						<p className='text-[#a3b2a9]'>
							Todas as faixas do espetáculo, na ordem das cenas. Toque em uma música para ouvir e deixar a sua observação: se está ok ou o que precisa ajustar.
						</p>
					</header>

					<div className='flex flex-wrap gap-2'>
						<label className='relative min-w-0 flex-[1_1_220px]'>
							<span className='sr-only'>Buscar música</span>
							<Search className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3b2a9]' />
							<input
								type='search'
								value={busca}
								onChange={(e) => setBusca(e.target.value)}
								placeholder='Buscar cena ou personagem'
								className='w-full rounded-xl border border-[#e8c25a]/20 bg-[#0d1713] py-3 pl-10 pr-4 text-sm placeholder-[#a3b2a9] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2fd28c]'
							/>
						</label>
						<a
							href={PASTA_MUSICAS}
							target='_blank'
							rel='noreferrer'
							className='inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#2fd28c]/15 px-4 py-3 text-sm font-semibold text-[#2fd28c] transition hover:bg-[#2fd28c]/25'>
							<FolderOpen className='h-4 w-4' />
							Abrir pasta completa
						</a>
					</div>

					{visiveis.length === 0 ? (
						<p className='py-4 text-[#a3b2a9]'>Nenhuma música encontrada.</p>
					) : (
						<ol className='divide-y divide-[#e8c25a]/10 overflow-hidden rounded-2xl border border-[#e8c25a]/15 bg-[#0d1713]'>
							{visiveis.map((f) => {
								const aberta = tocando === f.drive;
								const obs = porFaixa.get(f.drive) ?? [];
								return (
									<li key={f.drive}>
										<div className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${aberta ? "bg-[#13211b]" : ""}`}>
											<button
												type='button'
												onClick={() => setTocando(aberta ? null : f.drive)}
												aria-expanded={aberta}
												className='flex min-w-0 flex-1 items-center gap-3 text-left'>
												<span className='w-10 shrink-0 text-lg font-bold tabular-nums text-[#a3b2a9]'>{f.numero}</span>
												<span className='min-w-0 flex-1 font-medium'>
													{f.nome}
													{f.obs && (
														<span className='ml-2 inline-block rounded-full border border-[#e8c25a] px-2 text-[11px] font-semibold uppercase tracking-wide text-[#e8c25a]'>
															{f.obs}
														</span>
													)}
												</span>
												{obs.length > 0 && <SeloSituacao situacao={obs[0].situacao} total={obs.length} />}
												<span
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
														aberta ? "bg-[#e8c25a] text-[#060b09]" : "bg-[#2fd28c] text-[#060b09]"
													}`}>
													{aberta ? <Pause className='h-4 w-4' /> : <Play className='ml-0.5 h-4 w-4' />}
												</span>
											</button>
											<a
												href={`https://drive.google.com/file/d/${f.drive}/view`}
												target='_blank'
												rel='noreferrer'
												aria-label={`Abrir ${f.nome} no Google Drive`}
												className='rounded-lg p-2 text-[#a3b2a9] transition hover:bg-[#13211b] hover:text-[#f4efe1]'>
												<ExternalLink className='h-4 w-4' />
											</a>
										</div>
										{aberta && (
											// Abaixo de ~200px o player do Drive espreme a onda e corta o topo.
											<iframe
												src={`https://drive.google.com/file/d/${f.drive}/preview`}
												title={f.nome}
												allow='autoplay'
												className='block h-[200px] w-full border-0 bg-[#202124]'
											/>
										)}
										{aberta && <Observacoes faixa={f.drive} observacoes={obs} bancoFora={bancoFora} />}
									</li>
								);
							})}
						</ol>
					)}

					<p className='text-sm text-[#a3b2a9]'>
						A música toca pelo player do Google Drive. Para ensaiar sem internet, abra no Drive (ícone ao lado de cada
						faixa) e use o botão de download.
					</p>
				</div>
			</main>
		</>
	);
}

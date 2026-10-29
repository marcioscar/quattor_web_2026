import { useMemo, useRef, useState } from "react";
import { ESPETACULO } from "../ballet/espetaculo";
import { cenasDaBailarina, cenasDoLugar, EQUIPE, ELENCO, ehCena, normalizarNome, PROGRAMA, RASCUNHO } from "../ballet/programa";
import estilos from "../ballet/programa.css?url";
import type { Route } from "./+types/programa_ballet";

const WHATSAPP =
	"https://wa.me/5561993190568?text=" +
	encodeURIComponent("Olá! Vi o programa do Mágico de Oz e quero agendar uma aula experimental de ballet.");

export const links: Route.LinksFunction = () => [
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Geist:wght@400;500;600&display=swap",
	},
	{ rel: "stylesheet", href: estilos },
];

export function meta({}: Route.MetaArgs) {
	const descricao = `Programa do Espetáculo de Ballet ${ESPETACULO.titulo} — Quattor Academia, ${ESPETACULO.dataCurta}, ${ESPETACULO.local}.`;
	return [
		{ title: `${ESPETACULO.titulo} · Programa` },
		{ name: "description", content: descricao },
		{ name: "theme-color", content: "#060b09" },
		{ property: "og:title", content: `${ESPETACULO.titulo} · Programa do espetáculo` },
		{ property: "og:description", content: descricao },
		{ property: "og:image", content: "/espetaculo/og.jpg" },
		// Quem chega aqui é a plateia, pelo QR code; não precisa aparecer no Google.
		{ name: "robots", content: "noindex, nofollow" },
	];
}

export default function ProgramaBallet() {
	const [busca, setBusca] = useState("");
	const lista = useRef<HTMLDivElement>(null);

	const termo = normalizarNome(busca);
	const filtrando = termo.length >= 2;
	const achadas = useMemo(() => cenasDaBailarina(PROGRAMA, busca), [busca]);
	const totalCenas = PROGRAMA.filter(ehCena).length;

	function irParaPrimeira() {
		lista.current?.querySelector(".cena.match")?.scrollIntoView({ behavior: "smooth", block: "center" });
	}

	let numero = 0;

	return (
		<div className='prog'>
			{RASCUNHO && <div className='rascunho'>Rascunho · turmas, bailarinas e equipe ainda por preencher</div>}

			<header className='hero'>
				<picture>
					<source media='(min-aspect-ratio: 1/1)' srcSet='/espetaculo/fundo.webp' />
					<img src='/espetaculo/fundo_retrato.webp' alt='' fetchPriority='high' />
				</picture>
				<div className='hero-inner'>
					<img className='espetaculo' src='/espetaculo/espetaculo.webp' alt='Espetáculo de Ballet' />
					<h1 style={{ margin: 0 }}>
						<img className='titulo' src='/espetaculo/titulo.webp' alt={ESPETACULO.titulo} />
					</h1>
					<div className='quando'>
						{ESPETACULO.data.replace(/ de 2026$/, "")} <span>·</span> {ESPETACULO.local}
					</div>
					<div className='por'>
						apresentado por <img src='/espetaculo/logo.svg' alt='Quattor Academia' />
					</div>
				</div>
			</header>

			<nav className='secoes' aria-label='Seções do programa'>
				<div className='wrap'>
					<div className='links'>
						<a href='#historia'>História</a>
						<a href='#programa'>Programa</a>
						<a href='#elenco'>Elenco</a>
						<a href='#equipe'>Equipe</a>
						<a href='#quattor'>Quattor</a>
					</div>
				</div>
			</nav>

			<main>
				<section id='historia'>
					<p className='eyebrow'>A história</p>
					<h2>Siga a estrada de tijolos amarelos</h2>
					<img
						className='ilustracao'
						src='/espetaculo/oz/abertura.webp'
						alt='Dorothy, o Espantalho, a Mulher de Lata e a Leoa Medrosa na estrada de tijolos amarelos'
						width={800}
						height={800}
						decoding='async'
					/>
					<p className='lead'>
						Numa fazenda do Kansas, Dorothy sonha com um lugar além do arco-íris. Até que um tornado leva sua casa pelos ares e a deixa na
						terra mágica de Oz.
					</p>
					<p>
						Lá ela conhece as elfas, os campos de papoulas e a Bruxa Boa, que lhe dá os sapatinhos vermelhos, para fúria da Bruxa Má. Para
						voltar para casa, Dorothy precisa seguir a estrada de tijolos amarelos até a Cidade das Esmeraldas e pedir ajuda ao Mágico de Oz.
					</p>
					<p>
						No caminho ela faz três amigos: o Espantalho, que quer um cérebro, a Mulher de Lata, que quer um coração, e a Leoa Medrosa, que
						quer coragem. O Mágico só atende aos pedidos se eles vencerem a Bruxa Má. Juntos, enfrentam abelhas gigantes e a própria bruxa, e
						descobrem que o que procuravam sempre esteve dentro deles.
					</p>
					<div className='info'>
						<div>
							<b>{totalCenas} cenas</b>
							<small>na ordem do espetáculo</small>
						</div>
						<div>
							<b>≈ 1h30</b>
							<small>de música</small>
						</div>
						<div>
							<b>2 sessões</b>
							<small>{ESPETACULO.sessoes.map((s) => s.hora).join(" e ")}</small>
						</div>
					</div>
				</section>

				<section id='programa'>
					<p className='eyebrow'>Ordem das apresentações</p>
					<h2>Programa</h2>
					<div className='busca'>
						<label htmlFor='q'>Encontre sua bailarina</label>
						<svg className='lupa' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
							<circle cx='11' cy='11' r='7' />
							<path d='m20 20-3.5-3.5' />
						</svg>
						<input
							id='q'
							type='search'
							value={busca}
							onChange={(e) => setBusca(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.currentTarget.blur();
									irParaPrimeira();
								}
							}}
							placeholder='Digite o nome'
							autoComplete='off'
							enterKeyHint='search'
						/>
						{busca && (
							<button type='button' className='limpar' aria-label='Limpar busca' onClick={() => setBusca("")}>
								×
							</button>
						)}
					</div>
					<div className='resultado' aria-live='polite'>
						{filtrando &&
							(achadas.size
								? `Aparece em ${achadas.size} ${achadas.size > 1 ? "cenas" : "cena"}`
								: "Nenhuma cena encontrada com esse nome")}
					</div>

					<div ref={lista} className={filtrando ? "filtrando" : ""}>
						{PROGRAMA.map((item, i) => {
							if ("ato" in item) return <div key={i} className='ato'>{item.ato}</div>;
							if ("intervalo" in item) return <div key={i} className='intervalo'>{item.intervalo}</div>;
							if ("lugar" in item) {
								const de = numero + 1;
								const ate = numero + cenasDoLugar(PROGRAMA, i);
								return (
									<div key={i} className='lugar'>
										<img src={`/espetaculo/oz/${item.imagem}.webp`} alt='' width={800} height={800} loading='lazy' decoding='async' />
										<div className='lugar-nome'>
											<small>{de === ate ? `Cena ${de}` : `Cenas ${de} a ${ate}`}</small>
											<h3>{item.lugar}</h3>
										</div>
									</div>
								);
							}
							numero++;
							const casou = achadas.has(item);
							return (
								<article key={i} className={`cena${casou ? " match" : ""}`}>
									<div className='n'>{numero}</div>
									<div>
										<h3>{item.titulo}</h3>
										{item.sinopse && <p className='sinopse'>{item.sinopse}</p>}
										{!item.apenasTitulo && (
											<>
												{(item.turma || item.estilo || RASCUNHO) && (
													<div className='meta'>
														<b>{item.turma ?? (RASCUNHO ? "Turma a definir" : "")}</b>
														{item.estilo && ` · ${item.estilo}`}
														{RASCUNHO && ` · música ${item.faixas.join(" e ")}`}
													</div>
												)}
												<div className='nomes'>
													{item.nomes.map((nome) => (
														<span key={nome} className={casou && normalizarNome(nome).includes(termo) ? "achou" : ""}>
															{nome}
														</span>
													))}
													{RASCUNHO && item.nomes.length === 0 && <span className='vazio'>bailarinas a preencher</span>}
												</div>
											</>
										)}
										{RASCUNHO && item.conferir && <p className='conferir'>Conferir: {item.conferir}</p>}
									</div>
								</article>
							);
						})}
					</div>
				</section>

				<section id='elenco'>
					<p className='eyebrow'>Personagens</p>
					<h2>Elenco principal</h2>
					<div className='elenco'>
						{ELENCO.map(([personagem, bailarina, cor]) => (
							<div key={personagem} className='pers' style={{ "--c": cor } as React.CSSProperties}>
								<b>{personagem}</b>
								<span className={bailarina ? "" : "a-definir"}>{bailarina || "a definir"}</span>
							</div>
						))}
					</div>
				</section>

				<section id='equipe'>
					<p className='eyebrow'>Por trás das cortinas</p>
					<h2>Equipe</h2>
					<ul className='equipe'>
						{EQUIPE.map(([funcao, nome]) => (
							<li key={funcao}>
								<span>{funcao}</span>
								<span className={nome ? "" : "a-definir"}>{nome || "a definir"}</span>
							</li>
						))}
					</ul>
				</section>

				<section>
					<p className='eyebrow'>Palavra da direção</p>
					<blockquote>
						Cada passo deste espetáculo foi ensaiado com dedicação durante o ano inteiro. Assim como Dorothy, nossas bailarinas descobriram que
						coragem, coração e inteligência já estavam com elas. Obrigada por estarem aqui.
						<cite>Direção artística · Quattor Academia</cite>
					</blockquote>
				</section>

				<section>
					<p className='eyebrow'>Agradecimentos</p>
					<p>
						Às famílias, que acompanharam cada ensaio; às professoras e à equipe da Quattor; ao {ESPETACULO.local}; e a todos os parceiros que
						tornaram este espetáculo possível.
					</p>
				</section>

				<div className='cta' id='quattor'>
					<img src='/espetaculo/logo.svg' alt='Quattor Academia' />
					<h2>Quer dançar com a gente?</h2>
					<p>Ballet infantil e adulto, jazz e muito mais. Agende uma aula experimental.</p>
					<a className='btn' href={WHATSAPP} target='_blank' rel='noopener noreferrer'>
						<svg viewBox='0 0 24 24' fill='currentColor' aria-hidden>
							<path d='M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z' />
						</svg>
						Agendar aula experimental
					</a>
					<p className='end'>
						Rua 5 Sul · Águas Claras · Brasília
						<br />
						(61) 99319-0568
					</p>
				</div>
			</main>

			<footer>
				<img src='/espetaculo/simbolo.svg' alt='' />
				{ESPETACULO.titulo} · Espetáculo de Ballet 2026
				<br />
				Quattor Academia
			</footer>
		</div>
	);
}

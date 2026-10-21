import { Link } from "react-router";
import { ArrowRight, Hourglass, MapPin, Ticket } from "lucide-react";
import { diasParaEspetaculo, ESPETACULO, textoContagem } from "../ballet/espetaculo";

/**
 * Estrelas piscando no céu da arte (banner e capa da /ballet). Posições fixas
 * (sorteio com semente), para o HTML do servidor e o do navegador saírem
 * iguais na hidratação.
 */
const ESTRELAS = (() => {
	let semente = 7;
	const sortear = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;
	return Array.from({ length: 34 }, (_, i) => {
		const brilho = i % 6 === 0;
		return {
			brilho,
			left: `${(sortear() * 100).toFixed(1)}%`,
			top: `${(sortear() * 55).toFixed(1)}%`,
			tam: `${brilho ? 12 + sortear() * 8 : 3 + sortear() * 4}px`,
			dur: `${(2.5 + sortear() * 3).toFixed(2)}s`,
			atraso: `${(sortear() * 4).toFixed(2)}s`,
		};
	});
})();

export function Estrelas() {
	return (
		<div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
			{ESTRELAS.map((e, i) => (
				<span
					key={i}
					className={`oz-estrela${e.brilho ? " brilho" : ""}`}
					style={
						{ left: e.left, top: e.top, "--tam": e.tam, "--dur": e.dur, "--atraso": e.atraso } as React.CSSProperties
					}
				/>
			))}
		</div>
	);
}

/** Botão de compra de uma sessão — abre a Bilheteria Digital em outra aba. */
export function BotaoIngresso({ hora, ingresso, grande = false }: { hora: string; ingresso: string; grande?: boolean }) {
	return (
		<a
			href={ingresso}
			target='_blank'
			rel='noreferrer'
			className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#e0263f] font-semibold text-white shadow-lg shadow-black/30 transition hover:brightness-110 ${
				grande ? "px-6 py-4 text-base" : "px-5 py-3 text-sm"
			}`}>
			<Ticket className={grande ? "h-5 w-5" : "h-4 w-4"} />
			Ingressos · sessão {hora}
		</a>
	);
}

/** Destaque do espetáculo no topo da página inicial. */
export default function BannerBallet() {
	const contagem = textoContagem(diasParaEspetaculo());
	return (
		<section className='relative isolate overflow-hidden rounded-3xl bg-[#060b09] shadow-lg'>
			<picture>
				<source media='(max-width: 639px)' srcSet='/espetaculo/fundo_retrato.webp' />
				<img
					src='/espetaculo/fundo.webp'
					alt=''
					className='absolute inset-0 -z-10 h-full w-full object-cover object-[50%_70%]'
				/>
			</picture>
			<div className='absolute inset-0 -z-10 bg-gradient-to-t from-[#060b09] via-[#060b09]/55 to-[#060b09]/20 sm:bg-gradient-to-r sm:from-[#060b09]/90 sm:via-[#060b09]/50 sm:to-transparent' />
			<Estrelas />

			<div className='flex min-h-[460px] flex-col justify-end gap-5 p-6 sm:min-h-[380px] sm:max-w-xl sm:justify-center sm:p-10'>
				<div className='mx-auto w-full max-w-sm text-center sm:mx-0 sm:text-left'>
					<div className='mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start'>
						<p className='inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur'>
							Espetáculo de fim de ano · Ballet Quattor
						</p>
						{contagem && (
							<p className='inline-flex items-center gap-1.5 rounded-full bg-[#e8c25a] px-3 py-1 text-xs font-bold text-[#060b09]'>
								<Hourglass className='h-3.5 w-3.5' />
								{contagem}
							</p>
						)}
					</div>
					<img src='/espetaculo/espetaculo.webp' alt='Espetáculo de Ballet' className='mx-auto w-full sm:mx-0' />
					<img
						src='/espetaculo/titulo.webp'
						alt={ESPETACULO.titulo}
						className='oz-brilho mx-auto mt-2 w-2/3 sm:mx-0 sm:w-1/2'
					/>
				</div>

				<p className='text-center text-lg font-bold uppercase tracking-wide text-white sm:text-left'>
					<span className='text-[#e8c25a]'>
						{ESPETACULO.diaSemana}, {ESPETACULO.dataCurta}
					</span>{" "}
					·{" "}
					<span className='inline-flex items-center gap-1'>
						<MapPin className='h-4 w-4' />
						{ESPETACULO.local}
					</span>
				</p>

				<div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap'>
					{ESPETACULO.sessoes.map((s) => (
						<BotaoIngresso key={s.hora} {...s} />
					))}
				</div>
				<Link
					to='/ballet'
					className='inline-flex items-center justify-center gap-1 text-sm font-semibold text-white/85 hover:text-white sm:justify-start'>
					Saiba mais sobre o espetáculo
					<ArrowRight className='h-4 w-4' />
				</Link>
			</div>
		</section>
	);
}

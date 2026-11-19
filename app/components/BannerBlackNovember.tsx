import { ArrowRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { AVISO, formatarPreco, linkWhatsapp, OFERTAS } from "../promocoes/blackNovember";

/** Black November no topo da página inicial: preços em texto, a capa ao lado e as artes de cada plano. */
export default function BannerBlackNovember() {
	return (
		<section aria-labelledby='black-november' className='overflow-hidden rounded-3xl bg-[#0d0d0f] text-white shadow-lg'>
			<div className='grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_minmax(0,340px)] lg:gap-10 lg:p-10'>
				<div>
					<p className='inline-flex rounded-md bg-quattor-vermelho px-3 py-1 text-xs font-bold uppercase tracking-wider'>
						Até 30 de novembro
					</p>
					<h2 id='black-november' className='mt-4 text-5xl font-black uppercase italic leading-[0.9] tracking-tight sm:text-6xl'>
						Black
						<br />
						<span className='text-quattor-vermelho'>November</span>
					</h2>
					<p className='mt-4 text-sm font-bold uppercase tracking-wider text-white/80'>O mês inteiro com preço de Black</p>

					<ul className='mt-5 divide-y divide-white/10'>
						{OFERTAS.map((o) => (
							<li key={o.plano}>
								<a
									href={linkWhatsapp(o.plano)}
									target='_blank'
									rel='noreferrer'
									className='group flex items-center gap-3 py-2.5'>
									<span className={`h-2.5 w-2.5 shrink-0 rounded-full ${o.cor}`} aria-hidden />
									<span className='min-w-0 flex-1'>
										<span className='block text-sm font-bold uppercase sm:text-base'>{o.plano}</span>
										{o.detalhe && <span className='block text-xs text-white/55'>{o.detalhe}</span>}
									</span>
									<span className='whitespace-nowrap text-base font-black tabular-nums sm:text-lg'>
										{formatarPreco(o.preco)}
										<span className='text-xs font-semibold text-white/55'>/mês</span>
									</span>
									<ArrowRight className='h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white' />
								</a>
							</li>
						))}
					</ul>
					<p className='mt-3 text-xs text-white/55'>{AVISO}</p>

					<a
						href={linkWhatsapp()}
						target='_blank'
						rel='noreferrer'
						className='mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-quattor-verde px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 sm:w-auto'>
						<FaWhatsapp className='h-5 w-5' />
						Garantir meu plano pelo WhatsApp
					</a>
				</div>

				<img
					src='/black-november/capa.webp'
					alt='Black November Quattor: todas as ofertas'
					width={1080}
					height={1350}
					className='hidden w-full rounded-2xl lg:block'
				/>
			</div>

			<div className='border-t border-white/10 px-6 pb-6 pt-5 sm:px-8 lg:px-10 lg:pb-10'>
				<p className='mb-3 text-xs font-semibold uppercase tracking-wider text-white/60'>Escolha o seu plano</p>
				<ul className='-mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 lg:pb-0'>
					{OFERTAS.map((o) => (
						<li key={o.arte} className='w-[68%] shrink-0 snap-start sm:w-[38%] lg:w-auto'>
							<a
								href={linkWhatsapp(o.plano)}
								target='_blank'
								rel='noreferrer'
								className='block overflow-hidden rounded-2xl ring-1 ring-white/10 transition hover:ring-white/40'>
								<img
									src={`/black-november/${o.arte}.webp`}
									alt={`${o.plano}: ${formatarPreco(o.preco)} por mês`}
									width={1080}
									height={1350}
									loading='lazy'
									decoding='async'
									className='w-full transition duration-500 hover:scale-[1.03]'
								/>
							</a>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

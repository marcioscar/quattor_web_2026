import { CalendarDays, Clock, MapPin, Ticket } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import MainNavbar from "../components/MainNavbar";
import { BotaoIngresso, Estrelas } from "../components/BannerBallet";
import { ESPETACULO } from "../ballet/espetaculo";
import type { Route } from "./+types/ballet";

const WHATSAPP = "https://wa.me/5561993190568";

/** Faixa de tijolos amarelos entre as seções. */
function Estrada() {
	return <div aria-hidden className='oz-estrada' />;
}

export function meta({}: Route.MetaArgs) {
	const descricao = `Espetáculo de Ballet da Quattor Academia — ${ESPETACULO.data}, ${ESPETACULO.local}. Sessões às 16h30 e 19h.`;
	return [
		{ title: `${ESPETACULO.titulo} · Espetáculo de Ballet Quattor` },
		{ name: "description", content: descricao },
		{ property: "og:title", content: `${ESPETACULO.titulo} · Espetáculo de Ballet Quattor` },
		{ property: "og:description", content: descricao },
		{ property: "og:image", content: "/espetaculo/og.jpg" },
	];
}

export default function Ballet() {
	return (
		<>
			<MainNavbar />
			<main className='min-h-screen bg-[#060b09] text-[#f4efe1]'>
				{/* Capa */}
				<section className='relative isolate flex min-h-[85svh] items-end overflow-hidden pt-24'>
					<picture>
						<source media='(max-width: 639px)' srcSet='/espetaculo/fundo_retrato.webp' />
						<img
							src='/espetaculo/fundo.webp'
							alt=''
							className='absolute inset-0 -z-10 h-full w-full object-cover object-[50%_70%]'
						/>
					</picture>
					<div className='absolute inset-0 -z-10 bg-gradient-to-b from-[#060b09]/60 via-transparent to-[#060b09]' />
					<Estrelas />
					<div className='mx-auto w-full max-w-3xl px-4 pb-12 text-center'>
						<img
							src='/espetaculo/espetaculo.webp'
							alt='Espetáculo de Ballet'
							className='oz-surgir mx-auto w-[min(80%,440px)]'
							style={{ "--atraso": "0.15s" } as React.CSSProperties}
						/>
						<img
							src='/espetaculo/titulo.webp'
							alt={ESPETACULO.titulo}
							className='oz-surgir oz-titulo mx-auto mt-[calc(min(70%,360px)*-0.18)] w-[min(70%,360px)]'
						/>
						<p
							className='oz-surgir mt-5 text-xl font-bold uppercase tracking-wide sm:text-2xl'
							style={{ "--atraso": "0.85s" } as React.CSSProperties}>
							<span className='text-[#e8c25a]'>{ESPETACULO.data}</span> · {ESPETACULO.local}
						</p>
						<div
							className='oz-surgir mt-6 flex flex-col justify-center gap-3 sm:flex-row'
							style={{ "--atraso": "1.05s" } as React.CSSProperties}>
							{ESPETACULO.sessoes.map((s) => (
								<BotaoIngresso key={s.hora} {...s} grande />
							))}
						</div>
					</div>
				</section>

				<div className='mx-auto max-w-3xl space-y-8 px-4 pb-16'>
					<Estrada />

					{/* Sessões */}
					<section>
						<h2 className='mb-4 text-xl font-bold sm:text-2xl'>Escolha a sua sessão</h2>
						<div className='grid gap-4 sm:grid-cols-2'>
							{ESPETACULO.sessoes.map((s) => (
								<a
									key={s.hora}
									href={s.ingresso}
									target='_blank'
									rel='noreferrer'
									className='group rounded-3xl border border-[#e8c25a]/20 bg-[#0d1713] p-6 transition hover:border-[#e8c25a]/60'>
									<p className='text-sm text-[#a3b2a9]'>
										{ESPETACULO.diaSemana}, {ESPETACULO.dataCurta}
									</p>
									<p className='mt-1 flex items-center gap-2 text-4xl font-bold text-[#e8c25a]'>
										<Clock className='h-7 w-7' />
										{s.hora}
									</p>
									<p className='mt-5 inline-flex items-center gap-2 rounded-xl bg-[#e0263f] px-4 py-2.5 text-sm font-semibold text-white transition group-hover:brightness-110'>
										<Ticket className='h-4 w-4' />
										Comprar ingresso
									</p>
								</a>
							))}
						</div>
						<p className='mt-3 text-xs text-[#a3b2a9]'>
							A venda é feita pela Bilheteria Digital; o link abre em outra aba.
						</p>
					</section>

					<Estrada />

					{/* Informações */}
					<section>
						<h2 className='mb-4 text-xl font-bold sm:text-2xl'>Informações</h2>
						<div className='grid gap-3 sm:grid-cols-3'>
							<div className='flex items-start gap-3 rounded-2xl bg-[#0d1713] p-4'>
								<CalendarDays className='mt-0.5 h-5 w-5 shrink-0 text-[#2fd28c]' />
								<div>
									<p className='font-semibold'>{ESPETACULO.data}</p>
									<p className='text-sm text-[#a3b2a9]'>
										{ESPETACULO.diaSemana} · sessões às {ESPETACULO.sessoes.map((s) => s.hora).join(" e ")}
									</p>
								</div>
							</div>
							<a
								href={ESPETACULO.mapa}
								target='_blank'
								rel='noreferrer'
								className='flex items-start gap-3 rounded-2xl bg-[#0d1713] p-4 transition hover:bg-[#13211b]'>
								<MapPin className='mt-0.5 h-5 w-5 shrink-0 text-[#2fd28c]' />
								<div>
									<p className='font-semibold'>{ESPETACULO.local}</p>
									<p className='text-sm text-[#a3b2a9]'>Ver no mapa</p>
								</div>
							</a>
							<a
								href={WHATSAPP}
								target='_blank'
								rel='noreferrer'
								className='flex items-start gap-3 rounded-2xl bg-[#0d1713] p-4 transition hover:bg-[#13211b]'>
								<FaWhatsapp className='mt-0.5 h-5 w-5 shrink-0 text-[#2fd28c]' />
								<div>
									<p className='font-semibold'>Dúvidas?</p>
									<p className='text-sm text-[#a3b2a9]'>Fale com a recepção pelo WhatsApp</p>
								</div>
							</a>
						</div>
					</section>
				</div>
			</main>
		</>
	);
}

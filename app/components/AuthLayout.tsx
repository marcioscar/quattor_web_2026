import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import MainNavbar from "./MainNavbar";

/**
 * Molde das telas de acesso (login, criar senha, escolher aluno): cartão
 * dividido com a foto da academia de um lado e o formulário do outro. No
 * celular a foto vira uma faixa no topo do cartão.
 */
export function AuthLayout({
	titulo,
	subtitulo,
	chamada = "Seu treino da semana na palma da mão.",
	children,
}: {
	titulo: string;
	subtitulo?: ReactNode;
	chamada?: string;
	children: ReactNode;
}) {
	return (
		<>
			<MainNavbar />
			<main className='flex min-h-[calc(100vh-4rem)] items-center justify-center bg-quattor-fundo px-4 py-8'>
				<div className='grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-gray-100 lg:grid-cols-2'>
					<div
						className='relative flex h-36 bg-cover bg-center lg:h-auto lg:min-h-[560px]'
						style={{ backgroundImage: `url('/backgroud%20quattor.webp')` }}>
						<div className='absolute inset-0 bg-gradient-to-t from-quattor-azul-escuro via-quattor-azul-escuro/70 to-quattor-azul-escuro/20' />
						<div className='relative mt-auto p-5 lg:p-8'>
							<p className='text-xs font-semibold uppercase tracking-wider text-quattor-laranja'>Área do aluno</p>
							<p className='mt-1 text-lg font-bold leading-snug text-white lg:text-2xl'>{chamada}</p>
							<ul className='mt-4 hidden space-y-2 text-sm text-white/75 lg:block'>
								<li>• Exercícios da semana com vídeo</li>
								<li>• Séries, descanso e carga em cada exercício</li>
								<li>• Histórico de tudo que você treinou</li>
							</ul>
						</div>
					</div>

					<div className='flex flex-col justify-center p-6 sm:p-10'>
						<h1 className='text-2xl font-bold text-quattor-azul-escuro'>{titulo}</h1>
						{subtitulo && <div className='mt-1 text-sm text-gray-500'>{subtitulo}</div>}
						<div className='mt-6'>{children}</div>
					</div>
				</div>
			</main>
		</>
	);
}

export function Aviso({ tipo, children }: { tipo: "erro" | "sucesso" | "atencao"; children: ReactNode }) {
	const estilo = {
		erro: "bg-quattor-vermelho/10 text-quattor-vermelho",
		sucesso: "bg-quattor-verde/10 text-quattor-verde",
		atencao: "bg-quattor-laranja/10 text-quattor-azul-escuro",
	}[tipo];
	return (
		<p role={tipo === "erro" ? "alert" : "status"} className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${estilo}`}>
			{children}
		</p>
	);
}

const CLASSE_INPUT =
	"w-full rounded-xl border border-gray-200 bg-quattor-fundo py-3 pl-11 text-sm text-quattor-azul-escuro placeholder-gray-400 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-quattor-azul";

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
	id: string;
	rotulo: string;
	icone: LucideIcon;
};

export function Campo({ id, rotulo, icone: Icone, className, ...props }: CampoProps) {
	return (
		<div>
			<label htmlFor={id} className='mb-1.5 block text-sm font-medium text-gray-700'>
				{rotulo}
			</label>
			<div className='relative'>
				<Icone className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
				<input id={id} name={id} {...props} className={`${CLASSE_INPUT} pr-4 ${className ?? ""}`} />
			</div>
		</div>
	);
}

/** Campo de senha com o olho de mostrar/ocultar. */
export function CampoSenha({ id, rotulo, icone: Icone, ...props }: CampoProps) {
	const [visivel, setVisivel] = useState(false);
	return (
		<div>
			<label htmlFor={id} className='mb-1.5 block text-sm font-medium text-gray-700'>
				{rotulo}
			</label>
			<div className='relative'>
				<Icone className='pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
				<input id={id} name={id} {...props} type={visivel ? "text" : "password"} className={`${CLASSE_INPUT} pr-12`} />
				<button
					type='button'
					onClick={() => setVisivel((v) => !v)}
					aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
					className='absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:text-quattor-azul-escuro'>
					{visivel ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
				</button>
			</div>
		</div>
	);
}

export const CLASSE_BOTAO_PRINCIPAL =
	"flex w-full items-center justify-center gap-2 rounded-xl bg-quattor-laranja px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-quattor-laranja focus-visible:ring-offset-2 disabled:opacity-60";

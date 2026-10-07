import { useState } from "react";
import { Link } from "react-router";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Check, LayoutGrid, X } from "lucide-react";
import { GRUPOS_MUSCULARES, type GrupoMuscular } from "~/constants/gruposMusculares";

type TreinosGrupoFormProps = {
	registration: number;
	grupoInicial: GrupoMuscular;
	/** Grupos com algum exercício registrado nesta semana — ganham um ✓. */
	gruposDaSemana: string[];
};

/** "MEMBROS SUPERIORES 1" → "Membros Superiores 1" */
export function nomeGrupoExibicao(grupo: string): string {
	return grupo
		.toLowerCase()
		.split(" ")
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(" ");
}

/**
 * Botão "Escolha o grupo para treinar" que abre um painel com os 14 grupos
 * em grade (de baixo para cima no celular, centralizado no desktop).
 * Substitui a faixa de rolagem
 * lateral, que atrapalhava no meio do treino. Cada grupo é um link
 * `?grupo=...`.
 */
export function TreinosGrupoForm({ registration, grupoInicial, gruposDaSemana }: TreinosGrupoFormProps) {
	const [aberto, setAberto] = useState(false);
	const feitos = new Set(gruposDaSemana);

	return (
		<>
			<button
				type='button'
				onClick={() => setAberto(true)}
				className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20 sm:w-auto'>
				<LayoutGrid className='h-4 w-4' />
				Escolha o grupo para treinar
			</button>

			<Dialog open={aberto} onClose={() => setAberto(false)} className='relative z-50'>
				<div className='fixed inset-0 bg-quattor-azul-escuro/50 backdrop-blur-sm' aria-hidden='true' />
				<div className='fixed inset-0 flex items-end justify-center sm:items-center sm:p-4'>
					<DialogPanel className='max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-3xl'>
						{/* "alça" do painel no celular */}
						<div className='mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden' />
						<div className='mb-4 flex items-start justify-between gap-3'>
							<div>
								<DialogTitle className='text-lg font-bold text-quattor-azul-escuro'>Escolha o grupo</DialogTitle>
								{feitos.size > 0 && (
									<p className='mt-0.5 flex items-center gap-1 text-xs text-gray-500'>
										<Check className='h-3.5 w-3.5 text-quattor-verde' /> treinado nesta semana
									</p>
								)}
							</div>
							<button
								type='button'
								onClick={() => setAberto(false)}
								aria-label='Fechar'
								className='flex h-9 w-9 items-center justify-center rounded-xl bg-quattor-fundo text-gray-500 hover:text-quattor-azul-escuro'>
								<X className='h-4 w-4' />
							</button>
						</div>

						<ul className='grid grid-cols-2 gap-2'>
							{GRUPOS_MUSCULARES.map((g) => {
								const atual = g === grupoInicial;
								const feito = feitos.has(g);
								return (
									<li key={g}>
										<Link
											to={`/treinos/${registration}?grupo=${encodeURIComponent(g)}`}
											onClick={() => setAberto(false)}
											aria-current={atual ? "page" : undefined}
											className={`flex min-h-14 items-center justify-between gap-2 rounded-2xl px-3.5 py-3 text-sm font-semibold leading-tight transition ${
												atual
													? "bg-quattor-azul-escuro text-white"
													: "bg-quattor-fundo text-quattor-azul-escuro hover:ring-2 hover:ring-quattor-azul"
											}`}>
											<span>{nomeGrupoExibicao(g)}</span>
											{feito && (
												<span
													className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
														atual ? "bg-white/20" : "bg-quattor-verde"
													}`}>
													<Check className='h-3 w-3 text-white' />
												</span>
											)}
										</Link>
									</li>
								);
							})}
						</ul>
					</DialogPanel>
				</div>
			</Dialog>
		</>
	);
}

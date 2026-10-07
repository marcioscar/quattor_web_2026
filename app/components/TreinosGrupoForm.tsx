import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { GRUPOS_MUSCULARES, type GrupoMuscular } from "~/constants/gruposMusculares";

type TreinosGrupoFormProps = {
	registration: number;
	grupoInicial: GrupoMuscular;
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
 * Grupos musculares em botões que rolam para o lado (no lugar do combobox):
 * um toque troca o grupo, sem abrir lista. Cada botão é um link
 * `?grupo=...`, então funciona até sem JavaScript.
 */
export function TreinosGrupoForm({ registration, grupoInicial }: TreinosGrupoFormProps) {
	const ativoRef = useRef<HTMLLIElement>(null);

	// O grupo atual pode estar fora da tela (ex.: Quads é o 13º): rola a
	// faixa até ele, só na horizontal.
	useEffect(() => {
		const li = ativoRef.current;
		const faixa = li?.closest("nav");
		if (!li || !faixa) return;
		faixa.scrollTo({ left: li.offsetLeft - faixa.clientWidth / 2 + li.clientWidth / 2, behavior: "smooth" });
	}, [grupoInicial]);

	return (
		<nav aria-label='Grupo muscular' className='-mx-4 overflow-x-auto px-4'>
			<ul className='relative flex w-max gap-2 pb-1'>
				{GRUPOS_MUSCULARES.map((g) => {
					const ativo = g === grupoInicial;
					return (
						<li key={g} ref={ativo ? ativoRef : undefined}>
							<Link
								to={`/treinos/${registration}?grupo=${encodeURIComponent(g)}`}
								preventScrollReset
								aria-current={ativo ? "page" : undefined}
								className={`block whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
									ativo
										? "bg-quattor-azul-escuro text-white shadow-sm"
										: "bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-quattor-azul"
								}`}>
								{nomeGrupoExibicao(g)}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}

import type { Route } from "./+types/historico";
import MainNavbar from "../components/MainNavbar";

type TreinoHistorico = {
	carga: string;
	data: string;
	grupo: string;
	nome: string;
};

function normalizarTreinos(data: unknown): TreinoHistorico[] {
	if (!data) return [];
	if (Array.isArray(data)) {
		return data.filter(
			(item): item is TreinoHistorico =>
				item != null &&
				typeof item === "object" &&
				"nome" in item &&
				"data" in item,
		) as TreinoHistorico[];
	}
	if (typeof data === "object" && "data" in (data as object)) {
		const aninhado = (data as Record<string, unknown>).data;
		return Array.isArray(aninhado) ? normalizarTreinos(aninhado) : [];
	}
	return [];
}

export async function loader({ params }: Route.LoaderArgs) {
	const response = await fetch(
		`https://api.quattoracademia.com/historico/?matricula=${params.registration}`,
	);
	const data: unknown = await response.json();
	return { treinos: normalizarTreinos(data), matricula: params.registration };
}

function formatarData(dataStr: string): string {
	if (!dataStr) return "—";
	const d = new Date(dataStr);
	if (Number.isNaN(d.getTime())) return dataStr;
	return d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function agruparPorGrupo(
	treinos: TreinoHistorico[],
): [string, TreinoHistorico[]][] {
	const mapa = new Map<string, TreinoHistorico[]>();
	for (const t of treinos) {
		const grupo = t.grupo?.trim() || "Sem grupo";
		const lista = mapa.get(grupo) ?? [];
		lista.push(t);
		mapa.set(grupo, lista);
	}
	return Array.from(mapa.entries()).sort(([a], [b]) =>
		a === "Sem grupo" ? 1 : b === "Sem grupo" ? -1 : a.localeCompare(b),
	);
}

export default function Historico({ loaderData }: Route.ComponentProps) {
	const { treinos, matricula } = loaderData ?? { treinos: [], matricula: "" };

	if (!treinos.length) {
		return (
			<>
				<MainNavbar />
				<div className='p-6 max-w-2xl mx-auto'>
					<h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4'>
						Histórico de treinos
					</h1>
					<p className='text-gray-600 dark:text-gray-400'>
						Matrícula: {matricula}
					</p>
					<p className='mt-4 text-gray-500 dark:text-gray-400'>
						Nenhum treino encontrado no histórico.
					</p>
				</div>
			</>
		);
	}

	const grupos = agruparPorGrupo(treinos);

	return (
		<>
			<MainNavbar />
			<div className='p-6 max-w-2xl mx-auto'>
			<h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
				Histórico de treinos
			</h1>

			<div className='space-y-8'>
				{grupos.map(([nomeGrupo, treinosDoGrupo]) => {
					const idGrupo = `grupo-${nomeGrupo.replace(/\s+/g, "-").toLowerCase()}`;
					return (
						<section key={nomeGrupo} aria-labelledby={idGrupo}>
							<h2
								id={idGrupo}
								className='text-lg font-medium text-orange-500 dark:text-orange-400 mb-3 pb-1 border-b border-gray-200 dark:border-gray-700'>
								{nomeGrupo}
							</h2>
							<ul className='space-y-3' role='list'>
								{treinosDoGrupo.map((treino, index) => (
									<li
										key={`${treino.data}-${treino.nome}-${index}`}
										className='rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm'>
										<div className='flex flex-wrap items-baseline justify-between gap-2'>
											<span className='font-medium text-gray-900 dark:text-gray-100'>
												{treino.nome}
											</span>
											<time
												className='text-sm text-gray-500 dark:text-gray-400'
												dateTime={treino.data}>
												{formatarData(treino.data)}
											</time>
										</div>
										{treino.carga && (
											<p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
												Carga: {treino.carga}
											</p>
										)}
									</li>
								))}
							</ul>
						</section>
					);
				})}
			</div>
			</div>
		</>
	);
}

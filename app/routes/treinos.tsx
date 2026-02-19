import { Link } from "react-router";
import MainNavbar from "../components/MainNavbar";
import type { Route } from "./+types/treinos";

type Treino = {
	carga: string;
	data: string;
	grupo: string;
	nome: string;
	id: string;
};

export async function loader() {
	const response = await fetch(
		"https://api.quattoracademia.com/historico/?matricula=17841",
	);
	const data = (await response.json()) as Treino[];
	return data;
}
export default function Treinos({ loaderData }: Route.ComponentProps) {
	return (
		<>
			<MainNavbar />
			<div>
				<h1>Treinos</h1>
				<ul>
					{loaderData.map((treino: Treino, index: number) => (
						<li key={index}>
							<Link to={`/treinos/${treino.id}`}>{treino.nome}</Link>
							{treino.nome}
						</li>
					))}
				</ul>
			</div>
		</>
	);
}

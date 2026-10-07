import { Form, redirect } from "react-router";
import MainNavbar from "../components/MainNavbar";
import { db } from "~/db.server";
import {
	createSessionCookie,
	destroyEscolhaCookie,
	getEscolhaMatriculas,
} from "../session.server";
import type { Route } from "./+types/login.escolher";

/**
 * E-mail de família: o login já conferiu a senha e a matrícula vigente, e
 * guardou as matrículas liberadas num cookie assinado de 5 minutos. A escolha
 * é conferida de novo contra essa lista — não dá para pôr outra matrícula.
 */
export async function loader({ request }: Route.LoaderArgs) {
	const matriculas = getEscolhaMatriculas(request);
	if (matriculas.length === 0) throw redirect("/login");

	const alunos = await db.aluno.findMany({
		where: { idMembro: { in: matriculas } },
		select: { idMembro: true, nome: true, sobrenome: true, fotoUrl: true },
	});
	return {
		alunos: alunos
			.map((a) => ({
				registration: a.idMembro as number,
				nome: [a.nome, a.sobrenome].filter(Boolean).join(" ").trim() || `Matrícula ${a.idMembro}`,
				foto: a.fotoUrl ?? "",
			}))
			.sort((a, b) => a.nome.localeCompare(b.nome)),
	};
}

export async function action({ request }: Route.ActionArgs) {
	const matriculas = getEscolhaMatriculas(request);
	const formData = await request.formData();
	const escolhida = Number(formData.get("registration"));
	if (!matriculas.includes(escolhida)) throw redirect("/login");

	const headers = new Headers();
	headers.append("Set-Cookie", createSessionCookie(String(escolhida)));
	headers.append("Set-Cookie", destroyEscolhaCookie());
	throw redirect(`/aluno/${escolhida}`, { headers });
}

export default function EscolherAluno({ loaderData }: Route.ComponentProps) {
	return (
		<>
			<MainNavbar />
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4'>
				<div className='w-full max-w-md'>
					<div className='bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8'>
						<h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
							Quem vai treinar?
						</h1>
						<p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
							Este e-mail é de mais de um aluno. Escolha o seu.
						</p>
						<Form method='post' className='space-y-3'>
							{loaderData.alunos.map((aluno) => (
								<button
									key={aluno.registration}
									type='submit'
									name='registration'
									value={aluno.registration}
									className='w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800 text-left transition-colors'>
									{aluno.foto ? (
										<img src={aluno.foto} alt='' className='w-10 h-10 rounded-full object-cover' />
									) : (
										<span className='w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700' />
									)}
									<span className='flex flex-col'>
										<span className='font-medium text-gray-900 dark:text-gray-100'>{aluno.nome}</span>
										<span className='text-xs text-gray-500'>Matrícula {aluno.registration}</span>
									</span>
								</button>
							))}
						</Form>
					</div>
				</div>
			</div>
		</>
	);
}

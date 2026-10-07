import { Form, redirect } from "react-router";
import { ChevronRight } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
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
		<AuthLayout
			titulo='Quem vai treinar?'
			subtitulo='Este e-mail é de mais de um aluno. Escolha o seu.'
			chamada='Um e-mail, a família toda treinando.'>
			<Form method='post' className='space-y-2'>
				{loaderData.alunos.map((aluno) => (
					<button
						key={aluno.registration}
						type='submit'
						name='registration'
						value={aluno.registration}
						className='group flex w-full items-center gap-3 rounded-2xl bg-quattor-fundo p-3 text-left ring-1 ring-transparent transition hover:bg-white hover:ring-quattor-azul'>
						{aluno.foto ? (
							<img src={aluno.foto} alt='' className='h-12 w-12 rounded-full object-cover' />
						) : (
							<span className='flex h-12 w-12 items-center justify-center rounded-full bg-quattor-azul-escuro text-lg font-bold text-white'>
								{aluno.nome.charAt(0)}
							</span>
						)}
						<span className='min-w-0 flex-1'>
							<span className='block truncate font-semibold capitalize text-quattor-azul-escuro'>
								{aluno.nome.toLowerCase()}
							</span>
							<span className='text-xs text-gray-500'>Matrícula {aluno.registration}</span>
						</span>
						<ChevronRight className='h-5 w-5 text-gray-300 transition group-hover:text-quattor-azul' />
					</button>
				))}
			</Form>
		</AuthLayout>
	);
}

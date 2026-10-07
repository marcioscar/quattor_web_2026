import { Link, redirect, useFetcher } from "react-router";
import { getSessionRegistration } from "../session.server";
import { AuthLayout, Aviso, Campo, CampoSenha, CLASSE_BOTAO_PRINCIPAL } from "../components/AuthLayout";
import { ArrowRight, KeyRound, Lock, Mail } from "lucide-react";
import { autenticar, concluirLogin, type FalhaLogin } from "~/auth/login.server";
import { normalizarEmail } from "~/auth/regras";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
	const registration = getSessionRegistration(request);
	if (registration) {
		throw redirect(`/aluno/${registration}`);
	}
	return null;
}

/**
 * E-mail e senha chegam no CORPO do POST e são conferidos direto no banco
 * (Aluno.senhaHash). A senha não é aparada nem vai para log.
 */
export async function action({ request }: Route.ActionArgs): Promise<FalhaLogin> {
	const formData = await request.formData();
	const email = normalizarEmail(String(formData.get("email") ?? ""));
	const senha = String(formData.get("senha") ?? "");
	if (!email || !senha) return { ok: false, error: "NOT_FOUND" };

	const alunos = await autenticar(email, senha);
	if (!alunos) return { ok: false, error: "NOT_FOUND" };

	const resultado = await concluirLogin(alunos);
	if (resultado instanceof Response) throw resultado;
	return resultado;
}

export default function Login() {
	const fetcher = useFetcher<typeof action>();
	const isSubmitting = fetcher.state !== "idle";
	const result = fetcher.data;

	return (
		<AuthLayout
			titulo='Entrar'
			subtitulo='Use o e-mail do seu cadastro na academia.'>
			{result && !result.ok && result.error === "INACTIVE" && (
				<Aviso tipo='atencao'>Sua matrícula está inativa. Procure a recepção.</Aviso>
			)}
			{result && !result.ok && result.error === "NOT_FOUND" && (
				<Aviso tipo='erro'>
					E-mail ou senha incorretos. Se é seu primeiro acesso,{" "}
					<Link to='/primeiro-acesso' className='underline'>
						crie sua senha
					</Link>
					.
				</Aviso>
			)}

			<fetcher.Form method='post' className='space-y-4'>
				<Campo
					id='email'
					rotulo='E-mail'
					icone={Mail}
					type='email'
					autoComplete='email'
					required
					placeholder='seu@email.com'
				/>
				<CampoSenha id='senha' rotulo='Senha' icone={Lock} autoComplete='current-password' required />
				<button type='submit' disabled={isSubmitting} className={`${CLASSE_BOTAO_PRINCIPAL} mt-2`}>
					{isSubmitting ? "Entrando..." : "Entrar"}
					{!isSubmitting && <ArrowRight className='h-4 w-4' />}
				</button>
			</fetcher.Form>

			<div className='mt-8 rounded-2xl bg-quattor-fundo p-4 text-center'>
				<p className='text-sm font-medium text-quattor-azul-escuro'>Primeiro acesso ou esqueceu a senha?</p>
				<Link
					to='/primeiro-acesso'
					className='mt-1 inline-flex items-center gap-1 text-sm font-semibold text-quattor-azul hover:underline'>
					<KeyRound className='h-4 w-4' />
					Criar ou trocar senha
				</Link>
			</div>
		</AuthLayout>
	);
}

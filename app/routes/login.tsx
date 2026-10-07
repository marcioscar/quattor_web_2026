import { Link, redirect, useFetcher } from "react-router";
import { getSessionRegistration } from "../session.server";
import MainNavbar from "../components/MainNavbar";
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
	const isSubmitting = fetcher.state === "submitting";
	const result = fetcher.data;

	const errorMessage =
		result && !result.ok && result.error === "INACTIVE"
			? "Sua matrícula está inativa. Procure a recepção."
			: result && !result.ok && result.error === "NOT_FOUND"
				? "E-mail ou senha incorretos. Se é seu primeiro acesso, crie sua senha abaixo."
				: null;

	return (
		<>
			<MainNavbar />
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4'>
				<div className='w-full max-w-md'>
					<div className='bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8'>
						<h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6'>
							Entrar
						</h1>

						{errorMessage && (
							<div
								className='mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm'
								role='alert'>
								{errorMessage}
							</div>
						)}

						<fetcher.Form method='post' className='space-y-5'>
														<div>
								<label
									htmlFor='email'
									className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'>
									E-mail
								</label>
								<input
									id='email'
									type='email'
									name='email'
									autoComplete='email'
									required
									className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow'
									placeholder='seu@email.com'
								/>
							</div>

							<div>
								<label
									htmlFor='senha'
									className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'>
									Senha
								</label>
								<div className='relative'>
									<input
										id='senha'
										name='senha'
										autoComplete='current-password'
										required
										type='password'
										className='w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow'
									/>
								</div>
							</div>

							<button
								type='submit'
								className='w-full py-3 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors'>
								{!isSubmitting && "Entrar"}
								{isSubmitting && <span className='ml-2'>Carregando...</span>}
							</button>
						</fetcher.Form>

						<p className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
							Primeiro acesso ou esqueceu a senha?{" "}
							<Link
								to='/primeiro-acesso'
								className='text-orange-500 hover:text-orange-600 font-medium'>
								Criar senha
							</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	);
}

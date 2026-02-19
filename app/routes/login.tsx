import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { redirect, useFetcher } from "react-router";
import { createSessionCookie, getSessionRegistration } from "../session.server";
import { useState } from "react";
import MainNavbar from "../components/MainNavbar";
import type { Route } from "./+types/login";

const API_BASE_URL_AUTENTICACAO = "https://api.quattoracademia.com/autenticar/";

type AlunoResponse = {
	status?: string;
	registration?: number;
	[name: string]: unknown;
};

type ActionResult =
	| { ok: true; aluno: AlunoResponse }
	| { ok: false; error: "INACTIVE"; errorMessage?: string }
	| { ok: false; error: "NOT_FOUND" };

function normalizeSenhaEmail(value: string): string {
	return value.trim();
}

function isStatusActive(status: string): boolean {
	const s = status.toLowerCase().trim();
	return s === "ativo" || s === "active" || s === "activo";
}

function buildApiUrlAutenticacao(email: string, senha: string): string {
	return `${API_BASE_URL_AUTENTICACAO}?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`;
}
async function fetchAutenticacao(email: string, senha: string) {
	const url = buildApiUrlAutenticacao(email, senha);
	const response = await fetch(url, { method: "POST" });
	const data = await response.json();

	if (!response.ok) {
		throw { type: "ERROR", message: data.message || "Erro ao autenticar" };
	}
	return data as AuthenticatorResponse;
}
export async function loader({ request }: Route.LoaderArgs) {
	const registration = getSessionRegistration(request);
	if (registration) {
		throw redirect(`/aluno/${registration}`);
	}
	return null;
}

export async function action({
	request,
}: Route.ActionArgs): Promise<ActionResult> {
	const formData = await request.formData();
	const email = normalizeSenhaEmail(formData.get("email") as string);
	const senha = normalizeSenhaEmail(formData.get("senha") as string);

	try {
		const data = await fetchAutenticacao(email, senha);

		if (
			"status" in data &&
			typeof data.status === "string" &&
			!isStatusActive(data.status)
		) {
			return {
				ok: false,
				error: "INACTIVE",
				errorMessage: "Sua matrícula está inativa.",
			};
		}

		if ("status" in data) {
			const alunoData = data as unknown as AlunoResponse;
			const matriculaDoAluno = String(alunoData.registration ?? "");

			if (matriculaDoAluno) {
				throw redirect(`/aluno/${matriculaDoAluno}`, {
					headers: {
						"Set-Cookie": createSessionCookie(matriculaDoAluno),
					},
				});
			}

			return { ok: true, aluno: alunoData };
		}

		return { ok: false, error: "NOT_FOUND" };
	} catch (err) {
		if (err instanceof Response && err.status >= 300 && err.status < 400) {
			throw err;
		}
		const errObj = err as { type?: string; message?: string } | null;
		if (errObj && errObj.type === "INACTIVE") {
			return {
				ok: false,
				error: "INACTIVE",
				errorMessage: errObj.message ?? undefined,
			};
		}
		return { ok: false, error: "NOT_FOUND" };
	}
}

const URL_TROCA_SENHA =
	"https://evo-totem.w12app.com.br/quattor/1/page/landing-page/validacao";

export default function Login() {
	const fetcher = useFetcher<typeof action>();
	const isSubmitting = fetcher.state === "submitting";
	const result = fetcher.data;
	const [modalTrocaSenhaAberto, setModalTrocaSenhaAberto] = useState(false);
	const [emailTrocaSenha, setEmailTrocaSenha] = useState("");

	const errorMessage =
		result && !result.ok && result.error === "INACTIVE"
			? (result.errorMessage ?? "Sua matrícula está inativa.")
			: result && !result.ok && result.error === "NOT_FOUND"
				? "E-mail ou senha incorretos."
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
							<input type='hidden' name='intent' value='login' />
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
							mudar a senha?{" "}
							<button
								type='button'
								onClick={() => setModalTrocaSenhaAberto(true)}
								className='text-orange-500 hover:text-orange-600 font-medium'>
								clique aqui
							</button>
						</p>

						<Dialog
							open={modalTrocaSenhaAberto}
							onClose={() => setModalTrocaSenhaAberto(false)}
							className='relative z-50'>
							<div className='fixed inset-0 bg-black/30' aria-hidden='true' />
							<div className='fixed inset-0 flex items-center justify-center p-4'>
								<DialogPanel className='mx-auto max-w-sm rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl border border-gray-200 dark:border-gray-800'>
									<DialogTitle className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'>
										Trocar senha
									</DialogTitle>
									<p className='text-sm text-gray-600 dark:text-gray-400 mb-4'>
										Digite seu e-mail para trocar a senha:
									</p>
									<input
										type='email'
										value={emailTrocaSenha}
										onChange={(e) => setEmailTrocaSenha(e.target.value)}
										placeholder='seu@email.com'
										className='w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4'
									/>
									<div className='flex gap-2 justify-end'>
										<button
											type='button'
											onClick={() => setModalTrocaSenhaAberto(false)}
											className='px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'>
											Cancelar
										</button>
										<button
											type='button'
											onClick={() => {
												const url = `${URL_TROCA_SENHA}?email=${encodeURIComponent(emailTrocaSenha)}&login=False`;
												window.open(url, "_blank", "noopener,noreferrer");
												setModalTrocaSenhaAberto(false);
												setEmailTrocaSenha("");
											}}
											className='px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white'>
											Continuar
										</button>
									</div>
								</DialogPanel>
							</div>
						</Dialog>
					</div>
				</div>
			</div>
		</>
	);
}

import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import MainNavbar from "../components/MainNavbar";
import {
	alunosDoEmail,
	consumirCodigo,
	criarCodigo,
	gravarSenhaDoEmail,
	registrarTentativaErrada,
	ultimoCodigo,
} from "~/auth/alunos.server";
import { enviarCodigoAcesso } from "~/auth/email.server";
import { concluirLogin } from "~/auth/login.server";
import {
	SENHA_MIN_CARACTERES,
	avaliarCodigo,
	gerarCodigo,
	hashSegredo,
	normalizarEmail,
	podeReenviar,
	validarNovaSenha,
	type ResultadoCodigo,
} from "~/auth/regras";
import { getSessionRegistration } from "../session.server";
import type { Route } from "./+types/primeiro-acesso";

/**
 * Primeiro acesso e "esqueci a senha" são o mesmo fluxo:
 * 1. o aluno digita o e-mail → se houver aluno, mandamos um código de 6
 *    dígitos (a resposta é IGUAL exista ou não, para não revelar quem é aluno);
 * 2. com o código certo, define a senha → gravada em todos os alunos do
 *    e-mail, e já entra.
 */
type Resposta =
	| { etapa: "codigo"; email: string; aviso?: string; erro?: string }
	| { etapa: "email"; erro: string }
	| { etapa: "inativo" };

const AVISO_ENVIO =
	"Se o e-mail estiver cadastrado, enviamos um código. Confira também a caixa de spam.";

const MENSAGEM_CODIGO: Record<Exclude<ResultadoCodigo, "ok">, string> = {
	inexistente: "Código vencido ou inválido. Peça um novo código.",
	expirado: "Código vencido ou inválido. Peça um novo código.",
	usado: "Este código já foi usado. Peça um novo código.",
	bloqueado: "Muitas tentativas erradas. Peça um novo código.",
	invalido: "Código incorreto.",
};

export async function loader({ request }: Route.LoaderArgs) {
	const registration = getSessionRegistration(request);
	if (registration) throw redirect(`/aluno/${registration}`);
	// Vai pelo loader: importar regras.ts no componente levaria node:crypto ao navegador.
	return { minimoSenha: SENHA_MIN_CARACTERES };
}

export async function action({ request }: Route.ActionArgs): Promise<Resposta> {
	const formData = await request.formData();
	const intent = String(formData.get("intent") ?? "");
	const email = normalizarEmail(String(formData.get("email") ?? ""));
	if (!email || !email.includes("@")) return { etapa: "email", erro: "Digite um e-mail válido." };

	if (intent === "pedir") {
		await pedirCodigo(email);
		return { etapa: "codigo", email, aviso: AVISO_ENVIO };
	}

	if (intent === "definir") {
		const senha = String(formData.get("senha") ?? "");
		const confirmacao = String(formData.get("confirmacao") ?? "");
		const erroSenha = validarNovaSenha(senha, confirmacao);
		if (erroSenha) return { etapa: "codigo", email, erro: erroSenha };

		const registro = await ultimoCodigo(email);
		const resultado = avaliarCodigo(registro, String(formData.get("codigo") ?? ""));
		if (resultado !== "ok" || !registro) {
			if (resultado === "invalido" && registro) await registrarTentativaErrada(registro.id);
			return { etapa: "codigo", email, erro: MENSAGEM_CODIGO[resultado === "ok" ? "inexistente" : resultado] };
		}
		if (!(await consumirCodigo(registro.id))) {
			return { etapa: "codigo", email, erro: MENSAGEM_CODIGO.usado };
		}

		await gravarSenhaDoEmail(email, hashSegredo(senha));
		const login = await concluirLogin(await alunosDoEmail(email));
		if (login instanceof Response) throw login;
		return { etapa: "inativo" };
	}

	return { etapa: "email", erro: "Ação inválida." };
}

/**
 * Gera e manda o código se houver aluno com o e-mail e já tiver passado 60 s
 * do último pedido. O envio não é aguardado: esperar o SMTP faria a resposta
 * demorar mais quando o e-mail existe, e o tempo revelaria quem é aluno.
 */
async function pedirCodigo(email: string) {
	const ultimo = await ultimoCodigo(email);
	if (!podeReenviar(ultimo?.criadoEm)) return;
	const alunos = await alunosDoEmail(email);
	if (alunos.length === 0) return;

	const codigo = gerarCodigo();
	await criarCodigo(email, hashSegredo(codigo));
	enviarCodigoAcesso(email, codigo).catch((erro: unknown) => {
		console.error("Falha ao enviar código de acesso:", erro instanceof Error ? erro.message : erro);
	});
}

const CLASSE_INPUT =
	"w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow";
const CLASSE_LABEL = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
const CLASSE_BOTAO =
	"w-full py-3 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors";

export default function PrimeiroAcesso() {
	const { minimoSenha } = useLoaderData<typeof loader>();
	const resposta = useActionData<typeof action>();
	const navigation = useNavigation();
	const enviando = navigation.state !== "idle";

	return (
		<>
			<MainNavbar />
			<div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4'>
				<div className='w-full max-w-md'>
					<div className='bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8'>
						<h1 className='text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2'>
							Criar ou trocar senha
						</h1>

						{resposta?.etapa === "inativo" ? (
							<div className='space-y-4'>
								<p className='p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm'>
									Senha criada, mas sua matrícula está inativa. Procure a recepção.
								</p>
								<Link to='/login' className='block text-center text-orange-500 hover:text-orange-600 font-medium'>
									Voltar para o login
								</Link>
							</div>
						) : resposta?.etapa === "codigo" ? (
							<>
								{resposta.aviso && (
									<p className='mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm'>
										{resposta.aviso}
									</p>
								)}
								{resposta.erro && (
									<p role='alert' className='mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm'>
										{resposta.erro}
									</p>
								)}
								<Form method='post' className='space-y-5'>
									<input type='hidden' name='email' value={resposta.email} />
									<p className='text-sm text-gray-600 dark:text-gray-400'>
										E-mail: <strong>{resposta.email}</strong>
									</p>
									<div>
										<label htmlFor='codigo' className={CLASSE_LABEL}>
											Código recebido por e-mail
										</label>
										<input
											id='codigo'
											name='codigo'
											inputMode='numeric'
											autoComplete='one-time-code'
											pattern='[0-9 ]{6,7}'
											maxLength={7}
											required
											className={`${CLASSE_INPUT} tracking-widest text-lg`}
											placeholder='000000'
										/>
									</div>
									<div>
										<label htmlFor='senha' className={CLASSE_LABEL}>
											Nova senha (mínimo {minimoSenha} caracteres)
										</label>
										<input
											id='senha'
											name='senha'
											type='password'
											autoComplete='new-password'
											minLength={minimoSenha}
											required
											className={CLASSE_INPUT}
										/>
									</div>
									<div>
										<label htmlFor='confirmacao' className={CLASSE_LABEL}>
											Repita a nova senha
										</label>
										<input
											id='confirmacao'
											name='confirmacao'
											type='password'
											autoComplete='new-password'
											minLength={minimoSenha}
											required
											className={CLASSE_INPUT}
										/>
									</div>
									<button type='submit' name='intent' value='definir' disabled={enviando} className={CLASSE_BOTAO}>
										{enviando ? "Salvando..." : "Salvar senha e entrar"}
									</button>
								</Form>
								<Form method='post' className='mt-4 text-center'>
									<input type='hidden' name='email' value={resposta.email} />
									<button
										type='submit'
										name='intent'
										value='pedir'
										disabled={enviando}
										className='text-sm text-orange-500 hover:text-orange-600 font-medium'>
										Não recebeu? Enviar outro código
									</button>
								</Form>
							</>
						) : (
							<>
								<p className='text-sm text-gray-600 dark:text-gray-400 mb-6'>
									Digite o e-mail do seu cadastro na academia. Vamos mandar um código para você criar a senha.
								</p>
								{resposta?.etapa === "email" && (
									<p role='alert' className='mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm'>
										{resposta.erro}
									</p>
								)}
								<Form method='post' className='space-y-5'>
									<div>
										<label htmlFor='email' className={CLASSE_LABEL}>
											E-mail
										</label>
										<input
											id='email'
											name='email'
											type='email'
											autoComplete='email'
											required
											className={CLASSE_INPUT}
											placeholder='seu@email.com'
										/>
									</div>
									<button type='submit' name='intent' value='pedir' disabled={enviando} className={CLASSE_BOTAO}>
										{enviando ? "Enviando..." : "Enviar código"}
									</button>
								</Form>
							</>
						)}

						<p className='mt-6 text-center text-sm text-gray-600 dark:text-gray-400'>
							Já tem senha?{" "}
							<Link to='/login' className='text-orange-500 hover:text-orange-600 font-medium'>
								Entrar
							</Link>
						</p>
					</div>
				</div>
			</div>
		</>
	);
}

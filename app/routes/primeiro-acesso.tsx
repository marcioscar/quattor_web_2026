import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { AuthLayout, Aviso, Campo, CampoSenha, CLASSE_BOTAO_PRINCIPAL } from "../components/AuthLayout";
import { Lock, Mail, RotateCw, Send } from "lucide-react";
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

export default function PrimeiroAcesso() {
	const { minimoSenha } = useLoaderData<typeof loader>();
	const resposta = useActionData<typeof action>();
	const navigation = useNavigation();
	const enviando = navigation.state !== "idle";

	if (resposta?.etapa === "inativo") {
		return (
			<AuthLayout titulo='Senha criada' chamada='Tudo pronto para voltar a treinar.'>
				<Aviso tipo='atencao'>Sua senha foi criada, mas a matrícula está inativa. Procure a recepção.</Aviso>
				<Link to='/login' className={CLASSE_BOTAO_PRINCIPAL}>
					Voltar para o login
				</Link>
			</AuthLayout>
		);
	}

	if (resposta?.etapa === "codigo") {
		return (
			<AuthLayout
				titulo='Digite o código'
				subtitulo={
					<>
						Enviado para <strong className='text-quattor-azul-escuro'>{resposta.email}</strong>
					</>
				}
				chamada='Falta pouco: confirme o código e crie sua senha.'>
				{resposta.aviso && <Aviso tipo='sucesso'>{resposta.aviso}</Aviso>}
				{resposta.erro && <Aviso tipo='erro'>{resposta.erro}</Aviso>}

				<Form method='post' className='space-y-4'>
					<input type='hidden' name='email' value={resposta.email} />
					<div>
						<label htmlFor='codigo' className='mb-1.5 block text-sm font-medium text-gray-700'>
							Código de 6 dígitos
						</label>
						<input
							id='codigo'
							name='codigo'
							inputMode='numeric'
							autoComplete='one-time-code'
							pattern='[0-9 ]{6,7}'
							maxLength={7}
							required
							placeholder='000000'
							className='w-full rounded-xl border border-gray-200 bg-quattor-fundo px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.5em] text-quattor-azul-escuro placeholder-gray-300 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-quattor-azul'
						/>
					</div>
					<CampoSenha
						id='senha'
						rotulo={`Nova senha (mínimo ${minimoSenha} caracteres)`}
						icone={Lock}
						autoComplete='new-password'
						minLength={minimoSenha}
						required
					/>
					<CampoSenha
						id='confirmacao'
						rotulo='Repita a nova senha'
						icone={Lock}
						autoComplete='new-password'
						minLength={minimoSenha}
						required
					/>
					<button type='submit' name='intent' value='definir' disabled={enviando} className={`${CLASSE_BOTAO_PRINCIPAL} mt-2`}>
						{enviando ? "Salvando..." : "Salvar senha e entrar"}
					</button>
				</Form>

				<Form method='post' className='mt-5 text-center'>
					<input type='hidden' name='email' value={resposta.email} />
					<button
						type='submit'
						name='intent'
						value='pedir'
						disabled={enviando}
						className='inline-flex items-center gap-1 text-sm font-semibold text-quattor-azul hover:underline'>
						<RotateCw className='h-4 w-4' />
						Não recebeu? Enviar outro código
					</button>
				</Form>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			titulo='Criar ou trocar senha'
			subtitulo='Digite o e-mail do seu cadastro. Vamos mandar um código para você criar a senha.'
			chamada='Primeiro acesso? Leva menos de um minuto.'>
			{resposta?.etapa === "email" && <Aviso tipo='erro'>{resposta.erro}</Aviso>}
			<Form method='post' className='space-y-4'>
				<Campo id='email' rotulo='E-mail' icone={Mail} type='email' autoComplete='email' required placeholder='seu@email.com' />
				<button type='submit' name='intent' value='pedir' disabled={enviando} className={`${CLASSE_BOTAO_PRINCIPAL} mt-2`}>
					{enviando ? "Enviando..." : "Enviar código"}
					{!enviando && <Send className='h-4 w-4' />}
				</button>
			</Form>
			<p className='mt-8 text-center text-sm text-gray-500'>
				Já tem senha?{" "}
				<Link to='/login' className='font-semibold text-quattor-azul hover:underline'>
					Entrar
				</Link>
			</p>
		</AuthLayout>
	);
}

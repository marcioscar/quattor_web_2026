import { redirect } from "react-router";
import { createEscolhaCookie, createSessionCookie } from "~/session.server";
import { alunosDoEmail, alunosLiberados, type AlunoDoEmail } from "./alunos.server";
import { conferirSegredo, hashSegredo } from "./regras";

export type FalhaLogin = { ok: false; error: "NOT_FOUND" | "INACTIVE" };

/**
 * Hash qualquer para conferir quando o e-mail não tem senha: assim a resposta
 * demora o mesmo com ou sem aluno, e o tempo não revela quem é aluno.
 */
const HASH_FALSO = hashSegredo("senha-inexistente");

/** Alunos do e-mail se a senha confere; null se não. */
export async function autenticar(emailNormalizado: string, senha: string): Promise<AlunoDoEmail[] | null> {
	const alunos = await alunosDoEmail(emailNormalizado);
	const comSenha = alunos.filter((a) => a.senhaHash);
	if (comSenha.length === 0) {
		conferirSegredo(senha, HASH_FALSO);
		return null;
	}
	// Normalmente todos têm o mesmo hash (uma senha por e-mail); confere
	// cada hash distinto para o caso de alguém ter gravado diferente.
	const hashes = [...new Set(comSenha.map((a) => a.senhaHash as string))];
	return hashes.some((h) => conferirSegredo(senha, h)) ? alunos : null;
}

/**
 * Depois da senha (ou do código) conferida: só entra quem tem matrícula
 * vigente. Um aluno → sessão; vários (família) → tela de escolha.
 * Devolve o redirect para a rota lançar, ou a falha para mostrar.
 */
export async function concluirLogin(alunos: AlunoDoEmail[]): Promise<Response | FalhaLogin> {
	const liberados = await alunosLiberados(alunos);
	if (liberados.length === 0) return { ok: false, error: "INACTIVE" };

	if (liberados.length === 1) {
		const registration = String(liberados[0].idMembro);
		return redirect(`/aluno/${registration}`, {
			headers: { "Set-Cookie": createSessionCookie(registration) },
		});
	}

	return redirect("/login/escolher", {
		headers: { "Set-Cookie": createEscolhaCookie(liberados.map((a) => a.idMembro as number)) },
	});
}

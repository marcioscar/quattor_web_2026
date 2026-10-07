import nodemailer from "nodemailer";
import { CODIGO_VALIDADE_MS } from "./regras";

function transporte() {
	return nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT ?? 587),
		secure: process.env.SMTP_SECURE === "true",
		auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
	});
}

/** Manda o código de acesso. O código só vai no e-mail — nunca em log. */
export async function enviarCodigoAcesso(para: string, codigo: string): Promise<void> {
	const minutos = CODIGO_VALIDADE_MS / 60000;
	await transporte().sendMail({
		from: `Quattor Academia <${process.env.SMTP_USER}>`,
		to: para,
		subject: `Seu código de acesso: ${codigo}`,
		text:
			`Seu código para criar a senha da área do aluno é: ${codigo}\n\n` +
			`Ele vale por ${minutos} minutos e só pode ser usado uma vez.\n` +
			"Se não foi você quem pediu, ignore este e-mail.",
		html:
			`<p>Seu código para criar a senha da área do aluno é:</p>` +
			`<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p>` +
			`<p>Ele vale por ${minutos} minutos e só pode ser usado uma vez.</p>` +
			`<p style="color:#666">Se não foi você quem pediu, ignore este e-mail.</p>`,
	});
}

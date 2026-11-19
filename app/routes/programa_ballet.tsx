import { redirect } from "react-router";

/**
 * O programa do espetáculo "O Mágico de Oz" (15/11/2026) saiu do ar depois da
 * apresentação. O endereço continua existindo porque está no QR code impresso:
 * quem escanear vai para a página inicial. O conteúdo está no histórico do git.
 */
export function loader() {
	return redirect("/", 301);
}

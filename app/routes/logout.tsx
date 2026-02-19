import { redirect } from "react-router";
import { destroySessionCookie } from "../session.server";

export async function loader() {
	throw redirect("/login", {
		headers: {
			"Set-Cookie": destroySessionCookie(),
		},
	});
}

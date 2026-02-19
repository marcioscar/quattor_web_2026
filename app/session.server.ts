const COOKIE_NAME = "quattor_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export function getSessionRegistration(request: Request): string | null {
	const cookieHeader = request.headers.get("Cookie");
	if (!cookieHeader) return null;

	const match = cookieHeader.match(
		new RegExp(`(?:^|;)\\s*${COOKIE_NAME}=([^;]*)`),
	);
	if (!match) return null;

	const value = decodeURIComponent(match[1].trim());
	return value || null;
}

export function createSessionCookie(registration: string): string {
	return `${COOKIE_NAME}=${encodeURIComponent(registration)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function destroySessionCookie(): string {
	return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

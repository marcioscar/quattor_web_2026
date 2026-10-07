import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useRouteLoaderData } from "react-router";
import { CalendarDays, Dumbbell, House, LayoutDashboard, LogIn, LogOut, type LucideIcon } from "lucide-react";

const AVATAR_GENERICO =
	"data:image/svg+xml;utf8," +
	"<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>" +
	"<rect width='100%25' height='100%25' fill='%23e5e7eb'/>" +
	"<circle cx='20' cy='16' r='8' fill='%239ca3af'/>" +
	"<ellipse cx='20' cy='36' rx='12' ry='8' fill='%239ca3af'/>" +
	"</svg>";

type Usuario = { name: string; photo: string; registration: string };
type Item = { to: string; rotulo: string; rotuloCurto: string; icone: LucideIcon; end?: boolean };

function primeiroNome(nome: string): string {
	const p = nome.trim().split(/\s+/)[0] ?? "";
	return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

function itensDo(user: Usuario | null): Item[] {
	const inicio: Item = { to: "/", rotulo: "Início", rotuloCurto: "Início", icone: House, end: true };
	if (!user) return [inicio];
	const r = user.registration;
	return [
		inicio,
		{ to: `/aluno/${r}`, rotulo: "Meu painel", rotuloCurto: "Painel", icone: LayoutDashboard },
		{ to: `/treinos/${r}`, rotulo: "Treinar", rotuloCurto: "Treinar", icone: Dumbbell },
		{ to: `/historico/${r}`, rotulo: "Histórico", rotuloCurto: "Histórico", icone: CalendarDays },
	];
}

function Avatar({ user, tamanho }: { user: Usuario; tamanho: string }) {
	return (
		<img
			src={user.photo || AVATAR_GENERICO}
			alt=''
			className={`${tamanho} rounded-full object-cover ring-2 ring-white`}
			onError={(e) => {
				e.currentTarget.src = AVATAR_GENERICO;
			}}
		/>
	);
}

/**
 * Barra do topo (fixa, translúcida) e, no celular, para o aluno logado, uma
 * barra de abas embaixo — Início / Painel / Treinar / Histórico ao alcance
 * do polegar no meio do treino.
 */
export default function MainNavbar() {
	const data = useRouteLoaderData("root") as { user: Usuario | null } | undefined;
	const user = data?.user ?? null;
	const itens = itensDo(user);
	const location = useLocation();
	const [menuAberto, setMenuAberto] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Fecha o menu do avatar ao navegar, ao tocar fora dele e com Esc.
	useEffect(() => setMenuAberto(false), [location.pathname]);
	useEffect(() => {
		if (!menuAberto) return;
		const fechar = (e: PointerEvent) => {
			if (!menuRef.current?.contains(e.target as Node)) setMenuAberto(false);
		};
		const fecharComEsc = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
		document.addEventListener("pointerdown", fechar);
		document.addEventListener("keydown", fecharComEsc);
		return () => {
			document.removeEventListener("pointerdown", fechar);
			document.removeEventListener("keydown", fecharComEsc);
		};
	}, [menuAberto]);

	// A barra de abas fica por cima do fim da página: reserva o espaço dela.
	useEffect(() => {
		if (!user) return;
		document.body.classList.add("com-abas");
		return () => document.body.classList.remove("com-abas");
	}, [user]);

	return (
		<>
			<header className='sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-md'>
				<div className='mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4'>
					<Link to='/' className='shrink-0' aria-label='Quattor Academia — início'>
						<img src='/logos_quattor.svg' alt='Quattor Academia' className='h-8 w-auto' />
					</Link>

					{/* Links — só no desktop; no celular quem navega é a barra de abas */}
					<nav aria-label='Principal' className='hidden md:block'>
						<ul className='flex items-center gap-1'>
							{itens.map((item) => (
								<li key={item.to}>
									<NavLink
										to={item.to}
										end={item.end}
										className={({ isActive }) =>
											`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
												isActive
													? "bg-quattor-azul-escuro text-white"
													: "text-gray-600 hover:bg-quattor-fundo hover:text-quattor-azul-escuro"
											}`
										}>
										<item.icone className='h-4 w-4' />
										{item.rotulo}
									</NavLink>
								</li>
							))}
						</ul>
					</nav>

					{user ? (
						<div ref={menuRef} className='relative'>
							<button
								type='button'
								onClick={() => setMenuAberto((a) => !a)}
								aria-expanded={menuAberto}
								aria-haspopup='menu'
								className='flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-quattor-fundo md:pr-3'>
								<Avatar user={user} tamanho='h-9 w-9' />
								<span className='hidden text-sm font-semibold text-quattor-azul-escuro md:inline'>
									{primeiroNome(user.name)}
								</span>
							</button>
							{menuAberto && (
								<div
									role='menu'
									className='absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-white p-2 shadow-xl ring-1 ring-gray-100'>
									<div className='flex items-center gap-3 px-2 py-2'>
										<Avatar user={user} tamanho='h-10 w-10' />
										<div className='min-w-0'>
											<p className='truncate text-sm font-semibold text-quattor-azul-escuro'>
												{primeiroNome(user.name)}
											</p>
											<p className='text-xs text-gray-500'>Matrícula {user.registration}</p>
										</div>
									</div>
									<div className='my-1 h-px bg-gray-100' />
									<Link
										to='/logout'
										role='menuitem'
										className='flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-quattor-vermelho hover:bg-quattor-vermelho/5'>
										<LogOut className='h-4 w-4' />
										Sair
									</Link>
								</div>
							)}
						</div>
					) : (
						<Link
							to='/login'
							className='inline-flex items-center gap-2 rounded-xl bg-quattor-laranja px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-105'>
							<LogIn className='h-4 w-4' />
							<span className='hidden sm:inline'>Área do aluno</span>
							<span className='sm:hidden'>Entrar</span>
						</Link>
					)}
				</div>
			</header>

			{/* Barra de abas — celular, aluno logado */}
			{user && (
				<nav
					aria-label='Navegação do aluno'
					className='fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden'>
					<ul className='grid grid-cols-4'>
						{itens.map((item) => (
							<li key={item.to}>
								<NavLink
									to={item.to}
									end={item.end}
									className={({ isActive }) =>
										`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition ${
											isActive ? "text-quattor-azul-escuro" : "text-gray-400"
										}`
									}>
									{({ isActive }) => (
										<>
											<span
												className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
													isActive ? "bg-quattor-laranja/15" : ""
												}`}>
												<item.icone className={`h-5 w-5 ${isActive ? "text-quattor-laranja" : ""}`} />
											</span>
											{item.rotuloCurto}
										</>
									)}
								</NavLink>
							</li>
						))}
					</ul>
				</nav>
			)}
		</>
	);
}

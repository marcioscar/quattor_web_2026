import { useState } from "react";
import { Link, useRouteLoaderData } from "react-router";
import { TbLogout } from "react-icons/tb";

const AVATAR_GENERICO =
	"data:image/svg+xml;utf8," +
	"<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>" +
	"<rect width='100%25' height='100%25' fill='%23e5e7eb'/>" +
	"<circle cx='20' cy='16' r='8' fill='%239ca3af'/>" +
	"<ellipse cx='20' cy='36' rx='12' ry='8' fill='%239ca3af'/>" +
	"</svg>";

export default function MainNavbar() {
	const [menuAberto, setMenuAberto] = useState(false);
	const data = useRouteLoaderData("root") as
		| { user: { name: string; photo: string; registration: string } | null }
		| undefined;
	const user = data?.user ?? null;

	return (
		<>
			<nav className='fixed top-0 mt-1.5 left-0 right-0 z-30 bg-white w-full px-4 md:px-6 lg:px-8 backdrop-blur'>
				<div className='w-full'>
					<div className='flex flex-wrap items-center justify-between py-2'>
						<Link to='/' className='flex items-center gap-2'>
							<img
								src='/logos_quattor.svg'
								alt='Quattor Academia'
								className='h-8 w-auto'
							/>
						</Link>
						<div className='flex md:hidden md:order-2'>
							<button
								data-collapse-toggle='mobile-menu-3'
								type='button'
								className='md:hidden text-gray-400 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg inline-flex items-center justify-center'
								aria-controls='mobile-menu-3'
								aria-expanded={menuAberto}
								onClick={() => setMenuAberto((aberto) => !aberto)}>
								<span className='sr-only'>Open main menu</span>
								<svg
									className={`w-6 h-6 ${menuAberto ? "hidden" : ""}`}
									fill='currentColor'
									viewBox='0 0 20 20'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										fillRule='evenodd'
										d='M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
										clipRule='evenodd'></path>
								</svg>
								<svg
									className={`w-6 h-6 ${menuAberto ? "" : "hidden"}`}
									fill='currentColor'
									viewBox='0 0 20 20'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										fillRule='evenodd'
										d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
										clipRule='evenodd'></path>
								</svg>
							</button>
						</div>
						<div
							className={`${menuAberto ? "flex" : "hidden"} md:flex justify-between items-end w-full md:w-auto md:order-1`}
							id='mobile-menu-3'>
							<ul className='flex-col md:flex-row flex md:space-x-8 mt-4 md:mt-0 md:text-sm md:font-medium items-center'>
								<li>
									<Link
										to='/'
										className='bg-blue-700 md:bg-transparent text-white block pl-3 pr-4 py-2 md:text-blue-700 md:p-0 rounded'
										aria-current='page'>
										Home
									</Link>
								</li>
								<li>
									<Link
										to='/login'
										className='text-gray-700 hover:bg-gray-50 border-b border-gray-100 md:hover:bg-transparent md:border-0 block pl-3 pr-4 py-2 md:hover:text-blue-700 md:p-0'>
										Aluno
									</Link>
								</li>

								{user && (
									<li className='flex items-center gap-2 pl-3 pr-4 py-2 md:pl-0 md:pr-0 md:py-0 ml-auto'>
										<Link
											to={`/aluno/${user.registration}`}
											className='flex items-center gap-2 hover:opacity-80'>
											<img
												src={user.photo || AVATAR_GENERICO}
												alt={user.name}
												className='w-8 h-8 rounded-full object-cover'
												onError={(e) => {
													e.currentTarget.src = AVATAR_GENERICO;
												}}
											/>
											<span className='text-gray-700 md:hover:text-blue-700 hidden sm:inline max-w-[120px] truncate'>
												{user.name}
											</span>
										</Link>
										<Link
											to='/logout'
											className='px-3 py-1.5 rounded-lg text-sm  font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700'>
											<TbLogout className='w-5 h-5 mr-2' />
										</Link>
									</li>
								)}
							</ul>
						</div>
					</div>
				</div>
			</nav>
			<div className='h-14' />
		</>
	);
}

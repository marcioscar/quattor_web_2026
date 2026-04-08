"use client";

import { useEffect, useState } from "react";
import { useSubmit } from "react-router";
import { ChevronsUpDown } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import { Label } from "~/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import {
	GRUPOS_MUSCULARES,
	type GrupoMuscular,
} from "~/constants/gruposMusculares";

type TreinosGrupoFormProps = {
	registration: number;
	grupoInicial: GrupoMuscular;
};

export function TreinosGrupoForm({
	registration,
	grupoInicial,
}: TreinosGrupoFormProps) {
	const submit = useSubmit();
	const [grupo, setGrupo] = useState(grupoInicial);
	const [comboAberto, setComboAberto] = useState(false);

	useEffect(() => {
		setGrupo(grupoInicial);
	}, [grupoInicial]);

	function aoEscolherGrupo(g: GrupoMuscular) {
		setComboAberto(false);
		if (g === grupo) return;
		setGrupo(g);
		submit({ grupo: g }, { method: "get", action: `/treinos/${registration}` });
	}

	return (
		<Card>
			<CardContent className='flex flex-col gap-4'>
				<div className='flex flex-col gap-1.5'>
					<Label htmlFor='treinos-grupo'>Grupo</Label>
					<Popover open={comboAberto} onOpenChange={setComboAberto}>
						<PopoverTrigger
							type='button'
							id='treinos-grupo'
							role='combobox'
							aria-expanded={comboAberto}
							className={cn(
								buttonVariants({ variant: "outline" }),
								"h-auto min-h-8 w-full justify-between font-normal",
							)}>
							<span className='truncate text-left'>{grupo}</span>
							<ChevronsUpDown />
						</PopoverTrigger>
						<PopoverContent
							align='start'
							className='w-[min(100vw-2rem,28rem)] p-0'>
							<Command>
								<CommandInput placeholder='Buscar grupo...' />
								<CommandList>
									<CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
									<CommandGroup>
										{GRUPOS_MUSCULARES.map((g) => (
											<CommandItem
												key={g}
												value={g}
												onSelect={() => aoEscolherGrupo(g)}>
												{g}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
			</CardContent>
		</Card>
	);
}

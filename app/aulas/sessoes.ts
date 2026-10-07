// CÓPIA de recepcao/apps/web/app/features/aulas/sessoes.ts (07/10/2026) —
// mesmo motor de grade do recepção, para a home mostrar exatamente as aulas
// que a recepção vê. Mudou lá? Copie de novo; não edite só aqui.

/**
 * Motor de grade — responde "quais aulas acontecem entre o dia X e o dia Y".
 *
 * Desenho: sessão híbrida. A agenda é CALCULADA a partir da regra semanal
 * (`Turma`), e uma sessão só vira documento no banco (`AulaSessao`) quando
 * alguém escreve nela — abre a chamada, cancela a aula, troca o professor do
 * dia. Não existe cron gerando sessões: o modo de falha de um cron seria a
 * agenda do professor amanhecer vazia numa segunda, sem ninguém perceber.
 *
 * Precedência: sessão gravada > feriado > regra semanal. Um feriado pode ser
 * restrito a modalidades (`atingeTodas: false`) e pode cancelar só parte do dia
 * (`cancelaAPartirDe`): a academia funciona de manhã em feriado, então a turma
 * das 10h acontece e a das 18h cai.
 *
 * Módulo puro — sem Prisma, sem React. Toda a regra mora aqui, coberta por
 * `sessoes.test.ts`; a camada `.server.ts` só busca dados e delega.
 *
 * FUSO: dia é sempre a string "YYYY-MM-DD" no horário de Brasília. A aritmética
 * de datas aqui é feita em UTC de propósito — `Date.UTC(...)` mais passo de 24h
 * é exato porque UTC não tem horário de verão, e `getUTCDay()` devolve o dia da
 * semana do dia certo. O que não se pode fazer é `new Date("2026-09-07")`: isso
 * é meia-noite UTC, ou seja, 21:00 do dia 6 em Brasília, e o dia da semana sai
 * errado. Nenhuma função deste arquivo usa o fuso do processo.
 */

export interface RegraTurma {
  id: string;
  nome: string;
  diaSemana: number; // 0=domingo ... 6=sábado
  horaInicio: string; // "18:00"
  horaFim: string;
  professorId: string | null;
  professorNome: string | null;
  capacidade: number | null;
  ativo: boolean;
  /** Modalidade da turma. É por ele que o feriado restrito escolhe quem cancela. */
  centroReceitaId: string | null;
  vigenciaInicio: string | null; // "YYYY-MM-DD" — antes disso a turma não existia
  vigenciaFim: string | null; // depois disso, idem
}

/**
 * O que foi de fato gravado para um dia. É SNAPSHOT: hora, professor e
 * capacidade valem contra a `Turma` atual, que pode ter mudado depois.
 * Não existe model separado de exceção — uma sessão cancelada É "não teve
 * aula", com outro professor É "substituição", com outra hora É "foi mais cedo".
 */
export interface SessaoGravada {
  id: string;
  turmaId: string;
  dia: string;
  horaInicio: string;
  horaFim: string;
  professorId: string | null;
  professorNome: string | null;
  capacidade: number | null;
  status: "realizada" | "cancelada";
  motivoCancelamento: string | null;
  substituicao: boolean;
  chamadaFeitaEm: Date | null;
}

export interface FeriadoDia {
  dia: string;
  nome: string;
  tipo: string;
  /** `false` = só as turmas cujo centro de receita está em `centroReceitaIds`. */
  atingeTodas: boolean;
  centroReceitaIds: string[];
  /**
   * `null` = cancela o dia inteiro (é o caso do recesso). `"12:00"` = cancela
   * só as aulas que COMEÇAM a partir das 12h — a academia abre de manhã em
   * feriado. Comparação lexicográfica de "HH:MM" zero-padded ordena como hora.
   */
  cancelaAPartirDe: string | null;
}

export interface Ocorrencia {
  turmaId: string;
  turmaNome: string;
  dia: string;
  horaInicio: string;
  horaFim: string;
  professorId: string | null;
  professorNome: string | null;
  capacidade: number | null;
  /** Modalidade da turma, copiada da regra — usada pelo feriado restrito. */
  centroReceitaId: string | null;
  sessaoId: string | null;
  status: "prevista" | "realizada" | "cancelada";
  chamadaFeita: boolean;
  substituicao: boolean;
  /**
   * Informativo: vem preenchido sempre que o dia é feriado, INCLUSIVE quando a
   * aula aconteceu assim mesmo (sessão gravada vence o feriado). Quem consome
   * decide "teve aula?" por `status`, nunca por este campo.
   */
  feriadoNome: string | null;
  motivoCancelamento: string | null;
}

const DIA_MS = 24 * 60 * 60 * 1000;
const RE_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Timestamp UTC da meia-noite de "YYYY-MM-DD", ou null se a data não existe. */
function marcoUtc(dia: string): number | null {
  const partes = RE_DIA.exec(dia);
  if (!partes) return null;
  const ts = Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  if (Number.isNaN(ts)) return null;
  // Rejeita data impossível: "2026-02-31" viraria 2026-03-03 no Date.UTC.
  return formatarDia(ts) === dia ? ts : null;
}

function formatarDia(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** 0=domingo ... 6=sábado. -1 quando o dia é inválido. */
function diaSemanaDe(dia: string): number {
  const ts = marcoUtc(dia);
  return ts === null ? -1 : new Date(ts).getUTCDay();
}

/**
 * Todos os dias de `deDia` até `ateDia`, inclusive nas duas pontas.
 * Intervalo invertido ou data inválida devolve `[]` — nunca laço infinito.
 */
export function diasDoIntervalo(deDia: string, ateDia: string): string[] {
  const de = marcoUtc(deDia);
  const ate = marcoUtc(ateDia);
  if (de === null || ate === null || ate < de) return [];

  const dias: string[] = [];
  for (let ts = de; ts <= ate; ts += DIA_MS) {
    dias.push(formatarDia(ts));
  }
  return dias;
}

/** Comparação lexicográfica basta: "YYYY-MM-DD" ordena como data. */
function dentroDaVigencia(turma: RegraTurma, dia: string): boolean {
  if (turma.vigenciaInicio && dia < turma.vigenciaInicio) return false;
  if (turma.vigenciaFim && dia > turma.vigenciaFim) return false;
  return true;
}

/**
 * A agenda que a regra semanal prevê, sem nenhuma exceção aplicada.
 * A turma só entra se está ativa e o dia cai dentro da vigência — é a vigência
 * que permite mudar o horário de uma turma sem reescrever o passado.
 */
export function ocorrenciasNoIntervalo(
  turmas: RegraTurma[],
  deDia: string,
  ateDia: string,
): Ocorrencia[] {
  const previstas: Ocorrencia[] = [];

  for (const dia of diasDoIntervalo(deDia, ateDia)) {
    const diaSemana = diaSemanaDe(dia);
    for (const turma of turmas) {
      if (!turma.ativo) continue;
      if (turma.diaSemana !== diaSemana) continue;
      if (!dentroDaVigencia(turma, dia)) continue;
      previstas.push(previstaDaTurma(turma, dia));
    }
  }

  return ordenar(previstas);
}

function previstaDaTurma(turma: RegraTurma, dia: string): Ocorrencia {
  return {
    turmaId: turma.id,
    turmaNome: turma.nome,
    dia,
    horaInicio: turma.horaInicio,
    horaFim: turma.horaFim,
    professorId: turma.professorId,
    professorNome: turma.professorNome,
    capacidade: turma.capacidade,
    centroReceitaId: turma.centroReceitaId,
    sessaoId: null,
    status: "prevista",
    chamadaFeita: false,
    substituicao: false,
    feriadoNome: null,
    motivoCancelamento: null,
  };
}

function chave(turmaId: string, dia: string): string {
  return `${turmaId}|${dia}`;
}

/**
 * Aplica sessões gravadas e feriados sobre as previstas.
 *
 * `turmas` é opcional e serve só para dar nome a sessão órfã — sessão gravada
 * de turma que hoje está inativa ou fora da vigência, e que por isso não gerou
 * prevista. Chamada já feita nunca some da agenda, então a camada `.server.ts`
 * deve passar aqui as turmas referenciadas pelas sessões do período, inclusive
 * as inativas. Sessão órfã sem turma conhecida é ignorada (não há de onde tirar
 * o nome).
 */
export function resolverOcorrencias(
  previstas: Ocorrencia[],
  sessoes: SessaoGravada[],
  feriados: FeriadoDia[],
  turmas: RegraTurma[] = [],
): Ocorrencia[] {
  const feriadosPorDia = new Map<string, FeriadoDia[]>();
  for (const feriado of feriados) {
    const doDia = feriadosPorDia.get(feriado.dia);
    if (doDia) doDia.push(feriado);
    else feriadosPorDia.set(feriado.dia, [feriado]);
  }

  const sessoesPorChave = new Map<string, SessaoGravada>();
  for (const sessao of sessoes) {
    sessoesPorChave.set(chave(sessao.turmaId, sessao.dia), sessao);
  }

  const nomePorTurma = new Map<string, string>();
  const centroPorTurma = new Map<string, string | null>();
  for (const turma of turmas) {
    nomePorTurma.set(turma.id, turma.nome);
    centroPorTurma.set(turma.id, turma.centroReceitaId);
  }
  for (const prevista of previstas) nomePorTurma.set(prevista.turmaId, prevista.turmaNome);

  const usadas = new Set<string>();
  const resolvidas: Ocorrencia[] = [];

  for (const prevista of previstas) {
    const chaveOcorrencia = chave(prevista.turmaId, prevista.dia);
    const sessao = sessoesPorChave.get(chaveOcorrencia);
    if (sessao) usadas.add(chaveOcorrencia);
    const feriado = feriadoDoDia(feriadosPorDia, prevista.dia, prevista.centroReceitaId);
    resolvidas.push(aplicar(prevista, sessao, feriado));
  }

  // Sessões órfãs: a regra semanal não prevê mais esse dia, mas alguém já
  // escreveu na aula. O snapshot vence — o registro fica.
  for (const sessao of sessoes) {
    const chaveOcorrencia = chave(sessao.turmaId, sessao.dia);
    if (usadas.has(chaveOcorrencia)) continue;
    const turmaNome = nomePorTurma.get(sessao.turmaId);
    if (turmaNome === undefined) continue;
    const centroReceitaId = centroPorTurma.get(sessao.turmaId) ?? null;
    const base = previstaOrfa(sessao.turmaId, turmaNome, sessao.dia, centroReceitaId);
    const feriado = feriadoDoDia(feriadosPorDia, sessao.dia, centroReceitaId);
    resolvidas.push(aplicar(base, sessao, feriado));
  }

  return ordenar(resolvidas);
}

/** Base de uma órfã: só id, nome e dia — todo o resto vem do snapshot em `aplicar`. */
function previstaOrfa(
  turmaId: string,
  turmaNome: string,
  dia: string,
  centroReceitaId: string | null,
): Ocorrencia {
  return {
    turmaId,
    turmaNome,
    dia,
    horaInicio: "",
    horaFim: "",
    professorId: null,
    professorNome: null,
    capacidade: null,
    centroReceitaId,
    sessaoId: null,
    status: "prevista",
    chamadaFeita: false,
    substituicao: false,
    feriadoNome: null,
    motivoCancelamento: null,
  };
}

/**
 * O feriado do dia que atinge ESTA turma, ou `undefined`.
 *
 * Feriado restrito (`atingeTodas: false`) só atinge quem ele nomeia — turma sem
 * modalidade (`centroReceitaId: null`) fica de fora, que é o padrão seguro:
 * cancelar aula por omissão de cadastro seria pior que deixar passar.
 */
function feriadoDoDia(
  feriadosPorDia: Map<string, FeriadoDia[]>,
  dia: string,
  centroReceitaId: string | null,
): FeriadoDia | undefined {
  const doDia = feriadosPorDia.get(dia);
  if (!doDia) return undefined;
  return doDia.find(
    (feriado) =>
      feriado.atingeTodas ||
      (centroReceitaId !== null && feriado.centroReceitaIds.includes(centroReceitaId)),
  );
}

function aplicar(
  prevista: Ocorrencia,
  sessao: SessaoGravada | undefined,
  feriado: FeriadoDia | undefined,
): Ocorrencia {
  // Sessão gravada vence tudo, inclusive feriado: se a aula aconteceu no dia 7
  // de setembro e a chamada foi feita, o registro fica.
  if (sessao) {
    return {
      ...prevista,
      horaInicio: sessao.horaInicio,
      horaFim: sessao.horaFim,
      professorId: sessao.professorId,
      professorNome: sessao.professorNome,
      capacidade: sessao.capacidade,
      sessaoId: sessao.id,
      status: sessao.status,
      chamadaFeita: sessao.chamadaFeitaEm != null,
      substituicao: sessao.substituicao,
      motivoCancelamento: sessao.motivoCancelamento,
      feriadoNome: feriado ? feriado.nome : null,
    };
  }

  if (feriado) {
    // Feriado de dia inteiro derruba tudo; com `cancelaAPartirDe`, só as aulas
    // que começam a partir da hora de corte. A aula que sobrevive continua
    // marcada com `feriadoNome` — o campo é informativo, não é o "teve aula?".
    const cancela =
      feriado.cancelaAPartirDe === null || prevista.horaInicio >= feriado.cancelaAPartirDe;
    return {
      ...prevista,
      status: cancela ? "cancelada" : prevista.status,
      feriadoNome: feriado.nome,
    };
  }

  return prevista;
}

function ordenar(ocorrencias: Ocorrencia[]): Ocorrencia[] {
  return [...ocorrencias].sort((a, b) => {
    if (a.dia !== b.dia) return a.dia < b.dia ? -1 : 1;
    const hora = a.horaInicio.localeCompare(b.horaInicio);
    if (hora !== 0) return hora;
    return a.turmaNome.localeCompare(b.turmaNome, "pt-BR", { sensitivity: "base" });
  });
}

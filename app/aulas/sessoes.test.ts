import { describe, expect, it } from "vitest";
import {
  diasDoIntervalo,
  ocorrenciasNoIntervalo,
  resolverOcorrencias,
  type FeriadoDia,
  type Ocorrencia,
  type RegraTurma,
  type SessaoGravada,
} from "./sessoes";

// 2026-08-31 é segunda-feira; 2026-09-07 (Independência) também.

function turma(over: Partial<RegraTurma> & { id: string; diaSemana: number }): RegraTurma {
  return {
    nome: "Judô Infantil",
    horaInicio: "18:00",
    horaFim: "19:00",
    professorId: "prof-1",
    professorNome: "Marcio",
    capacidade: 20,
    ativo: true,
    centroReceitaId: null,
    vigenciaInicio: null,
    vigenciaFim: null,
    ...over,
  };
}

function sessao(over: Partial<SessaoGravada> & { turmaId: string; dia: string }): SessaoGravada {
  return {
    id: `s-${over.turmaId}-${over.dia}`,
    horaInicio: "18:00",
    horaFim: "19:00",
    professorId: "prof-1",
    professorNome: "Marcio",
    capacidade: 20,
    status: "realizada",
    motivoCancelamento: null,
    substituicao: false,
    chamadaFeitaEm: null,
    ...over,
  };
}

function feriado(dia: string, nome: string, over: Partial<FeriadoDia> = {}): FeriadoDia {
  return {
    dia,
    nome,
    tipo: "feriado",
    atingeTodas: true,
    centroReceitaIds: [],
    cancelaAPartirDe: null,
    ...over,
  };
}

/** Atalho: gera as previstas e já resolve, como fará a camada .server.ts. */
function agenda(
  turmas: RegraTurma[],
  deDia: string,
  ateDia: string,
  sessoes: SessaoGravada[] = [],
  feriados: FeriadoDia[] = [],
): Ocorrencia[] {
  return resolverOcorrencias(
    ocorrenciasNoIntervalo(turmas, deDia, ateDia),
    sessoes,
    feriados,
    turmas,
  );
}

describe("diasDoIntervalo", () => {
  it("inclui as duas pontas", () => {
    expect(diasDoIntervalo("2026-08-31", "2026-09-02")).toEqual([
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
  });

  it("intervalo de um dia só devolve esse dia", () => {
    expect(diasDoIntervalo("2026-09-07", "2026-09-07")).toEqual(["2026-09-07"]);
  });

  it("atravessa a virada do mês e a do ano", () => {
    const dias = diasDoIntervalo("2026-12-28", "2027-01-04");
    expect(dias).toHaveLength(8);
    expect(dias[3]).toBe("2026-12-31");
    expect(dias[4]).toBe("2027-01-01");
    expect(dias.at(-1)).toBe("2027-01-04");
  });

  it("ateDia anterior a deDia devolve vazio, sem laço infinito", () => {
    expect(diasDoIntervalo("2026-09-10", "2026-09-01")).toEqual([]);
  });

  it("data em formato inválido ou inexistente devolve vazio", () => {
    expect(diasDoIntervalo("31/08/2026", "2026-09-02")).toEqual([]);
    expect(diasDoIntervalo("2026-08-31", "")).toEqual([]);
    expect(diasDoIntervalo("2026-02-31", "2026-03-02")).toEqual([]);
  });
});

describe("ocorrenciasNoIntervalo", () => {
  it("semana normal: cada turma cai no seu dia da semana", () => {
    const turmas = [
      turma({ id: "t-seg", nome: "Judô", diaSemana: 1, horaInicio: "18:00" }),
      turma({ id: "t-qua", nome: "Muay Thai", diaSemana: 3, horaInicio: "19:00" }),
    ];

    const previstas = ocorrenciasNoIntervalo(turmas, "2026-08-31", "2026-09-06");

    expect(previstas.map((o) => [o.dia, o.turmaNome])).toEqual([
      ["2026-08-31", "Judô"],
      ["2026-09-02", "Muay Thai"],
    ]);
    expect(previstas[0].status).toBe("prevista");
    expect(previstas[0].sessaoId).toBeNull();
    expect(previstas[0].chamadaFeita).toBe(false);
    expect(previstas[0].professorNome).toBe("Marcio");
  });

  it("dia da semana não desliza na virada do mês e do ano", () => {
    const turmas = [
      turma({ id: "t-seg", nome: "Judô", diaSemana: 1 }),
      turma({ id: "t-qui", nome: "Boxe", diaSemana: 4, horaInicio: "20:00" }),
    ];

    const previstas = ocorrenciasNoIntervalo(turmas, "2026-12-28", "2027-01-04");

    expect(previstas.map((o) => `${o.dia} ${o.turmaNome}`)).toEqual([
      "2026-12-28 Judô",
      "2026-12-31 Boxe",
      "2027-01-04 Judô",
    ]);
  });

  it("turma fora da vigência não aparece", () => {
    const turmas = [
      turma({ id: "t-nova", nome: "Judô", diaSemana: 1, vigenciaInicio: "2026-09-01" }),
      turma({ id: "t-velha", nome: "Karatê", diaSemana: 1, vigenciaFim: "2026-08-30" }),
    ];

    const previstas = ocorrenciasNoIntervalo(turmas, "2026-08-31", "2026-09-07");

    expect(previstas.map((o) => `${o.dia} ${o.turmaNome}`)).toEqual(["2026-09-07 Judô"]);
  });

  it("turma inativa não aparece", () => {
    const turmas = [turma({ id: "t-off", diaSemana: 1, ativo: false })];
    expect(ocorrenciasNoIntervalo(turmas, "2026-08-31", "2026-09-06")).toEqual([]);
  });

  it("ordena por dia, depois hora, depois nome", () => {
    const turmas = [
      turma({ id: "t-c", nome: "Zumba", diaSemana: 1, horaInicio: "18:00" }),
      turma({ id: "t-a", nome: "Alongamento", diaSemana: 1, horaInicio: "18:00" }),
      turma({ id: "t-b", nome: "Boxe", diaSemana: 1, horaInicio: "07:00" }),
    ];

    const previstas = ocorrenciasNoIntervalo(turmas, "2026-08-31", "2026-08-31");

    expect(previstas.map((o) => o.turmaNome)).toEqual(["Boxe", "Alongamento", "Zumba"]);
  });
});

describe("resolverOcorrencias — feriado", () => {
  const turmas = [turma({ id: "t-seg", nome: "Judô", diaSemana: 1 })];

  it("feriado sem sessão gravada cancela a ocorrência", () => {
    const resolvidas = agenda(turmas, "2026-09-07", "2026-09-07", [], [
      feriado("2026-09-07", "Independência"),
    ]);

    expect(resolvidas).toHaveLength(1);
    expect(resolvidas[0].status).toBe("cancelada");
    expect(resolvidas[0].feriadoNome).toBe("Independência");
    expect(resolvidas[0].sessaoId).toBeNull();
  });

  it("feriado em dia sem turma não inventa ocorrência", () => {
    const resolvidas = agenda(turmas, "2026-09-08", "2026-09-08", [], [
      feriado("2026-09-08", "Padroeira"),
    ]);
    expect(resolvidas).toEqual([]);
  });

  it("sessão gravada vence o feriado: a aula aconteceu e o registro fica", () => {
    const resolvidas = agenda(
      turmas,
      "2026-09-07",
      "2026-09-07",
      [
        sessao({
          turmaId: "t-seg",
          dia: "2026-09-07",
          status: "realizada",
          chamadaFeitaEm: new Date("2026-09-07T21:05:00.000Z"),
        }),
      ],
      [feriado("2026-09-07", "Independência")],
    );

    expect(resolvidas[0].status).toBe("realizada");
    expect(resolvidas[0].chamadaFeita).toBe(true);
    expect(resolvidas[0].sessaoId).toBe("s-t-seg-2026-09-07");
    // Informativo: a aula aconteceu, mas o dia continua sendo feriado.
    expect(resolvidas[0].feriadoNome).toBe("Independência");
  });
});

describe("resolverOcorrencias — feriado restrito a modalidades", () => {
  const natacao = [turma({ id: "t-nat", nome: "Natação", diaSemana: 1, centroReceitaId: "c-nat" })];
  const judo = [turma({ id: "t-judo", nome: "Judô", diaSemana: 1, centroReceitaId: "c-judo" })];
  const semModalidade = [turma({ id: "t-solta", nome: "Funcional", diaSemana: 1 })];

  it("feriado global cancela turma de qualquer modalidade, e a sem modalidade também", () => {
    const resolvidas = agenda(
      [...natacao, ...judo, ...semModalidade],
      "2026-09-07",
      "2026-09-07",
      [],
      [feriado("2026-09-07", "Independência")],
    );

    expect(resolvidas).toHaveLength(3);
    expect(resolvidas.every((o) => o.status === "cancelada")).toBe(true);
  });

  it("feriado restrito cancela só a turma da modalidade nomeada", () => {
    const resolvidas = agenda(
      [...natacao, ...judo],
      "2026-09-07",
      "2026-09-07",
      [],
      [
        feriado("2026-09-07", "Manutenção da piscina", {
          tipo: "manutencao",
          atingeTodas: false,
          centroReceitaIds: ["c-nat"],
        }),
      ],
    );

    const porTurma = new Map(resolvidas.map((o) => [o.turmaId, o]));
    expect(porTurma.get("t-nat")).toMatchObject({
      status: "cancelada",
      feriadoNome: "Manutenção da piscina",
    });
    // A outra modalidade nem sabe que teve manutenção na piscina.
    expect(porTurma.get("t-judo")).toMatchObject({ status: "prevista", feriadoNome: null });
  });

  it("feriado restrito não atinge turma sem modalidade cadastrada", () => {
    const resolvidas = agenda(
      semModalidade,
      "2026-09-07",
      "2026-09-07",
      [],
      [
        feriado("2026-09-07", "Manutenção da piscina", {
          atingeTodas: false,
          centroReceitaIds: ["c-nat"],
        }),
      ],
    );

    expect(resolvidas[0]).toMatchObject({ status: "prevista", feriadoNome: null });
  });

  it("sessão órfã também é filtrada pela modalidade, que vem do parâmetro turmas", () => {
    // A turma saiu da grade (inativa), mas a sessão gravada fica. O feriado
    // restrito à natação não pode marcar a sessão de judô.
    const inativas = [
      turma({ id: "t-nat", nome: "Natação", diaSemana: 1, centroReceitaId: "c-nat", ativo: false }),
      turma({ id: "t-judo", nome: "Judô", diaSemana: 1, centroReceitaId: "c-judo", ativo: false }),
    ];
    const resolvidas = agenda(
      inativas,
      "2026-09-07",
      "2026-09-07",
      [
        sessao({ turmaId: "t-nat", dia: "2026-09-07" }),
        sessao({ turmaId: "t-judo", dia: "2026-09-07" }),
      ],
      [
        feriado("2026-09-07", "Manutenção da piscina", {
          atingeTodas: false,
          centroReceitaIds: ["c-nat"],
        }),
      ],
    );

    const porTurma = new Map(resolvidas.map((o) => [o.turmaId, o]));
    expect(porTurma.get("t-nat")?.feriadoNome).toBe("Manutenção da piscina");
    expect(porTurma.get("t-judo")?.feriadoNome).toBeNull();
  });
});

describe("resolverOcorrencias — feriado que cancela só parte do dia", () => {
  // A academia funciona até 12h em feriado: a aula da manhã acontece.
  const turmas = [
    turma({ id: "t-manha", nome: "Natação manhã", diaSemana: 1, horaInicio: "10:00", horaFim: "11:00" }),
    turma({ id: "t-meio", nome: "Funcional meio-dia", diaSemana: 1, horaInicio: "12:00", horaFim: "13:00" }),
    turma({ id: "t-noite", nome: "Judô noite", diaSemana: 1, horaInicio: "18:00", horaFim: "19:00" }),
  ];

  it("cancelaAPartirDe corta só as aulas que começam a partir da hora", () => {
    const resolvidas = agenda(turmas, "2026-09-07", "2026-09-07", [], [
      feriado("2026-09-07", "Independência", { cancelaAPartirDe: "12:00" }),
    ]);

    const porTurma = new Map(resolvidas.map((o) => [o.turmaId, o]));
    expect(porTurma.get("t-manha")?.status).toBe("prevista");
    expect(porTurma.get("t-meio")?.status).toBe("cancelada");
    expect(porTurma.get("t-noite")?.status).toBe("cancelada");
  });

  it("a aula que sobrevive ao feriado continua marcada com o nome do feriado", () => {
    const resolvidas = agenda(turmas, "2026-09-07", "2026-09-07", [], [
      feriado("2026-09-07", "Independência", { cancelaAPartirDe: "12:00" }),
    ]);

    expect(resolvidas.every((o) => o.feriadoNome === "Independência")).toBe(true);
  });

  it("recesso (cancelaAPartirDe nulo) derruba o dia inteiro, inclusive a manhã", () => {
    const resolvidas = agenda(turmas, "2026-09-07", "2026-09-07", [], [
      feriado("2026-09-07", "Recesso de fim de ano", { tipo: "recesso" }),
    ]);

    expect(resolvidas.every((o) => o.status === "cancelada")).toBe(true);
  });
});

describe("resolverOcorrencias — sessão gravada", () => {
  const turmas = [turma({ id: "t-seg", nome: "Judô", diaSemana: 1 })];

  it("snapshot vence a Turma atual em hora, professor e capacidade", () => {
    const resolvidas = agenda(turmas, "2026-08-31", "2026-08-31", [
      sessao({
        turmaId: "t-seg",
        dia: "2026-08-31",
        horaInicio: "17:00",
        horaFim: "18:00",
        professorId: "prof-2",
        professorNome: "Arthur",
        capacidade: 12,
        substituicao: true,
      }),
    ]);

    expect(resolvidas[0]).toMatchObject({
      horaInicio: "17:00",
      horaFim: "18:00",
      professorId: "prof-2",
      professorNome: "Arthur",
      capacidade: 12,
      substituicao: true,
      status: "realizada",
    });
  });

  it("sessão cancelada carrega o motivo", () => {
    const resolvidas = agenda(turmas, "2026-08-31", "2026-08-31", [
      sessao({
        turmaId: "t-seg",
        dia: "2026-08-31",
        status: "cancelada",
        motivoCancelamento: "Professor doente",
      }),
    ]);

    expect(resolvidas[0].status).toBe("cancelada");
    expect(resolvidas[0].motivoCancelamento).toBe("Professor doente");
    expect(resolvidas[0].feriadoNome).toBeNull();
  });

  it("chamadaFeita segue chamadaFeitaEm", () => {
    const comChamada = agenda(turmas, "2026-08-31", "2026-08-31", [
      sessao({ turmaId: "t-seg", dia: "2026-08-31", chamadaFeitaEm: new Date() }),
    ]);
    const semChamada = agenda(turmas, "2026-08-31", "2026-08-31", [
      sessao({ turmaId: "t-seg", dia: "2026-08-31", chamadaFeitaEm: null }),
    ]);

    expect(comChamada[0].chamadaFeita).toBe(true);
    expect(semChamada[0].chamadaFeita).toBe(false);
  });

  it("sessão de outro dia não vaza para a ocorrência prevista", () => {
    const resolvidas = agenda(turmas, "2026-08-31", "2026-09-07", [
      sessao({ turmaId: "t-seg", dia: "2026-09-07", professorNome: "Arthur" }),
    ]);

    expect(resolvidas.map((o) => [o.dia, o.status, o.professorNome])).toEqual([
      ["2026-08-31", "prevista", "Marcio"],
      ["2026-09-07", "realizada", "Arthur"],
    ]);
  });

  it("sessão gravada de turma hoje inativa continua na agenda", () => {
    const turmas = [turma({ id: "t-off", nome: "Karatê", diaSemana: 1, ativo: false })];

    const resolvidas = agenda(turmas, "2026-08-31", "2026-08-31", [
      sessao({ turmaId: "t-off", dia: "2026-08-31", chamadaFeitaEm: new Date() }),
    ]);

    expect(resolvidas).toHaveLength(1);
    expect(resolvidas[0]).toMatchObject({
      turmaNome: "Karatê",
      status: "realizada",
      chamadaFeita: true,
      horaInicio: "18:00",
    });
  });

  it("sessão gravada fora da vigência continua na agenda", () => {
    const turmas = [
      turma({ id: "t-velha", nome: "Judô", diaSemana: 1, vigenciaFim: "2026-08-30" }),
    ];

    const resolvidas = agenda(turmas, "2026-08-31", "2026-08-31", [
      sessao({ turmaId: "t-velha", dia: "2026-08-31" }),
    ]);

    expect(resolvidas.map((o) => o.turmaNome)).toEqual(["Judô"]);
  });

  it("sessão de turma desconhecida é ignorada", () => {
    const resolvidas = agenda(turmas, "2026-08-31", "2026-08-31", [
      sessao({ turmaId: "t-apagada", dia: "2026-08-31" }),
    ]);

    expect(resolvidas.map((o) => o.turmaId)).toEqual(["t-seg"]);
  });

  it("órfã entra na ordenação junto com as previstas", () => {
    const turmas = [
      turma({ id: "t-seg", nome: "Judô", diaSemana: 1, horaInicio: "18:00" }),
      turma({ id: "t-off", nome: "Boxe", diaSemana: 1, horaInicio: "07:00", ativo: false }),
    ];

    const resolvidas = agenda(turmas, "2026-08-31", "2026-08-31", [
      sessao({ turmaId: "t-off", dia: "2026-08-31", horaInicio: "07:00", horaFim: "08:00" }),
    ]);

    expect(resolvidas.map((o) => o.turmaNome)).toEqual(["Boxe", "Judô"]);
  });
});

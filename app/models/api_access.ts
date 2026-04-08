type AlunoResponse = {
    endDate: string;
    name: string;
    photo: string;
    plano: string;
    registration: number;
    status: string;
};

type RegistrarTreinoResponse = any;

const API_BASE_URL_ALUNO = "https://api.quattoracademia.com/alunos/";
const API_BASE_URL_EXERCICIOS = "https://api.quattoracademia.com/exercicio/";
const API_BASE_URL_HISTORICO = "https://api.quattoracademia.com/historico/";
const API_BASE_URL_REGISTRAR_TREINO = "https://api.quattoracademia.com/registrar/";
const API_BASE_URL_AUTENTICACAO = "https://api.quattoracademia.com/autenticar/";


function buildApiUrlAutenticacao(email: string, senha: string): string {
    return `${API_BASE_URL_AUTENTICACAO}?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`;
}



function buildApiUrlAluno(matricula: string): string {
    return `${API_BASE_URL_ALUNO}?matricula=${encodeURIComponent(matricula)}`;
}
function buildApiUrlHistorico(matricula: string): string {
    return `${API_BASE_URL_HISTORICO}?matricula=${encodeURIComponent(matricula)}`;
}

function buildApiUrlExercicios(semana: string, grupo: string): string {
    return `${API_BASE_URL_EXERCICIOS}?semana=${encodeURIComponent(semana)}&grupo=${encodeURIComponent(grupo)}`;
}

/** URL absoluta para mídia retornada como arquivo relativo (ex.: `producao.gif`). */
export function buildUrlMidiaExercicio(referencia: string): string {
    const t = referencia.trim();
    if (!t) return "";
    if (/^https?:\/\//i.test(t)) return t;
    const origin = `${new URL(API_BASE_URL_EXERCICIOS).origin}/`;
    return new URL(t.replace(/^\/+/, ""), origin).href;
}

function buildApiUrlRegistrarTreino(
    matricula: string,
    grupo: string,
    nome: string,
    carga: string
): string {
    return `${API_BASE_URL_REGISTRAR_TREINO}?matricula=${encodeURIComponent(matricula)}&grupo=${encodeURIComponent(grupo)}&nome=${encodeURIComponent(nome)}&carga=${encodeURIComponent(carga)}`;
}

function buildApiUrlRegistrarTreinoLegacy(
    matricula: string,
    grupo: string,
    nome: string
): string {
    return `${API_BASE_URL_REGISTRAR_TREINO}?matricula=${encodeURIComponent(matricula)}&grupo=${encodeURIComponent(grupo)}&nome=${encodeURIComponent(nome)}`;
}

async function postarRegistroTreino(url: string): Promise<RegistrarTreinoResponse> {
    const response = await fetch(url, {
        method: "POST",
    });

    const contentType = response.headers.get("content-type");
    let data: unknown;

    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();
        throw { type: "ERROR", message: text || "Resposta inválida da API" };
    }

    if (!response.ok) {
        const mensagem =
            typeof data === "object" &&
            data !== null &&
            "message" in data &&
            typeof (data as { message: unknown }).message === "string"
                ? (data as { message: string }).message
                : "Erro ao registrar treino";
        throw { type: "ERROR", message: mensagem };
    }

    return data as RegistrarTreinoResponse;
}


async function fetchAutenticacao(email: string, senha: string) {
    const url = buildApiUrlAutenticacao(email, senha);
    
    const response = await fetch(url, { method: "POST" });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw { type: "ERROR", message: data.message || "Erro ao autenticar" };
    }
    return data as AuthenticatorResponse;
}


async function fetchRegistrarTreino(
    matricula: string,
    grupo: string,
    nome: string,
    carga = ""
): Promise<RegistrarTreinoResponse | { message: string }> {
    const urlComCarga = buildApiUrlRegistrarTreino(matricula, grupo, nome, carga);
    try {
        return await postarRegistroTreino(urlComCarga);
    } catch (erroComCarga) {
        if (carga !== "") throw erroComCarga;
        const urlLegado = buildApiUrlRegistrarTreinoLegacy(matricula, grupo, nome);
        return await postarRegistroTreino(urlLegado);
    }
}

async function fetchAluno(
    matricula: string
): Promise<AlunoResponse | { message: string }> {
    const url = buildApiUrlAluno(matricula);
    const response = await fetch(url);

    if (response.status === 404) {
        throw { type: "NOT_FOUND" };
    }

    const data = await response.json();

    if (data.message && data.message.toLowerCase().includes("inativo")) {
        throw { type: "INACTIVE", message: data.message };
    }

    if (!response.ok) {
        throw { type: "NOT_FOUND" };
    }

    return data as AlunoResponse;
}


type HistoricoResponse = any;
async function fetchHistorico(matricula: string): Promise<HistoricoResponse | { message: string }> {
    const url = buildApiUrlHistorico(matricula);
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
        throw { type: "ERROR", message: data.message || "Erro ao buscar histórico" };
    }

    return data as HistoricoResponse;
}




type ExerciciosResponse = any;
async function fetchExercicios(
    semana: string,
    grupo: string
): Promise<ExerciciosResponse | { message: string }> {
    const url = buildApiUrlExercicios(semana, grupo);
    const response = await fetch(url);

    if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        throw { type: "NOT_FOUND", message: errorData.message || "Exercícios não encontrados" };
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { type: "ERROR", message: errorData.message || "Erro ao buscar exercícios" };
    }

    const data = await response.json();
    return data as ExerciciosResponse;
}
export const bd = {
    fetchAluno,
    fetchExercicios,
    fetchHistorico,
    fetchRegistrarTreino,
    fetchAutenticacao

};
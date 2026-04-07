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

function buildApiUrlRegistrarTreino(matricula: string, grupo: string, nome: string): string {
    return `${API_BASE_URL_REGISTRAR_TREINO}?matricula=${encodeURIComponent(matricula)}&grupo=${encodeURIComponent(grupo)}&nome=${encodeURIComponent(nome)}`;
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


async function fetchRegistrarTreino(matricula: string, grupo: string, nome: string): Promise<RegistrarTreinoResponse | { message: string }> {
    const url = buildApiUrlRegistrarTreino(matricula, grupo, nome);
    
    const response = await fetch(url, {
        method: "POST",
    });
    
    const contentType = response.headers.get("content-type");
    let data;
    
    if (contentType && contentType.includes("application/json")) {
        data = await response.json();
    } else {
        const text = await response.text();
        throw { type: "ERROR", message: "Resposta inválida da API" };
    }
    
    if (!response.ok) {
        throw { type: "ERROR", message: data.message || "Erro ao registrar treino" };
    }
    
    return data as RegistrarTreinoResponse;
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
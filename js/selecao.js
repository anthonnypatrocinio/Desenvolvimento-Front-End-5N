// selecao.js
// Responsabilidade única: derivar, a partir do estado, a lista de tarefas que
// deve aparecer na tela. Não lê nem escreve no DOM, não faz fetch, não muta
// estado.tarefas — apenas calcula uma visão (tarefasVisiveis = f(estado)).

const PESO_PRIORIDADE = { baixa: 1, media: 2, alta: 3 };

// Cada estratégia de ordenação é um comparador puro (a, b) => number.
// Mantidas num mapa para que trocar "ordenacao" no estado seja só uma troca de chave.
const COMPARADORES = {
    "prazo-asc": (a, b) => a.prazo.localeCompare(b.prazo),
    "prazo-desc": (a, b) => b.prazo.localeCompare(a.prazo),
    "prioridade-desc": (a, b) => PESO_PRIORIDADE[b.prioridade] - PESO_PRIORIDADE[a.prioridade],
    "titulo-asc": (a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"),
};

// Filtra por busca (título), status e prioridade — nessa ordem, mas o resultado
// não depende da ordem porque cada .filter() é independente dos outros.
function filtrarTarefas(estado) {
    const termo = estado.busca.trim().toLowerCase();

    return estado.tarefas
        .filter((tarefa) => tarefa.titulo.toLowerCase().includes(termo))
        .filter((tarefa) => estado.status === "todos" || tarefa.status === estado.status)
        .filter((tarefa) => estado.prioridade === "todas" || tarefa.prioridade === estado.prioridade);
}

// Ordena uma CÓPIA do resultado filtrado. Nunca usa .sort() diretamente sobre
// estado.tarefas (isso mutaria a fonte). [...array].sort() é o equivalente
// compatível de toSorted() para navegadores mais antigos.
function ordenarTarefas(tarefas, chaveOrdenacao) {
    const comparador = COMPARADORES[chaveOrdenacao] ?? COMPARADORES["prazo-asc"];
    return [...tarefas].sort(comparador);
}

// Única função exportada: recebe o estado inteiro, devolve a lista visível.
// Chamar duas vezes com o mesmo estado sempre devolve o mesmo resultado
// (nenhum efeito colateral, nenhuma dependência de tempo ou de DOM).
export function selecionarTarefas(estado) {
    const filtradas = filtrarTarefas(estado);
    return ordenarTarefas(filtradas, estado.ordenacao);
}

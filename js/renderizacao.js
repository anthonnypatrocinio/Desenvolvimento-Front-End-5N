// renderizacao.js
// Responsabilidade: transformar tarefas em nós DOM e reagir a cliques.
// Não busca dados, não decide de onde eles vêm, e não sabe nada sobre
// "carregando/sucesso/erro/vazio" (isso é papel de api.js e estados.js).
// Este arquivo não muda entre a entrega da aula 5 e a E3.

const CLASSE_POR_STATUS = {
    "a-fazer": "status-fazer",
    "em-andamento": "status-andamento",
    "em-revisao": "status-revisao",
    "concluida": "status-concluido",
};

const ROTULO_PRIORIDADE = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
};

// Cria um <p class="texto-padrao"><strong>Rótulo:</strong> valor</p>
// usando textContent em cada pedaço — nunca innerHTML com dado dinâmico.
function criarCampo(rotulo, valor, classe = "texto-padrao") {
    const paragrafo = document.createElement("p");
    paragrafo.className = classe;

    const forte = document.createElement("strong");
    forte.textContent = `${rotulo}:`;

    paragrafo.append(forte, ` ${valor}`);
    return paragrafo;
}

export function criarCartao(tarefa) {
    const cartao = document.createElement("article");
    const classeStatus = CLASSE_POR_STATUS[tarefa.status] ?? "status-fazer";
    cartao.className = `cartao-tarefa ${classeStatus}`;
    cartao.dataset.tarefaId = tarefa.id;

    const titulo = document.createElement("h4");
    titulo.className = "titulo-cartao";
    titulo.textContent = tarefa.titulo;

    const prioridade = ROTULO_PRIORIDADE[tarefa.prioridade] ?? tarefa.prioridade;

    const botao = document.createElement("button");
    botao.type = "button";
    botao.dataset.acao = "ver-detalhes";
    const rotuloBotao = document.createElement("span");
    rotuloBotao.textContent = "Ver detalhes";
    botao.append(rotuloBotao);

    cartao.append(
        titulo,
        criarCampo("Projeto", tarefa.projeto),
        criarCampo("Responsável", tarefa.responsavel),
        criarCampo("Prazo", tarefa.prazo, "texto-pequeno"),
        criarCampo("Prioridade", prioridade, "texto-pequeno"),
        botao
    );

    return cartao;
}

// Sincroniza cada coluna [data-lista-status] com as tarefas daquele status.
// Chamar duas vezes seguidas não duplica cartões (replaceChildren substitui a fotografia anterior).
export function renderizarTarefas(tarefas, quadro) {
    const colunas = quadro.querySelectorAll("[data-lista-status]");

    colunas.forEach((lista) => {
        const status = lista.dataset.listaStatus;
        const tarefasDoStatus = tarefas.filter((tarefa) => tarefa.status === status);

        if (tarefasDoStatus.length === 0) {
            const mensagemVazia = document.createElement("li");
            mensagemVazia.className = "texto-pequeno";
            mensagemVazia.textContent = "Nenhuma tarefa nesta coluna.";
            lista.replaceChildren(mensagemVazia);
            return;
        }

        const itens = tarefasDoStatus.map((tarefa) => {
            const item = document.createElement("li");
            item.append(criarCartao(tarefa));
            return item;
        });

        lista.replaceChildren(...itens);
    });
}

// Um único listener no quadro (ancestral estável) atende cartões antigos e novos,
// mesmo depois de renderizarTarefas substituir os nós.
// obterTarefas é uma função (não um array) para sempre enxergar os dados mais recentes.
export function instalarEventosDoQuadro(quadro, obterTarefas) {
    quadro.addEventListener("click", (evento) => {
        if (!(evento.target instanceof Element)) return;

        const botao = evento.target.closest('button[data-acao="ver-detalhes"]');
        if (!botao || !quadro.contains(botao)) return;

        const cartao = botao.closest("[data-tarefa-id]");
        if (!cartao) return;

        const tarefas = obterTarefas();
        const tarefa = tarefas.find((item) => item.id === cartao.dataset.tarefaId);
        if (!tarefa) return;

        console.log("Detalhes da tarefa:", tarefa);
    });
}

// app.js
// Composição: monta o estado inicial, importa a busca (api.js) e o ciclo de
// renderização (estados.js), conecta os controles do formulário a esse
// estado e instala os eventos delegados do quadro (renderizacao.js). Único
// arquivo carregado pelo HTML (type="module").

import { instalarEventosDoQuadro } from "./renderizacao.js";
import { carregarTarefas } from "./api.js";
import { renderizarAplicacao } from "./estados.js";
import { instalarInteracoes } from "./interacao.js";
import { instalarAmbiente } from "./ambiente.js";
import { instalarTutorial } from "./tutorial.js";
import { animarOrganizacaoInicial } from "./abertura.js";

// Slide 8: um objeto responde qual é a situação atual. Cada fato mutável que
// pode mudar a tela mora aqui — e só aqui. tarefasVisiveis NÃO existe como
// propriedade: ela é sempre calculada (selecao.js), nunca guardada.
function criarEstadoInicial() {
    return {
        tarefas: [],
        busca: "",
        status: "todos",
        prioridade: "todas",
        ordenacao: "prazo-asc",
        carregamento: "carregando",
        erro: null,
    };
}

// Liga cada controle do formulário a UMA propriedade do estado e, em seguida,
// chama a mesma função de renderização. input acompanha a digitação (busca);
// change acompanha uma escolha confirmada (select e radio).
function conectarControles(estado, atualizarTela) {
    const formulario = document.querySelector("form");
    const campoBusca = document.querySelector("#busca-titulo");
    const filtroStatus = document.querySelector("#filtro-status");
    const radiosPrioridade = document.querySelectorAll('input[name="prioridade"]');
    const selecaoOrdenacao = document.querySelector("#ordenacao");
    const botaoLimpar = document.querySelector("[data-acao-limpar]");

    // O formulário não navega mais para lugar nenhum — cada controle já
    // atualiza a tela sozinho, ao vivo. O submit só existiria por causa do
    // Enter no campo de texto, então ele é neutralizado aqui.
    if (formulario) {
        formulario.addEventListener("submit", (evento) => evento.preventDefault());
    }

    if (campoBusca) {
        campoBusca.addEventListener("input", (evento) => {
            estado.busca = evento.currentTarget.value;
            atualizarTela();
        });
    }

    if (filtroStatus) {
        filtroStatus.addEventListener("change", (evento) => {
            estado.status = evento.currentTarget.value;
            atualizarTela();
        });
    }

    radiosPrioridade.forEach((radio) => {
        radio.addEventListener("change", (evento) => {
            if (!evento.currentTarget.checked) return;
            estado.prioridade = evento.currentTarget.value;
            atualizarTela();
        });
    });

    if (selecaoOrdenacao) {
        selecaoOrdenacao.addEventListener("change", (evento) => {
            estado.ordenacao = evento.currentTarget.value;
            atualizarTela();
        });
    }

    if (botaoLimpar) {
        botaoLimpar.addEventListener("click", () => {
            estado.busca = "";
            estado.status = "todos";
            estado.prioridade = "todas";
            estado.ordenacao = "prazo-asc";

            // O estado é a fonte — mas os controles também precisam voltar a
            // refletir essa fonte, senão a tela e o formulário discordariam
            // entre si (o mesmo problema do slide 6, só que ao contrário).
            if (campoBusca) campoBusca.value = "";
            if (filtroStatus) filtroStatus.value = "todos";
            if (selecaoOrdenacao) selecaoOrdenacao.value = "prazo-asc";
            const radioTodas = document.querySelector("#prioridade-todas");
            if (radioTodas) radioTodas.checked = true;

            atualizarTela();
        });
    }
}

async function iniciar() {
    const quadro = document.querySelector("[data-quadro]");

    if (!quadro) {
        throw new Error("Contêiner [data-quadro] não encontrado.");
    }

    const estado = criarEstadoInicial();
    const atualizarTela = () => renderizarAplicacao(estado);

    // O listener de clique é instalado uma vez, sobre o quadro (ancestral
    // estável). obterTarefas lê sempre estado.tarefas mais atual, mesmo
    // depois de filtros trocarem os cartões visíveis.
    instalarEventosDoQuadro(quadro, () => estado.tarefas);
    conectarControles(estado, atualizarTela);

    // Camadas puramente visuais/interativas (E5) — não leem nem escrevem em
    // estado.tarefas/busca/status/prioridade/ordenacao, então não alteram em
    // nada o comportamento avaliado nas E1-E4.
    instalarInteracoes(quadro, () => estado.tarefas);
    instalarAmbiente();

    // Estado "carregando" é aplicado ANTES do await — é isso que faz a
    // mensagem aparecer de fato enquanto a rede responde.
    atualizarTela();

    try {
        estado.tarefas = await carregarTarefas();
        estado.carregamento = "sucesso";
    } catch (erro) {
        estado.carregamento = "erro";
        estado.erro = erro;
    }

    atualizarTela();

    // A abertura (E5) só faz sentido depois que existem fichas na tela, e só
    // na primeira vez: daqui em diante, quem redesenha o quadro é o ciclo
    // normal de filtros/ordenação. Ela devolve quanto tempo a coreografia
    // leva, e o tutorial usa esse número para não abrir por cima dela.
    const duracaoDaAbertura = animarOrganizacaoInicial(quadro) ?? 0;
    instalarTutorial({ atrasoDaPrimeiraVisita: duracaoDaAbertura + 400 });
}

// Sem await de nível superior: a inicialização roda dentro da função async acima.
iniciar();

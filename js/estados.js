// estados.js
// Responsabilidade: ser o ÚNICO ponto de sincronização entre estado e tela.
// renderizarAplicacao(estado) é chamada depois de toda mudança (evento novo
// ou resposta de rede) e decide, a partir do MESMO estado, o que o quadro e
// a região de status devem mostrar. Nenhuma requisição acontece aqui; quem
// chama já atualizou estado.tarefas / estado.carregamento / estado.erro.

import { renderizarTarefas } from "./renderizacao.js";
import { selecionarTarefas } from "./selecao.js";

function pluralizar(quantidade, singular, plural) {
    return quantidade === 1 ? singular : plural;
}

// Diferencia a mensagem pelo tipo de falha: rede, formato ou protocolo.
// erro.name distingue TypeError (rede) de SyntaxError (formato);
// o Error genérico com .status vem do próprio api.js (protocolo).
function mensagemDeErro(erro) {
    if (erro && erro.name === "TypeError") {
        return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    }

    if (erro && erro.name === "SyntaxError") {
        return "Os dados recebidos não puderam ser interpretados (formato inválido).";
    }

    if (erro && typeof erro.status === "number") {
        return `O servidor respondeu com um erro (status ${erro.status}).`;
    }

    return "Não foi possível carregar as tarefas.";
}

// Slide 21: origem vazia (nada foi carregado) e resultado vazio (os critérios
// não bateram com nada) respondem perguntas diferentes e merecem mensagens
// diferentes — nenhuma das duas é um erro.
function mensagemDeResumo(totalVisivel, totalOrigem) {
    if (totalOrigem === 0) {
        return "Nenhuma tarefa foi cadastrada.";
    }

    if (totalVisivel === 0) {
        return "Nenhum resultado para os critérios atuais. Altere ou limpe os filtros.";
    }

    return `${totalVisivel} de ${totalOrigem} ${pluralizar(totalOrigem, "tarefa", "tarefas")}.`;
}

// Ponto único chamado por app.js: no carregamento inicial, a cada resposta de
// rede e a cada evento de busca/filtro/ordenação/limpeza. Sempre lê o estado
// inteiro e sempre re-deriva a lista visível — nunca reaproveita um resultado
// antigo, então a ordem das interações não muda o resultado final.
export function renderizarAplicacao(estado) {
    const elementoEstado = document.querySelector("[data-estado]");
    const quadro = document.querySelector("[data-quadro]");

    if (estado.carregamento === "carregando") {
        if (elementoEstado) elementoEstado.textContent = "Carregando tarefas...";
        return;
    }

    if (estado.carregamento === "erro") {
        if (quadro) renderizarTarefas([], quadro);
        if (elementoEstado) elementoEstado.textContent = mensagemDeErro(estado.erro);
        return;
    }

    // "sucesso": deriva a visão a partir do MESMO estado.tarefas (nunca uma
    // cópia guardada à parte) e sincroniza quadro + resumo com a mesma lista.
    const visiveis = selecionarTarefas(estado);
    if (quadro) renderizarTarefas(visiveis, quadro);
    if (elementoEstado) {
        elementoEstado.textContent = mensagemDeResumo(visiveis.length, estado.tarefas.length);
    }
}

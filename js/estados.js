// estados.js
// Responsabilidade: decidir qual das quatro telas está valendo — carregando, sucesso,
// vazio ou erro — e atualizar a região de status. Nenhuma requisição acontece aqui;
// quem chama já trouxe o resultado (dados ou o erro capturado).

import { renderizarTarefas } from "./renderizacao.js";

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

// dados tem significado diferente conforme o estado:
// - "sucesso"/"vazio": o array de tarefas
// - "erro": o objeto de erro capturado no catch
// - "carregando": não é usado
export function renderizarEstado(estado, dados) {
    const elementoEstado = document.querySelector("[data-estado]");
    const quadro = document.querySelector("[data-quadro]");

    switch (estado) {
        case "carregando":
            if (elementoEstado) elementoEstado.textContent = "Carregando tarefas...";
            break;

        case "sucesso": {
            const tarefas = dados ?? [];
            if (quadro) renderizarTarefas(tarefas, quadro);
            if (elementoEstado) {
                elementoEstado.textContent =
                    `${tarefas.length} ${pluralizar(tarefas.length, "tarefa carregada", "tarefas carregadas")}.`;
            }
            break;
        }

        case "vazio":
            if (quadro) renderizarTarefas([], quadro);
            if (elementoEstado) elementoEstado.textContent = "Nenhuma tarefa encontrada.";
            break;

        case "erro":
            if (elementoEstado) elementoEstado.textContent = mensagemDeErro(dados);
            break;

        default:
            break;
    }
}

// app.js
// Composição: importa a busca (api.js), a exibição de estado (estados.js) e os
// eventos delegados (renderizacao.js), e inicia a interface. Único arquivo
// carregado pelo HTML (type="module").

import { instalarEventosDoQuadro } from "./renderizacao.js";
import { carregarTarefas } from "./api.js";
import { renderizarEstado } from "./estados.js";

async function iniciar() {
    const quadro = document.querySelector("[data-quadro]");

    if (!quadro) {
        throw new Error("Contêiner [data-quadro] não encontrado.");
    }

    // Guarda mutável fechada pela closure abaixo: o listener delegado sempre lê o
    // valor atual, mesmo depois que os cartões (nós DOM) forem substituídos.
    let tarefas = [];
    instalarEventosDoQuadro(quadro, () => tarefas);

    // Estado "carregando" é aplicado ANTES do await — é isso que faz a mensagem
    // aparecer de fato enquanto a rede responde, e não só por uma fração de segundo.
    renderizarEstado("carregando");

    try {
        tarefas = await carregarTarefas();

        // "vazio" é decidido aqui, por tarefas.length, e não dentro do catch:
        // um array vazio não é uma falha.
        renderizarEstado(tarefas.length === 0 ? "vazio" : "sucesso", tarefas);
    } catch (erro) {
        renderizarEstado("erro", erro);
    }
}

// Sem await de nível superior: a inicialização roda dentro da função async acima.
iniciar();

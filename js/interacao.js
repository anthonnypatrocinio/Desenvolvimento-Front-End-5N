// interacao.js
// Camada de feedback e foco — NÃO decide dados, estado, filtro ou ordenação.
// Só reage a cliques: (1) uma mancha de tinta se espalha no ponto tocado,
// (2) uma tarefa clicada se solta do mural e vem ampliada para o centro,
// usando criarCartao (renderizacao.js) para desenhar a versão em foco com
// exatamente o mesmo HTML/CSS dos cartões normais — nenhuma duplicação de
// lógica de apresentação.

import { criarCartao } from "./renderizacao.js";

function reduzirMovimento() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// --- Efeito de tinta (feedback tátil em qualquer clique relevante) --------
function instalarEfeitoTinta(seletorAlvo) {
    document.addEventListener("click", (evento) => {
        if (reduzirMovimento()) return;

        const alvo = evento.target.closest(seletorAlvo);
        if (!alvo) return;

        const rect = alvo.getBoundingClientRect();
        const mancha = document.createElement("span");
        mancha.className = "efeito-tinta";
        const tamanho = Math.max(rect.width, rect.height) * 1.5;
        mancha.style.width = mancha.style.height = `${tamanho}px`;
        mancha.style.left = `${evento.clientX - rect.left - tamanho / 2}px`;
        mancha.style.top = `${evento.clientY - rect.top - tamanho / 2}px`;

        alvo.appendChild(mancha);
        mancha.addEventListener("animationend", () => mancha.remove());
    });
}

// --- Zoom/foco: a ficha clicada vira uma cópia ampliada e centralizada ----
// obterTarefas funciona como em instalarEventosDoQuadro (renderizacao.js):
// uma função, não um array, para sempre ler a lista mais atual.
function instalarZoomDeTarefa(quadro, obterTarefas) {
    let zoomAtual = null;

    function aoTeclar(evento) {
        if (evento.key === "Escape") fecharZoom();
    }

    function fecharZoom() {
        if (!zoomAtual) return;
        const { clone, fundo, original, rectOriginal } = zoomAtual;

        clone.style.top = `${rectOriginal.top}px`;
        clone.style.left = `${rectOriginal.left}px`;
        clone.style.width = `${rectOriginal.width}px`;
        clone.style.height = `${rectOriginal.height}px`;
        fundo.classList.remove("zoom-fundo--ativo");
        original.classList.remove("cartao-tarefa--desfocado");

        const remover = () => {
            clone.remove();
            fundo.remove();
        };

        if (reduzirMovimento()) {
            remover();
        } else {
            clone.addEventListener("transitionend", remover, { once: true });
        }

        document.removeEventListener("keydown", aoTeclar);
        zoomAtual = null;
    }

    quadro.addEventListener("click", (evento) => {
        if (zoomAtual) return; // evita empilhar um segundo foco por cima do atual

        const cartaoOriginal = evento.target.closest("[data-tarefa-id]");
        if (!cartaoOriginal) return;

        const tarefas = obterTarefas();
        const tarefa = tarefas.find((item) => item.id === cartaoOriginal.dataset.tarefaId);
        if (!tarefa) return;

        const rectOriginal = cartaoOriginal.getBoundingClientRect();

        const fundo = document.createElement("div");
        fundo.className = "zoom-fundo";

        const clone = criarCartao(tarefa);
        clone.classList.add("cartao-zoom");
        clone.style.top = `${rectOriginal.top}px`;
        clone.style.left = `${rectOriginal.left}px`;
        clone.style.width = `${rectOriginal.width}px`;
        clone.style.height = `${rectOriginal.height}px`;

        // Na versão ampliada, "Ver detalhes" é redundante — você já está vendo.
        const botaoDetalhes = clone.querySelector('[data-acao="ver-detalhes"]');
        if (botaoDetalhes) botaoDetalhes.remove();

        const fechar = document.createElement("button");
        fechar.type = "button";
        fechar.className = "zoom-fechar";
        fechar.setAttribute("aria-label", "Fechar detalhes da tarefa");
        fechar.textContent = "×";
        clone.appendChild(fechar);

        document.body.append(fundo, clone);
        cartaoOriginal.classList.add("cartao-tarefa--desfocado");

        // Força o navegador a registrar a posição inicial antes de animar
        // (sem isso, o navegador otimiza os dois estados juntos e não anima).
        void clone.offsetWidth;

        const larguraAlvo = Math.min(window.innerWidth * 0.86, 460);
        const alturaAlvo = Math.min(window.innerHeight * 0.72, 420);

        if (reduzirMovimento()) clone.style.transition = "none";

        fundo.classList.add("zoom-fundo--ativo");
        clone.style.top = `${(window.innerHeight - alturaAlvo) / 2}px`;
        clone.style.left = `${(window.innerWidth - larguraAlvo) / 2}px`;
        clone.style.width = `${larguraAlvo}px`;
        clone.style.height = `${alturaAlvo}px`;

        zoomAtual = { clone, fundo, original: cartaoOriginal, rectOriginal };

        fundo.addEventListener("click", fecharZoom);
        fechar.addEventListener("click", fecharZoom);
        document.addEventListener("keydown", aoTeclar);
    });
}

export function instalarInteracoes(quadro, obterTarefas) {
    instalarEfeitoTinta(".botao-acao, .cartao-tarefa button, .cartao-tarefa");
    instalarZoomDeTarefa(quadro, obterTarefas);
}

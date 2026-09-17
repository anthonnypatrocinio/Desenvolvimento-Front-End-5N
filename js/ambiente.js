// ambiente.js
// Camada ambiente — não sabe o que é uma tarefa, nem por que o estado mudou.
// Só faz a página parecer viva: um holofote que segue o cursor sobre o mural
// e um lampejo breve na região de status sempre que o TEXTO dela muda
// (observado de fora, via MutationObserver, sem tocar em estados.js).

function reduzirMovimento() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function instalarHolofote() {
    if (reduzirMovimento()) return;

    const holofote = document.createElement("div");
    holofote.className = "mural-holofote";
    holofote.setAttribute("aria-hidden", "true");
    document.body.prepend(holofote);

    let quadroDeAnimacao = null;
    document.addEventListener("mousemove", (evento) => {
        if (quadroDeAnimacao) return;
        quadroDeAnimacao = requestAnimationFrame(() => {
            document.documentElement.style.setProperty("--mouse-x", `${evento.clientX}px`);
            document.documentElement.style.setProperty("--mouse-y", `${evento.clientY}px`);
            quadroDeAnimacao = null;
        });
    });
}

function instalarLampejoDeStatus() {
    const elementoEstado = document.querySelector("[data-estado]");
    if (!elementoEstado) return;

    const observador = new MutationObserver(() => {
        elementoEstado.classList.remove("atualizado");
        void elementoEstado.offsetWidth; // força reflow para reiniciar a animação
        elementoEstado.classList.add("atualizado");
    });

    observador.observe(elementoEstado, {
        childList: true,
        characterData: true,
        subtree: true,
    });
}

export function instalarAmbiente() {
    instalarHolofote();
    instalarLampejoDeStatus();
}

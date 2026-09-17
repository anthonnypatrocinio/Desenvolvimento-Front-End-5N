// abertura.js
// Camada de abertura — roda UMA única vez, logo depois da primeira
// renderização bem-sucedida. Não lê estado, não filtra, não ordena, não
// altera o DOM dos cartões: só escreve variáveis CSS em cada ficha e liga a
// classe que dispara a coreografia declarada no style.css.
//
// A coreografia de cada ficha tem três tempos:
//   1. o papel chega voando e se assenta torto no mural   (organizar-ficha)
//   2. o título é escrito da esquerda para a direita      (escrever-titulo)
//   3. o pino desce e prende a ficha                      (espetar-pino)
// As fichas entram em cascata (uma a cada ATRASO_ENTRE_FICHAS ms), como
// alguém arrumando o mural ficha por ficha.

const ATRASO_ENTRE_FICHAS = 90; // ms entre uma ficha e a seguinte

function reduzirMovimento() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Deslocamento inicial "aleatório o suficiente": derivado do índice, sem
// Math.random(), para que a abertura seja idêntica a cada carregamento —
// mais fácil de conferir na apresentação do trabalho.
function posicaoDeChegada(indice) {
    const lado = indice % 2 === 0 ? -1 : 1;
    return {
        x: lado * (36 + (indice % 3) * 26),
        y: -64 - (indice % 4) * 20,
        giro: lado * (7 + (indice % 3) * 4),
    };
}

// A classe NÃO é removida no fim: a animação de entrada não tem "forwards",
// então cada ficha repousa no estilo normal sozinha. Tirar a classe faria o
// navegador reiniciar a animação padrão do .cartao-tarefa (ficha-fixada) e
// a ficha piscaria de novo.
export function animarOrganizacaoInicial(quadro) {
    if (!quadro || reduzirMovimento()) return;

    const cartoes = quadro.querySelectorAll(".cartao-tarefa");

    cartoes.forEach((cartao, indice) => {
        const { x, y, giro } = posicaoDeChegada(indice);

        cartao.style.setProperty("--de-x", `${x}px`);
        cartao.style.setProperty("--de-y", `${y}px`);
        cartao.style.setProperty("--giro-entrada", `${giro}deg`);
        cartao.style.setProperty("--atraso-entrada", `${indice * ATRASO_ENTRE_FICHAS}ms`);

        cartao.classList.add("cartao-tarefa--entrando");
    });

    // Quanto tempo a abertura inteira leva — quem quiser esperar por ela
    // (o tutorial, por exemplo) usa este número em vez de chutar um valor.
    return cartoes.length * ATRASO_ENTRE_FICHAS + 1600;
}

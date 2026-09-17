// lapis.js
// Camada de rascunho — não sabe o que é uma tarefa, nem lê/escreve estado.
// Coloca um <canvas> atrás do conteúdo da ficha de papel e deixa a pessoa
// rabiscar nela com o mouse ou o dedo, como quem rabisca no canto de uma
// folha enquanto pensa.
//
// Três decisões que fazem o traço parecer lápis e não uma linha de software:
//   1. o caminho é desenhado com curvas quadráticas entre PONTOS MÉDIOS —
//      isso arredonda os cantos que o mouse produz e deixa o traço fluido;
//   2. a espessura responde à velocidade: gesto rápido, traço fino;
//   3. cada segmento é passado três vezes com deslocamentos mínimos e pouca
//      opacidade, imitando o grafite agarrando na textura do papel.
//
// Nenhuma biblioteca: só a API 2D do canvas, que já vem no navegador.

const SELETOR_PAPEL = 'main > section[aria-labelledby="filtros-titulo"]';
const SELETOR_CONTROLES = "input, select, button, label, legend, textarea, a, option";

const COR_GRAFITE = "58, 42, 24"; // mesma tinta do texto, usada com alfa baixo
const ESPESSURA_MAXIMA = 2.6;
const ESPESSURA_MINIMA = 0.7;
const PASSADAS = 3;

function distancia(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

// Espessura decai com a velocidade do gesto, como a pressão de um lápis.
function espessuraPara(velocidade) {
    const decaimento = Math.min(velocidade / 14, 1);
    return ESPESSURA_MAXIMA - (ESPESSURA_MAXIMA - ESPESSURA_MINIMA) * decaimento;
}

export function instalarLapis(seletorPapel = SELETOR_PAPEL) {
    const papel = document.querySelector(seletorPapel);
    if (!papel) return;

    const canvas = document.createElement("canvas");
    canvas.className = "papel-rascunho";
    canvas.setAttribute("aria-hidden", "true"); // decorativo: nada a anunciar
    papel.prepend(canvas);

    const pincel = canvas.getContext("2d");
    if (!pincel) return;

    // Cada traço é uma lista de pontos guardada em px de layout (não em px de
    // tela). Guardar os traços é o que permite redesenhar tudo quando o
    // canvas muda de tamanho — um canvas redimensionado perde o conteúdo.
    const tracos = [];
    let tracoAtual = null;
    let larguraAnterior = 0;

    function ajustarTamanho() {
        const { width, height } = papel.getBoundingClientRect();
        if (width === 0 || height === 0) return;

        const densidade = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * densidade);
        canvas.height = Math.round(height * densidade);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Uma unidade do contexto volta a valer um px de CSS.
        pincel.setTransform(densidade, 0, 0, densidade, 0, 0);
        pincel.lineCap = "round";
        pincel.lineJoin = "round";

        // Largura mudou (responsivo): reescala os traços já feitos para que
        // o rabisco continue no mesmo lugar relativo da folha.
        if (larguraAnterior > 0 && Math.abs(width - larguraAnterior) > 1) {
            const fator = width / larguraAnterior;
            tracos.forEach((traco) => {
                traco.forEach((ponto) => {
                    ponto.x *= fator;
                    ponto.y *= fator;
                });
            });
        }
        larguraAnterior = width;

        redesenharTudo();
    }

    function desenharSegmento(anterior, atual, proximo) {
        const meioInicial = {
            x: (anterior.x + atual.x) / 2,
            y: (anterior.y + atual.y) / 2,
        };
        const meioFinal = {
            x: (atual.x + proximo.x) / 2,
            y: (atual.y + proximo.y) / 2,
        };

        const espessura = espessuraPara(distancia(anterior, atual));

        for (let passada = 0; passada < PASSADAS; passada += 1) {
            // Deslocamento sub-pixel determinístico: o mesmo traço redesenhado
            // depois de um resize sai idêntico (nada de Math.random aqui).
            const desvio = (passada - 1) * 0.35;

            pincel.beginPath();
            pincel.moveTo(meioInicial.x + desvio, meioInicial.y - desvio);
            pincel.quadraticCurveTo(atual.x + desvio, atual.y - desvio, meioFinal.x + desvio, meioFinal.y - desvio);
            pincel.lineWidth = espessura * (1 - passada * 0.22);
            pincel.strokeStyle = `rgba(${COR_GRAFITE}, ${0.3 - passada * 0.07})`;
            pincel.stroke();
        }
    }

    function desenharTraco(traco) {
        if (traco.length === 1) {
            // Clique sem arrasto: um pontinho de grafite.
            const [ponto] = traco;
            pincel.beginPath();
            pincel.arc(ponto.x, ponto.y, ESPESSURA_MAXIMA / 2, 0, Math.PI * 2);
            pincel.fillStyle = `rgba(${COR_GRAFITE}, 0.38)`;
            pincel.fill();
            return;
        }

        for (let i = 1; i < traco.length - 1; i += 1) {
            desenharSegmento(traco[i - 1], traco[i], traco[i + 1]);
        }
    }

    function redesenharTudo() {
        pincel.clearRect(0, 0, canvas.width, canvas.height);
        tracos.forEach(desenharTraco);
    }

    function pontoDoEvento(evento) {
        const rect = papel.getBoundingClientRect();
        return { x: evento.clientX - rect.left, y: evento.clientY - rect.top };
    }

    // O canvas fica ATRÁS do conteúdo e sem pointer-events; quem escuta o
    // ponteiro é a própria ficha de papel. Assim, arrastar sobre um campo
    // continua sendo usar o campo, e arrastar sobre o vazio vira rabisco.
    papel.addEventListener("pointerdown", (evento) => {
        if (evento.button !== 0 && evento.pointerType === "mouse") return;
        if (evento.target.closest(SELETOR_CONTROLES)) return;

        tracoAtual = [pontoDoEvento(evento)];
        tracos.push(tracoAtual);
        papel.classList.add("papel--rabiscando");
        papel.setPointerCapture(evento.pointerId);
        evento.preventDefault(); // evita selecionar o texto da ficha ao arrastar
    });

    papel.addEventListener("pointermove", (evento) => {
        if (!tracoAtual) return;

        const ponto = pontoDoEvento(evento);
        const ultimo = tracoAtual[tracoAtual.length - 1];

        // Ignora micro-movimentos: menos pontos, curva mais limpa.
        if (distancia(ultimo, ponto) < 1.2) return;

        tracoAtual.push(ponto);

        // Desenha só o segmento novo, em vez de redesenhar a folha inteira a
        // cada movimento do mouse.
        if (tracoAtual.length >= 3) {
            const n = tracoAtual.length;
            desenharSegmento(tracoAtual[n - 3], tracoAtual[n - 2], tracoAtual[n - 1]);
        }
    });

    function encerrarTraco(evento) {
        if (!tracoAtual) return;
        if (tracoAtual.length === 1) desenharTraco(tracoAtual);
        tracoAtual = null;
        papel.classList.remove("papel--rabiscando");
        if (evento && papel.hasPointerCapture?.(evento.pointerId)) {
            papel.releasePointerCapture(evento.pointerId);
        }
    }

    papel.addEventListener("pointerup", encerrarTraco);
    papel.addEventListener("pointercancel", encerrarTraco);
    papel.addEventListener("pointerleave", encerrarTraco);

    // Borracha: apaga o traço mais recente (Ctrl+Z é o gesto que todo mundo
    // já tem no dedo) e o botão da própria ficha limpa a folha inteira.
    document.addEventListener("keydown", (evento) => {
        const desfazer = (evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "z";
        if (!desfazer || tracos.length === 0) return;
        if (document.activeElement?.closest(SELETOR_CONTROLES)) return; // digitando: não interferir
        tracos.pop();
        redesenharTudo();
        evento.preventDefault();
    });

    const borracha = document.createElement("button");
    borracha.type = "button";
    borracha.className = "botao-borracha";
    borracha.textContent = "Apagar rabiscos";
    borracha.addEventListener("click", () => {
        tracos.length = 0;
        redesenharTudo();
    });
    papel.append(borracha);

    // ResizeObserver acompanha a ficha mudando de altura (o fieldset quebra
    // linha em telas estreitas), não só a janela mudando de tamanho.
    if (typeof ResizeObserver === "function") {
        new ResizeObserver(ajustarTamanho).observe(papel);
    } else {
        window.addEventListener("resize", ajustarTamanho);
    }

    ajustarTamanho();
}

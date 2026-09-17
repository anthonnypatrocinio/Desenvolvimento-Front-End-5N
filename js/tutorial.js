// tutorial.js
// Onboarding — não sabe nada sobre tarefas, estado ou filtros. Só sabe onde
// cada controle real está na tela (via seletor) e o texto de cada passo.
// Um "spotlight" escurece a página e recorta um buraco em volta do alvo;
// uma nota de papel ao lado explica o que aquele controle faz.
//
// O recorte é posicionado em coordenadas de viewport (getBoundingClientRect),
// então qualquer rolagem durante o tour desalinharia o buraco do alvo. Em vez
// de recalcular o recorte a cada scroll (que ficaria tremido e ainda deixaria
// o usuário passear pela página no meio da explicação), o tour ROLA a página
// ele mesmo até o alvo e, terminada a rolagem, TRAVA a rolagem enquanto
// estiver aberto. Destrava ao encerrar.

const CHAVE_TUTORIAL_VISTO = "tarefas-academicas:tutorial-visto";
const CLASSE_ROLAGEM_TRAVADA = "rolagem-travada";
const DURACAO_DA_ROLAGEM = 320; // ms

const PASSOS = [
    {
        seletor: "#busca-titulo",
        titulo: "Busque por título",
        texto: "Digite aqui para filtrar as tarefas pelo título, em tempo real — sem precisar apertar nenhum botão.",
    },
    {
        seletor: "#filtro-status",
        titulo: "Filtre por status",
        texto: "Escolha uma coluna específica para ver só as tarefas de um status: a fazer, em andamento, em revisão ou concluída.",
    },
    {
        seletor: "fieldset",
        titulo: "Filtre por prioridade",
        texto: "Combine com a busca e o status: os três critérios funcionam juntos, sobre a mesma lista de tarefas.",
    },
    {
        seletor: "#ordenacao",
        titulo: "Escolha a ordem",
        texto: "Prazo, prioridade ou título — a ordem dos cartões muda, mas nenhuma tarefa some da tela.",
    },
    {
        seletor: "[data-acao-limpar]",
        titulo: "Limpe tudo de uma vez",
        texto: "Um clique aqui restaura busca, status, prioridade e ordenação ao ponto de partida.",
    },
    {
        seletor: 'main > section[aria-labelledby="filtros-titulo"]',
        titulo: "Rabisque no papel",
        texto: "Clique e arraste em qualquer área livre da ficha para desenhar a lápis. Ctrl+Z apaga o último traço; o botão no canto limpa a folha.",
    },
    {
        seletor: ".cartao-tarefa",
        titulo: "Clique numa tarefa",
        texto: "Toda ficha pode ser clicada: ela se solta do mural e vem para perto de você, ampliada e sem cortes no título.",
    },
    {
        seletor: "[data-estado]",
        titulo: "Fique de olho aqui",
        texto: "Esta faixa sempre resume a situação atual: quantas tarefas aparecem, se a busca não encontrou nada, ou se algo deu errado.",
    },
];

function reduzirMovimento() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function elementoVisivel(seletor) {
    const alvo = document.querySelector(seletor);
    if (!alvo) return null;
    const rect = alvo.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? alvo : null;
}

// --- Trava de rolagem ------------------------------------------------------
// overflow: hidden na raiz congela a página sem tirá-la do lugar. A largura
// da barra de rolagem some junto, então ela é devolvida como padding para o
// conteúdo não "pular" alguns pixels para a direita ao travar.
function criarTravaDeRolagem() {
    const raiz = document.documentElement;
    let travado = false;
    let rolagemGuardada = 0;

    function travar() {
        if (travado) return;
        rolagemGuardada = window.scrollY;
        const larguraDaBarra = window.innerWidth - raiz.clientWidth;
        document.body.style.paddingRight = larguraDaBarra > 0 ? `${larguraDaBarra}px` : "";
        raiz.classList.add(CLASSE_ROLAGEM_TRAVADA);
        travado = true;
    }

    function destravar() {
        if (!travado) return;
        raiz.classList.remove(CLASSE_ROLAGEM_TRAVADA);
        document.body.style.paddingRight = "";
        // Alguns navegadores devolvem o scroll ao topo ao liberar o overflow;
        // restaurar o valor guardado deixa o comportamento igual em todos.
        window.scrollTo(0, rolagemGuardada);
        travado = false;
    }

    return { travar, destravar };
}

// Rolagem suave própria (requestAnimationFrame), em vez de scroll-behavior
// ou scrollIntoView({behavior:"smooth"}): aqui é preciso saber EXATAMENTE
// quando a rolagem terminou para só então medir o alvo e travar a página.
function rolarAte(alvo, aoTerminar) {
    const rect = alvo.getBoundingClientRect();
    const alturaDaPagina = document.documentElement.scrollHeight;
    const centralizado = window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2;
    const destino = Math.max(0, Math.min(centralizado, alturaDaPagina - window.innerHeight));

    const inicio = window.scrollY;
    const distancia = destino - inicio;

    if (reduzirMovimento() || Math.abs(distancia) < 2) {
        window.scrollTo(0, destino);
        aoTerminar();
        return;
    }

    const instanteInicial = performance.now();

    function passo(agora) {
        const progresso = Math.min(1, (agora - instanteInicial) / DURACAO_DA_ROLAGEM);
        // ease-in-out quadrático, escrito à mão (sem biblioteca de easing).
        const suave = progresso < 0.5
            ? 2 * progresso * progresso
            : 1 - Math.pow(-2 * progresso + 2, 2) / 2;

        window.scrollTo(0, inicio + distancia * suave);

        if (progresso < 1) {
            requestAnimationFrame(passo);
        } else {
            aoTerminar();
        }
    }

    requestAnimationFrame(passo);
}

function construirTour() {
    if (document.querySelector(".tutorial-fundo")) return; // tour já aberto

    const trava = criarTravaDeRolagem();

    const fundo = document.createElement("div");
    fundo.className = "tutorial-fundo";

    const recorte = document.createElement("div");
    recorte.className = "tutorial-recorte";

    const nota = document.createElement("div");
    nota.className = "tutorial-nota";

    fundo.append(recorte, nota);
    document.body.append(fundo);

    let indice = 0;
    let alvoAtual = null;

    function posicionar(alvo) {
        const rect = alvo.getBoundingClientRect();
        const folga = 8;

        recorte.style.top = `${rect.top - folga}px`;
        recorte.style.left = `${rect.left - folga}px`;
        recorte.style.width = `${rect.width + folga * 2}px`;
        recorte.style.height = `${rect.height + folga * 2}px`;

        const abaixoCabe = rect.bottom + 190 < window.innerHeight;
        nota.style.top = abaixoCabe ? `${rect.bottom + 16}px` : `${Math.max(16, rect.top - 190)}px`;
        nota.style.left = `${Math.max(16, Math.min(rect.left, window.innerWidth - 280))}px`;
    }

    function desenharNota(passo) {
        nota.replaceChildren();

        const titulo = document.createElement("h4");
        titulo.textContent = passo.titulo;

        const texto = document.createElement("p");
        texto.style.margin = "0";
        texto.textContent = passo.texto;

        const acoes = document.createElement("div");
        acoes.className = "tutorial-acoes";

        const progresso = document.createElement("span");
        progresso.className = "tutorial-progresso";
        progresso.textContent = `${indice + 1} de ${PASSOS.length}`;

        const botaoPular = document.createElement("button");
        botaoPular.type = "button";
        botaoPular.textContent = "Pular";
        botaoPular.addEventListener("click", encerrar);

        const botaoProximo = document.createElement("button");
        botaoProximo.type = "button";
        botaoProximo.className = "tutorial-proximo";
        botaoProximo.textContent = indice === PASSOS.length - 1 ? "Concluir" : "Próximo";
        botaoProximo.addEventListener("click", avancar);

        acoes.append(progresso, botaoPular, botaoProximo);
        nota.append(titulo, texto, acoes);
        botaoProximo.focus({ preventScroll: true });
    }

    function renderizarPasso() {
        const passo = PASSOS[indice];
        const alvo = elementoVisivel(passo.seletor);

        if (!alvo) {
            avancar(); // elemento ausente na tela — pula, não trava o tour
            return;
        }

        alvoAtual = alvo;

        // Destravar → rolar → travar de novo → só então medir e desenhar.
        // É essa ordem que mantém o buraco do spotlight exatamente em cima
        // do controle, em vez de sobre o lugar onde ele estava antes.
        trava.destravar();
        rolarAte(alvo, () => {
            trava.travar();
            posicionar(alvo);
            desenharNota(passo);
        });
    }

    function avancar() {
        indice += 1;
        if (indice >= PASSOS.length) {
            encerrar();
            return;
        }
        renderizarPasso();
    }

    function aoTeclar(evento) {
        if (evento.key === "Escape") encerrar();
    }

    // A página está congelada, mas a janela ainda pode mudar de tamanho
    // (girar o celular, redimensionar). O recorte precisa reacompanhar o alvo.
    function aoRedimensionar() {
        if (alvoAtual) posicionar(alvoAtual);
    }

    function encerrar() {
        document.removeEventListener("keydown", aoTeclar);
        window.removeEventListener("resize", aoRedimensionar);
        trava.destravar();
        fundo.remove();
        try {
            localStorage.setItem(CHAVE_TUTORIAL_VISTO, "1");
        } catch {
            // localStorage indisponível — sem problema, só não lembra na próxima visita.
        }
    }

    document.addEventListener("keydown", aoTeclar);
    window.addEventListener("resize", aoRedimensionar);
    renderizarPasso();
}

function instalarBotaoDeAjuda() {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "botao-ajuda";
    botao.setAttribute("aria-label", "Como usar esta página");
    botao.textContent = "?";
    botao.addEventListener("click", construirTour);
    document.body.append(botao);
}

// atrasoDaPrimeiraVisita vem de app.js: é o tempo que a animação de abertura
// do quadro leva, para o tour não começar por cima das fichas ainda voando.
export function instalarTutorial({ atrasoDaPrimeiraVisita = 900 } = {}) {
    instalarBotaoDeAjuda();

    let jaVisto = false;
    try {
        jaVisto = Boolean(localStorage.getItem(CHAVE_TUTORIAL_VISTO));
    } catch {
        jaVisto = false;
    }

    if (!jaVisto) {
        setTimeout(construirTour, atrasoDaPrimeiraVisita);
    }
}

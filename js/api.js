// api.js
// Responsabilidade única: buscar os dados brutos pela rede.
// Nenhuma linha aqui toca no DOM ou decide o que aparece na tela.
// Este arquivo não muda entre a E3 e a E4 — nada aqui depende de estado,
// filtros ou ordenação.

export async function carregarTarefas() {
    // fetch só rejeita (TypeError) quando a requisição em si falha: rede fora, URL inválida.
    const resposta = await fetch("./dados.json");

    // Um 404/500 é uma resposta bem-sucedida com status negativo — fetch não rejeita sozinho.
    // Por isso o protocolo é verificado explicitamente, e não deduzido de um catch genérico.
    if (!resposta.ok) {
        const erro = new Error(`Resposta HTTP ${resposta.status}`);
        erro.status = resposta.status;
        throw erro;
    }

    // Segunda espera: o corpo ainda precisa ser lido e interpretado como JSON.
    // Se o texto não for JSON válido, resposta.json() rejeita com SyntaxError.
    const documento = await resposta.json();
    return documento.tarefas ?? [];
}

async function api(url, method = "GET", dados) {
    const resposta = await fetch(url, {
        method,
        headers: dados ? { "Content-Type": "application/json" } : {},
        body: dados ? JSON.stringify(dados) : undefined
    });
    const texto = await resposta.text();
    let resultado = {};

    if (texto) {
        try {
            resultado = JSON.parse(texto);
        } catch {
            resultado = {};
        }
    }

    if (!resposta.ok) {
        const error = new Error(
            resultado.error || `Não foi possível concluir a solicitação (${resposta.status}).`
        );
        error.status = resposta.status;
        throw error;
    }

    return resultado;
}

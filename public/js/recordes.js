const conteudoRecordes = document.getElementById("recordes-conteudo");
const statusRecordes = document.getElementById("recordes-status");
const nomePiloto = document.getElementById("nome-piloto");
const formularioRecorde = document.getElementById("form-recorde");
const feedbackRecorde = document.getElementById("recorde-feedback");
let usuarioAtual;

function formatarTempo(tempoMs) {
    const minutos = Math.floor(tempoMs / 60000);
    const segundos = Math.floor((tempoMs % 60000) / 1000);
    const milissegundos = tempoMs % 1000;

    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}.${String(milissegundos).padStart(3, "0")}`;
}

function criarItemRecorde(recorde, posicao) {
    const item = document.createElement("li");
    const colocacao = document.createElement("span");
    const piloto = document.createElement("span");
    const tempo = document.createElement("strong");

    colocacao.className = "posicao";
    colocacao.textContent = String(posicao).padStart(2, "0");
    piloto.className = "piloto";
    piloto.textContent = `${recorde.nome}${recorde.idUsuario === usuarioAtual.id ? " (Você)" : ""}`;
    tempo.textContent = formatarTempo(recorde.tempoMs);

    item.append(colocacao, piloto, tempo);
    return item;
}

function renderizarLista(elemento, recordes) {
    elemento.replaceChildren();

    if (recordes.length === 0) {
        const vazio = document.createElement("li");
        vazio.className = "recorde-vazio";
        vazio.textContent = "Nenhum recorde cadastrado ainda.";
        elemento.appendChild(vazio);
        return;
    }

    recordes.forEach((recorde, indice) => {
        elemento.appendChild(criarItemRecorde(recorde, indice + 1));
    });
}

async function atualizarRecordes() {
    const resposta = await api("/api/recordes");
    const recordes = resposta.recordes;

    renderizarLista(
        document.getElementById("melhores-recordes"),
        recordes.slice(0, 5)
    );
    renderizarLista(
        document.getElementById("piores-recordes"),
        recordes.slice(-5).reverse()
    );
    renderizarLista(document.getElementById("lista-recordes"), recordes);
}

function tratarErro(error) {
    if (error.status === 401) {
        location.href = "login.html";
        return;
    }

    return error.status
        ? error.message
        : "Não foi possível conectar ao servidor. Tente novamente.";
}

formularioRecorde.addEventListener("submit", async (event) => {
    event.preventDefault();
    feedbackRecorde.textContent = "";

    if (!formularioRecorde.reportValidity()) {
        return;
    }

    const botaoSalvar = formularioRecorde.querySelector("button[type='submit']");
    const tempoMs = Math.round(Number(document.getElementById("tempo-recorde").value) * 1000);
    botaoSalvar.disabled = true;

    try {
        await api("/api/recordes", "POST", { tempoMs });
        formularioRecorde.reset();
        await atualizarRecordes();
        feedbackRecorde.textContent = "Recorde salvo! Ele já aparece na lista.";
    } catch (error) {
        feedbackRecorde.textContent = tratarErro(error);
    } finally {
        botaoSalvar.disabled = false;
    }
});

async function carregarPaginaRecordes() {
    try {
        const resposta = await api("/api/auth/logado");
        usuarioAtual = resposta.user;
        nomePiloto.textContent = usuarioAtual.nome;
        conteudoRecordes.hidden = false;
        statusRecordes.hidden = true;
    } catch (error) {
        if (error.status === 401) {
            location.href = "login.html";
            return;
        }

        statusRecordes.textContent = tratarErro(error);
        return;
    }

    try {
        await atualizarRecordes();
    } catch (error) {
        document.getElementById("ranking-status").textContent =
            `Não foi possível carregar os recordes: ${tratarErro(error)}`;
    }
}

carregarPaginaRecordes();

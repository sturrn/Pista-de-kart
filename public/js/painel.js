function mostrarErro(error) {
    if (error.status === 401) {
        location.href = "login.html";
        return;
    }
    const status = document.getElementById("painel-status");
    status.textContent = error.message || "Erro inesperado.";
    status.hidden = false;
}

const nomeUsuario = document.getElementById("user-name");

async function load() {
    const user = await api("/api/auth/logado");
    nomeUsuario.textContent = user.user.nome;

    const listaReservas = document.getElementById("lista-reservas");
    const guia = document.getElementById("guia");

    const resposta = await api("/api/reserva");
    listaReservas.innerHTML = "";

    if (resposta.reservas.length === 0) {
        guia.textContent = "Nenhuma reserva encontrada.";
        return;
    }

    guia.textContent = "";
    for (const item of resposta.reservas) {
        const x = document.createElement("div");
        x.className = "item-reserva";
        const data = document.createElement("div");
        data.textContent = `Data: ${item.data}`;
        const horario = document.createElement("div");
        horario.textContent = `Horário: ${item.horas}h`;
        const pacote = document.createElement("div");
        pacote.textContent = `Pacote: ${item.tipoReserva === 1 ? "Simples" : "Completo"}`;
        x.append(data, horario, pacote);
        listaReservas.appendChild(x);
    }
}

const botaoSair = document.getElementById("botaoSair");
botaoSair.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
        await api("/api/auth/logout", "POST");
    } finally {
        location.href = "index.html";
    }
});

load().catch(mostrarErro);

const formReserva = document.getElementById("reserva-pista");
formReserva.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dia = document.getElementById("data").value;
    const pacote = Number(document.getElementById("pacote").value);
    const horas = Number(document.getElementById("horas").value);

    try {
        await api("/api/reserva", "POST", {
            dia,
            horas,
            pacote
        });
        alert("Reserva criada");
        document.getElementById("painel-status").hidden = true;
        formReserva.reset();
        await load();
    } catch (error) {
        mostrarErro(error);
    }
});

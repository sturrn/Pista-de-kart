const formCadastro = document.getElementById("form-cadastro");
formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nomeCadastro = document.getElementById("nome-cadastro").value.trim();
    const telefoneCadastro = document.getElementById("telefone-cadastro").value.trim();
    const emailCadastro = document.getElementById("email-cadastro").value.trim();
    const senhaCadastro = document.getElementById("senha-cadastro").value;
    const confirma = document.getElementById("confirmacao").value;

    if (confirma !== senhaCadastro) {
        alert("As senhas não coincidem.");
        return;
    }

    try {
        await api("/api/auth/cadastro", "POST", {
            nome: nomeCadastro,
            telefone: telefoneCadastro,
            email: emailCadastro,
            senha: senhaCadastro
        });
        location.href = "painel.html";
    } catch (error) {
        alert(error.message || "Erro ao cadastrar");
    }
});

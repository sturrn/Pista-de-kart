const formLogin = document.getElementById("login-form");
const feedbackLogin = document.getElementById("login-feedback");
const botaoLogin = formLogin.querySelector("button[type='submit']");

formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailLogin = document.getElementById("email-login").value.trim();
    const senhaLogin = document.getElementById("senha-login").value;

    feedbackLogin.textContent = "";
    botaoLogin.disabled = true;

    try {
        await api("/api/auth/login", "POST", {
            email: emailLogin,
            senha: senhaLogin
        });
        location.href = "painel.html";
    } catch (error) {
        feedbackLogin.textContent = error.message || "Erro ao fazer login.";
    } finally {
        botaoLogin.disabled = false;
    }
});

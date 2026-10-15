import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser"
import helmet from "helmet";
import rateLimit from "express-rate-limit"
import "dotenv/config";
 
import {
    buscarEmail, criarReserva, listaReserva, buscarUsuarioID, criarUser,
    criarRecorde, listaRecordes
} from "./db.js"
 
const app = express();
const TEMPO_SESSAO = 15;
const PORT = Number(process.env.PORT) || 3000;
 
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Faltou criar o segredo JWT")
}
 
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
 
 
const opcoesCookies = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TEMPO_SESSAO * 60 * 1000
};
 
function login (res, usuario) {
    const token = jwt.sign(
        { sub: String(usuario.id)},
        process.env.JWT_SECRET,
        { expiresIn: `${TEMPO_SESSAO}m`}
    )  
    res.cookie("acess_token", token, opcoesCookies)
}
 
app.post("/api/auth/cadastro", async (req, res) => {
    const nome = typeof req.body?.nome === "string" ? req.body.nome : "";
    const telefone = typeof req.body?.telefone === "string" ? req.body.telefone.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const senha = typeof req.body?.senha === "string" ? req.body.senha : "";
 
    if (nome.length >80) {
        return res.status(400).json({ error: "Nome inválido"})
    }
    if (senha.length < 8 || senha.length > 72) {
        return res.status(400).json({error: "A senha deve ter entre 8 e 72 caracteres"})
    }
    const verificarEmail = await buscarEmail(email);
    if (verificarEmail) {
        return res.status(409).json({ error: "Não foi possível cadastrar."})
    }
    const senhaHash = await bcrypt.hash(senha, 10)
    const user = await criarUser(nome, telefone, email, senhaHash)
    login(res, user);
    res.status(201).json({user})
})
 
const limiteLogin = rateLimit({
    windowMs: 900000,
    limit: 5,
    message: { error: "Tentativas excedidas. Aguarde 15 minutos."}
})
 
app.post("/api/auth/login", limiteLogin, async (req,res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const senha = typeof req.body?.senha === "string" ? req.body.senha : "";
 
    const user =await buscarEmail(email);
    const verificar = user && await bcrypt.compare(senha, user.senhaHash)
    if(!verificar) {
        return res.status(401).json({error: "Email ou senha inválidos."})
    }
    login(res, user);
    res.json({ user: { id: user.id, nome: user.nome, email: user.email}})
})
 
function requerLogin (req, res, next) {
    const token = req.cookies.acess_token;
    if (!token) {
        return res.status(401).json({error: "Faça login para continuar"})
    }
    try {
        const valor = jwt.verify(token, process.env.JWT_SECRET);
        req.idUsuario = Number(valor.sub);
        next();
    } catch {
        res.status(401).json({ error: "Sessão expirada ou inválida."})
    }
}
 

app.get("/api/auth/logado", requerLogin, async (req, res) => {
    const user =await buscarUsuarioID(req.idUsuario);
    if(!user) {
        return res.status(401).json({ error: "Usuario nao encontrado"})
    }
    res.json({ user })
})
 
app.post("/api/auth/logout", (req,res) => {
    res.clearCookie("acess_token", opcoesCookies);
    res.json ({ message: "Logout efetuado."})
})
 
app.post("/api/reserva", requerLogin,async (req, res) => {
    const dia = typeof req.body?.dia === "string" ? req.body.dia : "";
    const horas = Number(req.body?.horas);
    const pacote = Number(req.body?.pacote);
 
    if(horas <1 || horas > 5) {
        return res.status(400).json({ error: "Horas inválidas"})
    }
 
    const reserva =await criarReserva(req.idUsuario, dia, horas, pacote);
    res.status(201).json({ reserva });
})
 
app.get ("/api/reserva", requerLogin,async (req, res) => {
    const reservas = await listaReserva(req.idUsuario)
    res.json({ reservas })
})

app.get("/api/recordes", requerLogin, async (req, res) => {
    const recordes = await listaRecordes();
    res.json({ recordes });
});

app.post("/api/recordes", requerLogin, async (req, res) => {
    const tempoMs = req.body?.tempoMs;
    if (!Number.isInteger(tempoMs) || tempoMs < 1000 || tempoMs > 600000) {
        return res.status(400).json({
            error: "Informe um tempo entre 1 segundo e 10 minutos."
        });
    }

    const recorde = await criarRecorde(req.idUsuario, tempoMs);
    res.status(201).json({ recorde });
});

app.get("/recordes.html", async (req, res) => {
    const token = req.cookies.acess_token;
    if (!token) {
        return res.redirect("/login.html");
    }

    let usuarioId;
    try {
        const sessao = jwt.verify(token, process.env.JWT_SECRET);
        usuarioId = Number(sessao.sub);
    } catch {
        return res.redirect("/login.html");
    }

    const user = await buscarUsuarioID(usuarioId);
    if (!user) {
        return res.redirect("/login.html");
    }

    res.sendFile("recordes.html", { root: "public" });
});

app.use(express.static("public"));
 
app.listen (PORT, () => {
    console.log("Servidor rodando")
})
 
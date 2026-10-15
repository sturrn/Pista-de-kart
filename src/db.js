 import sqlite3 from "sqlite3";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
 
fs.mkdirSync("data", { recursive: true });
 
const db = new sqlite3.Database(
    path.join("data", "kart.db")
);
 
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (error) {
            if (error) return reject(error);
 
            resolve({
                lastID: this.lastID,
                changes: this.changes
            });
        });
    });
}
 
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));
 
async function inicializarBanco() {
    await run("PRAGMA foreign_keys = ON");
 
    await run(`
        CREATE TABLE IF NOT EXISTS usuario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            telefone TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            senhaHash TEXT NOT NULL
        )
    `);
 
    await run(`
        CREATE TABLE IF NOT EXISTS reservas (
            idReserva INTEGER PRIMARY KEY AUTOINCREMENT,
            idUsuario INTEGER NOT NULL
                REFERENCES usuario(id),
            data TEXT NOT NULL,
            horas INTEGER NOT NULL,
            tipoReserva INTEGER NOT NULL
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS recordes (
            idRecorde INTEGER PRIMARY KEY AUTOINCREMENT,
            idUsuario INTEGER NOT NULL
                REFERENCES usuario(id) ON DELETE CASCADE,
            tempoMs INTEGER NOT NULL,
            criadoEm TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
}
 
await inicializarBanco();
 
export async function buscarEmail(email) {
    return await get(
        "SELECT * FROM usuario WHERE email = ?",
        [email]
    );
}
 
export async function buscarUsuarioID(id) {
    return await get(
        "SELECT id, nome, email FROM usuario WHERE id = ?",
        [id]
    );
}
 
export async function criarUser(
    nome,
    telefone,
    email,
    senhaHash
) {
    const resultado = await run(
        `INSERT INTO usuario
        (nome, telefone, email, senhaHash)
        VALUES (?, ?, ?, ?)`,
        [nome, telefone, email, senhaHash]
    );
 
    return {
        id: resultado.lastID,
        nome,
        email
    };
}
 
export async function criarReserva(
    idUsuario,
    dia,
    horas,
    pacote
) {
    const resultado = await run(
        `INSERT INTO reservas
        (idUsuario, data, horas, tipoReserva)
        VALUES (?, ?, ?, ?)`,
        [idUsuario, dia, horas, pacote]
    );
 
    return {
        idReserva: resultado.lastID,
        idUsuario,
        data: dia,
        horas,
        tipoReserva: pacote
    };
}
 
export async function listaReserva(idUsuario) {
    return await all(
        `SELECT idReserva, data, horas, tipoReserva
         FROM reservas
         WHERE idUsuario = ?
         ORDER BY data`,
        [idUsuario]
    );
}

export async function criarRecorde(idUsuario, tempoMs) {
    const resultado = await run(
        `INSERT INTO recordes (idUsuario, tempoMs)
         VALUES (?, ?)`,
        [idUsuario, tempoMs]
    );

    return await get(
        `SELECT recordes.idRecorde, recordes.idUsuario, usuario.nome,
                recordes.tempoMs, recordes.criadoEm
         FROM recordes
         JOIN usuario ON usuario.id = recordes.idUsuario
         WHERE recordes.idRecorde = ?`,
        [resultado.lastID]
    );
}

export async function listaRecordes() {
    return await all(
        `SELECT recordes.idRecorde, recordes.idUsuario, usuario.nome,
                recordes.tempoMs, recordes.criadoEm
         FROM recordes
         JOIN usuario ON usuario.id = recordes.idUsuario
         ORDER BY recordes.tempoMs, recordes.criadoEm`
    );
}

export function fecharBanco() {
    return new Promise((resolve, reject) => {
        db.close((error) => {
            if (error) return reject(error);
            resolve();
        });
    });
}
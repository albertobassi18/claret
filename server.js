// server.js — Claret (versione autonoma)
// Serve un unico file: Claret.html. Nessun login, nessun dato sul server:
// ogni utente tiene i propri dati nel proprio browser.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'Claret.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Claret in ascolto su :' + PORT));

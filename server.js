// server.js — Claret (versione autonoma + PWA)
// Serve l'app (Claret.html) e i file della PWA (manifest, service worker, icone).
// Nessun login, nessun dato sul server: ogni utente tiene i propri dati nel proprio browser/account.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// File statici della PWA (solo questi, non l'intera cartella)
['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png', 'claret-logo.png']
  .forEach(f => app.get('/' + f, (req, res) => res.sendFile(path.join(__dirname, f))));

// Tutto il resto -> l'app
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'Claret.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Claret in ascolto su :' + PORT));

// server.js — Claret backend
// Homepage di login → login FIG → serve l'app con i dati dell'utente.
// Le password NON vengono mai salvate su disco. Restano solo in RAM il tempo di
// ottenere i dati, poi si conserva in sessione soltanto il risultato (i tuoi score).

import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { login, fetchResults, fetchProfile } from './fig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1); // necessario dietro hosting (Render/Railway) per i cookie sicuri
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Database campi (statico, dal calcolatore pubblico Federgolf)
const COURSE_DB = JSON.parse(fs.readFileSync(path.join(__dirname, 'campi.json'), 'utf8'));

// Sessioni in memoria: sid -> { results, profile, createdAt }
// (per la produzione vera si userebbe Redis; per la beta la RAM basta)
const SESSIONS = new Map();
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8 ore
setInterval(() => {
  const now = Date.now();
  for (const [sid, s] of SESSIONS) if (now - s.createdAt > SESSION_TTL) SESSIONS.delete(sid);
}, 1000 * 60 * 30);

function currentSession(req) {
  const sid = req.cookies.claret_sid;
  return sid ? SESSIONS.get(sid) : null;
}

// --- Homepage: login ---
app.get('/', (req, res) => {
  if (currentSession(req)) return res.redirect('/app');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// --- POST login: usa le credenziali, scarica i dati, crea la sessione ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Inserisci numero tessera e password.' });
  try {
    const jar = await login(username.trim(), password);   // password usata solo qui, mai salvata
    const [results, profile] = await Promise.all([fetchResults(jar), fetchProfile(jar)]);
    if (!results.length) return res.status(502).json({ error: 'Accesso riuscito ma nessun risultato trovato.' });
    const sid = crypto.randomBytes(24).toString('hex');
    SESSIONS.set(sid, { results, profile: { ...profile, tessera: username.trim() }, createdAt: Date.now() });
    res.cookie('claret_sid', sid, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: SESSION_TTL });
    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ error: e.message || 'Accesso non riuscito.' });
  }
});

app.post('/api/logout', (req, res) => {
  const sid = req.cookies.claret_sid;
  if (sid) SESSIONS.delete(sid);
  res.clearCookie('claret_sid');
  res.json({ ok: true });
});

// --- App protetta ---
app.get('/app', (req, res) => {
  if (!currentSession(req)) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// --- Dati dell'utente loggato ---
app.get('/api/data', (req, res) => {
  const s = currentSession(req);
  if (!s) return res.status(401).json({ error: 'Sessione scaduta, rifai il login.' });
  res.json({ player: s.profile, results: s.results, courses: COURSE_DB });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Claret in ascolto su :${PORT}`));

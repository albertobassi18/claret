// fig.js — client per l'area riservata Federgolf
// Fa login con le credenziali del tesserato e scarica i suoi risultati.
// Nessuna password viene mai salvata: si usa solo al volo per ottenere un cookie di sessione,
// che resta in memoria per la durata della sessione utente.

import { parse } from 'node-html-parser';

const BASE = 'https://areariservata.federgolf.it';

// Estrae i cookie da una risposta e li accumula in un oggetto {nome: valore}
function collectCookies(res, jar) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of raw) {
    const [pair] = c.split(';');
    const idx = pair.indexOf('=');
    if (idx > 0) jar[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return jar;
}
function cookieHeader(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}

// Login: legge il form della pagina di login (campi + antiforgery token a runtime),
// poi invia le credenziali. Ritorna il cookie jar autenticato oppure lancia un errore.
export async function login(username, password) {
  const jar = {};
  // 1. GET pagina login → cookie iniziali + token antiforgery + nomi campi
  const g = await fetch(`${BASE}/Home/Login`, { redirect: 'manual', headers: { 'User-Agent': 'ClaretGolf/1.0' } });
  collectCookies(g, jar);
  const html = await g.text();
  const doc = parse(html);
  const form = doc.querySelector('form');
  if (!form) throw new Error('Pagina di login non riconosciuta (la FIG potrebbe aver cambiato il sito).');

  // Raccoglie tutti gli input del form (compreso __RequestVerificationToken se presente)
  const body = new URLSearchParams();
  for (const inp of form.querySelectorAll('input')) {
    const name = inp.getAttribute('name');
    if (name) body.append(name, inp.getAttribute('value') || '');
  }
  // Individua i campi utente/password in modo tollerante
  const fieldNames = [...form.querySelectorAll('input')].map(i => i.getAttribute('name')).filter(Boolean);
  const userField = fieldNames.find(n => /user|utente|login|tessera|username/i.test(n)) || 'Username';
  const passField = fieldNames.find(n => /pass|pwd/i.test(n)) || 'Password';
  body.set(userField, username);
  body.set(passField, password);

  const action = form.getAttribute('action') || '/Home/Login';
  const postUrl = action.startsWith('http') ? action : BASE + action;

  // 2. POST credenziali
  const p = await fetch(postUrl, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader(jar),
      'User-Agent': 'ClaretGolf/1.0',
      'Origin': BASE,
      'Referer': `${BASE}/Home/Login`
    },
    body: body.toString()
  });
  collectCookies(p, jar);

  // Login riuscito se ci ridirige fuori dalla pagina di login (redirect 302 verso area riservata)
  const loc = p.headers.get('location') || '';
  const ok = (p.status === 302 || p.status === 303) && !/login/i.test(loc);
  if (!ok) {
    // ricontrolla: alcune configurazioni tornano 200 con la home
    const txt = await p.text().catch(() => '');
    if (/Home\/Logout|areariservata|Lista Funzioni/i.test(txt)) return jar;
    throw new Error('Credenziali non valide o accesso rifiutato dalla Federazione.');
  }
  return jar;
}

// Scarica la griglia risultati completa e la trasforma nel formato usato dall'app.
export async function fetchResults(jar) {
  // Imposta pagesize alto e prende la pagina
  await fetch(`${BASE}/Risultati/ShowGrid`, { headers: { 'Cookie': cookieHeader(jar), 'User-Agent': 'ClaretGolf/1.0' } });
  const res = await fetch(`${BASE}/Risultati/Paging`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader(jar),
      'User-Agent': 'ClaretGolf/1.0',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: new URLSearchParams({ pagesize: '1000', page: '1' }).toString()
  });
  const html = await res.text();
  return parseResults(html);
}

// Parser della tabella risultati → array di oggetti {d,g,club,giro,f,b,v,ph,par,cr,sr,stbl,ags,pcc,sd,io,inw,va}
export function parseResults(html) {
  const doc = parse(html);
  const table = doc.querySelector('table.entity-list-view') || doc.querySelector('table');
  if (!table) return [];
  const rows = table.querySelectorAll('tr').slice(1);
  const out = [];
  for (const tr of rows) {
    const c = tr.querySelectorAll('td').map(td => td.text.trim());
    if (c.length < 20) continue;
    out.push({
      d: c[0], g: c[3], club: c[6], giro: c[7], f: c[8], b: c[9], v: c[10],
      ph: c[11], par: c[12], cr: c[13], sr: c[14], stbl: c[15], ags: c[16],
      pcc: c[17], sd: c[18], io: c[21], inw: c[22], va: c[23]
    });
  }
  return out;
}

// Nome del tesserato (per la testata)
export async function fetchProfile(jar) {
  try {
    const r = await fetch(`${BASE}/areariservata`, { headers: { 'Cookie': cookieHeader(jar), 'User-Agent': 'ClaretGolf/1.0' } });
    const doc = parse(await r.text());
    const name = doc.querySelector('.user-name, .username, h1, h2')?.text?.trim();
    return { name: name || 'Tesserato FIG' };
  } catch { return { name: 'Tesserato FIG' }; }
}

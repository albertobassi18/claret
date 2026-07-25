// fig.js — client per l'area riservata Federgolf
// Fa login con le credenziali del tesserato e scarica i suoi risultati.
// Nessuna password viene mai salvata: si usa solo al volo per ottenere un cookie di sessione,
// che resta in memoria per la durata della sessione utente.

import { parse } from 'node-html-parser';

const BASE = 'https://areariservata.federgolf.it';

// Header che imitano una vera navigazione da browser: il server FIG rifiuta (400)
// le richieste che non li includono.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const NAV_HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1'
};

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

// Login: la pagina FIG costruisce il form via JavaScript e invia le credenziali
// (campi User / Password) in POST a /Home/AuthenticateUser. Non c'è antiforgery token.
// Facciamo prima un GET per ottenere il cookie di sessione, poi il POST.
export async function login(username, password) {
  const jar = {};
  // 1. GET pagina login → cookie di sessione
  const g = await fetch(`${BASE}/Home/Login`, { redirect: 'manual', headers: { ...NAV_HEADERS, 'Sec-Fetch-Site': 'none' } });
  collectCookies(g, jar);

  // 2. POST credenziali all'endpoint reale, imitando una navigazione da form
  const body = new URLSearchParams({ returnUrl: '', User: username, Password: password });
  const p = await fetch(`${BASE}/Home/AuthenticateUser`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      ...NAV_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader(jar),
      'Origin': BASE,
      'Referer': `${BASE}/Home/Login`
    },
    body: body.toString()
  });
  collectCookies(p, jar);

  const loc = p.headers.get('location') || '';
  // Login riuscito = redirect verso l'area riservata (non di nuovo verso la login)
  const redirectedOk = (p.status === 302 || p.status === 303) && !/login/i.test(loc);
  if (redirectedOk) return jar;

  const txt = await p.text().catch(() => '');
  // Alcune risposte tornano 200: controlla se siamo dentro
  if (p.status === 200 && /Home\/Logout|Lista Funzioni|Anagrafica tesserati/i.test(txt)) return jar;

  // --- Diagnostica dettagliata (temporanea) per capire cosa risponde la FIG ---
  if (p.status === 400) {
    throw new Error('DIAG: la FIG ha risposto 400 (richiesta rifiutata a monte, non è la password). Header ancora insufficienti.');
  }
  if (p.status === 200 && /Credenziali non valide/i.test(txt)) {
    const gotCookies = Object.keys(jar).join(',') || 'nessuno';
    throw new Error('DIAG: 200 con "Credenziali non valide". Cookie di sessione ottenuti dal GET: [' + gotCookies + ']. Se sono giusti, il POST non riceve la sessione.');
  }
  throw new Error('DIAG: risposta inattesa status=' + p.status + ' location="' + loc + '" primi100="' + txt.slice(0, 100).replace(/\s+/g, ' ') + '"');
}

// Scarica la griglia risultati completa e la trasforma nel formato usato dall'app.
export async function fetchResults(jar) {
  // Imposta pagesize alto e prende la pagina
  await fetch(`${BASE}/Risultati/ShowGrid`, { headers: { 'Cookie': cookieHeader(jar), 'User-Agent': UA } });
  const res = await fetch(`${BASE}/Risultati/Paging`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookieHeader(jar),
      'User-Agent': UA,
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
    const r = await fetch(`${BASE}/areariservata`, { headers: { 'Cookie': cookieHeader(jar), 'User-Agent': UA } });
    const doc = parse(await r.text());
    const name = doc.querySelector('.user-name, .username, h1, h2')?.text?.trim();
    return { name: name || 'Tesserato FIG' };
  } catch { return { name: 'Tesserato FIG' }; }
}

# Mettere Claret online su claret.golf — guida completa

Tre tappe: **GitHub** (ospita il codice) → **Render** (lo esegue) → **GoDaddy** (il dominio).
Account gratuiti. ~30 minuti. Non serve saper programmare, basta seguire i clic.

---

## TAPPA 1 — Caricare il codice su GitHub

1. Vai su **github.com** e crea un account gratuito (se non ce l'hai).
2. In alto a destra: **+** → **New repository**.
3. Nome: `claret` · lascia **Public** o **Private** (indifferente) · **Create repository**.
4. Nella pagina che appare clicca **"uploading an existing file"** (link azzurro al centro).
5. Apri sul computer la cartella **claret-app**. Seleziona TUTTO il contenuto
   **TRANNE la cartella `node_modules`** (quella non va caricata) e trascinalo nella
   pagina GitHub. Devi caricare: `server.js`, `fig.js`, `campi.json`, `package.json`,
   `package-lock.json`, `.gitignore`, i due file `.md`, e la cartella `public`.
6. In fondo clicca **Commit changes**.

Ora il tuo codice è su GitHub. ✅

---

## TAPPA 2 — Pubblicarlo con Render

1. Vai su **render.com** → **Get Started** → accedi **con GitHub** (un clic, autorizza).
2. Dashboard → **Add new** → **Web Service**.
3. Trova il repository `claret` nell'elenco → **Connect**.
4. Compila così:
   - **Name**: `claret`
   - **Region**: Frankfurt (la più vicina)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. Clicca **Create Web Service**. Render installa e avvia (2-3 minuti).
6. Quando in alto compare **"Live"**, hai un indirizzo tipo `https://claret.onrender.com`.
   Aprilo: dovresti vedere la schermata di login di Claret. **Provala con le tue
   credenziali FIG.**

> Nota: nel piano gratuito, se nessuno la usa per un po', al primo accesso ci mette
> ~40 secondi a "svegliarsi". Normale, per far testare agli amici va benissimo.

---

## TAPPA 3 — Collegare claret.golf (GoDaddy)

1. In Render, apri il tuo servizio → menu **Settings** → sezione **Custom Domains**
   → **Add Custom Domain**.
2. Scrivi `claret.golf` e conferma. Poi aggiungi anche `www.claret.golf`.
3. Render mostra **i valori DNS esatti da copiare** (un record per il dominio nudo e
   uno per il www). Tienili aperti: ti servono adesso.
4. In un'altra scheda vai su **godaddy.com** → accedi → **I miei prodotti** →
   accanto a `claret.golf` clicca **DNS**.
5. Inserisci i record che Render ti ha mostrato:
   - Di solito: un record **CNAME** con Nome `www` e Valore = quello dato da Render.
   - Per `claret.golf` "nudo" Render dà un record **A** (un indirizzo IP) oppure ti
     indica di fare un reindirizzamento a `www`. **Segui esattamente ciò che scrive
     Render** — cambia caso per caso, quindi copia i suoi valori, non inventarli.
   - Se GoDaddy ha già record `A` o `CNAME` con quei nomi, modificali invece di
     aggiungerne di nuovi.
6. Salva. Ora si aspetta: la propagazione DNS richiede da 15 minuti a qualche ora.
7. Torna su Render: accanto al dominio comparirà **"Verified"** e l'HTTPS si attiva
   da solo. Da quel momento **https://claret.golf** è online. 🎉

---

## Aggiornare l'app in futuro

Quando vuoi cambiare qualcosa (o se la FIG modifica il sito e va aggiornato `fig.js`):
carica il file modificato su GitHub (stessa procedura del punto 1.4-1.6, sovrascrive).
Render se ne accorge e ripubblica da solo in un paio di minuti.

---

## Se qualcosa non va

- **La login dà "credenziali non valide" ma sono giuste** → la FIG potrebbe aver
  cambiato i nomi dei campi del form. Va aggiornato `fig.js`. Scrivimi e lo sistemo.
- **"Application failed to respond" / pagina bianca** → su Render apri **Logs** e
  guarda l'errore; spesso è un file mancante nell'upload (ricontrolla la Tappa 1.5).
- **Il dominio non si collega** → ricontrolla che i valori DNS su GoDaddy siano
  identici a quelli mostrati da Render, e aspetta ancora un po' (il DNS è lento).

---

## Promemoria per quando la farai testare agli amici

Diglielo chiaramente: è una **beta tra amici**. Le loro password FIG passano dal tuo
server. Va bene in una cerchia ristretta e fidata; prima di aprirla al pubblico vanno
irrobustite sicurezza e sessioni (vedi `COME-PUBBLICARE.md`).

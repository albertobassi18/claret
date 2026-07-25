# Pubblicare Claret su claret.golf

Guida passo-passo per mettere online l'app. Non serve essere programmatori, ma
un paio di passaggi richiedono attenzione (le password degli utenti).

---

## Cosa fa questa app

- **Homepage** (`/`): schermata di login con le credenziali Federgolf.
- Il **server** fa login sull'area riservata FIG al posto dell'utente, scarica i suoi
  risultati e glieli mostra nell'app Claret.
- Ogni utente entra e trova **i suoi** dati. La password **non viene mai salvata**:
  è usata solo al momento del login per ottenere i dati.

File del progetto:
- `server.js` — il server web
- `fig.js` — il collegamento a Federgolf (login + scaricamento risultati)
- `campi.json` — database dei 222 circoli italiani (CR/Slope/Par)
- `public/login.html` — la homepage di accesso
- `public/app.html` — l'app Claret

---

## Passo 1 — Scegliere dove ospitarla

Serve un hosting che esegua Node.js (un semplice "spazio web" non basta).
Il più semplice per iniziare è **Render** (ha un piano gratuito) o **Railway** (~5 €/mese).

Esempio con **Render**:
1. Crea un account su render.com
2. Carica questa cartella su un repository GitHub (o usa "Deploy from folder")
3. New → Web Service → collega il repo
4. Build command: `npm install` · Start command: `npm start`
5. Render assegna un indirizzo tipo `claret.onrender.com`

## Passo 2 — Collegare il dominio claret.golf (GoDaddy)

1. Nel pannello dell'hosting (Render/Railway) aggiungi il dominio `claret.golf`
   → ti darà un valore CNAME o un indirizzo IP.
2. Entra in **GoDaddy → I miei prodotti → claret.golf → DNS**.
3. Aggiungi un record:
   - Tipo **CNAME**, Nome `www`, Valore = l'indirizzo dato dall'hosting.
   - Per il dominio nudo `claret.golf` usa un record **A** (o "Forwarding") verso l'IP indicato.
4. Attendi qualche ora (propagazione DNS). L'hosting attiva l'HTTPS automaticamente.

## Passo 3 — Provare

Vai su `https://claret.golf`, inserisci la tua tessera e password FIG: dovresti
entrare e vedere i tuoi dati.

---

## ⚠️ Prima di aprirla ad altri — da leggere

Questa è una **beta funzionante**, non ancora un prodotto pronto per il pubblico.
Tre cose vanno sistemate prima di condividerla con altri golfisti:

1. **Sicurezza delle password.** Oggi la password viaggia cifrata (HTTPS) e non viene
   salvata, ma le sessioni stanno nella memoria del server. Per un uso pubblico serve:
   un cookie di sessione firmato, sessioni su un database (Redis), e un controllo di
   sicurezza da parte di qualcuno che se ne intende. Stai maneggiando le password
   della Federazione di altre persone: è una responsabilità seria.

2. **Se la FIG cambia il sito, l'app si ferma.** Il collegamento (`fig.js`) legge le
   pagine dell'area riservata. Se la Federazione le modifica, va aggiornato. È
   probabilmente il motivo per cui QuiGolf ha smesso di funzionare.

3. **Termini d'uso / rapporto con la FIG.** Fare login automatico per conto di terzi
   è in zona grigia. Per te personale va bene; offrirlo pubblicamente conviene prima
   chiarirlo con la Federazione — o proporre una collaborazione ufficiale.

---

## Uso solo personale (senza pubblicarla)

Se per ora vuoi usarla solo tu, sul tuo computer:
1. Installa Node.js (nodejs.org)
2. In questa cartella: `npm install` poi `npm start`
3. Apri `http://localhost:3000`

I dati restano sul tuo computer, nessun problema di privacy o di password altrui.

# Specifiche Tecniche e Funzionali: Diario delle Misurazioni Pressorie Web App

**Progetto:** Diario Digitale delle Misurazioni Pressorie (Multi-Medico & Pazienti)  
**Data di analisi:** Settembre 2026  
**Ruolo:** Full-Stack Developer & Software Analyst  
**Piattaforma target:** Web Responsive (Desktop & Mobile-First PWA con micro-interazioni e trend 2026)  
**Hosting & DB:** Vercel.com + Turso (LibSQL / SQLite Serverless su Edge)

---

## 1. Visione del Progetto e Obiettivi Clinico-Utente

L'applicazione è concepita come uno strumento medico-digitale ad alta usabilità per il monitoraggio della pressione arteriosa domiciliare.

### Principi Guida di Design & UX (Trend 2026)
1. **Mobile-First & App-Like Feel:** Esperienza fluida tramite Progressive Web App (PWA) installabile su iOS e Android senza passare dagli store.
2. **Accessibilità & Riduzione del Carico Cognitivo:** Progettata pensando anche a pazienti anziani o con scarsa dimestichezza digitale. Utilizzo di testi ad alto contrasto, tastierini numerici nativi a tutto schermo, pulsanti touch-friendly e chiarezza semantica.
3. **Micro-interazioni & Feedback Tattile/Visivo:** Transizioni fluide tra i giorni del calendario orizzontale, feedback cromatici immediati all'inserimento dei valori (conformi alle linee guida ESC/ESH) e messaggi contestuali mai allarmistici ma chiari.
4. **Isolamento Clinico Multi-Medico:** Architettura pronta per il supporto multi-medico con segregazione completa dei dati anagrafici e clinici tra diversi professionisti sanitari.

---

## 2. Architettura Tecnica e Stack Tecnologico

| Componente | Tecnologia Selezionata | Motivazione Tecnica |
| :--- | :--- | :--- |
| **Hosting & Deployment** | **Vercel** | Scalabilità globale serverless, latenza minima, gestione automatizzata dei deploy e Vercel Cron integrato. |
| **Database** | **Turso (LibSQL / SQLite)** | Database SQLite serverless conforme al requisito SQLite, residente su Edge, compatibile nativamente con Vercel. |
| **Framework Full-Stack** | **Next.js (App Router, React 19, TypeScript)** | Rendering ibrido (SSR/SSG/Server Actions), routing moderno e massima velocità di esecuzione. |
| **Styling & Design System** | **Tailwind CSS + shadcn/ui + Lucide Icons** | Design system consistente, accessibile, predisposto per dark/light mode e micro-animazioni. |
| **Micro-interazioni & UI** | **Framer Motion** | Animazioni per slide del tutorial, transizioni del calendario orizzontale e modali contestuali. |
| **Grafici Clinici** | **Recharts** | Grafici reattivi a linee e a barre (trend pressorio, medie sistolica/diastolica e frequenza cardiaca). |
| **Notifiche Push** | **Web Push API + VAPID + Service Worker** | Notifiche push native su smartphone anche ad applicazione chiusa. |
| **Pianificazione Notifiche** | **Vercel Cron Jobs** | Esecuzione programmata dei controlli cutoff alle ore 11:00, 16:00, 22:00. |
| **Gestione Credenziali / Email** | **Stampa Scheda PDF / Resend Ready** | Generazione foglio credenziali per consegna a mano + predisposizione Resend (React Email) all'attivazione del dominio. |
| **Esportazione Report** | **PDF Generator (@react-pdf o Edge HTML-to-PDF)** | Creazione del documento clinico stampabile con medie, percentuali a target e cronologia completa. |

---

## 3. Regole Cliniche e Logiche di Business

### 3.1. Classificazione Pressoria (Linee Guida ESC/ESH)
Ad ogni inserimento di pressione sistolica (MAX) e diastolica (MIN) viene calcolata la categoria:
- 🟢 **Ottimale / Normale:** MAX < 130 mmHg e MIN < 85 mmHg.
- 🟡 **Normale-Alta (Pre-ipertensione):** MAX 130–139 mmHg oppure MIN 85–89 mmHg.
- 🔴 **Ipertensione (Grado 1-2-3):** MAX ≥ 140 mmHg oppure MIN ≥ 90 mmHg.
- ⚠️ **Soglia di Allerta / Crisi:** MAX ≥ 180 mmHg oppure MIN ≥ 110 mmHg. Scatta una modale cautelare di sicurezza che consiglia di ripetere la misurazione a riposo e, se confermata, di avvisare il medico.

### 3.2. Procedura di Avvio Ciclo (Doppia Misurazione Bilaterale)
- All'inizio del primo ciclo "Da Iniziare", dopo l'onboarding, il paziente esegue la misurazione su **entrambe le braccia (Destro e Sinistro)**.
- Il braccio con la pressione sistolica (MAX) più alta viene memorizzato come **Braccio di Riferimento Ufficiale** per tutte le future rilevazioni.
- In caso di **parità esatta** di sistolica, una modale consente al paziente di scegliere manualmente quale braccio utilizzare.
- La misurazione del braccio scelto viene registrata come prima misurazione del **Giorno 1**, e il paziente indica a quale slot assegnarla (Mattina, Pomeriggio o Sera).

### 3.3. Calendario Giornaliero e Cutoff Orari
- Ogni giornata del ciclo prevede **3 slot di misurazione:**
  1. **Mattina** (Cutoff promemoria: ore 11:00)
  2. **Pomeriggio** (Cutoff promemoria: ore 16:00)
  3. **Sera** (Cutoff promemoria: ore 22:00)
- **Regola di compilazione:** I cutoff fungono da promemoria non vincolante (invio Web Push se lo slot è ancora vuoto).
- **Retroattività:** Il paziente può compilare o correggere le misurazioni di oggi e di tutti i giorni passati. I giorni futuri sono bloccati.

### 3.4. Ciclo di Controllo: Stati e Ordinamento
- **Stati del ciclo:**
  - `da iniziare`: Creato dal medico, in attesa della prima misurazione.
  - `in corso`: Dalla prima misurazione per X settimane consecutive.
  - `in pausa`: Sospeso temporaneamente dal medico.
  - `concluso`: Terminato al raggiungimento dell'ultimo giorno.
  - `annullato`: Interrotto anticipatamente dal medico.
- **Ordinamento interfaccia paziente:**
  1. Cicli con stato `in corso` (massima priorità visiva).
  2. Cicli con stato `da iniziare` e `in pausa`.
  3. Cicli con stato `concluso` o `annullato`.
  - Ordinamento secondario: Data di creazione decrescente.

### 3.5. Note di Terapia del Medico
- **Note Condivise per il Paziente:** Visibili nella scheda del paziente (es. "Assumere Ramipril 5mg alle ore 08:00").
- **Note Private Medico:** Visibili solo al medico per annotazioni cliniche riservate.

---

## 4. Mappa del Sito (Sitemap Completa)

```
[AREA PUBBLICA & AUTENTICAZIONE]
├── /                       -> P1: Landing Page / Selezione Ruolo
├── /login/medico           -> P2: Login Medico (Email + Password)
└── /login/paziente         -> P3: Login Paziente (Codice Fiscale + PIN 6 cifre)

[AREA MEDICO] (Protetto da autenticazione medico)
├── /medico/dashboard       -> P4: Dashboard Overview (Riepilogo attività, alert, scorciatoie)
├── /medico/pazienti        -> P5: Anagrafica Pazienti & Elenco Completo
│   ├── [MODALE]            -> M1: Creazione Nuovo Paziente
│   └── [MODALE]            -> M2: Stampa / Condivisione Scheda Credenziali (PDF)
├── /medico/pazienti/[id]   -> P6: Scheda Dettaglio Paziente & Diario Clinico
│   ├── [MODALE]            -> M3: Creazione Nuovo Ciclo di Controllo
│   ├── [MODALE]            -> M4: Gestione Stato Ciclo (Pausa / Annulla / Elimina)
│   ├── [MODALE]            -> M5: Inserimento Note di Terapia (Condivisa vs Privata)
│   └── [AZIONE]            -> Export Report Clinico PDF del Ciclo
└── /medico/comunicazioni   -> [MODALE/SEZIONE] M6: Invio Comunicazione / Notifiche Push (Tutti o 1..N)

[AREA PAZIENTE] (Protetto da sessione paziente con CF + PIN)
├── /paziente/cicli         -> P7: Elenco Cicli di Controllo del Paziente
└── /paziente/diario/[id]   -> P8: Diario delle Misurazioni (Calendario Orizzontale + Slot Giornalieri)
    ├── [MODALE]            -> M7: Tutorial / Onboarding Ciclo "Da Iniziare" (3-4 step)
    ├── [MODALE]            -> M8: Procedura Misurazione Iniziale Bilaterale (DX vs SX)
    ├── [MODALE]            -> M9: Inserimento / Modifica Misurazione Singola
    ├── [MODALE]            -> M10: Alert Cautelare per Valori Critici (Sistolica/Diastolica fuori scala)
    ├── [MODALE]            -> M11: Schermata / Modale di Conclusione Ciclo
    ├── [MODALE]            -> M12: Visualizzazione Note di Terapia del Medico
    └── [MODALE]            -> M13: Centro Notifiche e Comunicazioni In-App
```

---

## 5. Specifiche Dettagliate di Pagine e Modali

---

### AREA PUBBLICA & ACCESSO

#### [P1] Landing Page / Selezione Ruolo (`/`)
* **A cosa serve:** Schermata d'ingresso pulita e moderna con branding del diario pressorio e due schede per instradare l'utente al login Medico o Paziente.
* **Campi mostrati / richiesti:** Nessun dato in ingresso. Mostra logo, titolo applicazione, claim su salute cardiovascolare e due card interattive con icone (Card "Accesso Medico" e Card "Accesso Paziente").
* **Controlli presenti:**
  - Pulsante/Card "Area Medico" (reindirizza a `/login/medico`).
  - Pulsante/Card "Area Paziente" (reindirizza a `/login/paziente`).
  - Banner di richiesta installazione PWA ("Aggiungi alla schermata Home").
* **Messaggi a video:**
  - Testo introduttivo: *"Il tuo diario pressorio digitale, costantemente connesso con il tuo medico curante."*

---

#### [P2] Pagina Login Medico (`/login/medico`)
* **A cosa serve:** Accesso riservato al personale sanitario tramite credenziali sicure.
* **Campi mostrati / richiesti:**
  - Email (input di testo, validazione formato email).
  - Password (input password con icona mostra/nascondi).
  - Checkbox "Ricordami su questo dispositivo".
* **Controlli presenti:**
  - Pulsante "Accedi come Medico".
  - Link "Password dimenticata?".
  - Link per tornare alla selezione ruolo (`/`).
* **Messaggi a video:**
  - Errore credenziali errate: *"Email o password non corretti. Riprova."*
  - Errore account bloccato o non trovato: *"Utenza non autorizzata o disabilitata."*
  - Validazione campi vuoti: *"Inserisci un'email valida e la tua password."*

---

#### [P3] Pagina Login Paziente (`/login/paziente`)
* **A cosa serve:** Accesso ultra-semplificato per i pazienti, ottimizzato per smartphone e utenti senior.
* **Campi mostrati / richiesti:**
  - Codice Fiscale (input testuale con formattazione automatica in maiuscolo, 16 caratteri).
  - PIN di Accesso (6 caselle numeriche a visualizzazione singola con attivazione automatica del tastierino numerico mobile).
* **Controlli presenti:**
  - Pulsante ben visibile "Entra nel Diario".
  - Icona d'aiuto: "Hai perso il tuo PIN? Contatta il tuo medico per riceverne uno nuovo o ristampare la tua scheda".
  - Link rapido per tornare indietro.
* **Messaggi a video:**
  - Validazione CF errato: *"Il Codice Fiscale inserito non è valido (16 caratteri alfanumerici)."*
  - Validazione PIN incompleto: *"Inserisci tutte le 6 cifre del tuo PIN personale."*
  - Errore credenziali non trovate: *"Credenziali non riconosciute. Verifica il Codice Fiscale e il PIN presenti sulla scheda consegnata dal medico."*
  - Stato di caricamento: *"Verifica credenziali in corso..."*

---

### AREA MEDICO

#### [P4] Dashboard Medico (`/medico/dashboard`)
* **A cosa serve:** Centro di controllo generale del medico. Fornisce una panoramica sui pazienti seguiti, i cicli attivi e gli alert clinici recenti.
* **Campi mostrati / richiesti:**
  - Card di sintesi: Totale Pazienti seguiti, Cicli In Corso, Misurazioni registrate oggi, Alert valori critici nelle ultime 48h.
  - Elenco rapido "Attività Recenti": ultime misurazioni registrate dai pazienti con indicatore cromatico di livello pressorio.
  - Tabella scorciatoia dei pazienti con misurazioni mancanti o irregolari.
* **Controlli presenti:**
  - Pulsante principale "+ Nuovo Paziente" (apre [M1]).
  - Pulsante rapido "Invia Comunicazione Broadcast" (apre [M6]).
  - Barra di ricerca per nome/cognome/CF del paziente.
  - Menu di navigazione: Dashboard, Pazienti, Comunicazioni, Profilo Medico, Logout.
* **Messaggi a video:**
  - Stato vuoto (nessun paziente): *"Nessun paziente ancora registrato. Clicca su '+ Nuovo Paziente' per iniziare il monitoraggio."*
  - Notifica badge per valori critici: *"Attenzione: rilevati valori pressori fuori scala per [Nome Paziente]."*

---

#### [P5] Elenco Pazienti & Gestione Anagrafica (`/medico/pazienti`)
* **A cosa serve:** Gestione completa del censimento pazienti assegnati al medico curante.
* **Campi mostrati / richiesti:**
  - Tabella / Elenco Card responsive con: Nome, Cognome, Codice Fiscale, Telefono, Stato ultimo ciclo, Data ultima misurazione, Badge ultimo valore pressorio.
  - Barra di ricerca per testo libero (Nome, Cognome, CF).
  - Filtro per stato del ciclo (Tutti, In corso, Da iniziare, In pausa, Conclusi, Senza ciclo).
* **Controlli presenti:**
  - Pulsante "+ Aggiungi Paziente" (apre [M1]).
  - Clic sulla riga/card paziente: reindirizza alla scheda dettaglio (`/medico/pazienti/[id]`).
  - Azione rapida "Ristampa Scheda Credenziali" (apre [M2]).
  - Azione rapida "Nuovo Ciclo" (apre [M3]).
* **Messaggi a video:**
  - Ricerca senza risultati: *"Nessun paziente corrisponde ai criteri di ricerca impostati."*

---

#### [P6] Scheda Dettaglio Paziente & Diario Clinico (`/medico/pazienti/[id]`)
* **A cosa serve:** La schermata clinica più importante per il medico. Permette di analizzare l'andamento pressorio del paziente, consultare grafici dettagliati, gestire i cicli e aggiornare la terapia.
* **Campi mostrati / richiesti:**
  - **Header Paziente:** Nome, Cognome, Età/Data di nascita, Codice Fiscale, Contatti, Braccio di riferimento rilevato (DX o SX).
  - **Stato Ciclo Attivo:** Settimane totali, giorni trascorsi, percentuale di completamento, stato (`in corso`, `in pausa`, ecc.).
  - **Metriche Medie del Ciclo:** Media Sistolica, Media Diastolica, Frequenza media (BPM), Percentuale misurazioni a target (<140/90).
  - **Grafici Clinici Interattivi:**
    - *Grafico a Linee:* Andamento temporale Sistolica (MAX) e Diastolica (MIN) con linee orizzontali di soglia (140/90).
    - *Grafico a Barre:* Confronto medie per fascia oraria (Mattina vs Pomeriggio vs Sera).
  - **Tabella Cronologica Misurazioni:** Data, Ora, Slot, Braccio, MAX, MIN, BPM, Note paziente, Indicatore cromatico.
  - **Sezione Note di Terapia:** Box con storico indicazioni terapeutiche visibili al paziente e note private del medico.
* **Controlli presenti:**
  - Pulsante "Crea Nuovo Ciclo" (apre [M3], attivo se nessun ciclo è in corso).
  - Pulsante "Gestisci Ciclo" (apre [M4] per mettere in pausa, annullare o cancellare).
  - Pulsante "+ Nuova Nota Terapeutica" (apre [M5]).
  - Pulsante "Scarica Report PDF" (genera e scarica il report clinico completo).
  - Pulsante "Invia Notifica al Paziente" (apre [M6] pre-selezionando questo paziente).
* **Messaggi a video:**
  - Ciclo completato: *"Questo ciclo si è concluso con successo. È possibile avviare un nuovo ciclo di controllo o scaricare il PDF riassuntivo."*
  - Nessuna misurazione ancora presente: *"Il paziente non ha ancora registrato la prima misurazione del ciclo."*

---

### MODALI AREA MEDICO

#### [M1] Modale Creazione Nuovo Paziente
* **A cosa serve:** Censimento di un nuovo paziente nel database del medico con generazione istantanea del PIN.
* **Campi mostrati / richiesti:**
  - Nome (obbligatorio).
  - Cognome (obbligatorio).
  - Codice Fiscale (obbligatorio, 16 caratteri, validazione formale).
  - Data di nascita (obbligatorio).
  - Telefono / Cellulare (obbligatorio per contatti d'urgenza).
  - Email del paziente (facoltativo).
  - PIN Generato automaticamente (campo a 6 cifre casuale, modificabile dal medico con pulsante "Rigenera").
  - Note cliniche iniziali / anamnesi (facoltativo).
* **Controlli presenti:**
  - Pulsante "Genera PIN Casuale".
  - Pulsante "Salva Paziente".
  - Checkbox opzionale "Crea contestualmente il primo ciclo di controllo".
  - Pulsante "Annulla".
* **Messaggi a video:**
  - Conferma salvataggio: *"Paziente censito con successo! Si apre ora la scheda credenziali per la stampa."*
  - Errore duplicato: *"Attenzione: esiste già un paziente registrato con questo Codice Fiscale."*
  - Validazione: *"Tutti i campi contrassegnati con asterisco sono obbligatori."*

---

#### [M2] Modale Stampa / Condivisione Scheda Credenziali (PDF)
* **A cosa serve:** Mostra un foglio pulito, pronto per la stampa o l'invio al paziente contenente le istruzioni di accesso.
* **Campi mostrati / richiesti:**
  - Intestazione con Studio Medico / Nome Medico.
  - Dati Paziente: Nome e Cognome.
  - Codice Fiscale.
  - PIN Personale a 6 cifre (in carattere grande, chiaro ed evidenziato).
  - Indirizzo web a cui collegarsi (URL Vercel dell'applicazione) con annesso **QR Code** scansionabile con fotocamera dello smartphone per andare direttamente alla pagina di login.
  - Breve guida passo-passo in 3 punti: 1) Inquadra il QR Code o apri il sito, 2) Inserisci CF e PIN, 3) Segui la procedura iniziale.
* **Controlli presenti:**
  - Pulsante "Stampa Scheda" (apre finestra di stampa del browser/PDF).
  - Pulsante "Scarica PDF".
  - Pulsante "Invia via Email" (se è stata inserita l'email e quando sarà attivo Resend con dominio).
  - Pulsante "Chiudi".
* **Messaggi a video:**
  - Suggerimento per il medico: *"Consegna questa scheda al paziente durante la visita o inviala tramite i canali di studio."*

---

#### [M3] Modale Creazione Nuovo Ciclo di Controllo
* **A cosa serve:** Avviare un nuovo percorso di monitoraggio per un paziente specifico.
* **Campi mostrati / richiesti:**
  - Paziente selezionato (mostrato in sola lettura).
  - Durata del ciclo (selettore: 1 settimana, 2 settimane, 3 settimane, 4 settimane o numero personalizzato di settimane).
  - Note / Indicazioni specifiche per il ciclo (es. "Misurare prima dell'assunzione dei farmaci").
* **Controlli presenti:**
  - Pulsante "Conferma e Crea Ciclo".
  - Pulsante "Annulla".
* **Messaggi a video:**
  - Avviso informativo: *"Il ciclo rimarrà con stato 'Da Iniziare' finché il paziente non registrerà la sua prima misurazione. Da quel momento decorrerà la durata di X settimane stabilita."*
  - Errore: *"Esiste già un ciclo 'In Corso' o 'Da Iniziare' per questo paziente. Concludi o annulla quello esistente prima di crearne uno nuovo."*

---

#### [M4] Modale Gestione Stato Ciclo
* **A cosa serve:** Permette al medico di intervenire sul ciclo attivo (mettere in pausa, riattivare, annullare o cancellare).
* **Campi mostrati / richiesti:**
  - Stato attuale del ciclo.
  - Scelta azione: "Metti in Pausa", "Riattiva", "Annulla Ciclo", "Elimina definitivamente".
  - Motivazione medica dell'interruzione o pausa (textarea facoltativa).
* **Controlli presenti:**
  - Pulsante di conferma azione (colorato in arancione per Pausa, rosso per Annulla/Elimina).
  - Pulsante "Annulla operazione".
* **Messaggi a video:**
  - Conferma richiesta: *"Sei sicuro di voler annullare questo ciclo? Il paziente non potrà più aggiungere nuove misurazioni per questo periodo."*
  - Feedback di successo: *"Stato del ciclo aggiornato correttamente."*

---

#### [M5] Modale Inserimento Nota di Terapia
* **A cosa serve:** Consente al medico di aggiungere annotazioni terapeutiche, distinguendo tra messaggi rivolti al paziente e note cliniche interne.
* **Campi mostrati / richiesti:**
  - Testo della nota (textarea multilinea).
  - Selettore/Switch visivo:
    - 🟢 *"Nota per il Paziente"* (sarà visibile nella sua dashboard).
    - 🔒 *"Nota Privata Medico"* (visibile esclusivamente al medico).
* **Controlli presenti:**
  - Pulsante "Salva Nota".
  - Pulsante "Annulla".
* **Messaggi a video:**
  - Avviso di riservatezza: *"Le note per il paziente saranno immediatamente consultabili dal paziente all'interno della sua app."*

---

#### [M6] Modale / Funzione Invio Comunicazione & Notifiche Push
* **A cosa serve:** Permette al medico di trasmettere comunicazioni, istruzioni o avvisi tramite notifica push Web e messaggi in-app.
* **Campi mostrati / richiesti:**
  - **Selezione Destinatari:**
    - Pulsante toggle "Seleziona Tutti i Pazienti".
    - Elenco nominativi pazienti con checkbox per selezione multipla individuale (da 1 a N pazienti).
    - Contatore dinamico selezionati (es. *"3 pazienti selezionati"*).
  - Titolo della comunicazione (input breve).
  - Testo del messaggio (textarea).
* **Controlli presenti:**
  - Checkbox "Seleziona Tutti".
  - Filtro rapido di ricerca per nome nella lista destinatari.
  - Pulsante "Invia Notifica Push a [X] Pazienti".
  - Pulsante "Annulla".
* **Messaggi a video:**
  - Validazione nessun destinatario: *"Seleziona almeno un paziente a cui inviare la comunicazione."*
  - Conferma invio: *"Comunicazione inviata con successo a [X] pazienti!"*
  - Errore invio: *"Si è verificato un problema durante l'inoltro di alcune notifiche push."*

---

### AREA PAZIENTE

#### [P7] Elenco Cicli di Controllo Paziente (`/paziente/cicli`)
* **A cosa serve:** Pagina principale per il paziente loggato. Mostra lo storico dei suoi cicli di monitoraggio con priorità visiva per il ciclo attivo.
* **Campi mostrati / richiesti:**
  - Card del ciclo attivo in evidenza (stato `in corso`): mostra settimane previste, giorno corrente (es. "Giorno 4 di 14"), percentuale di completamento, braccio di riferimento con badge (es. "Braccio Destro").
  - Sezione secondaria per cicli con stato `da iniziare` (con pulsante evidente "Inizia Ora") o `in pausa`.
  - Sezione storico (accordion o lista comprimibile) con cicli `conclusi` o `annullati`.
* **Controlli presenti:**
  - Clic su un ciclo: apre il diario del ciclo corrispondente (`/paziente/diario/[id]`).
  - Pulsante "Note del Medico" (apre [M12] con badge se ci sono nuove note).
  - Icona campanella "Notifiche" (apre [M13]).
  - Pulsante "Esci" (Logout).
* **Messaggi a video:**
  - Paziente senza cicli: *"Nessun ciclo di monitoraggio attivo. Il tuo medico curante attiverà a breve il tuo piano di misurazione."*
  - Ciclo in pausa: *"Questo ciclo è attualmente sospeso dal tuo medico. Contattalo per informazioni."*

---

#### [P8] Diario di Misurazione del Ciclo (`/paziente/diario/[id]`)
* **A cosa serve:** L'interfaccia operativa quotidiana del paziente. Visualizza il calendario del ciclo e le 3 misurazioni della giornata.
* **Campi mostrati / richiesti:**
  - **Header Superiore:**
    - Indicatore fisso del braccio di riferimento: *"Braccio di misurazione: [Destro / Sinistro]"* (evidenziato visivamente).
    - Progresso ciclo: *"Settimana X di Y • Giorno Z"*.
  - **Calendario Orizzontale a Scorrimento (Top Bar):**
    - Striscia scrollabile orizzontalmente con tutti i giorni del ciclo (es. "G1 Lun 21", "G2 Mar 22", ecc.).
    - Giorno selezionato evidenziato con badge.
    - Mini-indicatori sotto ogni giorno: 3 pallini cromatici (verde/giallo/rosso se compilati, grigio se da compilare).
    - Giorni futuri visibili ma contrassegnati come non ancora attivi.
  - **Corpo Centrale - Schede dei 3 Slot Giornalieri:**
    - **1. Scheda Mattina (Cutoff ore 11:00)**
    - **2. Scheda Pomeriggio (Cutoff ore 16:00)**
    - **3. Scheda Sera (Cutoff ore 22:00)**
    - Per ogni scheda:
      - *Se NON compilata:* Scritta evidente **"Inserisci misurazione"**, indicazione dell'orario di riferimento, pulsante con icona "+".
      - *Se già compilata:* Mostra i valori registrati (MAX / MIN mmHg, BPM), orario effettivo di inserimento, eventuali note inserite e badge cromatico di classificazione (Normale, Normale-Alta, Ipertensione).
* **Controlli presenti:**
  - Clic sui giorni del calendario orizzontale per navigare indietro nel tempo.
  - Clic su una scheda vuota: apre la modale di inserimento [M9] precompilando lo slot corrispondente.
  - Clic su una scheda compilata: apre la modale [M9] in modalità modifica / visualizzazione dettagli.
  - Pulsante fluttuante d'aiuto: riapre il tutorial [M7] su come misurare correttamente la pressione.
  - Pulsante "Scarica Diario PDF" (disponibile sempre o a fine ciclo).
* **Messaggi a video:**
  - Giorno futuro selezionato: *"Non puoi registrare misurazioni per giornate future."*
  - Avviso cutoff superato: Nessun blocco, la scheda rimane aperta con etichetta *"Puoi ancora inserire la misurazione della mattina"*.
  - Promemoria braccio: *"Ricordati di misurare sempre al Braccio [Destro/Sinistro] come stabilito all'inizio del ciclo."*

---

### MODALI AREA PAZIENTE

#### [M7] Modale Tutorial / Onboarding Ciclo "Da Iniziare"
* **A cosa serve:** Mostrato automaticamente quando il paziente apre per la prima volta un ciclo con stato "Da Iniziare". Spiega in 3-4 pagine illustrate come utilizzare l'app e come effettuare misurazioni corrette.
* **Campi mostrati / richiesti:**
  - **Pagina 1 (Benvenuto & Scopo):** Introduzione al diario pressorio, importanza della regolarità delle misurazioni prescritte dal medico.
  - **Pagina 2 (Come Misurare Correttamente):** Regole cliniche: riposare seduti per 5 minuti prima della misura, schiena appoggiata, braccio al livello del cuore, non parlare né fumare prima della rilevazione.
  - **Pagina 3 (La Regola del Doppio Braccio):** Spiegazione della prima misurazione su entrambe le braccia per stabilire il braccio di riferimento.
  - **Pagina 4 (I 3 Momenti del Giorno & Notifiche):** Spiegazione delle 3 misurazioni (mattina, pomeriggio, sera) e richiesta autorizzazione notifiche push per i promemoria.
* **Controlli presenti:**
  - Indicatori di pagina a pallini (dots pagination con animazione).
  - Pulsante "Avanti" (passa allo slide successivo con transizione fluida).
  - Pulsante "Indietro" (dal secondo slide).
  - Pulsante "Inizia la prima misurazione" (all'ultimo slide, chiude il tutorial e apre [M8]).
  - Pulsante "Salta tutorial" in alto a destra.
* **Messaggi a video:**
  - Richiesta permessi push: *"Vuoi ricevere un promemoria sul telefono prima dei cutoff delle 11:00, 16:00 e 22:00?"* con opzioni *"Attiva Notifiche"* o *"Più tardi"*.

---

#### [M8] Modale / Flusso Misurazione Iniziale Bilaterale
* **A cosa serve:** Procedura guidata iniziale per misurare entrambe le braccia e inaugurare ufficialmente il ciclo.
* **Campi mostrati / richiesti:**
  - **Fase A - Misurazione Braccio Destro:**
    - Pressione Massima (MAX / Sistolica).
    - Pressione Minima (MIN / Diastolica).
    - Battiti cardiaci (BPM - facoltativo).
  - **Fase B - Misurazione Braccio Sinistro:**
    - Pressione Massima (MAX / Sistolica).
    - Pressione Minima (MIN / Diastolica).
    - Battiti cardiaci (BPM - facoltativo).
  - **Fase C - Calcolo & Selezione Slot Giorno 1:**
    - Esito del confronto: il sistema indica automaticamente il braccio con la sistolica maggiore (es. *"La pressione massima è risultata più alta al Braccio Destro (135 vs 128 mmHg)"*).
    - *Se parità esatta:* Comparsa di un selettore interattivo: *"La pressione massima è identica (130 mmHg su entrambe le braccia). Seleziona quale braccio preferisci utilizzare:"* con opzioni `[ Braccio Destro ]` o `[ Braccio Sinistro ]`.
    - **Scelta Slot Giorno 1:** Selettore con 3 opzioni radio-card: `[ Mattina ]`, `[ Pomeriggio ]`, `[ Sera ]` (*"A quale momento della giornata desideri associare questa prima misurazione?"*).
* **Controlli presenti:**
  - Pulsante "Registra Braccio Destro".
  - Pulsante "Registra Braccio Sinistro".
  - Selettore manuale braccio (solo in caso di parità).
  - Selettore dello slot di collocazione del Giorno 1.
  - Pulsante finale "Salva e Inizia il Diario".
* **Messaggi a video:**
  - Istruzione guidata: *"Misura la pressione prima al braccio destro e segna i valori; subito dopo misura al braccio sinistro."*
  - Conferma assegnazione braccio: *"Perfetto! D'ora in poi effettuerai tutte le misurazioni al Braccio [Destro/Sinistro]. Te lo ricorderemo ogni volta."*
  - Avvio ciclo: *"Il tuo ciclo di [X] settimane è ufficialmente iniziato oggi!"*

---

#### [M9] Modale Inserimento / Modifica Misurazione Giornaliera
* **A cosa serve:** Inserimento standard dei dati per uno slot (mattina, pomeriggio o sera) di una determinata data.
* **Campi mostrati / richiesti:**
  - Promemoria fisso in alto: *"Usa il Braccio [Destro/Sinistro]"* con icona dedicata.
  - Data di misurazione (precompilata con la data della scheda selezionata, modificabile se giorno passato).
  - Orario di misurazione (precompilato con l'orario attuale del dispositivo, modificabile).
  - Pressione Massima / Sistolica (input numerico intero, es. 120, obbligatorio).
  - Pressione Minima / Diastolica (input numerico intero, es. 80, obbligatorio).
  - Frequenza Cardiaca (BPM, input numerico intero, facoltativo).
  - Note / Sintomi (campo testo facoltativo, es. "Leggero mal di testa", "Dopo colazione", "Iniziata attività fisica").
* **Controlli presenti:**
  - Feedback cromatico istantaneo ESC/ESH che cambia in tempo reale mentre si digitano MAX e MIN (badge verde, giallo o rosso).
  - Pulsante "Salva Misurazione".
  - Pulsante "Annulla".
  - Pulsante "Elimina misurazione" (visibile solo se si sta modificando una misurazione già esistente).
* **Messaggi a video:**
  - Validazione campi: *"La pressione massima e minima sono obbligatorie."*
  - Validazione di congruità: *"La pressione massima (sistolica) deve essere superiore alla pressione minima (diastolica)."*
  - Validazione range plausibile: *"I valori inseriti sono fuori scala fisiologica (es. MAX < 50 o > 300). Verifica i dati digitati."*
  - Se i valori superano le soglie critiche (es. MAX ≥ 180 o MIN ≥ 110), al salvataggio si apre contestualmente la modale di sicurezza [M10].

---

#### [M10] Modale Alert Cautelare per Valori Critici
* **A cosa serve:** Avviso precauzionale a scopo di sicurezza sanitaria attivato automaticamente se il paziente inserisce valori pressori molto elevati.
* **Campi mostrati / richiesti:**
  - Icona di attenzione arancione/rossa.
  - Riepilogo del valore inserito (es. *"Hai registrato: 185 / 115 mmHg"*).
  - Testo guida con istruzioni comportamentali chiare e rassicuranti:
    1. *Rimani calmo e siediti comodamente.*
    2. *Attendi 5-10 minuti a riposo senza parlare.*
    3. *Ripeti la misurazione per verificare se si tratta di un picco temporaneo o di un'errata rilevazione.*
    4. *Se i valori rimangono costantemente elevati o avverti sintomi (forte mal di testa, vertigini, dolore al petto), contatta tempestivamente il tuo medico curante o la guardia medica.*
* **Controlli presenti:**
  - Pulsante "Ho Capito / Ho Letto le Istruzioni" (chiude la modale registrando comunque il dato nel diario con contrassegno di alert per il medico).
  - Pulsante rapido "Ripeti Misurazione Adesso" (riapre l'inserimento per aggiornare il valore).
* **Messaggi a video:**
  - Disclaimer: *"Questo avviso non sostituisce il parere di un medico. In presenza di sintomi gravi contatta il 112/118."*

---

#### [M11] Schermata / Modale di Conclusione Ciclo
* **A cosa serve:** Presentata al paziente quando raggiunge e completa l'ultimo giorno del periodo di monitoraggio stabilito.
* **Campi mostrati / richiesti:**
  - Grafica festosa/appagante di traguardo raggiunto (micro-animazione check verde/badge completamento).
  - Messaggio di ringraziamento e invito a contattare il medico.
  - Card di riepilogo del ciclo: Totale misurazioni effettuate su quelle previste (es. "40 misurazioni su 42 totali"), Media Sistolica generale, Media Diastolica generale.
* **Controlli presenti:**
  - Pulsante "Scarica Report Clinico Completo (PDF)" per stamparlo o salvarlo.
  - Pulsante "Torna all'Elenco Cicli".
* **Messaggi a video:**
  - Testo principale: *"Complimenti per aver concluso con costanza il tuo ciclo di misurazioni pressorie! Il tuo diario è ora completo e a disposizione del tuo medico per valutare la tua salute o l'efficacia della terapia. Contatta il tuo studio medico per i passi successivi."*

---

#### [M12] Modale Visualizzazione Note di Terapia del Medico
* **A cosa serve:** Permette al paziente di consultare in ogni momento le raccomandazioni e le prescrizioni che il medico ha contrassegnato come "Visibili al Paziente".
* **Campi mostrati / richiesti:**
  - Elenco cronologico delle note terapeutiche: Data/Ora inserimento, Nome del Medico, Testo del consiglio o prescrizione (es. "Ricordarsi di assumere il farmaco a stomaco pieno").
* **Controlli presenti:**
  - Pulsante "Chiudi".
* **Messaggi a video:**
  - Se non ci sono note: *"Nessuna nota terapeutica inviata dal medico al momento."*

---

#### [M13] Centro Notifiche e Comunicazioni In-App Paziente
* **A cosa serve:** Lista di tutti i messaggi broadcast o individuali inviati dal medico, oltre allo storico dei promemoria cutoff ricevuti.
* **Campi mostrati / richiesti:**
  - Elenco messaggi: Titolo comunicazione, Testo completo, Data e ora di ricezione, Mittente ("Dr. Cognome"), indicatore messaggio letto/non letto.
* **Controlli presenti:**
  - Pulsante "Segna tutte come lette".
  - Pulsante "Chiudi".
* **Messaggi a video:**
  - Stato vuoto: *"Nessuna comunicazione recente."*

---

## 6. Servizi Trasversali e Logiche Tecniche di Background

### 6.1. Gestione Notifiche Web Push e Service Worker
1. **Iscrizione (Subscription):** Al termine dell'onboarding [M7] o dalla schermata del diario, l'applicazione richiede il permesso browser `Notification.requestPermission()`.
2. **Memorizzazione Endpoint:** Le chiavi VAPID e l'endpoint di sottoscrizione push vengono salvati nel database Turso associati all'ID del paziente e del suo dispositivo.
3. **Trigger Programmato (Vercel Cron):**
   - Vengono configurati tre cron job su Vercel:
     - `0 11 * * *` (Cutoff Mattina - ore 11:00)
     - `0 16 * * *` (Cutoff Pomeriggio - ore 16:00)
     - `0 22 * * *` (Cutoff Sera - ore 22:00)
   - Ad ogni esecuzione, la Serverless Function interroga il DB cercandovi i pazienti con ciclo con stato `in corso` che non hanno ancora inserito la misurazione nello slot corrispondente della giornata odierna.
   - Per ciascun paziente inadempiente viene inviato il payload Web Push crittografato (es. Titolo: *"Promemoria Pressione - Slot Mattina"*, Testo: *"Non hai ancora registrato la misurazione della mattina. Ricordati di effettuarla al Braccio [DX/SX]"*).

### 6.2. Generazione Report Clinico PDF
- Disponibile sia nella vista Medico [P6] che nella schermata Paziente [M11].
- **Contenuti del PDF generato:**
  1. Intestazione Studio Medico, Dati Medico Curante, Dati Anagrafici Paziente e Codice Fiscale.
  2. Periodo del ciclo (Data inizio, Data fine, Durata in settimane, Braccio di riferimento).
  3. Statistiche aggregate di periodo: Media MAX, Media MIN, Media Frequenza cardiaca, Deviazione standard/variabilità, Percentuale di valori a target clinico (<140/90).
  4. Medie suddivise per slot: Media Mattina, Media Pomeriggio, Media Sera.
  5. Grafico di sintesi dell'andamento pressorio giornaliero.
  6. Tabella tabellare completa di tutte le singole misurazioni con eventuali note del paziente.
  7. Sezione finale con le note di terapia e spazio timbro/firma del medico.

---

## 7. Modello Dati Relazionale (Schema Turso / SQLite)

```sql
-- Tabella Medici
CREATE TABLE medici (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    specializzazione TEXT,
    telefono TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Pazienti (Multi-medico: associati a un medico_id)
CREATE TABLE pazienti (
    id TEXT PRIMARY KEY,
    medico_id TEXT NOT NULL REFERENCES medici(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    codice_fiscale TEXT NOT NULL,
    data_nascita DATE NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT,
    pin_hash TEXT NOT NULL,
    note_anamnesi TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(medico_id, codice_fiscale)
);

-- Tabella Cicli di Controllo
CREATE TABLE cicli (
    id TEXT PRIMARY KEY,
    paziente_id TEXT NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
    medico_id TEXT NOT NULL REFERENCES medici(id) ON DELETE CASCADE,
    durata_settimane INTEGER NOT NULL,
    stato TEXT CHECK(stato IN ('da iniziare', 'in corso', 'in pausa', 'concluso', 'annullato')) NOT NULL DEFAULT 'da iniziare',
    braccio_riferimento TEXT CHECK(braccio_riferimento IN ('DX', 'SX')),
    data_creazione DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_inizio_effettiva DATETIME,
    data_fine_prevista DATETIME,
    data_fine_effettiva DATETIME,
    note_ciclo TEXT
);

-- Tabella Registrazione Iniziale Bilaterale (Doppio Braccio)
CREATE TABLE misurazioni_iniziali (
    id TEXT PRIMARY KEY,
    ciclo_id TEXT UNIQUE NOT NULL REFERENCES cicli(id) ON DELETE CASCADE,
    max_dx INTEGER NOT NULL,
    min_dx INTEGER NOT NULL,
    bpm_dx INTEGER,
    max_sx INTEGER NOT NULL,
    min_sx INTEGER NOT NULL,
    bpm_sx INTEGER,
    braccio_scelto TEXT CHECK(braccio_scelto IN ('DX', 'SX')) NOT NULL,
    slot_assegnato TEXT CHECK(slot_assegnato IN ('mattina', 'pomeriggio', 'sera')) NOT NULL,
    data_misurazione DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Misurazioni Quotidiane
CREATE TABLE misurazioni (
    id TEXT PRIMARY KEY,
    ciclo_id TEXT NOT NULL REFERENCES cicli(id) ON DELETE CASCADE,
    paziente_id TEXT NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
    giorno_numero INTEGER NOT NULL, -- es. da 1 a durata_settimane*7
    slot TEXT CHECK(slot IN ('mattina', 'pomeriggio', 'sera')) NOT NULL,
    data_rilevazione DATE NOT NULL,
    ora_rilevazione TIME NOT NULL,
    braccio TEXT CHECK(braccio IN ('DX', 'SX')) NOT NULL,
    pressione_max INTEGER NOT NULL,
    pressione_min INTEGER NOT NULL,
    bpm INTEGER,
    note TEXT,
    is_critica BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ciclo_id, data_rilevazione, slot)
);

-- Tabella Note di Terapia del Medico
CREATE TABLE note_terapia (
    id TEXT PRIMARY KEY,
    paziente_id TEXT NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
    medico_id TEXT NOT NULL REFERENCES medici(id) ON DELETE CASCADE,
    testo TEXT NOT NULL,
    visibile_paziente BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Dispositivi & Sottoscrizioni Web Push
CREATE TABLE push_subscriptions (
    id TEXT PRIMARY KEY,
    paziente_id TEXT NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Notifiche e Comunicazioni Inviate
CREATE TABLE comunicazioni (
    id TEXT PRIMARY KEY,
    medico_id TEXT NOT NULL REFERENCES medici(id) ON DELETE CASCADE,
    titolo TEXT NOT NULL,
    messaggio TEXT NOT NULL,
    inviato_a_tutti BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Destinatari Notifiche
CREATE TABLE comunicazione_destinatari (
    comunicazione_id TEXT NOT NULL REFERENCES comunicazioni(id) ON DELETE CASCADE,
    paziente_id TEXT NOT NULL REFERENCES pazienti(id) ON DELETE CASCADE,
    letta BOOLEAN DEFAULT 0,
    letta_il DATETIME,
    PRIMARY KEY(comunicazione_id, paziente_id)
);
```

---

## 8. Conclusioni e Prossimi Passi

Il presente documento definisce integralmente i requisiti tecnici, clinici, di interfaccia (Sitemap con tutte le 8 pagine e le 13 modali/sezioni) e lo schema dei dati per la Web App del Diario Pressorio. 

Tutti i requisiti concordati sono formalizzati e pronti per l'approvazione finale.

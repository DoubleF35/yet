/**
 * Il nome di una persona ridotto a un pezzo di indirizzo.
 *
 * PERCHE' STA IN UN FILE DA SOLO. Questa funzione la usano due mondi diversi:
 * il browser (per costruire i link e per capire quale profilo mostrare) e lo
 * script di build in Node (per generare una pagina HTML per ogni membro). Se
 * ne esistessero due copie, il giorno in cui una cambia le pagine generate
 * risponderebbero a indirizzi che nessun link produce piu', e non se ne
 * accorgerebbe nessuno finche' un profilo non sparisce dai risultati di
 * ricerca. Sta qui, e non in members.jsx, solo perche' Node non sa leggere il
 * JSX.
 *
 *   "Federico Fassio"   -> "federicofassio"
 *   "Greta Dall'Olio"   -> "gretadallolio"
 *   "Nicolò Pugliese"   -> "nicolopugliese"
 *
 * Gli accenti vengono scomposti e scartati, non sostituiti a mano: `normalize`
 * separa la lettera dal segno diacritico e la regex butta via il segno. Cosi'
 * funziona anche per lettere a cui nessuno aveva pensato, invece di reggersi
 * su una tabella di sostituzioni che prima o poi manca di un caso.
 *
 * Torna stringa vuota quando non resta niente di utilizzabile (un nome fatto
 * di soli simboli, o assente). Chi chiama deve trattare quel caso: l'indirizzo
 * ricade sull'identificativo interno.
 */
export function memberSlug(nome) {
  return String(nome ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40)
}

/**
 * La data d'iscrizione in millisecondi, comunque sia scritta.
 *
 * Lo stesso campo arriva in tre forme diverse a seconda di chi legge: un
 * Timestamp del client Firebase (con `toMillis`), un oggetto grezzo con
 * `seconds` (succede sui documenti appena scritti, prima che il server
 * risponda), una stringa ISO dall'API REST che usa lo script di build. Un
 * confronto che ne conosce una sola funziona in un posto e fallisce
 * silenziosamente nell'altro.
 *
 * Chi non ha data viene trattato come il piu' recente: i profili senza
 * `createdAt` sono i piu' vecchi in ordine di database ma non possono
 * dimostrarlo, e dare loro la precedenza su una data certa sarebbe un'ipotesi.
 */
function quando(valore) {
  if (!valore) return Number.POSITIVE_INFINITY
  if (typeof valore === 'string') {
    const t = Date.parse(valore)
    return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t
  }
  if (typeof valore.toMillis === 'function') return valore.toMillis()
  if (typeof valore.seconds === 'number') return valore.seconds * 1000
  return Number.POSITIVE_INFINITY
}

/**
 * Fra piu' persone che finirebbero sullo stesso indirizzo, quella che se lo
 * tiene.
 *
 * PERCHE' SERVE. Due "Mario Rossi" danno lo stesso slug, e Firestore non sa
 * imporre l'unicita' di un campo fra documenti: la collisione non si puo'
 * impedire, si puo' solo risolvere sempre allo stesso modo.
 *
 * PERCHE' LA STESSA FUNZIONE IN DUE POSTI. La regola la applicano lo script di
 * build (per decidere di chi generare la pagina) e il browser (per decidere
 * chi mostrare). Se divergessero, l'indirizzo /vetrina/mariorossi mostrerebbe
 * una persona nel guscio generato e un'altra un attimo dopo, quando
 * l'applicazione parte. Un difetto che nessuno collegherebbe mai a due
 * ordinamenti scritti separatamente.
 *
 * Vince chi si e' iscritto prima, cioe' chi aveva quell'indirizzo per primo.
 * A parita' di data decide l'identificativo: e' arbitrario, ma e' identico
 * ovunque e non cambia nel tempo, che e' l'unica cosa che conta in un
 * pareggio. L'altro resta raggiungibile con il proprio identificativo.
 */
export function primoFraOmonimi(membri) {
  if (!Array.isArray(membri) || membri.length === 0) return null

  return [...membri].sort((a, b) => {
    const qa = quando(a?.createdAt)
    const qb = quando(b?.createdAt)
    if (qa !== qb) return qa < qb ? -1 : 1
    return String(a?.uid ?? '').localeCompare(String(b?.uid ?? ''))
  })[0]
}

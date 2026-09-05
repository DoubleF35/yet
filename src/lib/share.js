/**
 * Copiare e condividere un indirizzo.
 *
 * PERCHE' UN FILE A PARTE. La copia negli appunti era scritta due volte, in
 * Contatti e in Brand, e le due copie erano gia' diverse fra loro: quella di
 * Brand chiamava `navigator.clipboard` senza ripiego, quindi su un contesto
 * non sicuro falliva e basta. Con la condivisione del profilo i punti
 * diventavano tre. Una funzione sola, e chi la corregge la corregge per tutti.
 */

/**
 * Copia `testo` negli appunti e dice se ci e' riuscita.
 *
 * `navigator.clipboard` esiste solo in contesti sicuri (https, o localhost).
 * Aperto il sito in http semplice, per esempio un'anteprima su un IP di rete
 * locale, e' `undefined`, e un bottone che lo chiama a occhi chiusi esplode
 * senza fare niente. Anche dove esiste puo' rifiutare: permesso negato,
 * documento non a fuoco.
 *
 * Quindi prima la strada buona, poi il ripiego con `execCommand`, deprecato ma
 * l'unica cosa che funziona fuori dai contesti sicuri. Se fallisce anche
 * quello si torna `false`, e chi chiama lo dice all'utente invece di far finta
 * di aver copiato.
 */
export async function copiaNegliAppunti(testo) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(testo)
      return true
    }
  } catch {
    // Nessun rethrow: si scende al ripiego qui sotto.
  }

  try {
    const campo = document.createElement('textarea')
    campo.value = testo
    campo.setAttribute('readonly', '')
    /* Fuori dallo schermo ma NON `display:none` ne' `hidden`: un elemento non
       disegnato non e' selezionabile e la copia non partirebbe. */
    campo.style.position = 'fixed'
    campo.style.top = '-2000px'
    campo.style.opacity = '0'
    document.body.appendChild(campo)
    campo.select()
    // iOS ignora select() sui campi readonly: serve l'intervallo esplicito.
    campo.setSelectionRange(0, testo.length)
    const fatto = document.execCommand('copy')
    document.body.removeChild(campo)
    return fatto
  } catch {
    return false
  }
}

/**
 * Condivide un indirizzo col foglio di sistema, o lo copia se non si puo'.
 *
 * Torna cosa e' successo, non un booleano, perche' i tre esiti vogliono tre
 * messaggi diversi:
 *
 *   'condiviso'  il foglio di sistema si e' aperto e la persona ha scelto dove
 *   'copiato'    niente foglio di sistema, l'indirizzo e' negli appunti
 *   'annullato'  il foglio si e' aperto e la persona ha chiuso senza scegliere
 *   'fallito'    nessuna delle due strade ha funzionato
 *
 * `annullato` NON e' un errore ed e' il motivo per cui questa funzione non
 * torna true/false: chi annulla ha fatto una scelta, e vedersi comparire
 * "non e' riuscito" dopo aver premuto Chiudi fa sembrare rotta l'applicazione.
 *
 * ATTENZIONE PER CHI LA USA: `navigator.share` pretende di essere chiamata
 * dentro il gesto dell'utente. Va invocata direttamente nel gestore del clic,
 * senza `await` di altro prima, o Safari la rifiuta con NotAllowedError.
 */
export async function condividi({ url, titolo, testo }) {
  if (navigator.share) {
    try {
      await navigator.share({ url, title: titolo, text: testo })
      return 'condiviso'
    } catch (err) {
      /* AbortError = ha chiuso il foglio. Qualunque altro errore (permesso
         negato, contesto non sicuro, tipo non condivisibile) merita invece il
         ripiego: meglio l'indirizzo negli appunti che niente. */
      if (err?.name === 'AbortError') return 'annullato'
    }
  }

  return (await copiaNegliAppunti(url)) ? 'copiato' : 'fallito'
}

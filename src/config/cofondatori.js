/**
 * CHI HA FONDATO YET.
 *
 * Sta qui e non su Firestore per la stessa ragione degli eventi: e' un fatto
 * che non cambia, e metterlo nel database vorrebbe dire che la home aspetta
 * una risposta di rete per sapere chi mettere per primo.
 *
 * SONO uid E NON NOMI. L'indirizzo di un profilo (/vetrina/gretadallolio) e'
 * ricavato dal nome che la persona ha scritto nel suo profilo, quindi cambia
 * se lei lo cambia: legare l'elenco a quello vorrebbe dire che un giorno un
 * co-fondatore scompare dalla cima e nessuno capisce perche'. L'uid e' il
 * documento, e non cambia mai.
 *
 * L'ORDINE DI QUESTA LISTA E' L'ORDINE CHE SI VEDE, ed e' voluto: non e'
 * alfabetico e non dipende da chi ha caricato una foto. Per cambiarlo si
 * spostano le righe qui sotto, e cambiano insieme la vetrina e la fila sulla
 * home, perche' leggono tutte e due da qui.
 */
export const COFONDATORI = [
  'k46VxF5qWedKa7mK1AJV8axHIzQ2', // Federico Fassio
  'uLuIQvrBkWhRMqfjOcFRdpj2Ub43', // Greta Dall'Olio
  'EREdVqWZ5DPy37bdpq8rtyCruyp2', // Mattia Papa
  'U9B2gcUuA5gzir2boz7EA7opws63', // Luchino Franceschino Rollino
]

/** Vero se questa persona ha fondato il club. */
export function eCofondatore(membro) {
  return Boolean(membro?.uid) && COFONDATORI.includes(membro.uid)
}

/**
 * La posizione nell'elenco, per ordinare. Chi non c'e' finisce in fondo:
 * Infinity e non -1, altrimenti con un confronto numerico i non-fondatori
 * passerebbero davanti a tutti.
 */
export function postoCofondatore(membro) {
  const i = COFONDATORI.indexOf(membro?.uid)
  return i === -1 ? Infinity : i
}

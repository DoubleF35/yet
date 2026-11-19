/**
 * LE PERSONE DELLA COMMUNITY CHE SUL SITO NON CI SONO.
 *
 * Il numero della home e': profili approvati + questo. Nel gruppo WhatsApp
 * ci sono persone che un profilo non l'hanno mai fatto, e senza questo
 * numero la home direbbe che la community e' meta' di quello che e'.
 *
 * Fissato il 19 novembre 2026: il gruppo aveva 145 persone e i profili
 * approvati erano 66, quindi 145 - 66 = 79. Da qui in avanti ogni profilo
 * approvato fa salire il numero di uno.
 *
 * DA RIGUARDARE A MAGGIO 2027. Col tempo chi e' nel gruppo si iscrive al
 * sito, e ognuno di loro viene contato due volte (una qui, una come
 * profilo): il numero cresce piu' del vero. Allora si riconta il gruppo e si
 * rimette a posto questa cifra.
 */
export const PERSONE_SOLO_NEL_GRUPPO = 79

/**
 * Dati per l'informativa privacy e per quella sui cookie.
 *
 * Stanno in un file di configurazione e non dentro le pagine per la stessa
 * ragione dei social: sono le cose che cambiano (l'indirizzo, il titolare, la
 * data di aggiornamento) e non devono richiedere di aprire un componente.
 *
 */

import { CONTACT_EMAIL } from './socials.js'

export const LEGAL = {
  /* Chi gestisce il sito e i dati. La community si identifica con il proprio
     nome e con l'indirizzo qui sotto: sono i due dati che servono a chi voglia
     scrivere per far correggere o cancellare qualcosa.
     Se un domani YET diventa un'associazione registrata, qui vanno la
     denominazione esatta, la sede legale e il codice fiscale. */
  ownerName: 'YET, Young Entrepreneurs Together',
  ownerCity: 'Torino',

  /** L'indirizzo a cui si esercitano i diritti. Lo stesso dei contatti: aprire
   *  una casella dedicata che poi nessuno legge è peggio che non averla. */
  privacyEmail: CONTACT_EMAIL,

  /** Data dell'ultima modifica sostanziale, in formato ISO.
   *  Va aggiornata a mano quando cambia il testo, non a ogni deploy: dice
   *  "da quando vale questa versione", non "quando ho ricompilato". */
  updatedAt: '2026-08-19',
}

/**
 * Formatta LEGAL.updatedAt nella lingua scelta, con un ripiego se la data è
 * scritta male (meglio la stringa ISO grezza che "Invalid Date" in fondo a
 * un'informativa).
 */
export function legalUpdatedAt(lang = 'it') {
  const d = new Date(`${LEGAL.updatedAt}T00:00:00`)
  if (Number.isNaN(d.getTime())) return LEGAL.updatedAt
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

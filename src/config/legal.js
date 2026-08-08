/**
 * Dati per l'informativa privacy e per quella sui cookie.
 *
 * Stanno in un file di configurazione e non dentro le pagine per la stessa
 * ragione dei social: sono le cose che cambiano (l'indirizzo, il titolare, la
 * data di aggiornamento) e non devono richiedere di aprire un componente.
 *
 * ⚠️  I campi marcati TODO vanno riempiti PRIMA di pubblicare.
 *     Un'informativa senza il titolare del trattamento non è un'informativa:
 *     il GDPR (art. 13) chiede identità e contatti di chi tratta i dati, e
 *     senza quelli la pagina è un testo di cortesia, non un adempimento.
 *     Non li ho inventati apposta — un nome o una partita IVA sbagliati
 *     sarebbero peggio di un campo vuoto.
 */

import { CONTACT_EMAIL } from './socials.js'

export const LEGAL = {
  /** TODO: nome della persona fisica o dell'associazione che gestisce il sito.
   *  Se YET non è (ancora) un ente costituito, va il nome e cognome di chi si
   *  assume la responsabilità del trattamento. */
  ownerName: 'YET — Young Entrepreneurs Together',

  /** TODO: se esiste un'associazione registrata, mettere qui la sede legale.
   *  Se non esiste, si può indicare la sola città e togliere l'indirizzo. */
  ownerAddress: 'Torino, Italia',

  /** TODO: solo se l'ente ha una partita IVA o un codice fiscale.
   *  Lasciare stringa vuota se non applicabile: la pagina salta la riga. */
  ownerVat: '',

  /** L'indirizzo a cui si esercitano i diritti. Lo stesso dei contatti: aprire
   *  una casella dedicata che poi nessuno legge è peggio che non averla. */
  privacyEmail: CONTACT_EMAIL,

  /** Data dell'ultima modifica sostanziale, in formato ISO.
   *  Va aggiornata a mano quando cambia il testo, non a ogni deploy: serve a
   *  dire "da quando vale questa versione", non "quando ho ricompilato". */
  updatedAt: '2026-08-08',
}

/** Formatta LEGAL.updatedAt in italiano, con un ripiego se la data è scritta male. */
export function legalUpdatedAt() {
  const d = new Date(`${LEGAL.updatedAt}T00:00:00`)
  if (Number.isNaN(d.getTime())) return LEGAL.updatedAt
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

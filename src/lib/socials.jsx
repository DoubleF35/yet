/**
 * I canali della community, con le etichette nella lingua scelta.
 *
 *     const socials = useSocials()
 *
 * PERCHE' NON DIRETTAMENTE `SOCIALS`. In config/socials.js vive quello che
 * NON si traduce: l'id, l'indirizzo, il path dell'icona. Il nome che si legge
 * a schermo ("Gruppo WhatsApp" / "WhatsApp group") e la riga sotto sono testo
 * di interfaccia, e il loro posto e' il catalogo delle lingue. Questo hook
 * ricuce le due meta': i componenti continuano a iterare su una lista di
 * oggetti con `label` e `handle`, e non sanno che sotto ci sono due fonti.
 *
 * Aggiungere un canale resta un lavoro in due passi, ed e' giusto che si
 * veda: l'oggetto in config/socials.js e le due righe `socials.<id>` nei
 * cataloghi. Se le righe mancano, `t()` ripiega sull'italiano e in pagina si
 * legge il nome italiano, non un buco.
 */

import { useMemo } from 'react'

import { CONTACT_EMAIL, SOCIALS } from '../config/socials.js'
import { useAuth } from './auth.jsx'
import { useI18n } from './i18n.jsx'

/**
 * Il gruppo WhatsApp si vede SOLO a chi e' dentro il club.
 *
 * Non e' una scelta di stile: il gruppo e' il posto dove ci si organizza, e
 * se il link d'invito sta su una pagina pubblica la selezione non seleziona
 * niente. Entrare nel club e entrare nel gruppo devono essere la stessa cosa.
 *
 * Il filtro vale per TUTTI i punti che mostrano quel canale, perche' passano
 * tutti da qui: il riquadro sulla home, quello sulla vetrina, quello sul
 * profilo, quello sulla pagina di iscrizione, l'elenco nel piede e la pagina
 * dei contatti. Toglierlo da uno solo avrebbe lasciato aperti gli altri
 * cinque.
 *
 * Chi sta ancora aspettando una risposta NON lo vede, ed e' voluto: in attesa
 * non si e' dentro. Gli admin lo vedono perche' il loro profilo nasce gia'
 * approvato.
 *
 * Mentre il profilo si carica il cancello e' chiuso. E' il verso giusto in
 * cui sbagliare: al massimo il riquadro compare mezzo secondo dopo, invece di
 * comparire a chi non doveva vederlo e sparire quando e' tardi.
 *
 * ATTENZIONE, QUESTO DA SOLO NON BASTA. Il link d'invito che e' gia' stato
 * pubblico resta valido per chiunque se lo sia salvato: nasconderlo adesso
 * non lo disattiva. Per chiudere davvero il rubinetto va reimpostato da
 * WhatsApp (Info gruppo, Invita tramite link, Reimposta link) e il nuovo va
 * incollato in config/socials.js. C'e' scritto anche li'.
 */
function useAmmesso() {
  const { profile } = useAuth()
  return profile?.status === 'approved'
}

export function useSocials() {
  const { t } = useI18n()
  const ammesso = useAmmesso()

  return useMemo(
    () =>
      SOCIALS.filter((item) => item.id !== 'whatsapp' || ammesso).map((item) => ({
        ...item,
        /* L'indirizzo di posta arriva come segnaposto: la stringa tradotta
           della mail e' `{email}`, cosi' l'indirizzo vero resta scritto in un
           posto solo (config/socials.js) invece di essere copiato in due
           cataloghi che poi divergono. Per gli altri canali il segnaposto non
           c'e' e passarlo non fa niente. */
        label: t(`socials.${item.id}.label`, { email: CONTACT_EMAIL }),
        handle: t(`socials.${item.id}.handle`, { email: CONTACT_EMAIL }),
      })),
    [t, ammesso],
  )
}

/**
 * Il gruppo WhatsApp con le etichette tradotte, o undefined se non c'è.
 * Stesso motivo di `WHATSAPP` in config: lo cerchiamo per id invece di
 * duplicarne l'indirizzo nei cinque punti del sito che lo mostrano.
 *
 * Torna undefined anche a chi non e' ancora stato accettato, perche' il
 * filtro sta dentro useSocials() qui sopra. I componenti che lo usano gia'
 * sapevano gestire l'assenza (WhatsAppCta torna null senza indirizzo), quindi
 * non c'e' stato bisogno di toccarli.
 */
export function useWhatsapp() {
  const socials = useSocials()
  return useMemo(() => socials.find((item) => item.id === 'whatsapp'), [socials])
}

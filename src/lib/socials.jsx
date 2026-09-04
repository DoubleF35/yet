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
import { useI18n } from './i18n.jsx'

export function useSocials() {
  const { t } = useI18n()

  return useMemo(
    () =>
      SOCIALS.map((item) => ({
        ...item,
        /* L'indirizzo di posta arriva come segnaposto: la stringa tradotta
           della mail e' `{email}`, cosi' l'indirizzo vero resta scritto in un
           posto solo (config/socials.js) invece di essere copiato in due
           cataloghi che poi divergono. Per gli altri canali il segnaposto non
           c'e' e passarlo non fa niente. */
        label: t(`socials.${item.id}.label`, { email: CONTACT_EMAIL }),
        handle: t(`socials.${item.id}.handle`, { email: CONTACT_EMAIL }),
      })),
    [t],
  )
}

/**
 * Il gruppo WhatsApp con le etichette tradotte, o undefined se non c'è.
 * Stesso motivo di `WHATSAPP` in config: lo cerchiamo per id invece di
 * duplicarne l'indirizzo nei cinque punti del sito che lo mostrano.
 */
export function useWhatsapp() {
  const socials = useSocials()
  return useMemo(() => socials.find((item) => item.id === 'whatsapp'), [socials])
}

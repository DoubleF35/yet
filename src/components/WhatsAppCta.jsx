import { useI18n } from '../lib/i18n.jsx'
import { useWhatsapp } from '../lib/socials.jsx'

import s from './WhatsAppCta.module.css'

/**
 * Invito a entrare nel gruppo WhatsApp.
 *
 * Sta in un componente perché lo stesso invito compare in più pagine, e perché
 * il giorno in cui il link va reimpostato (WhatsApp permette di invalidare un
 * invito) deve bastare cambiare `src/config/socials.js`.
 *
 * Se in config non c'è nessuna voce con id `whatsapp`, non renderizza niente:
 * meglio un blocco che sparisce di un bottone che porta a una pagina d'errore.
 *
 * @param {'block'|'button'} variant
 *   'button', un bottone da mettere accanto a un altro invito.
 *   'block' , una fascia con titolo e spiegazione, per chiudere una pagina.
 */
export default function WhatsAppCta({ variant = 'block', className = '' }) {
  /* Gli hook prima dell'uscita anticipata: chiamarne uno dopo un `return`
     cambierebbe il loro numero fra un render e l'altro, che è l'errore che
     React segnala come "rendered fewer hooks than expected". */
  const { t } = useI18n()
  const whatsapp = useWhatsapp()

  if (!whatsapp?.href) return null

  /* Il gruppo è pubblico e chiunque abbia il link entra: aprirlo in una scheda
     nuova evita di far perdere il sito a chi stava leggendo, e rel="noopener"
     è comunque d'obbligo su un target _blank. */
  const linkProps = {
    href: whatsapp.href,
    target: '_blank',
    rel: 'noopener noreferrer',
  }

  if (variant === 'button') {
    return (
      <a className={`${s.button} ${className}`.trim()} {...linkProps}>
        <Icona />
        <span>{t('whatsapp.bottone')}</span>
        <span className="sr-only">{t('whatsapp.srSuffisso')}</span>
      </a>
    )
  }

  return (
    <section className={`${s.block} ${className}`.trim()} aria-labelledby="gruppo-whatsapp">
      <div className={s.blockText}>
        <p className={s.eyebrow}>{t('whatsapp.eyebrow')}</p>
        <h2 className={s.title} id="gruppo-whatsapp">
          {t('whatsapp.titolo')}
        </h2>
        <p className={s.text}>{t('whatsapp.testo')}</p>
      </div>

      <a className={s.blockButton} {...linkProps}>
        <Icona />
        <span>{t('whatsapp.bottone')}</span>
        <span className="sr-only">{t('whatsapp.srSuffisso')}</span>
      </a>
    </section>
  )
}

/* L'icona sta qui e non in config perché è decorazione di questo componente,
   mentre i path in socials.js servono all'elenco dei contatti. */
function Icona() {
  return (
    <svg className={s.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.86 9.86 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 18.06h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.81.83-3.02-.2-.31a8.17 8.17 0 0 1-1.25-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.2-8.26 8.2Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.38-1.99-1.23-.74-.65-1.23-1.46-1.38-1.71-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.13.17 1.74 2.65 4.21 3.72.59.25 1.05.4 1.4.52.59.18 1.13.16 1.55.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"
        fill="currentColor"
      />
    </svg>
  )
}

import { LINGUE, useI18n } from '../lib/i18n.jsx'

import s from './LangSwitch.module.css'

/**
 * Il selettore di lingua: due bottoni, IT e EN.
 *
 * DUE BOTTONI E NON UN MENU A TENDINA. Con due sole lingue una tendina
 * costringe a due gesti (aprila, scegli) per una scelta che ne richiede uno, e
 * su telefono apre il selettore di sistema a tutto schermo per due voci. Qui
 * si vede subito in che lingua sei e con un tocco passi all'altra.
 *
 * `aria-pressed` e non `aria-current`: sono controlli che cambiano uno stato
 * dell'interfaccia, non link a una pagina. Uno screen reader annuncia
 * "Italiano, premuto", che e' esattamente l'informazione utile.
 *
 * Le etichette (IT/EN) NON si traducono: sono codici di lingua, e "IT" tradotto
 * in inglese resterebbe "IT". Il nome per esteso, che invece si traduce, sta
 * nel titolo accessibile del bottone: chi usa uno screen reader sente
 * "Italiano" e non "i, t".
 *
 * `compatta` e' la versione da barra desktop: bersagli da 34px invece di 44,
 * perche' li' si clicca col mouse e lo spazio e' quello che resta dopo sette
 * voci di menu. Su telefono il selettore sta nel pannello del panino, dove i
 * 44px pieni servono.
 */
export default function LangSwitch({ compatta = false, className = '' }) {
  const { lang, setLang, t } = useI18n()

  return (
    <div
      className={`${s.wrap} ${compatta ? s.compatta : ''} ${className}`.trim()}
      role="group"
      aria-label={t('lingua.scegli')}
    >
      {LINGUE.map((l) => {
        const attiva = l.code === lang
        return (
          <button
            key={l.code}
            type="button"
            className={`${s.btn} ${attiva ? s.attiva : ''}`.trim()}
            onClick={() => setLang(l.code)}
            aria-pressed={attiva}
          >
            <span aria-hidden="true">{l.label}</span>
            <span className="sr-only">{t(`lingua.${l.code}`)}</span>
          </button>
        )
      })}
    </div>
  )
}

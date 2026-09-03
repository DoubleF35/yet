import { useT } from '../lib/i18n.jsx'

import s from './LanguageToggle.module.css'

/**
 * L'interruttore fra italiano e inglese.
 *
 * DUE ETICHETTE VISIBILI, non una. Un bottone che mostra solo "EN" e'
 * ambiguo: vuol dire "sei in inglese" o "premi per l'inglese"? Mostrando
 * IT | EN con quella attiva evidenziata, la domanda non si pone: si vede in
 * che lingua sei e dove puoi andare, come su un interruttore vero.
 *
 * Non e' una <select>: con due sole opzioni un menu a tendina costa due
 * gesti (apri, scegli) dove ne basta uno, e su un telefono apre un pannello
 * di sistema a tutto schermo per due voci.
 */
export default function LanguageToggle({ className = '' }) {
  const { lang, cambia } = useT()

  return (
    /* role="group" con un nome: senza, uno screen reader legge due bottoni
       "IT" e "EN" senza dire di cosa sono le iniziali. */
    <div
      className={`${s.wrap} ${className}`.trim()}
      role="group"
      aria-label={lang === 'it' ? 'Lingua del sito' : 'Site language'}
    >
      {[
        { code: 'it', label: 'IT', nome: 'Italiano' },
        { code: 'en', label: 'EN', nome: 'English' },
      ].map(({ code, label, nome }) => {
        const attiva = lang === code
        return (
          <button
            key={code}
            type="button"
            className={`${s.btn} ${attiva ? s.attiva : ''}`.trim()}
            onClick={() => cambia(code)}
            /* aria-pressed e non aria-current: sono due bottoni che
               commutano uno stato, non due link a due posti diversi. */
            aria-pressed={attiva}
            /* Il nome completo nell'etichetta accessibile: "IT" da solo non
               si capisce ad alta voce. */
            aria-label={nome}
            /* Premere quella già attiva non fa niente e non deve nemmeno
               sembrare cliccabile. */
            disabled={attiva}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

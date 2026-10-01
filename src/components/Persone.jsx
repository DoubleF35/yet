import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Avatar from './Avatar.jsx'
import Reveal from './Reveal.jsx'
import { etichettaRuolo, ordinaPersone } from '../lib/citta.js'
import { listUsers } from '../lib/db.js'
import { isFirebaseConfigured } from '../lib/firebase.js'
import { useI18n } from '../lib/i18n.jsx'
import { memberName, memberPath } from '../lib/members.jsx'
import { prefersReducedMotion } from '../lib/motion.js'

import s from './Persone.module.css'

/* Pixel al secondo. Una tessera e' larga 280px col suo margine, quindi a
   questa andatura ne passa una ogni sei secondi: si vede che si muove senza
   che serva rincorrerla. Sopra i 90 il testo sulle tessere diventa
   illeggibile mentre passa. */
const VELOCITA = 48

/* Quanto resta ferma dopo che l'hai toccata. Quattro secondi e' il tempo di
   leggere una tessera: ripartire prima vuol dire strappare via quello che la
   persona stava guardando, ed e' il difetto peggiore di questo genere di
   caroselli. */
const PAUSA_DOPO_TOCCO = 4000

/**
 * La fila di persone sulla home.
 *
 * Scorre da sola e si clicca per aprire un profilo. Non e' l'elenco: e'
 * l'assaggio che porta alla vetrina.
 *
 * L'ORDINE E' QUELLO DELLA VETRINA, e per averlo bisogna leggere TUTTI i
 * profili e non un sottoinsieme: l'ordine mette davanti chi organizza, e per
 * sapere chi organizza bisogna averli visti tutti. Costa circa 768 kB oggi
 * (45 profili, con le foto dentro i documenti come data URL). Si paga una
 * volta sola per visita, e la regola di ordinamento sta in lib/citta.js
 * insieme a quella che usa la vetrina, cosi' le due non possono divergere.
 *
 * SE NON C'E' NIENTE, NON C'E' NIENTE. Niente scheletro, niente riquadro
 * "nessun profilo": questo blocco sta in mezzo a una home che ha comunque
 * altro da mostrare, e uno stato vuoto qui farebbe sembrare il sito piu' vuoto
 * di quanto e'. Lo stato vuoto ha senso sulla vetrina, dove uno ci arriva
 * CERCANDO le persone.
 *
 * @param {number} [totale] quante persone ci sono in tutto, per il link finale.
 */
export default function Persone({ totale = null }) {
  const { t } = useI18n()
  const [persone, setPersone] = useState([])
  const [puo, setPuo] = useState({ indietro: false, avanti: false })

  const pista = useRef(null)
  /* La posizione in virgola mobile. scrollLeft arrotonda, quindi sommandogli
     0,37 px per fotogramma non si muoverebbe mai: l'avanzamento va tenuto
     qui e assegnato intero. */
  const posizione = useRef(0)
  /* Fino a quando restare fermi dopo un tocco dell'utente. */
  const fermoFino = useRef(0)

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    let vivo = true

    listUsers()
      .then((elenco) => {
        if (!vivo) return
        setPersone(ordinaPersone(elenco).tutti)
      })
      .catch((e) => {
        /* In silenzio, ed e' voluto: se i profili non arrivano la home deve
           perdere questo blocco, non mostrare un errore. Il posto dove un
           errore sui profili va detto e' la vetrina. */
        console.warn('[YET] Non riesco a leggere i profili per la home.', e)
      })

    return () => {
      vivo = false
    }
  }, [])

  /* Quali frecce hanno senso: una freccia che non porta da nessuna parte e'
     peggio di nessuna freccia. */
  const misura = useCallback(() => {
    const el = pista.current
    if (!el) return
    const margine = 4 /* i sub-pixel dello zoom del browser */
    const ora = {
      indietro: el.scrollLeft > margine,
      avanti: el.scrollLeft + el.clientWidth < el.scrollWidth - margine,
    }
    /* Si aggiorna SOLO se e' cambiato davvero, e non e' un'ottimizzazione
       prematura: questa funzione gira a ogni evento di scorrimento, cioe' a
       ogni fotogramma mentre la fila si muove da sola. Passando sempre un
       oggetto nuovo, React ridisegnava tutte e 46 le tessere sessanta volte al
       secondo e lo scorrimento si inchiodava. Misurato: 2 px al secondo invece
       di 22, a scatti. */
    setPuo((prec) =>
      prec.indietro === ora.indietro && prec.avanti === ora.avanti ? prec : ora,
    )
  }, [])

  useEffect(() => {
    misura()
    const el = pista.current
    if (!el) return undefined
    el.addEventListener('scroll', misura, { passive: true })
    window.addEventListener('resize', misura)
    return () => {
      el.removeEventListener('scroll', misura)
      window.removeEventListener('resize', misura)
    }
  }, [misura, persone])

  /** Qualunque cosa faccia l'utente, la fila si ferma e aspetta. */
  const toccata = useCallback(() => {
    fermoFino.current = Date.now() + PAUSA_DOPO_TOCCO
  }, [])

  /* ----------------------------------------------------------------------
     Lo scorrimento automatico.

     Non usa scroll-behavior: smooth ne' un'animazione CSS, ma un avanzamento
     per fotogramma, perche' deve potersi fermare a META' senza strappi: una
     transizione CSS gia' partita non si interrompe, si puo' solo annullare, e
     annullarla fa saltare la fila indietro.

     Si ferma da sola in cinque casi, e ognuno ha una ragione sua:
       - "riduci animazioni" attivo: non parte proprio;
       - il mouse sopra o il fuoco dentro: stai leggendo o stai per cliccare;
       - la scheda del browser in secondo piano: nessuno la guarda e il
         portatile scalda per niente;
       - l'hai toccata da poco (trascinata, rotellina, frecce).
     ---------------------------------------------------------------------- */
  useEffect(() => {
    const el = pista.current
    if (!el || persone.length === 0) return undefined
    if (prefersReducedMotion()) return undefined

    let fermo = false
    let raf = 0
    let ultimo = performance.now()

    /* L'ultima posizione che abbiamo scritto NOI. Serve a distinguere il
       nostro movimento da quello dell'utente: se scrollLeft si discosta da
       questa, la fila l'ha mossa qualcun altro (dito, rotella, frecce,
       tabulazione) e l'accumulatore va riallineato.

       Prima il riallineamento stava dentro `riprendi`, cioe' a ogni
       pointerleave, e li' era un difetto: scrollLeft e' un intero, mentre a
       48 px/s su uno schermo a 144 Hz avanziamo di 0,33 px per fotogramma.
       Ogni riallineamento buttava via la frazione, e la fila non arrivava mai
       a muovere un pixel intero. Misurato: 3 px al secondo invece di 48. */
    let scritto = el.scrollLeft

    const sospendi = () => {
      fermo = true
    }
    const riprendi = () => {
      fermo = false
      ultimo = performance.now()
    }

    const fotogramma = (ora) => {
      const dt = Math.min(ora - ultimo, 100) /* un fermo-immagine non deve far saltare la fila */
      ultimo = ora

      const inAttesa = fermo || document.hidden || Date.now() < fermoFino.current
      if (!inAttesa) {
        const limite = el.scrollWidth - el.clientWidth
        if (limite <= 0) {
          raf = requestAnimationFrame(fotogramma)
          return
        }

        /* Qualcuno ha mosso la fila mentre non guardavamo: si riparte da li'
           invece di strapparla indietro dove eravamo rimasti. */
        if (Math.abs(el.scrollLeft - scritto) > 2) posizione.current = el.scrollLeft

        posizione.current += (VELOCITA * dt) / 1000

        /* Arrivata in fondo torna all'inizio. Il salto si vede, ed e' una
           scelta: l'alternativa e' duplicare tutte le tessere per far girare
           la fila all'infinito, cioe' raddoppiare il DOM e leggere due volte
           le stesse facce con uno screen reader. */
        if (posizione.current >= limite) posizione.current = 0

        el.scrollLeft = posizione.current
        scritto = el.scrollLeft
      }

      raf = requestAnimationFrame(fotogramma)
    }

    posizione.current = el.scrollLeft
    raf = requestAnimationFrame(fotogramma)

    el.addEventListener('pointerenter', sospendi)
    el.addEventListener('pointerleave', riprendi)
    el.addEventListener('focusin', sospendi)
    el.addEventListener('focusout', riprendi)
    el.addEventListener('wheel', toccata, { passive: true })
    el.addEventListener('touchstart', toccata, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerenter', sospendi)
      el.removeEventListener('pointerleave', riprendi)
      el.removeEventListener('focusin', sospendi)
      el.removeEventListener('focusout', riprendi)
      el.removeEventListener('wheel', toccata)
      el.removeEventListener('touchstart', toccata)
    }
  }, [persone, toccata])

  const scorri = useCallback(
    (verso) => {
      const el = pista.current
      if (!el) return
      toccata()
      /* Di una tessera per volta, misurata sul DOM invece che su un numero
         scritto qui: la larghezza cambia col viewport. */
      const tessera = el.querySelector('li')
      const passo = tessera ? tessera.getBoundingClientRect().width + 16 : el.clientWidth * 0.8
      el.scrollBy({ left: passo * verso, behavior: 'smooth' })
    },
    [toccata],
  )

  if (persone.length === 0) return null

  const quanti = totale ?? persone.length

  return (
    /* Un comparire solo per tutto il blocco, non uno per tessera: la pista
       scorre in orizzontale, e scaglionare lascerebbe invisibili le tessere
       fuori schermo, che e' il contrario di quello che serve. */
    <Reveal as="section" className={s.wrap} aria-labelledby="persone-titolo">
      <div className={`${s.testa} container`}>
        <div className={s.testaTesto}>
          <p className={s.occhiello}>{t('persone.occhiello')}</p>
          <h2 className={s.titolo} id="persone-titolo">
            {t('persone.titolo')}
          </h2>
          <p className={s.sottotitolo}>{t('persone.testo')}</p>
        </div>

        <div className={s.comandi}>
          <button
            type="button"
            className={s.freccia}
            onClick={() => scorri(-1)}
            disabled={!puo.indietro}
            aria-label={t('persone.precedente')}
          >
            &larr;
          </button>
          <button
            type="button"
            className={s.freccia}
            onClick={() => scorri(1)}
            disabled={!puo.avanti}
            aria-label={t('persone.successiva')}
          >
            &rarr;
          </button>
        </div>
      </div>

      <ul className={s.pista} ref={pista} aria-label={t('persone.regione')}>
        {persone.map((persona) => (
          <li className={s.voce} key={persona.uid}>
            <Tessera persona={persona} />
          </li>
        ))}

        {/* L'ultima casella e' il passaggio alla vetrina, in fondo alla fila:
            chi scorre fino in fondo sta gia' cercando il resto, e trovarci il
            link e' piu' naturale che dover risalire in cima. */}
        <li className={`${s.voce} ${s.voceTutti}`}>
          <Link className={s.tutti} to="/vetrina">
            <span className={s.tuttiNumero}>{quanti}</span>
            <span className={s.tuttiTesto}>{t('persone.tuttiFila')}</span>
          </Link>
        </li>
      </ul>

      <div className="container">
        <Link className={s.tuttiSotto} to="/vetrina">
          {t('persone.tutti', { n: quanti })}
        </Link>
      </div>
    </Reveal>
  )
}

function Tessera({ persona }) {
  const { t } = useI18n()
  const nome = memberName(persona)
  const etichetta = etichettaRuolo(persona, t)
  const dove = String(persona.location ?? '').trim()
  const bio = String(persona.bio ?? '').trim()

  return (
    <Link className={s.tessera} to={memberPath(persona)}>
      <span className={s.foto}>
        <Avatar src={persona.photoURL} name={nome} fill />
      </span>

      <span className={s.corpo}>
        <span className={s.nome}>{nome}</span>

        {etichetta ? (
          <span className={s.badge}>{etichetta}</span>
        ) : (
          dove && <span className={s.dove}>{dove}</span>
        )}

        {bio && <span className={s.bio}>{bio}</span>}
      </span>
    </Link>
  )
}

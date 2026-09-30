import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { useI18n } from '../lib/i18n.jsx'

import s from './Galleria.module.css'

/**
 * Le foto di una serata.
 *
 * I file li prepara `npm run foto` e li descrive src/data/gallerie.json: qui
 * dentro non si decide niente sulle immagini, si legge soltanto.
 *
 * TRE SCELTE CHE VALE LA PENA SPIEGARE
 *
 * Il riquadro ha il rapporto della foto VERA, preso dal manifesto, e lo tiene
 * anche mentre l'immagine sta arrivando. Senza, la pagina si accorcia e si
 * allunga a ogni foto che atterra, il testo sotto salta e chi stava leggendo
 * perde il segno. E' la stessa ragione per cui width e height sono sempre
 * dichiarati sul tag.
 *
 * Lo `srcset` offre solo le misure che ESISTONO davvero per quello scatto: una
 * foto piccola in partenza non ha la 1600, e prometterla al browser vorrebbe
 * dire un 404 al posto dell'immagine.
 *
 * L'ingrandimento e' un <dialog> vero e non un div: la trappola del focus,
 * Esc per chiudere e lo sfondo li porta gia' il browser, scritti meglio di
 * come li riscriverei io.
 */
export default function Galleria({ slug, scatti = [] }) {
  const { t } = useI18n()
  const dialogRef = useRef(null)
  const [aperta, setAperta] = useState(null)
  const titoloId = useId()

  const quante = scatti.length

  const apri = useCallback((indice) => {
    setAperta(indice)
  }, [])

  const chiudi = useCallback(() => {
    setAperta(null)
  }, [])

  const scorri = useCallback(
    (passo) => {
      setAperta((i) => {
        if (i === null) return i
        /* Gira in tondo: dall'ultima si torna alla prima. In una galleria di
           una serata e' il comportamento che la gente si aspetta, e toglie il
           vicolo cieco dell'ultima foto con il tasto avanti spento. */
        return (i + passo + quante) % quante
      })
    },
    [quante],
  )

  /* showModal() e close() non si possono chiamare nel render: sono effetti sul
     DOM. Qui lo stato React comanda e il dialog lo segue. */
  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (aperta !== null && !d.open) d.showModal()
    if (aperta === null && d.open) d.close()
  }, [aperta])

  /* Le frecce servono solo mentre l'ingrandimento e' aperto. Esc lo gestisce
     gia' il dialog da solo, ma l'evento `close` va comunque ascoltato o lo
     stato React resterebbe a credere che sia ancora aperto. */
  useEffect(() => {
    if (aperta === null) return undefined
    const suTasto = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        scorri(1)
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scorri(-1)
      }
    }
    document.addEventListener('keydown', suTasto)
    return () => document.removeEventListener('keydown', suTasto)
  }, [aperta, scorri])

  if (quante === 0) return null

  const corrente = aperta === null ? null : scatti[aperta]

  return (
    <section className={s.wrap} aria-labelledby={titoloId}>
      <div className={s.intestazione}>
        <h2 className={s.titolo} id={titoloId}>
          {t('galleria.titolo')}
        </h2>
        <span className={s.conteggio}>
          {t(quante === 1 ? 'galleria.unaFoto' : 'galleria.tanteFoto', { n: quante })}
        </span>
      </div>

      <ul className={s.griglia}>
        {scatti.map((scatto, i) => (
          <li className={`${s.cella} ${i === 0 ? s.cellaGrande : ''}`.trim()} key={scatto.id}>
            <button
              type="button"
              className={s.bottone}
              onClick={() => apri(i)}
              /* Il nome accessibile: la didascalia se c'e', altrimenti la
                 posizione. Un bottone che si chiama solo "immagine" non dice
                 niente a chi naviga a voce. */
              aria-label={
                scatto.alt
                  ? t('galleria.apriConAlt', { alt: scatto.alt, n: i + 1, tot: quante })
                  : t('galleria.apri', { n: i + 1, tot: quante })
              }
            >
              <Foto
                slug={slug}
                scatto={scatto}
                grande={i === 0}
                /* La prima foto e' quasi sempre sopra la piega: caricarla
                   pigramente la farebbe arrivare DOPO, non prima. */
                priorita={i === 0}
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        className={s.dialogo}
        ref={dialogRef}
        onClose={chiudi}
        /* Clic sullo sfondo: il target e' il dialog stesso solo quando si
           colpisce l'area fuori dal contenuto, che e' dentro un <div>. */
        onClick={(e) => {
          if (e.target === dialogRef.current) chiudi()
        }}
        aria-label={t('galleria.titolo')}
      >
        {corrente && (
          <div className={s.dialogoCorpo}>
            <img
              className={s.dialogoFoto}
              src={urlFoto(slug, corrente, misuraPiuGrande(corrente))}
              alt={corrente.alt || t('galleria.senzaDidascalia', { n: aperta + 1 })}
              width={corrente.w}
              height={corrente.h}
            />

            <div className={s.dialogoBarra}>
              <button
                type="button"
                className={s.dialogoTasto}
                onClick={() => scorri(-1)}
                aria-label={t('galleria.precedente')}
              >
                &larr;
              </button>
              <span className={s.dialogoConteggio}>
                {t('galleria.posizione', { n: aperta + 1, tot: quante })}
              </span>
              <button
                type="button"
                className={s.dialogoTasto}
                onClick={() => scorri(1)}
                aria-label={t('galleria.successiva')}
              >
                &rarr;
              </button>
              <button
                type="button"
                className={`${s.dialogoTasto} ${s.dialogoChiudi}`}
                onClick={chiudi}
                aria-label={t('galleria.chiudi')}
              >
                &times;
              </button>
            </div>

            {corrente.alt && <p className={s.dialogoDidascalia}>{corrente.alt}</p>}
          </div>
        )}
      </dialog>
    </section>
  )
}

/** L'indirizzo di una misura. BASE_URL perche' un giorno il sito potrebbe non stare in radice. */
export function urlFoto(slug, scatto, misura) {
  return `${import.meta.env.BASE_URL}eventi/${slug}/${scatto.base}-${misura}.webp`
}

function misuraPiuGrande(scatto) {
  const m = scatto.misure ?? []
  return m.length > 0 ? m[m.length - 1] : 800
}

/**
 * Una foto con tutte le sue misure.
 * Esportata perche' la copertina della pagina evento usa lo stesso meccanismo.
 */
export function Foto({ slug, scatto, grande = false, priorita = false, classe = '' }) {
  const misure = scatto.misure ?? [800]
  const srcSet = misure.map((m) => `${urlFoto(slug, scatto, m)} ${m}w`).join(', ')

  return (
    <img
      className={`${s.foto} ${classe}`.trim()}
      src={urlFoto(slug, scatto, misure[0])}
      srcSet={srcSet}
      sizes={
        grande
          ? '(min-width: 60rem) 34rem, (min-width: 40rem) 50vw, 100vw'
          : '(min-width: 60rem) 17rem, (min-width: 40rem) 25vw, 50vw'
      }
      alt={scatto.alt || ''}
      /* Le misure vere servono al browser per tenere il posto prima che la
         foto arrivi: senza, la pagina salta. */
      width={scatto.w}
      height={scatto.h}
      loading={priorita ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priorita ? 'high' : 'auto'}
    />
  )
}

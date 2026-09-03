import { useEffect, useState } from 'react'

import { COMMUNITY } from '../config/socials.js'

import s from './Brand.module.css'

/* I colori del marchio, con i rapporti di contrasto MISURATI e non stimati.
   Stanno qui come dato e non come testo scritto a mano perché la pagina li
   mostra e li fa copiare: un valore sbagliato qui diventa un logo sbagliato
   sulla locandina di qualcun altro. */
const COLORI = [
  {
    nome: 'Coral',
    hex: '#D14A2C',
    ruolo: 'L’accento. La freccia del marchio, i dettagli, un solo elemento per schermata.',
    nota: 'Su fondo scuro fa 4,2:1. Va bene per titoli e icone, non per il testo piccolo.',
  },
  {
    nome: 'Beige',
    hex: '#ECEAE4',
    ruolo: 'Il fondo delle stampe e il testo sul sito scuro. È il colore che si vede di più.',
    nota: 'Sul nero caldo fa 16,3:1, il massimo della scala.',
  },
  {
    nome: 'Nero caldo',
    hex: '#1E1B18',
    ruolo: 'Il testo sulle stampe, il fondo del sito. Non è il nero puro, tira al marrone.',
    nota: 'Il nero assoluto (#000) accanto al beige sembra un buco: non usarlo.',
  },
]

const REGOLE = [
  {
    si: 'Lascia respirare il marchio: almeno l’altezza della “Y” di spazio vuoto tutto intorno.',
    no: 'Non stringerlo fra altri elementi.',
  },
  {
    si: 'Usa la versione chiara sui fondi scuri e quella scura sui fondi chiari.',
    no: 'Non mettere quella scura su una foto scura: la parte nera sparisce e resta una freccia sospesa.',
  },
  {
    si: 'Scalalo tenendo le proporzioni.',
    no: 'Non allargarlo, non stringerlo, non inclinarlo.',
  },
  {
    si: 'Se ti serve monocromatico, usa il beige o il nero pieni.',
    no: 'Non ricolorarlo di altri colori, e non mettere la freccia di un colore diverso dal coral.',
  },
]

export default function Brand() {
  const base = import.meta.env.BASE_URL
  const [copiato, setCopiato] = useState(null)

  useEffect(() => {
    const previous = document.title
    document.title = 'Brand · YET'
    return () => {
      document.title = previous
    }
  }, [])

  /* clipboard può non esistere (http non sicuro) o essere negata: senza il
     catch il bottone resterebbe muto e sembrerebbe rotto. */
  async function copia(valore) {
    try {
      await navigator.clipboard.writeText(valore)
      setCopiato(valore)
      window.setTimeout(() => setCopiato((c) => (c === valore ? null : c)), 2000)
    } catch {
      setCopiato('errore')
      window.setTimeout(() => setCopiato((c) => (c === 'errore' ? null : c)), 3000)
    }
  }

  return (
    <div className={s.page}>
      <header className={`${s.head} container`}>
        <p className={s.eyebrow}>Brand identity</p>
        <h1 className={s.title}>Il marchio</h1>
        <p className={s.lead}>
          Se devi mettere {COMMUNITY.name} su una locandina, una slide o un post, i file e le
          regole sono qui. Serve a evitare la fine che fanno tutti i loghi delle associazioni:
          sette versioni diverse in giro, nessuna giusta.
        </p>
      </header>

      <div className="container">
        {/* --- il logo ---------------------------------------------------- */}
        <section className={s.section} aria-labelledby="logo">
          <h2 className={s.h2} id="logo">
            Il logo
          </h2>

          <div className={s.loghi}>
            <figure className={s.provaScura}>
              <img src={`${base}logo-light.png`} alt="Il logo YET nella versione chiara" />
              <figcaption>
                Versione chiara, per fondi scuri
                <a className={s.download} href={`${base}logo-light.png`} download="yet-logo-chiaro.png">
                  Scarica PNG
                </a>
              </figcaption>
            </figure>

            <figure className={s.provaChiara}>
              <img src={`${base}logo.png`} alt="Il logo YET nella versione scura" />
              <figcaption>
                Versione scura, per fondi chiari
                <a className={s.download} href={`${base}logo.png`} download="yet-logo-scuro.png">
                  Scarica PNG
                </a>
              </figcaption>
            </figure>
          </div>

          <p className={s.nota}>
            Il marchio è un’immagine, non una scritta: non va mai ricomposto scrivendo «YET» con un
            carattere qualsiasi. La lettera finale è fatta di due segni, e quelli sono il simbolo.
          </p>
        </section>

        {/* --- le lancette ------------------------------------------------ */}
        <section className={s.section} aria-labelledby="lancette">
          <h2 className={s.h2} id="lancette">
            Le lancette
          </h2>

          <div className={s.lancetteRiga}>
            <img
              className={s.lancette}
              src={`${base}hands-light.png`}
              alt="Le due lancette del marchio YET: una freccia coral e una barra diagonale"
            />
            <div>
              <p className={s.nota}>
                La lettera finale del marchio è fatta di due segni che sembrano le lancette di un
                orologio. Presi da soli diventano un elemento grafico riutilizzabile: divisori fra
                le sezioni, decorazione, icona.
              </p>
              <p className={s.nota}>
                Si possono ruotare e scalare. Non si deformano e non si ricolorano.
              </p>
              <a
                className={s.download}
                href={`${base}hands-light.png`}
                download="yet-lancette-chiaro.png"
              >
                Scarica PNG
              </a>
            </div>
          </div>
        </section>

        {/* --- i colori --------------------------------------------------- */}
        <section className={s.section} aria-labelledby="colori">
          <h2 className={s.h2} id="colori">
            I colori
          </h2>
          <p className={s.nota}>
            Tre, e bastano. I rapporti di contrasto qui sotto sono calcolati con la formula WCAG,
            non stimati a occhio: servono a sapere quando un colore si può usare per il testo e
            quando no.
          </p>

          <ul className={s.colori}>
            {COLORI.map((c) => (
              <li className={s.colore} key={c.hex}>
                <span
                  className={s.campione}
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
                <div className={s.coloreInfo}>
                  <p className={s.coloreNome}>{c.nome}</p>
                  <button
                    type="button"
                    className={s.hex}
                    onClick={() => copia(c.hex)}
                    aria-label={`Copia il codice colore ${c.hex}`}
                  >
                    {copiato === c.hex ? 'Copiato' : c.hex}
                  </button>
                  <p className={s.coloreRuolo}>{c.ruolo}</p>
                  <p className={s.coloreNota}>{c.nota}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="sr-only" role="status">
            {copiato === 'errore'
              ? 'Non riesco a copiare. Selezionalo a mano.'
              : copiato
                ? `${copiato} copiato negli appunti.`
                : ''}
          </p>
          {copiato === 'errore' && (
            <p className={s.erroreCopia}>
              Il browser non mi lascia copiare. Selezionalo a mano, è {COLORI[0].hex} e simili.
            </p>
          )}
        </section>

        {/* --- il carattere ----------------------------------------------- */}
        <section className={s.section} aria-labelledby="carattere">
          <h2 className={s.h2} id="carattere">
            Il carattere
          </h2>
          <p className={s.campioneFont}>Inter</p>
          <p className={s.nota}>
            Un solo carattere per tutto. Titoli in Extrabold (800), testo in Regular (400),
            etichette e bottoni in Semibold (600). È gratuito e si scarica da{' '}
            <a
              className={s.link}
              href="https://rsms.me/inter/"
              target="_blank"
              rel="noopener noreferrer"
            >
              rsms.me/inter
            </a>
            <span className="sr-only"> (si apre in una nuova scheda)</span>.
          </p>
          <div className={s.pesi}>
            <span style={{ fontWeight: 400 }}>400 Regular</span>
            <span style={{ fontWeight: 600 }}>600 Semibold</span>
            <span style={{ fontWeight: 800 }}>800 Extrabold</span>
          </div>
        </section>

        {/* --- cosa non fare ---------------------------------------------- */}
        <section className={s.section} aria-labelledby="regole">
          <h2 className={s.h2} id="regole">
            Sì e no
          </h2>
          <ul className={s.regole}>
            {REGOLE.map((r) => (
              <li className={s.regola} key={r.si}>
                <p className={s.si}>
                  <span className={s.segno} aria-hidden="true">
                    Sì
                  </span>
                  {r.si}
                </p>
                <p className={s.no}>
                  <span className={s.segno} aria-hidden="true">
                    No
                  </span>
                  {r.no}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

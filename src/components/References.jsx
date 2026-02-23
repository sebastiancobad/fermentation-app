import { useState } from 'react'
import { SectionHeader } from './Dashboard'

const BOOKS = [
  {
    id: 'brock',
    authors: 'Madigan, M.T., Martinko, J.M., Bender, K.S., Buckley, D.H., Stahl, D.A.',
    year: 2022,
    title: 'Brock Biology of Microorganisms',
    edition: '16ª ed.',
    publisher: 'Pearson Education',
    isbn: 'ISBN 978-0134990361',
    pages: '1080 pp.',
    type: 'Libro de texto',
    relevance: 'Fundamento de microbiología; capítulos 5–7 cubren fisiología y crecimiento microbiano.',
    tags: ['Microbiología', 'Fisiología', 'Crecimiento'],
    color: '#22c55e',
    icon: '📗',
  },
  {
    id: 'shuler',
    authors: 'Shuler, M.L., Kargi, F., DeLisa, M.P.',
    year: 2017,
    title: 'Bioprocess Engineering: Basic Concepts',
    edition: '3ª ed.',
    publisher: 'Prentice Hall (Pearson)',
    isbn: 'ISBN 978-0137062706',
    pages: '576 pp.',
    type: 'Texto de ingeniería',
    relevance: 'Referencia principal en ingeniería de bioprocesos. Cubre cinética, biorreactores y escalado.',
    tags: ['Cinética', 'Biorreactores', 'Escalado', 'Diseño'],
    color: '#06b6d4',
    icon: '📘',
  },
  {
    id: 'stanbury',
    authors: 'Stanbury, P.F., Whitaker, A., Hall, S.J.',
    year: 2017,
    title: 'Principles of Fermentation Technology',
    edition: '3ª ed.',
    publisher: 'Butterworth-Heinemann (Elsevier)',
    isbn: 'ISBN 978-0080999531',
    pages: '584 pp.',
    type: 'Texto de ingeniería',
    relevance: 'Excelente tratamiento de operación de fermentadores industriales, control y optimización de procesos.',
    tags: ['Fermentación Industrial', 'Control', 'Fed-Batch', 'Scale-up'],
    color: '#a855f7',
    icon: '📙',
  },
  {
    id: 'doran',
    authors: 'Doran, P.M.',
    year: 2013,
    title: 'Bioprocess Engineering Principles',
    edition: '2ª ed.',
    publisher: 'Academic Press (Elsevier)',
    isbn: 'ISBN 978-0122208515',
    pages: '936 pp.',
    type: 'Texto avanzado',
    relevance: 'Tratamiento riguroso de fenómenos de transporte, balances de energía y transferencia de masa en biorreactores.',
    tags: ['Transferencia de masa', 'kLa', 'Fenómenos de transporte'],
    color: '#f59e0b',
    icon: '📒',
  },
  {
    id: 'blanch',
    authors: 'Blanch, H.W., Clark, D.S.',
    year: 1997,
    title: 'Biochemical Engineering',
    edition: '1ª ed.',
    publisher: 'Marcel Dekker',
    isbn: 'ISBN 978-0824700997',
    pages: '702 pp.',
    type: 'Texto avanzado',
    relevance: 'Análisis termodinámico, estequiometría detallada del crecimiento y modelos de metabolismo energético.',
    tags: ['Termodinámica', 'Estequiometría', 'Energía'],
    color: '#ef4444',
    icon: '📕',
  },
  {
    id: 'nielsen',
    authors: 'Nielsen, J., Villadsen, J., Lidén, G.',
    year: 2003,
    title: 'Bioreaction Engineering Principles',
    edition: '2ª ed.',
    publisher: 'Kluwer Academic / Plenum',
    isbn: 'ISBN 978-0306474583',
    pages: '528 pp.',
    type: 'Texto avanzado',
    relevance: 'Modelos de metabolismo, análisis de flujos metabólicos (MFA) y diseño de procesos óptimos.',
    tags: ['Modelos metabólicos', 'MFA', 'Diseño óptimo'],
    color: '#84cc16',
    icon: '📗',
  },
]

const ARTICLES = [
  {
    authors: 'Monod, J.',
    year: 1949,
    title: 'The growth of bacterial cultures',
    journal: 'Annual Review of Microbiology',
    vol: '3(1): 371–394',
    doi: '10.1146/annurev.mi.03.100149.002103',
    relevance: 'Artículo seminal que establece la ecuación de Monod para cinética microbiana. Lectura obligatoria.',
    badge: 'SEMINAL',
    badgeColor: '#f59e0b',
  },
  {
    authors: 'Monod, J.',
    year: 1942,
    title: 'Recherches sur la croissance des cultures bactériennes',
    journal: 'Hermann et Cie, Paris',
    vol: 'Tesis doctoral',
    doi: null,
    relevance: 'Tesis doctoral de Monod. Base experimental de toda la cinética microbiana moderna.',
    badge: 'TESIS DOCTORAL',
    badgeColor: '#a855f7',
  },
  {
    authors: 'Michaelis, L., Menten, M.L.',
    year: 1913,
    title: 'Die Kinetik der Invertinwirkung',
    journal: 'Biochemische Zeitschrift',
    vol: '49: 333–369',
    doi: null,
    relevance: 'Modelo de Michaelis-Menten para enzimas; base conceptual del modelo de Monod.',
    badge: 'CLÁSICO',
    badgeColor: '#22c55e',
  },
  {
    authors: 'Pirt, S.J.',
    year: 1965,
    title: 'The maintenance energy of bacteria in growing cultures',
    journal: 'Proceedings of the Royal Society B',
    vol: '163(991): 224–231',
    doi: '10.1098/rspb.1965.0069',
    relevance: 'Introduce el concepto de energía de mantenimiento (ms) en el balance de sustrato.',
    badge: 'CLÁSICO',
    badgeColor: '#22c55e',
  },
]

const ONLINE_RESOURCES = [
  {
    name: 'ScienceDirect — Biochemical Engineering Journal',
    url: 'https://www.sciencedirect.com/journal/biochemical-engineering-journal',
    desc: 'Revista líder en ingeniería bioquímica. Artículos sobre cinética, biorreactores y escalado.',
    icon: '🔬',
    badge: 'Revista científica',
    color: '#22c55e',
  },
  {
    name: 'MIT OpenCourseWare — Biochemical Engineering (10.28)',
    url: 'https://ocw.mit.edu',
    desc: 'Notas de clase, problem sets y exámenes del curso de ingeniería bioquímica del MIT. Acceso libre.',
    icon: '🎓',
    badge: 'Curso universitario',
    color: '#06b6d4',
  },
  {
    name: 'Coursera — Bioinformatics & Bioprocess Engineering',
    url: 'https://www.coursera.org',
    desc: 'Cursos online de universidades como UCSD, Penn, Johns Hopkins sobre biología computacional y bioprocesos.',
    icon: '💻',
    badge: 'MOOC',
    color: '#a855f7',
  },
  {
    name: 'NIST Chemistry WebBook',
    url: 'https://webbook.nist.gov',
    desc: 'Datos termodinámicos y de propiedades físicas de sustratos y metabolitos relevantes en bioprocesos.',
    icon: '📊',
    badge: 'Base de datos',
    color: '#f59e0b',
  },
  {
    name: 'BiGG Database (UCSD) — Genome-scale models',
    url: 'http://bigg.ucsd.edu',
    desc: 'Modelos metabólicos a escala genómica (GEM) para E. coli, S. cerevisiae y otros microorganismos industriales.',
    icon: '🧬',
    badge: 'Base de datos',
    color: '#ef4444',
  },
  {
    name: 'KEGG — Metabolic Pathways',
    url: 'https://www.kegg.jp',
    desc: 'Base de datos de rutas metabólicas, enzimas y compuestos para análisis de metabolismo microbiano.',
    icon: '🗺️',
    badge: 'Base de datos',
    color: '#84cc16',
  },
]

export default function References() {
  const [activeSection, setActiveSection] = useState('books')
  const [expandedBook, setExpandedBook] = useState(null)

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="MÓDULO 8 · BIBLIOGRAFÍA"
        title="Referencias y Recursos"
        sub="Fuentes primarias y secundarias del programa de Ingeniería de Bioprocesos (2024) — Dr. Sebastián Coba Daza"
      />

      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'books', label: 'Libros de texto', count: BOOKS.length },
          { id: 'articles', label: 'Artículos clave', count: ARTICLES.length },
          { id: 'online', label: 'Recursos en línea', count: ONLINE_RESOURCES.length },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
              activeSection === s.id
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {s.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeSection === s.id ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-700 text-slate-500'
            }`}>
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Books ─── */}
      {activeSection === 'books' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Haz clic en una referencia para expandir detalles y notas de relevancia.
          </p>
          {BOOKS.map((book, i) => (
            <div
              key={book.id}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden bio-card"
            >
              <button
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-slate-700/20 transition-all"
                onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
              >
                <span className="text-2xl flex-shrink-0">{book.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full mr-2 font-medium"
                        style={{ color: book.color, backgroundColor: `${book.color}22`, border: `1px solid ${book.color}44` }}
                      >
                        {book.type}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{book.year}</span>
                    </div>
                    <span className="text-slate-500 flex-shrink-0">{expandedBook === book.id ? '▲' : '▼'}</span>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-slate-400">{book.authors} ({book.year})</p>
                    <p className="font-bold text-white mt-0.5" style={{ color: book.color }}>
                      {book.title}
                    </p>
                    <p className="text-xs text-slate-500">{book.edition} — {book.publisher}</p>
                  </div>
                </div>
              </button>

              {expandedBook === book.id && (
                <div
                  className="px-4 pb-4 border-t border-slate-700 pt-3"
                  style={{ backgroundColor: `${book.color}07` }}
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Datos de publicación</p>
                      <div className="space-y-1 text-xs font-mono">
                        <div><span className="text-slate-500">ISBN: </span><span className="text-slate-300">{book.isbn}</span></div>
                        <div><span className="text-slate-500">Páginas: </span><span className="text-slate-300">{book.pages}</span></div>
                        <div><span className="text-slate-500">Editorial: </span><span className="text-slate-300">{book.publisher}</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Relevancia para el curso</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{book.relevance}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {book.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-md"
                            style={{ color: book.color, backgroundColor: `${book.color}15`, border: `1px solid ${book.color}33` }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Citation format */}
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Formato APA</p>
                    <p className="text-xs font-mono text-slate-400 bg-slate-900 rounded-lg p-3 leading-relaxed">
                      {book.authors} ({book.year}). <em className="not-italic text-white">{book.title}</em> ({book.edition}). {book.publisher}. {book.isbn}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Articles ─── */}
      {activeSection === 'articles' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
            📜 Los artículos de Monod (1942, 1949) son de lectura obligatoria. Representan el fundamento
            histórico y matemático de toda la cinética microbiana moderna.
          </div>
          {ARTICLES.map((art, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span
                  className="text-xs px-2 py-1 rounded-full font-bold flex-shrink-0"
                  style={{ color: art.badgeColor, backgroundColor: `${art.badgeColor}22`, border: `1px solid ${art.badgeColor}44` }}
                >
                  {art.badge}
                </span>
                <span className="text-xs font-mono text-slate-500">{art.year}</span>
              </div>
              <p className="text-xs text-slate-400">{art.authors} ({art.year}).</p>
              <p className="font-bold text-white mt-1">{art.title}.</p>
              <p className="text-sm text-slate-300 mt-0.5 italic">{art.journal}, {art.vol}.</p>
              {art.doi && (
                <p className="text-xs font-mono text-emerald-500 mt-1">DOI: {art.doi}</p>
              )}
              <div
                className="mt-3 rounded-lg p-3 border text-xs text-slate-400"
                style={{ borderColor: `${art.badgeColor}33`, backgroundColor: `${art.badgeColor}0a` }}
              >
                <span className="font-semibold" style={{ color: art.badgeColor }}>Relevancia: </span>
                {art.relevance}
              </div>

              {/* APA citation */}
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Formato APA</p>
                <p className="text-xs font-mono text-slate-400 bg-slate-900 rounded-lg p-2 leading-relaxed">
                  {art.authors} ({art.year}). {art.title}. <em className="text-slate-300">{art.journal}</em>, {art.vol}.
                  {art.doi && ` https://doi.org/${art.doi}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Online Resources ─── */}
      {activeSection === 'online' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Recursos digitales recomendados para complementar el estudio. Los URLs son referencias a los sitios; acceso sujeto a disponibilidad.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {ONLINE_RESOURCES.map((res, i) => (
              <div
                key={i}
                className="bio-card bg-slate-800 border border-slate-700 rounded-xl p-4"
                style={{ borderLeftColor: res.color, borderLeftWidth: '3px' }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-xl">{res.icon}</span>
                  <div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color: res.color, backgroundColor: `${res.color}22`, border: `1px solid ${res.color}33` }}
                    >
                      {res.badge}
                    </span>
                    <h4 className="font-semibold text-white text-sm mt-1 leading-snug">{res.name}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{res.desc}</p>
                <div className="font-mono text-xs text-slate-500 bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-700">
                  {res.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Course Attribution ─── */}
      <div className="bg-slate-800 border border-emerald-500/20 rounded-xl p-6 text-center">
        <div className="text-3xl mb-3">🎓</div>
        <h3 className="font-bold text-white text-lg">Programa de Ingeniería de Bioprocesos (2024)</h3>
        <p className="text-slate-400 mt-1 mb-4">
          Dr. Sebastián Coba Daza · Departamento de Ingeniería Química y Bioprocesos
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs">
          {['Cinética Microbiana', 'Modelo de Monod', 'Biorreactores STR', 'Fed-Batch', 'Escalado Industrial', 'CFD'].map(tag => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-slate-600 text-xs mt-4">
          Esta aplicación fue desarrollada como herramienta educativa complementaria al programa académico.
          El contenido matemático y técnico sigue estrictamente las referencias bibliográficas citadas.
        </p>
      </div>
    </div>
  )
}

import Math from './Math'

const MICROORGANISMS = [
  {
    name: 'Bacterias',
    examples: 'Lactobacillus, E. coli, Bacillus',
    uses: 'Yogur, ácido láctico, enzimas',
    doubling: '20–60 min',
    borderColor: '#2D6A4F',
    bgTint: '#E8F5E9',
    icon: '🦠',
    detail: 'Procariotas. Metabolismo versátil; aerobias, anaerobias o facultativas. Alta velocidad de crecimiento.',
  },
  {
    name: 'Levaduras',
    examples: 'Saccharomyces cerevisiae, Pichia pastoris',
    uses: 'Cerveza, vino, etanol, insulina recombinante',
    doubling: '90–120 min',
    borderColor: '#1B4965',
    bgTint: '#E1F5FE',
    icon: '🍺',
    detail: 'Hongos unicelulares eucariotas. Fermentación alcohólica clásica y expresión de proteínas recombinantes.',
  },
  {
    name: 'Hongos Filamentosos',
    examples: 'Aspergillus niger, Penicillium chrysogenum',
    uses: 'Ácido cítrico, penicilina, enzimas industriales',
    doubling: '4–8 h',
    borderColor: '#7B2D8E',
    bgTint: '#F3E5F5',
    icon: '🧫',
    detail: 'Eucariotas multicelulares. Crecimiento apical; secretan enzimas extracelulares de alto valor.',
  },
]

const APPLICATIONS = [
  { sector: 'Alimentos & Bebidas', examples: ['Cerveza', 'Vino', 'Yogur', 'Queso', 'Pan'], color: '#D4A017', pct: 35 },
  { sector: 'Farmacéutica', examples: ['Penicilina', 'Insulina', 'Estatinas', 'Eritropoyetina'], color: '#2D6A4F', pct: 28 },
  { sector: 'Biocombustibles', examples: ['Etanol', 'Butanol', 'Biogas', 'Biodiesel'], color: '#1B4965', pct: 20 },
  { sector: 'Enzimas & Proteínas', examples: ['Amilasas', 'Proteasas', 'Lipasas', 'Anticuerpos mAb'], color: '#7B2D8E', pct: 17 },
]

const ADVANTAGES = [
  { title: 'Sostenible', desc: 'Condiciones suaves (T/P), menor huella de carbono vs síntesis química.', icon: '♻️' },
  { title: 'Escalable', desc: 'De matraz (mL) a biorreactor industrial (>100,000 L).', icon: '📈' },
  { title: 'Específico', desc: 'Alta estereoselectividad enzimática sin subproductos racémicos.', icon: '🔬' },
  { title: 'Versátil', desc: 'Sustratos renovables: melaza, lignocelulosa, lactosuero.', icon: '🌱' },
]

export default function Dashboard() {
  return (
    <div className="space-y-10">
      {/* ─── Hero Section ─── */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-forest-50 to-white border border-sage-200 p-8">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #2D6A4F 0%, transparent 50%), radial-gradient(circle at 80% 50%, #1B4965 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block bg-forest-600/10 text-forest-600 text-xs font-medium px-3 py-1 rounded-full border border-forest-600/20 mb-4">
            MÓDULO 1 · FUNDAMENTOS
          </span>
          <h2 className="font-serif text-h1 text-forest-900 mb-4 leading-tight">
            Fundamentos de Fermentación<br />
            <span className="text-forest-600">& Cinética Microbiana</span>
          </h2>
          <p className="text-sage-600 text-lg leading-relaxed mb-6">
            La <strong className="text-forest-900">fermentación</strong> es el proceso metabólico por el cual microorganismos
            transforman sustratos orgánicos —en condiciones aeróbicas o anaeróbicas— para obtener{' '}
            <strong className="text-forest-700">ATP</strong> y metabolitos de interés industrial.
            A diferencia de la respiración aeróbica completa, la fermentación stricto sensu utiliza
            compuestos orgánicos como aceptores finales de electrones.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Mercado Global', value: '$390B/año', sub: '2024' },
              { label: 'CAGR', value: '8.3%', sub: '2024–2030' },
              { label: 'Biorreactores', value: '>100,000 L', sub: 'Escala industrial' },
              { label: 'Microorg. usados', value: '>300 sp.', sub: 'Procesos activos' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/70 rounded-xl p-4 border border-sage-200 text-center stat-animate">
                <div className="text-xl font-serif font-bold text-forest-600">{stat.value}</div>
                <div className="text-xs text-sage-600 mt-1 font-medium">{stat.label}</div>
                <div className="text-xs text-sage-400">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Microorganisms ─── */}
      <section>
        <SectionHeader
          tag="AGENTES FERMENTATIVOS"
          title="Microorganismos en Bioprocesos"
          sub="Cada grupo presenta ventajas específicas según el producto objetivo y las condiciones de proceso."
        />
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {MICROORGANISMS.map(mo => (
            <div
              key={mo.name}
              className="bio-card rounded-xl bg-white overflow-hidden border-l-[6px]"
              style={{ borderLeftColor: mo.borderColor, borderTop: '1px solid #D8DED4', borderRight: '1px solid #D8DED4', borderBottom: '1px solid #D8DED4' }}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{mo.icon}</span>
                  <h3 className="font-serif text-h3 text-forest-900">{mo.name}</h3>
                </div>
                <p className="text-sage-500 text-sm mb-4 leading-relaxed">{mo.detail}</p>
                <div className="space-y-2 text-xs">
                  <Row label="Ejemplos" val={mo.examples} />
                  <Row label="Aplicaciones" val={mo.uses} />
                  <Row label="Tiempo duplicación" val={mo.doubling} highlight />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Applications ─── */}
      <section>
        <SectionHeader
          tag="APLICACIONES INDUSTRIALES"
          title="Sectores de Impacto"
          sub="La biotecnología industrial abarca desde alimentos hasta fármacos de alta complejidad molecular."
        />
        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          {APPLICATIONS.map(app => (
            <div key={app.sector} className="bio-card bg-white rounded-xl border border-sage-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-forest-900">{app.sector}</h3>
                <span className="text-xs text-sage-500">{app.pct}% mercado</span>
              </div>
              <div className="w-full bg-sage-200 rounded-full h-1.5 mb-4">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${app.pct}%`, backgroundColor: app.color }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {app.examples.map(ex => (
                  <span
                    key={ex}
                    className="text-xs px-2 py-1 rounded-md border"
                    style={{ color: app.color, borderColor: `${app.color}44`, backgroundColor: `${app.color}11` }}
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Advantages ─── */}
      <section>
        <SectionHeader
          tag="VENTAJAS DEL PROCESO"
          title="¿Por qué usar Fermentación?"
          sub="La fermentación ofrece ventajas únicas frente a la síntesis química convencional."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {ADVANTAGES.map(adv => (
            <div key={adv.title} className="bio-card bg-white border border-sage-200 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">{adv.icon}</div>
              <h3 className="font-bold text-forest-600 mb-2">{adv.title}</h3>
              <p className="text-sage-500 text-sm leading-relaxed">{adv.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Key Concepts Box ─── */}
      <section className="bg-white border border-forest-600/15 rounded-xl p-6">
        <h3 className="font-serif text-forest-600 font-bold text-lg mb-4 flex items-center gap-2">
          📌 Conceptos Clave del Programa
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-sage-600">
          {[
            ['Fermentación aeróbica', 'aerobica', String.raw`\text{O}_2 \text{ como aceptor final de } e^{-}.\; \sim\!36 \text{ mol ATP/mol glucosa.}`],
            ['Fermentación anaeróbica', 'anaerobica', String.raw`\text{Compuesto orgánico como aceptor de } e^{-}.\; \sim\!2 \text{ ATP. Ej: etanol, ácido láctico.}`],
            ['Cinética microbiana', 'cinetica', null],
            ['Modelo de Monod (1949)', 'monod', String.raw`\mu = \mu_{\max} \cdot \frac{S}{K_s + S}`],
          ].map(([title, key, tex]) => (
            <div key={key} className="bg-warm-alt rounded-lg p-4 border border-sage-200">
              <div className="font-semibold text-forest-900 mb-1">{title}</div>
              {tex ? (
                <Math tex={tex} display className="mt-2" />
              ) : (
                <div className="text-sage-500 leading-relaxed">
                  Describe cuantitativamente la velocidad de crecimiento, consumo de sustrato y formación de producto en función de las condiciones del medio.
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Row({ label, val, highlight }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-sage-400 font-medium">{label}:</span>
      <span className={highlight ? 'text-forest-600 font-semibold' : 'text-sage-600 text-right'}>{val}</span>
    </div>
  )
}

export function SectionHeader({ tag, title, sub }) {
  return (
    <div>
      <span className="text-xs font-medium text-forest-500 tracking-wide">{tag}</span>
      <h2 className="font-serif text-h2 text-forest-900 mt-1">{title}</h2>
      {sub && <p className="text-sage-500 mt-1 text-sm">{sub}</p>}
    </div>
  )
}

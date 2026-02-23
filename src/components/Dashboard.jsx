const MICROORGANISMS = [
  {
    name: 'Bacterias',
    examples: 'Lactobacillus, E. coli, Bacillus',
    uses: 'Yogur, ácido láctico, enzimas',
    doubling: '20–60 min',
    color: 'from-emerald-600 to-emerald-800',
    icon: '🦠',
    detail: 'Procariotas. Metabolismo versátil; aerobias, anaerobias o facultativas. Alta velocidad de crecimiento.',
  },
  {
    name: 'Levaduras',
    examples: 'Saccharomyces cerevisiae, Pichia pastoris',
    uses: 'Cerveza, vino, etanol, insulina recombinante',
    doubling: '90–120 min',
    color: 'from-cyan-600 to-cyan-800',
    icon: '🍺',
    detail: 'Hongos unicelulares eucariotas. Fermentación alcohólica clásica y expresión de proteínas recombinantes.',
  },
  {
    name: 'Hongos Filamentosos',
    examples: 'Aspergillus niger, Penicillium chrysogenum',
    uses: 'Ácido cítrico, penicilina, enzimas industriales',
    doubling: '4–8 h',
    color: 'from-violet-600 to-violet-800',
    icon: '🧫',
    detail: 'Eucariotas multicelulares. Crecimiento apical; secretan enzimas extracelulares de alto valor.',
  },
]

const APPLICATIONS = [
  { sector: 'Alimentos & Bebidas', examples: ['Cerveza', 'Vino', 'Yogur', 'Queso', 'Pan'], color: '#f59e0b', pct: 35 },
  { sector: 'Farmacéutica', examples: ['Penicilina', 'Insulina', 'Estatinas', 'Eritropoyetina'], color: '#22c55e', pct: 28 },
  { sector: 'Biocombustibles', examples: ['Etanol', 'Butanol', 'Biogas', 'Biodiesel'], color: '#06b6d4', pct: 20 },
  { sector: 'Enzimas & Proteínas', examples: ['Amilasas', 'Proteasas', 'Lipasas', 'Anticuerpos mAb'], color: '#a855f7', pct: 17 },
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
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 50%), radial-gradient(circle at 80% 50%, #06b6d4 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-mono px-3 py-1 rounded-full border border-emerald-500/30 mb-4">
            MÓDULO 1 · FUNDAMENTOS
          </span>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Fundamentos de Fermentación<br />
            <span className="text-emerald-400">& Cinética Microbiana</span>
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-6">
            La <strong className="text-white">fermentación</strong> es el proceso metabólico por el cual microorganismos
            transforman sustratos orgánicos —en condiciones aeróbicas o anaeróbicas— para obtener{' '}
            <strong className="text-emerald-400">ATP</strong> y metabolitos de interés industrial.
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
              <div key={stat.label} className="bg-slate-900/60 rounded-xl p-4 border border-slate-700 text-center">
                <div className="text-xl font-bold text-emerald-400 font-mono">{stat.value}</div>
                <div className="text-xs text-slate-300 mt-1 font-medium">{stat.label}</div>
                <div className="text-xs text-slate-500">{stat.sub}</div>
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
            <div key={mo.name} className={`bio-card rounded-xl border border-slate-700 bg-slate-800 overflow-hidden`}>
              <div className={`h-2 bg-gradient-to-r ${mo.color}`} />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{mo.icon}</span>
                  <h3 className="text-lg font-bold text-white">{mo.name}</h3>
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{mo.detail}</p>
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
            <div key={app.sector} className="bio-card bg-slate-800 rounded-xl border border-slate-700 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">{app.sector}</h3>
                <span className="text-xs font-mono text-slate-400">{app.pct}% mercado</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mb-4">
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
            <div key={adv.title} className="bio-card bg-slate-800 border border-slate-700 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">{adv.icon}</div>
              <h3 className="font-bold text-emerald-400 mb-2">{adv.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{adv.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Key Concepts Box ─── */}
      <section className="bg-slate-800 border border-emerald-500/20 rounded-xl p-6">
        <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2">
          <span>📌</span> Conceptos Clave del Programa
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300">
          {[
            ['Fermentación aeróbica', 'O₂ como aceptor final de e⁻. Máxima producción de ATP (~36 mol ATP/mol glucosa). Ej: producción de biomasa, ácido cítrico.'],
            ['Fermentación anaeróbica', 'Compuesto orgánico como aceptor de e⁻. Menor rendimiento energético (~2 ATP). Ej: etanol, ácido láctico.'],
            ['Cinética microbiana', 'Describe cuantitativamente la velocidad de crecimiento, consumo de sustrato y formación de producto en función de las condiciones del medio.'],
            ['Modelo de Monod (1949)', 'Relaciona μ con la concentración de sustrato limitante: μ = μmax · S / (Ks + S). Análogo a Michaelis-Menten enzimático.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="font-semibold text-white mb-1">{title}</div>
              <div className="text-slate-400 leading-relaxed">{body}</div>
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
      <span className="text-slate-500 font-medium">{label}:</span>
      <span className={highlight ? 'text-emerald-400 font-mono font-semibold' : 'text-slate-300 text-right'}>{val}</span>
    </div>
  )
}

export function SectionHeader({ tag, title, sub }) {
  return (
    <div>
      <span className="text-xs font-mono text-emerald-600 tracking-widest">{tag}</span>
      <h2 className="text-2xl font-bold text-white mt-1">{title}</h2>
      {sub && <p className="text-slate-400 mt-1 text-sm">{sub}</p>}
    </div>
  )
}

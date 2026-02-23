import React from 'react'

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
    <div className="space-y-20 animate-in fade-in duration-700">
      
      {/* ─── Hero Section ─── */}
      <section className="relative bg-[#fafcfb] border border-[#E6F7ED] p-8 md:p-12">
        <div className="max-w-4xl">
          <span className="inline-flex items-center gap-2 text-[#879186] text-xs font-medium tracking-widest uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-[#E6F7ED]"></span>
            Módulo 1 · Fundamentos
          </span>
          <h2 className="text-4xl md:text-5xl font-light text-[#1a1a1a] mb-6 tracking-tight leading-tight">
            Fundamentos de Fermentación <br className="hidden md:block"/>
            <span className="font-medium">y Cinética Microbiana</span>
          </h2>
          <p className="text-[#879186] text-lg leading-relaxed mb-10 font-light">
            La <strong className="font-medium text-[#1a1a1a]">fermentación</strong> es el proceso metabólico por el cual microorganismos 
            transforman sustratos orgánicos —en condiciones aeróbicas o anaeróbicas— para obtener{' '}
            <strong className="font-medium text-[#1a1a1a]">ATP</strong> y metabolitos de interés industrial. 
            A diferencia de la respiración aeróbica completa, la fermentación stricto sensu utiliza 
            compuestos orgánicos como aceptores finales de electrones.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-[#E6F7ED]">
            {[
              { label: 'Mercado Global', value: '$390B/año', sub: '2024' },
              { label: 'CAGR', value: '8.3%', sub: '2024–2030' },
              { label: 'Biorreactores', value: '>100k L', sub: 'Escala industrial' },
              { label: 'Microorg. usados', value: '>300 sp.', sub: 'Procesos activos' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-2xl font-light text-[#1a1a1a] font-mono tracking-tight">{stat.value}</div>
                <div className="text-xs text-[#879186] mt-1 font-medium tracking-wide uppercase">{stat.label}</div>
                <div className="text-xs text-[#879186]/60 font-light">{stat.sub}</div>
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
        <div className="grid md:grid-cols-3 gap-8 mt-10">
          {MICROORGANISMS.map(mo => (
            <div key={mo.name} className="bg-white border border-[#E6F7ED] p-8 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-[#fafcfb] border border-[#E6F7ED] rounded-full flex items-center justify-center text-2xl shadow-sm">
                  {mo.icon}
                </div>
                <h3 className="text-xl font-medium text-[#1a1a1a] tracking-tight">{mo.name}</h3>
              </div>
              <p className="text-[#879186] text-sm mb-8 leading-relaxed font-light min-h-[60px]">{mo.detail}</p>
              <div className="space-y-1">
                <Row label="Ejemplos" val={mo.examples} />
                <Row label="Aplicaciones" val={mo.uses} />
                <Row label="Tiempo dup." val={mo.doubling} highlight />
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
        <div className="grid md:grid-cols-2 gap-8 mt-10">
          {APPLICATIONS.map(app => (
            <div key={app.sector} className="bg-white border border-[#E6F7ED] p-8 hover:border-[#879186]/30 transition-colors duration-300">
              <div className="flex items-end justify-between mb-4">
                <h3 className="font-medium text-[#1a1a1a] text-lg tracking-tight">{app.sector}</h3>
                <span className="text-xs font-mono font-medium text-[#879186]">{app.pct}% del mercado</span>
              </div>
              {/* Barra de progreso ultra-delgada */}
              <div className="w-full bg-[#fafcfb] h-1 mb-6 overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 ease-out"
                  style={{ width: `${app.pct}%`, backgroundColor: app.color }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {app.examples.map(ex => (
                  <span
                    key={ex}
                    className="text-xs px-3 py-1 font-light tracking-wide bg-[#fafcfb] text-[#1a1a1a]"
                    style={{ border: `1px solid ${app.color}40` }}
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
          {ADVANTAGES.map(adv => (
            <div key={adv.title} className="bg-white border border-[#E6F7ED] p-8 flex flex-col items-start">
              <div className="text-2xl mb-4 bg-[#fafcfb] p-3 rounded-full border border-[#E6F7ED]/50">{adv.icon}</div>
              <h3 className="font-medium text-[#1a1a1a] mb-3">{adv.title}</h3>
              <p className="text-[#879186] text-sm leading-relaxed font-light">{adv.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Key Concepts Box ─── */}
      <section className="bg-[#fafcfb] border border-[#E6F7ED] p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E6F7ED] rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 -translate-y-1/2"></div>
        
        <h3 className="text-[#1a1a1a] font-medium text-xl mb-8 flex items-center gap-3 relative z-10 tracking-tight">
          <span className="text-[#879186] font-light">|</span> Conceptos Clave del Programa
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 relative z-10">
          {[
            ['Fermentación aeróbica', 'O₂ como aceptor final de e⁻. Máxima producción de ATP (~36 mol ATP/mol glucosa). Ej: producción de biomasa, ácido cítrico.'],
            ['Fermentación anaeróbica', 'Compuesto orgánico como aceptor de e⁻. Menor rendimiento energético (~2 ATP). Ej: etanol, ácido láctico.'],
            ['Cinética microbiana', 'Describe cuantitativamente la velocidad de crecimiento, consumo de sustrato y formación de producto en función de las condiciones del medio.'],
            ['Modelo de Monod (1949)', 'Relaciona μ con la concentración de sustrato limitante: μ = μmax · S / (Ks + S). Análogo a Michaelis-Menten enzimático.'],
          ].map(([title, body]) => (
            <div key={title} className="bg-white p-6 border border-[#E6F7ED] hover:shadow-sm transition-shadow">
              <div className="font-medium text-[#1a1a1a] text-sm mb-2">{title}</div>
              <div className="text-[#879186] text-sm leading-relaxed font-light">{body}</div>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  )
}

/* ─── Componentes Auxiliares (Actualizados al diseño minimalista) ─── */

function Row({ label, val, highlight }) {
  return (
    <div className="flex justify-between items-start gap-4 py-3 border-b border-[#E6F7ED]/50 last:border-0">
      <span className="text-[#879186] text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className={`text-right text-sm ${highlight ? 'text-[#1a1a1a] font-mono font-medium' : 'text-[#1a1a1a] font-light'}`}>
        {val}
      </span>
    </div>
  )
}

export function SectionHeader({ tag, title, sub }) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-px bg-[#879186]/30"></span>
        <span className="text-xs font-medium text-[#879186] tracking-widest uppercase">{tag}</span>
      </div>
      <h2 className="text-3xl font-light text-[#1a1a1a] mb-3 tracking-tight">{title}</h2>
      {sub && <p className="text-[#879186] text-base leading-relaxed font-light">{sub}</p>}
    </div>
  )
}

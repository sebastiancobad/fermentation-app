import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { SectionHeader } from './Dashboard'

const MARKET_DATA = [
  { sector: 'Alimentos',   value: 136, color: '#B45309', growth: '+6.2%'  },
  { sector: 'Farmacéutica',value: 109, color: '#2D6A4F', growth: '+9.1%'  },
  { sector: 'Biocombust.', value: 78,  color: '#1B4965', growth: '+11.4%' },
  { sector: 'Enzimas Ind.',value: 42,  color: '#7B2D8E', growth: '+8.7%'  },
  { sector: 'Otros',       value: 25,  color: '#879186', growth: '+5.3%'  },
]

const CASE_STUDIES = [
  {
    id: 'insulin',
    product: 'Insulina Humana Recombinante',
    company: 'Eli Lilly / Novo Nordisk',
    organism: 'E. coli (K-12) / S. cerevisiae',
    mode: 'Fed-Batch',
    scale: '30,000 L',
    color: '#2D6A4F',
    icon: '💉',
    metrics: [
      { label: 'Título final',    value: '2–5 g/L'         },
      { label: 'μmax (prod.)',    value: '0.15–0.25 h⁻¹'   },
      { label: 'Yx/s',           value: '0.35 g/g'         },
      { label: 'Duración batch',  value: '40–60 h'          },
      { label: 'Mercado',        value: '$20B/año'          },
    ],
    description: `La producción industrial de insulina mediante E. coli fue el primer proceso comercial de ADN recombinante (Genentech, 1982).
El gen sintético de insulina humana (preproinsulina) se expresa bajo control del promotor tac con IPTG.
Se usa un biorreactor fed-batch a alta densidad celular (HCDC: >80 g/L DCW) con alimentación exponencial de glucosa para mantener μ controlado (~0.15 h⁻¹) y evitar efecto overflow.
La inclusión de cuerpos de refractivos (inclusion bodies) requiere renaturalización oxidativa y purificación cromatográfica (ion exchange + reversed phase HPLC).`,
    keyChallenge: 'Control de la activación de la vía overflow (acetato → inhibición) mediante μ < μcrit con alimentación controlada.',
    cfd: true,
  },
  {
    id: 'penicillin',
    product: 'Penicilina G / V',
    company: 'DSM Sinochem / Centrient',
    organism: 'Penicillium chrysogenum',
    mode: 'Fed-Batch',
    scale: '200,000 L',
    color: '#7B2D8E',
    icon: '🧬',
    metrics: [
      { label: 'Título final',        value: '40–70 g/L'       },
      { label: 'μmax (prod.)',        value: '0.005–0.020 h⁻¹' },
      { label: 'Yp/s',               value: '0.08 mol/mol'     },
      { label: 'Duración batch',      value: '150–200 h'        },
      { label: 'Producción global',   value: '60,000 t/año'     },
    ],
    description: `La penicilina es un metabolito secundario producido por Penicillium chrysogenum durante la fase de baja velocidad de crecimiento (idiofase).
La producción se realiza en reactores fed-batch con alimentación de glucosa y precursores (ácido fenilacético para Pen G).
El pH se controla estrictamente a 6.4–6.6. La transferencia de oxígeno (kLa > 400 h⁻¹) es crítica dado el alto consumo de O₂.
Las cepas modernas (derivadas de Wisconsin Q-176) producen hasta 50,000 veces más que las cepas salvajes de Fleming (1928).`,
    keyChallenge: 'Mantener alta tasa de transferencia de O₂ en reactor de 200,000 L sin generar shear stress excesivo sobre el micelio sensible.',
    cfd: true,
  },
  {
    id: 'ethanol',
    product: 'Etanol de Segunda Generación (2G)',
    company: 'Raízen / POET-DSM / Novozymes',
    organism: 'S. cerevisiae (ingeniería metabólica)',
    mode: 'Continuo / Batch en cascada',
    scale: '1,000,000 L',
    color: '#1B4965',
    icon: '⛽',
    metrics: [
      { label: 'Título final',    value: '10–14% v/v'    },
      { label: 'μmax',           value: '0.30–0.45 h⁻¹' },
      { label: 'Yx/s (EtOH)',   value: '0.45–0.50 g/g'  },
      { label: 'Productividad',  value: '3–5 g/L/h'      },
      { label: 'Mercado',        value: '$80B/año'        },
    ],
    description: `El bioetanol de 2G utiliza bagazo de caña pretratado (vapor explosion) como sustrato. Las cepas de S. cerevisiae han sido modificadas para cofermentar glucosa y xilosa (C5) de la lignocelulosa.
La fermentación se realiza en cascada de 4–6 reactores continuos (CSTR en serie) para maximizar conversión. La temperatura debe controlarse a 32–34°C dado el efecto inhibidor del etanol a altas concentraciones (>12% v/v).
El rendimiento teórico máximo es 0.511 g EtOH/g glucosa (estequiometría de Gay-Lussac). Las cepas industriales alcanzan 90–95% del máximo teórico.`,
    keyChallenge: 'Tolerancia al etanol y a inhibidores del pretratamiento (furfural, HMF, ácidos débiles). Cofermentación eficiente de hexosas y pentosas.',
    cfd: false,
  },
]

const FUTURE_TECH = [
  {
    title: 'Dinámica de Fluidos Computacional (CFD)',
    desc: 'Simulación numérica de campos de velocidad, concentración y temperatura en biorreactores. Permite optimizar el diseño de impellers, posición de sparger y geometría del tanque sin experimentos físicos costosos.',
    tools: ['ANSYS Fluent', 'OpenFOAM', 'COMSOL Multiphysics'],
    icon: '🌊',
    color: '#1B4965',
    impact: 'Reducción del 40–60% en tiempo de scale-up',
  },
  {
    title: 'Inteligencia Artificial en Bioprocesos',
    desc: 'Redes neuronales LSTM y modelos de ML para predicción de cinética, detección de anomalías en línea y optimización adaptativa de alimentación. Los gemelos digitales integran CFD + ML para control en tiempo real.',
    tools: ['TensorFlow', 'Python SciPy', 'Process Analytical Technology (PAT)'],
    icon: '🤖',
    color: '#7B2D8E',
    impact: 'Mejora del 15–30% en productividad',
  },
  {
    title: 'Biología Sintética',
    desc: 'Diseño racional de rutas metabólicas, promotores sintéticos y circuitos de retroalimentación génica. CRISPR-Cas9 permite reingeniería precisa de microorganismos para producir compuestos imposibles por síntesis química.',
    tools: ['CRISPR-Cas9', 'DBTL cycle', 'Genome-scale models (GEMs)'],
    icon: '🧬',
    color: '#2D6A4F',
    impact: 'Nuevos productos: cannabinoides, SPF, proteínas de araña',
  },
  {
    title: 'Fermentación de Precisión',
    desc: 'Producción de proteínas animales (caseína, lactoalbúmina, clara de huevo) mediante microorganismos sin necesidad de animales. Ataca el mercado de alternativas proteicas sostenibles.',
    tools: ['K. phaffii', 'T. reesei', 'Cell-free systems'],
    icon: '🥩',
    color: '#B45309',
    impact: 'Mercado proyectado: $15B en 2030',
  },
]

export default function CaseStudies() {
  const [activeCase, setActiveCase] = useState(0)
  const current = CASE_STUDIES[activeCase]

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="MÓDULO 6 · INDUSTRIA & TECNOLOGÍA"
        title="Casos Industriales y Futuro del Sector"
        sub="Análisis de procesos fermentativos comerciales de alto impacto y las tecnologías emergentes que transformarán la industria."
      />

      {/* ─── Market Stats ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-sage-200 p-5">
          <h3 className="font-serif font-semibold text-forest-900 mb-1">Mercado Global de Fermentación Industrial</h3>
          <p className="text-xs text-sage-400 mb-4">Distribución por sector (2024) — Total: $390 billones USD</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MARKET_DATA} margin={{ top: 5, right: 10, bottom: 30, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
              <XAxis
                dataKey="sector"
                tick={{ fill: '#879186', fontSize: 10 }}
                stroke="#C4CFC0"
              />
              <YAxis
                tick={{ fill: '#879186', fontSize: 10 }}
                stroke="#C4CFC0"
                label={{ value: 'B USD', angle: -90, position: 'insideLeft', fill: '#879186', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid #D8DED4', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#2D6A4F' }}
                formatter={(v, n, { payload }) => [`$${v}B USD (${payload.growth})`, 'Mercado']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {MARKET_DATA.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 content-start">
          {[
            { label: 'Mercado total 2024',          val: '$390B',   color: '#2D6A4F', icon: '💰' },
            { label: 'CAGR 2024–2030',              val: '8.3%',    color: '#1B4965', icon: '📈' },
            { label: 'Plantas industriales',         val: '>8,500',  color: '#7B2D8E', icon: '🏭' },
            { label: 'Empleo directo global',        val: '2.4M',    color: '#B45309', icon: '👷' },
            { label: 'Proteínas recombinantes',      val: '$220B',   color: '#2D6A4F', icon: '🧪' },
            { label: 'Reducción CO₂ vs petroquím.', val: '40–70%',  color: '#65A30D', icon: '♻️' },
          ].map(s => (
            <div key={s.label} className="bio-card bg-white border border-sage-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className="font-bold font-mono text-lg" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-sage-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Case Studies ─── */}
      <div>
        <h3 className="font-serif font-semibold text-forest-900 mb-4">Casos de Estudio: Procesos Industriales Reales</h3>
        <div className="flex gap-3 mb-5 flex-wrap">
          {CASE_STUDIES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveCase(i)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all"
              style={activeCase === i ? {
                borderColor: c.color,
                backgroundColor: `${c.color}12`,
                color: c.color,
              } : {
                borderColor: '#D8DED4',
                color: '#879186',
                backgroundColor: '#FFFFFF',
              }}
            >
              <span>{c.icon}</span>
              {c.product.split(' ').slice(0, 2).join(' ')}
            </button>
          ))}
        </div>

        <div
          className="bg-white rounded-xl border p-6"
          style={{ borderColor: `${current.color}44` }}
        >
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">{current.icon}</span>
                <div>
                  <h4 className="text-xl font-bold" style={{ color: current.color }}>
                    {current.product}
                  </h4>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-sage-400">
                    <span>🏢 {current.company}</span>
                    <span>🦠 {current.organism}</span>
                    <span>⚗️ {current.mode}</span>
                    <span>📐 {current.scale}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-sage-600 leading-relaxed whitespace-pre-line mb-4">
                {current.description}
              </p>

              <div
                className="rounded-lg p-4 border text-sm"
                style={{ borderColor: `${current.color}33`, backgroundColor: `${current.color}08` }}
              >
                <span className="font-semibold" style={{ color: current.color }}>
                  ⚠ Desafío técnico principal:
                </span>
                <p className="text-sage-600 mt-1 leading-relaxed">{current.keyChallenge}</p>
              </div>

              {current.cfd && (
                <div className="mt-3 flex items-center gap-2 text-xs text-navy-500 bg-navy-50 border border-navy-200 rounded-lg px-3 py-2">
                  <span>🌊</span>
                  Proceso optimizado con CFD para diseño de impeller y distribución de O₂
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold text-sage-400 uppercase mb-3">Parámetros del Proceso</h4>
              <div className="space-y-2">
                {current.metrics.map(m => (
                  <div key={m.label} className="flex justify-between items-center bg-sage-50 rounded-lg px-3 py-2 text-sm border border-sage-200">
                    <span className="text-sage-500">{m.label}</span>
                    <span className="font-mono font-semibold" style={{ color: current.color }}>
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Future Technologies ─── */}
      <div>
        <h3 className="font-serif font-semibold text-forest-900 mb-2">Tecnologías Emergentes</h3>
        <p className="text-sm text-sage-500 mb-5">
          La convergencia de ingeniería de procesos, computación y biología molecular está redefiniendo los límites de los bioprocesos industriales.
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          {FUTURE_TECH.map(tech => (
            <div
              key={tech.title}
              className="bio-card bg-white border border-sage-200 rounded-xl p-5"
              style={{ borderLeftColor: tech.color, borderLeftWidth: '3px' }}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{tech.icon}</span>
                <div>
                  <h4 className="font-bold text-forest-900">{tech.title}</h4>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                    style={{ color: tech.color, backgroundColor: `${tech.color}15`, border: `1px solid ${tech.color}33` }}
                  >
                    {tech.impact}
                  </span>
                </div>
              </div>
              <p className="text-sm text-sage-500 leading-relaxed mb-3">{tech.desc}</p>
              <div className="flex flex-wrap gap-2">
                {tech.tools.map(t => (
                  <span key={t} className="text-xs bg-sage-50 border border-sage-200 text-sage-600 px-2 py-1 rounded-md font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CFD Section ─── */}
      <div className="bg-white border border-navy-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🌊</span>
          <div>
            <h3 className="font-serif font-bold text-forest-900 mb-2">
              CFD Aplicada a Biorreactores: El Estándar Industrial
            </h3>
            <p className="text-sm text-sage-500 leading-relaxed mb-4">
              La Dinámica de Fluidos Computacional resuelve las ecuaciones de Navier-Stokes acopladas
              a modelos de transferencia de masa y reacción biológica. En biorreactores STR, permite:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Campos de velocidad y shear', 'Identificar zonas de alta tensión de cizalla que dañan células sensibles (CHO, BHK)'],
                ['Distribución de O₂ disuelto', 'Optimizar posición y caudal del sparger para eliminar zonas anóxicas'],
                ['Tiempo de mezcla (tm)', 'Calcular gradientes de pH y concentración de sustrato en reactores grandes (>10,000 L)'],
                ['Escala de Kolmogorov (η)', 'η = (ν³/ε)^(1/4). Si dp > η, posible daño celular por micro-turbulencia'],
              ].map(([title, desc]) => (
                <div key={title} className="bg-navy-50 rounded-lg p-3 border border-navy-200">
                  <div className="font-semibold text-navy-500 text-xs mb-1">{title}</div>
                  <div className="text-xs text-sage-500">{desc}</div>
                </div>
              ))}
            </div>
            <div className="formula-block mt-4 text-xs">
              ∂(ρu)/∂t + ∇·(ρuu) = −∇p + ∇·τ + ρg + F_sources  [Navier-Stokes]
            </div>
            <div className="formula-block text-xs">
              ∂C/∂t + u·∇C = D∇²C + R(C, X, μ)  [Balance de masa + reacción]
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { SectionHeader } from './Dashboard'
import Math from './Math'

const BIOREACTOR_TYPES = [
  {
    id: 'batch',
    name: 'Batch (Discontinuo)',
    color: '#B45309',
    icon: '🔒',
    description: 'Sistema cerrado: nutrientes y microorganismos se cargan al inicio; no hay entrada ni salida de líquido durante el proceso.',
    advantages: [
      'Simple de operar y escalar',
      'Fácil limpieza y esterilización entre lotes',
      'Alta flexibilidad de productos',
      'Menor riesgo de contaminación acumulada',
    ],
    disadvantages: [
      'Tiempos improductivos (carga, esterilización, descarga)',
      'μ disminuye con el sustrato → menor productividad volumétrica',
      'Acumulación de metabolitos inhibidores',
      'No aplicable a productos regulados por nutrientes',
    ],
    uses: 'Antibióticos, enzimas, biofármacos de alto valor, producción artesanal.',
    equations: [
      'dX/dt = μ · X',
      'dS/dt = −(μ/Yx/s) · X',
      'dP/dt = qp · X',
    ],
    productivity: 'Media',
    scalability: 'Alta',
    control: 'Bajo',
  },
  {
    id: 'fedbatch',
    name: 'Fed-Batch (Semi-continuo)',
    color: '#2D6A4F',
    icon: '⬆️',
    description: 'El sustrato (y/o nutrientes) se alimentan de forma continua o intermitente, pero no hay efluente. El volumen aumenta con el tiempo.',
    advantages: [
      'Control preciso de μ mediante perfil de alimentación',
      'Evita inhibición por exceso de sustrato (efecto Crabtree)',
      'Máxima concentración final de biomasa/producto',
      'Reduce represión catabólica en organismos como E. coli',
      'Mayor rendimiento vs. batch simple',
    ],
    disadvantages: [
      'Requiere sistema de control de alimentación sofisticado',
      'Riesgo de contaminación con larga duración',
      'Volumen variable complica la operación',
      'Optimización del perfil de alimentación es compleja',
    ],
    uses: 'Insulina recombinante, anticuerpos monoclonales, aminoácidos, biocombustibles, levaduras panaderas.',
    equations: [
      'dX/dt = μ·X − D·X',
      'dS/dt = D·(Sf−S) − (μ/Yx/s)·X',
      'dV/dt = F(t)',
      'D(t) = F(t)/V(t)',
    ],
    productivity: 'Alta',
    scalability: 'Alta',
    control: 'Alto',
    highlight: true,
  },
  {
    id: 'continuous',
    name: 'Continuo (CSTR / Quimiostato)',
    color: '#1B4965',
    icon: '🔄',
    description: 'Entrada y salida continua de medio de cultivo. En estado estacionario, todas las variables permanecen constantes (μ = D).',
    advantages: [
      'Máxima productividad volumétrica sostenida',
      'Condiciones estables → datos cinéticos reproducibles',
      'Ideal para estudios fisiológicos y de adaptación',
      'Bajo tiempo improductivo en producción continua',
    ],
    disadvantages: [
      'Alto riesgo de contaminación (operación prolongada)',
      'Evolución genética del microorganismo',
      'Lavado (washout) si D > μmax',
      'Difícil aplicación con productos de alto valor',
      'Regulatorio más complejo para biofármacos',
    ],
    uses: 'Tratamiento de aguas residuales, producción de etanol, investigación básica, vinagre.',
    equations: [
      'dX/dt = (μ−D)·X → 0 (estado est.)',
      'μ = D = F/V',
      'X* = Yx/s·(S0 − Ks·D/(μmax−D))',
      'S* = Ks·D / (μmax − D)',
    ],
    productivity: 'Muy alta',
    scalability: 'Media',
    control: 'Medio',
  },
]

const BIOREACTOR_COMPONENTS = [
  { id: 'vessel',     name: 'Tanque/Vessel',        desc: 'Recipiente de acero inoxidable 316L. Diseño de doble pared para control de T.', color: '#879186' },
  { id: 'agitator',  name: 'Agitador / Impeller',   desc: 'Turbina Rushton o marine propeller. Genera turbulencia para kLa ≥ 200 h⁻¹.', color: '#2D6A4F' },
  { id: 'sparger',   name: 'Sparger de Aire',        desc: 'Distribuidor de O₂ o N₂. Tamaño de burbuja crítico para transferencia de masa.', color: '#1B4965' },
  { id: 'probes',    name: 'Sondas en Línea',        desc: 'pH, pO₂ disuelto, temperatura, turbidez (biomasa on-line).', color: '#7B2D8E' },
  { id: 'jacket',    name: 'Camisa de Temperatura',  desc: 'Agua/vapor para control exacto de T. ΔT < ±0.1°C en biofármacos.', color: '#B45309' },
  { id: 'controller',name: 'Sistema de Control (DCS)',desc: 'PID cascada para pH, pO₂, T. Comunicación OPC-UA para GMP.', color: '#DC2626' },
  { id: 'foam',      name: 'Antiespumante',           desc: 'Sensor capacitivo + bomba dosificadora. Evita colapso de espuma.', color: '#65A30D' },
  { id: 'harvest',   name: 'Puerto de Cosecha',       desc: 'Válvula estéril de muestreo y descarga con membrana a presión.', color: '#DB2777' },
]

const SCALING_CHALLENGES = [
  {
    title: 'Transferencia de Oxígeno (kLa)',
    desc: 'El O₂ tiene baja solubilidad en agua (~8 mg/L a 25°C). Al escalar, mantener kLa requiere mayor agitación o presurización, generando fuerzas de cizalla que dañan células sensibles (células animales).',
    formula: 'OTR = kLa · (C* − CL)',
    risk: 'alto',
  },
  {
    title: 'Mezcla y Gradientes de Concentración',
    desc: 'En reactores >10,000 L, el tiempo de mezcla (tm) puede superar 30 s. Se forman gradientes de pH, S y O₂ que generan heterogeneidad metabólica y pérdida de rendimiento.',
    formula: 'tm ∝ (V/P)^(1/3) · N^(-1)',
    risk: 'alto',
  },
  {
    title: 'Disipación de Calor',
    desc: 'El metabolismo microbiano genera calor (Qmet ≈ 450 kJ/mol O₂). A gran escala, la relación área/volumen disminuye, dificultando el control de temperatura.',
    formula: 'Q = Qmet + Qagit − Qenfr',
    risk: 'medio',
  },
  {
    title: 'Esterilidad y Validación GMP',
    desc: 'Cada conexión es un punto potencial de contaminación. Los procesos biofarmacéuticos requieren validación F0 ≥ 12 y sistemas SIP/CIP documentados.',
    formula: 'F0 = ∫ 10^((T−121.1)/10) dt',
    risk: 'alto',
  },
]

export default function BioreactorModule() {
  const [activeType, setActiveType] = useState('fedbatch')
  const [activeComponent, setActiveComponent] = useState(null)

  const selectedType = BIOREACTOR_TYPES.find(t => t.id === activeType)

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="MÓDULO 5 · INGENIERÍA DE REACTORES"
        title="Biorreactores y Tipos de Fermentación"
        sub="Diseño, operación y comparación de sistemas de fermentación industrial. El modo Fed-Batch domina la producción biofarmacéutica moderna."
      />

      {/* ─── Bioreactor Diagram (SVG) ─── */}
      <div className="bg-white rounded-xl border border-sage-200 p-6">
        <h3 className="font-serif font-semibold text-forest-900 mb-2">Componentes de un Biorreactor Industrial</h3>
        <p className="text-xs text-sage-400 mb-5">
          Haz clic en un componente para ver sus especificaciones técnicas.
        </p>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SVG Bioreactor */}
          <div className="flex-shrink-0 flex justify-center">
            <BioreactorSVG activeComponent={activeComponent} setActiveComponent={setActiveComponent} />
          </div>

          {/* Component details */}
          <div className="flex-1">
            <div className="grid sm:grid-cols-2 gap-3">
              {BIOREACTOR_COMPONENTS.map(comp => (
                <button
                  key={comp.id}
                  onClick={() => setActiveComponent(c => c === comp.id ? null : comp.id)}
                  className={`text-left p-3 rounded-lg border transition-all text-sm ${
                    activeComponent === comp.id
                      ? ''
                      : 'border-sage-200 hover:border-sage-300 bg-sage-50/40'
                  }`}
                  style={activeComponent === comp.id ? {
                    borderColor: comp.color,
                    backgroundColor: `${comp.color}10`,
                  } : {}}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: comp.color }} />
                    <span className="font-medium text-forest-900">{comp.name}</span>
                  </div>
                  <p className="text-xs text-sage-500 leading-relaxed">{comp.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Type Selector ─── */}
      <div>
        <h3 className="font-serif font-semibold text-forest-900 mb-4">Seleccionar Modo de Operación</h3>
        <div className="flex flex-wrap gap-3 mb-6">
          {BIOREACTOR_TYPES.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveType(t.id)}
              className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                activeType === t.id
                  ? ''
                  : 'border-sage-200 text-sage-500 hover:text-sage-800 bg-white'
              }`}
              style={activeType === t.id ? {
                borderColor: t.color,
                backgroundColor: `${t.color}12`,
                color: t.color,
              } : {}}
            >
              <span>{t.icon}</span>
              {t.name}
              {t.highlight && (
                <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-forest-600/10 text-forest-600">
                  PREFERIDO
                </span>
              )}
            </button>
          ))}
        </div>

        {selectedType && (
          <div
            className="rounded-xl border p-6 bg-white"
            style={{ borderColor: `${selectedType.color}44` }}
          >
            <div className="flex items-start gap-4 mb-5">
              <span className="text-3xl">{selectedType.icon}</span>
              <div>
                <h3 className="text-xl font-bold" style={{ color: selectedType.color }}>
                  {selectedType.name}
                </h3>
                <p className="text-sage-500 text-sm mt-1 leading-relaxed">{selectedType.description}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-sage-400 uppercase mb-3">Ventajas</h4>
                <ul className="space-y-1.5">
                  {selectedType.advantages.map((a, i) => (
                    <li key={i} className="text-sm text-sage-600 flex items-start gap-2">
                      <span className="text-forest-600 mt-0.5 flex-shrink-0">✓</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-sage-400 uppercase mb-3">Desventajas</h4>
                <ul className="space-y-1.5">
                  {selectedType.disadvantages.map((d, i) => (
                    <li key={i} className="text-sm text-sage-600 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5 flex-shrink-0">✗</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-sage-400 uppercase mb-3">Balances de Masa</h4>
                {selectedType.equations.map((eq, i) => (
                  <div key={i} className="formula-block text-xs mb-1">{eq}</div>
                ))}
                <div className="mt-4 space-y-2">
                  <MetricBadge label="Productividad" value={selectedType.productivity} color={selectedType.color} />
                  <MetricBadge label="Escalabilidad" value={selectedType.scalability} color={selectedType.color} />
                  <MetricBadge label="Complejidad control" value={selectedType.control} color={selectedType.color} />
                </div>
                <div className="mt-3 p-3 bg-sage-50 rounded-lg text-xs text-sage-500 border border-sage-200">
                  <span className="font-semibold text-forest-600">Aplicaciones: </span>
                  {selectedType.uses}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Comparison Table ─── */}
      <div className="bg-white rounded-xl border border-sage-200 overflow-hidden">
        <div className="p-4 border-b border-sage-200">
          <h3 className="font-serif font-semibold text-forest-900">Tabla Comparativa de Sistemas de Fermentación</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sage-50 text-xs text-sage-400">
                <th className="py-3 px-4 text-left">Parámetro</th>
                {BIOREACTOR_TYPES.map(t => (
                  <th key={t.id} className="py-3 px-4 text-center" style={{ color: t.color }}>
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Concentración final X', '5–20 g/L', '50–150 g/L ★', '5–30 g/L'],
                ['Control de μ', 'No', 'Sí (alimentación)', 'Sí (D = F/V)'],
                ['Inhibición por S', 'Frecuente', 'Mínima', 'Controlable'],
                ['Efecto Crabtree (levad.)', 'Alto', 'Bajo/Nulo', 'Bajo'],
                ['Tiempo de ciclo', '12–48 h', '24–200 h', 'Continuo'],
                ['Riesgo contaminación', 'Bajo', 'Medio', 'Alto'],
                ['Capital (CAPEX)', 'Bajo', 'Medio', 'Alto'],
                ['Aplicación biofármaco', 'Sí', 'Sí (preferido)', 'Limitado (GMP)'],
                ['Estado estacionario', 'No', 'Pseudo-estac.', 'Sí (μ = D)'],
              ].map(([param, batch, fed, cont], i) => (
                <tr key={param} className={i % 2 === 0 ? 'bg-white' : 'bg-sage-50/50'}>
                  <td className="py-2.5 px-4 font-medium text-forest-600">{param}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-xs" style={{ color: '#B45309' }}>{batch}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-xs font-semibold" style={{ color: '#2D6A4F' }}>{fed}</td>
                  <td className="py-2.5 px-4 text-center font-mono text-xs" style={{ color: '#1B4965' }}>{cont}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-sage-200 text-xs text-sage-400">
          ★ Alta concentración de células en fed-batch (HCDC: High Cell Density Cultivation). Valores típicos; dependen del microorganismo y proceso.
        </div>
      </div>

      {/* ─── Scaling Challenges ─── */}
      <div>
        <h3 className="font-serif font-semibold text-forest-900 mb-1">Desafíos de Escalado (Scale-Up)</h3>
        <p className="text-sm text-sage-500 mb-5">
          El escalado de bioprocesos requiere ingeniería rigurosa. Los principios de similaridad
          geométrica, cinemática y dinámica raramente pueden satisfacerse simultáneamente.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {SCALING_CHALLENGES.map(ch => (
            <div
              key={ch.title}
              className={`bio-card bg-white border rounded-xl p-5 ${
                ch.risk === 'alto'
                  ? 'border-red-200'
                  : 'border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="font-semibold text-forest-900 text-sm">{ch.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  ch.risk === 'alto'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  Riesgo {ch.risk}
                </span>
              </div>
              <p className="text-sage-500 text-xs leading-relaxed mb-3">{ch.desc}</p>
              <div className="formula text-xs">{ch.formula}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-forest-600/5 border border-forest-600/20 rounded-xl p-4 text-sm text-forest-600">
          <strong>Enfoque moderno:</strong> La Dinámica de Fluidos Computacional (CFD) combinada con
          gemelos digitales permite simular gradientes de concentración, temperatura y shear stress
          antes de construir reactores físicos, reduciendo tiempo y costo de desarrollo.
        </div>
      </div>
    </div>
  )
}

// ─── SVG Bioreactor Diagram ────────────────────────────────────────────────────
function BioreactorSVG({ activeComponent, setActiveComponent }) {
  const highlight = (id) => activeComponent === id
  const getStroke = (id, def = '#C4CFC0') => highlight(id)
    ? BIOREACTOR_COMPONENTS.find(c => c.id === id)?.color ?? def
    : def
  const getFill = (id, def = 'transparent') => highlight(id)
    ? `${BIOREACTOR_COMPONENTS.find(c => c.id === id)?.color}18` ?? def
    : def

  return (
    <svg width="220" height="320" viewBox="0 0 220 320" className="select-none">
      {/* Jacket outer */}
      <g onClick={() => setActiveComponent(c => c === 'jacket' ? null : 'jacket')} className="cursor-pointer">
        <rect x="30" y="60" width="160" height="200" rx="20" ry="20"
          fill={getFill('jacket', '#FEF9EE')}
          stroke={getStroke('jacket', '#B45309')}
          strokeWidth={highlight('jacket') ? 2 : 1.5}
          strokeDasharray={highlight('jacket') ? '' : '6 3'}
          opacity="0.7"
        />
        <text x="108" y="55" textAnchor="middle" fill="#B45309" fontSize="8" opacity="0.9">Camisa T°</text>
      </g>

      {/* Main vessel */}
      <g onClick={() => setActiveComponent(c => c === 'vessel' ? null : 'vessel')} className="cursor-pointer">
        <rect x="42" y="70" width="136" height="180" rx="14" ry="14"
          fill={getFill('vessel', '#F7F9F4')}
          stroke={getStroke('vessel', '#879186')}
          strokeWidth={highlight('vessel') ? 2.5 : 2}
        />
      </g>

      {/* Liquid fill visual */}
      <clipPath id="vesselClip">
        <rect x="43" y="71" width="134" height="178" rx="13" ry="13" />
      </clipPath>
      <rect x="43" y="160" width="134" height="89" rx="0"
        fill="#2D6A4F22" clipPath="url(#vesselClip)" />
      <text x="110" y="210" textAnchor="middle" fill="#2D6A4F66" fontSize="9">caldo</text>

      {/* Agitator shaft */}
      <line x1="110" y1="70" x2="110" y2="220"
        stroke={getStroke('agitator', '#2D6A4F')}
        strokeWidth={highlight('agitator') ? 3 : 2}
        className="cursor-pointer"
        onClick={() => setActiveComponent(c => c === 'agitator' ? null : 'agitator')}
      />
      {/* Impeller blades */}
      {[180, 200, 220].map((y) => (
        <g key={y}
          onClick={() => setActiveComponent(c => c === 'agitator' ? null : 'agitator')}
          className="cursor-pointer"
        >
          <line x1="75" y1={y} x2="145" y2={y}
            stroke={getStroke('agitator', '#2D6A4F')}
            strokeWidth={highlight('agitator') ? 3 : 2}
          />
          <rect x="72" y={y - 6} width="16" height="12" rx="2"
            fill={getFill('agitator', '#2D6A4F22')}
            stroke={getStroke('agitator', '#2D6A4F')}
            strokeWidth="1"
          />
          <rect x="132" y={y - 6} width="16" height="12" rx="2"
            fill={getFill('agitator', '#2D6A4F22')}
            stroke={getStroke('agitator', '#2D6A4F')}
            strokeWidth="1"
          />
        </g>
      ))}
      <text x="148" y="200" fill="#4A6741" fontSize="7" opacity="0.9"
        onClick={() => setActiveComponent(c => c === 'agitator' ? null : 'agitator')}
        className="cursor-pointer"
      >Agit.</text>

      {/* Sparger */}
      <g onClick={() => setActiveComponent(c => c === 'sparger' ? null : 'sparger')} className="cursor-pointer">
        <ellipse cx="110" cy="240" rx="25" ry="5"
          fill={getFill('sparger', '#1B496511')}
          stroke={getStroke('sparger', '#1B4965')}
          strokeWidth={highlight('sparger') ? 2 : 1}
        />
        <line x1="110" y1="245" x2="110" y2="270"
          stroke={getStroke('sparger', '#1B4965')} strokeWidth="2" />
        {[95, 102, 110, 118, 125].map(x => (
          <circle key={x} cx={x} cy="233" r="2"
            fill={getStroke('sparger', '#1B4965')} opacity="0.6" />
        ))}
        <text x="110" y="282" textAnchor="middle" fill="#0F766E" fontSize="7">Sparger O₂</text>
      </g>

      {/* Probes (side) */}
      <g onClick={() => setActiveComponent(c => c === 'probes' ? null : 'probes')} className="cursor-pointer">
        <rect x="15" y="130" width="27" height="8" rx="2"
          fill={getFill('probes', '#7B2D8E11')}
          stroke={getStroke('probes', '#7B2D8E')}
          strokeWidth={highlight('probes') ? 2 : 1}
        />
        <line x1="42" y1="134" x2="56" y2="134"
          stroke={getStroke('probes', '#7B2D8E')} strokeWidth="1.5" />
        <text x="12" y="127" fill="#7B2D8E" fontSize="7">pH/pO₂</text>
      </g>

      {/* Foam probe + pump */}
      <g onClick={() => setActiveComponent(c => c === 'foam' ? null : 'foam')} className="cursor-pointer">
        <line x1="110" y1="70" x2="110" y2="40"
          stroke={getStroke('foam', '#65A30D')} strokeWidth="1.5" />
        <rect x="95" y="28" width="30" height="12" rx="2"
          fill={getFill('foam', '#65A30D11')}
          stroke={getStroke('foam', '#65A30D')} strokeWidth="1"
        />
        <text x="110" y="38" textAnchor="middle" fill="#65A30D" fontSize="7">Antiesp.</text>
      </g>

      {/* Harvest port */}
      <g onClick={() => setActiveComponent(c => c === 'harvest' ? null : 'harvest')} className="cursor-pointer">
        <rect x="178" y="200" width="30" height="10" rx="2"
          fill={getFill('harvest', '#DB277711')}
          stroke={getStroke('harvest', '#DB2777')} strokeWidth="1"
        />
        <line x1="178" y1="205" x2="168" y2="205"
          stroke={getStroke('harvest', '#DB2777')} strokeWidth="1.5"
        />
        <text x="183" y="222" textAnchor="middle" fill="#DB2777" fontSize="7">Cosecha</text>
      </g>

      {/* Controller (external) */}
      <g onClick={() => setActiveComponent(c => c === 'controller' ? null : 'controller')} className="cursor-pointer">
        <rect x="165" y="80" width="40" height="28" rx="3"
          fill={getFill('controller', '#DC262611')}
          stroke={getStroke('controller', '#DC2626')} strokeWidth="1"
        />
        <text x="185" y="91" textAnchor="middle" fill="#DC2626" fontSize="6">DCS/PLC</text>
        <text x="185" y="101" textAnchor="middle" fill="#DC262688" fontSize="6">Control</text>
        <line x1="165" y1="94" x2="178" y2="94"
          stroke={getStroke('controller', '#DC2626')} strokeWidth="1" strokeDasharray="2 2"
        />
      </g>

      {/* Labels */}
      <text x="110" y="14" textAnchor="middle" fill="#4A6741" fontSize="9" fontWeight="bold">
        Biorreactor STR
      </text>
      <text x="110" y="26" textAnchor="middle" fill="#879186" fontSize="7">
        (Stirred Tank Reactor)
      </text>
    </svg>
  )
}

function MetricBadge({ label, value, color }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-sage-400">{label}:</span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  )
}

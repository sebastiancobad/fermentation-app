import { useState } from 'react'
import { SectionHeader } from './Dashboard'

// ─── Exercise Data ────────────────────────────────────────────────────────────
const EXERCISES = [
  {
    id: 1,
    title: 'Cálculo de μx y td a partir de datos experimentales',
    category: 'Cinética de crecimiento',
    difficulty: 'Básico',
    diffColor: '#22c55e',
    icon: '📊',
    topic: 'Fase exponencial, tasa de crecimiento específico, tiempo de duplicación',
    statement: `Un cultivo de Escherichia coli en medio mínimo con glucosa (37°C, pH 7.0) presenta los siguientes datos durante la fase exponencial:

  t₁ = 2.0 h  →  X₁ = 0.50 g/L  (biomasa celular seca)
  t₂ = 6.0 h  →  X₂ = 4.00 g/L

Determine:
  a) La tasa de crecimiento específico (μx) en h⁻¹
  b) El tiempo de duplicación (td) en horas
  c) El número de generaciones ocurridas entre t₁ y t₂`,
    data: [
      { symbol: 't₁', value: '2.0 h' },
      { symbol: 't₂', value: '6.0 h' },
      { symbol: 'X₁', value: '0.50 g/L' },
      { symbol: 'X₂', value: '4.00 g/L' },
    ],
    solution: [
      {
        part: 'a) Tasa de crecimiento específico (μx)',
        steps: [
          {
            title: 'Ecuación de partida',
            formula: 'μx = Δln(X) / Δt = [ln(X₂) − ln(X₁)] / (t₂ − t₁)',
            explanation: 'Definición diferencial de μx, integrada para la fase exponencial donde μ = cte.',
          },
          {
            title: 'Sustitución de valores',
            formula: 'μx = [ln(4.00) − ln(0.50)] / (6.0 − 2.0)',
            explanation: 'Se sustituyen los valores experimentales directamente.',
          },
          {
            title: 'Cálculo del numerador',
            formula: 'ln(4.00) = 1.3863 ;  ln(0.50) = −0.6931\nΔln(X) = 1.3863 − (−0.6931) = 2.0794',
            explanation: 'Ln(X₂/X₁) = ln(4.00/0.50) = ln(8) = 2.0794',
          },
          {
            title: 'Resultado',
            formula: 'μx = 2.0794 / 4.0 h\nμx = 0.5199 ≈ 0.52 h⁻¹',
            explanation: 'Valor típico para E. coli en condiciones aeróbicas óptimas (0.4–1.0 h⁻¹).',
            isResult: true,
          },
        ],
      },
      {
        part: 'b) Tiempo de duplicación (td)',
        steps: [
          {
            title: 'Fórmula del tiempo de duplicación',
            formula: 'td = ln(2) / μx',
            explanation: 'Se deriva de X(t) = X₀·e^(μ·t). Cuando X = 2X₀, entonces μ·td = ln(2).',
          },
          {
            title: 'Cálculo',
            formula: 'td = 0.6931 / 0.5199 h⁻¹\ntd = 1.33 h ≈ 80 min',
            explanation: 'Tiempo para duplicar la concentración de biomasa. Característico de E. coli en condiciones óptimas.',
            isResult: true,
          },
        ],
      },
      {
        part: 'c) Número de generaciones (n)',
        steps: [
          {
            title: 'Fórmula',
            formula: 'n = Δt / td = (t₂ − t₁) / td',
            explanation: 'También expresable como n = log₂(X₂/X₁) = ln(X₂/X₁) / ln(2)',
          },
          {
            title: 'Cálculo',
            formula: 'n = (6.0 − 2.0) h / 1.33 h/gen\nn = 3.0 generaciones',
            explanation: 'Verificación: X₀ · 2³ = 0.50 · 8 = 4.00 g/L ✓',
            isResult: true,
          },
        ],
      },
    ],
    answer: 'μx = 0.52 h⁻¹ · td = 1.33 h · n = 3.0 generaciones',
  },

  {
    id: 2,
    title: 'Coeficiente de rendimiento Yx/s y balance de carbono',
    category: 'Estequiometría del crecimiento',
    difficulty: 'Intermedio',
    diffColor: '#f59e0b',
    icon: '⚗️',
    topic: 'Rendimiento biomasa/sustrato, balance de masa, respiración aeróbica',
    statement: `Un cultivo aeróbico de Saccharomyces cerevisiae con glucosa como única fuente de carbono y energía presenta los siguientes datos al inicio y final de la fase exponencial:

  Condición inicial (t = 0 h):  X₀ = 0.20 g DCW/L,   S₀ = 10.0 g glucosa/L
  Condición final   (t = 8 h):  X  = 2.00 g DCW/L,   S  = 1.0  g glucosa/L

Determine:
  a) El coeficiente de rendimiento biomasa/sustrato (Yx/s) en g·g⁻¹
  b) La productividad volumétrica de biomasa (Px) en g·L⁻¹·h⁻¹
  c) La tasa específica de consumo de sustrato (qs) en g glucosa / (g biomasa · h)
  d) Si se asume fórmula empírica de célula CH₁.₈O₀.₅N₀.₂, verificar el balance de carbono`,
    data: [
      { symbol: 'X₀', value: '0.20 g/L' },
      { symbol: 'S₀', value: '10.0 g/L' },
      { symbol: 'X final', value: '2.00 g/L' },
      { symbol: 'S final', value: '1.0 g/L' },
      { symbol: 'Δt', value: '8 h' },
    ],
    solution: [
      {
        part: 'a) Coeficiente de rendimiento Yx/s',
        steps: [
          {
            title: 'Definición',
            formula: 'Yx/s = ΔX / |ΔS| = (X − X₀) / (S₀ − S)',
            explanation: 'Moles (o gramos) de biomasa producida por gramo de sustrato consumido. Refleja la eficiencia metabólica.',
          },
          {
            title: 'Sustitución',
            formula: 'ΔX = 2.00 − 0.20 = 1.80 g/L\n|ΔS| = 10.0 − 1.0 = 9.0 g/L',
            explanation: 'ΔX es la variación de biomasa; ΔS es el sustrato consumido (S₀ > S, por eso |ΔS|).',
          },
          {
            title: 'Resultado',
            formula: 'Yx/s = 1.80 / 9.0 = 0.200 g biomasa / g glucosa',
            explanation: 'Para S. cerevisiae aeróbico: 0.40–0.50 g/g. Valor de 0.20 sugiere condiciones anaeróbicas o efecto Crabtree activado.',
            isResult: true,
          },
        ],
      },
      {
        part: 'b) Productividad volumétrica de biomasa (Px)',
        steps: [
          {
            title: 'Definición y cálculo',
            formula: 'Px = ΔX / Δt = (2.00 − 0.20) g/L / 8 h\nPx = 0.225 g·L⁻¹·h⁻¹',
            explanation: 'Parámetro operacional clave para el diseño del biorreactor y evaluación económica.',
            isResult: true,
          },
        ],
      },
      {
        part: 'c) Tasa específica de consumo de sustrato (qs)',
        steps: [
          {
            title: 'Relación con μx y Yx/s',
            formula: 'qs = μx / Yx/s',
            explanation: 'La tasa específica de consumo de S se relaciona directamente con μ y el rendimiento.',
          },
          {
            title: 'Calcular μx primero',
            formula: 'μx = [ln(2.00) − ln(0.20)] / 8 h\nμx = [0.6931 − (−1.6094)] / 8 = 2.3026 / 8\nμx = 0.288 h⁻¹',
            explanation: 'Se aplica la misma fórmula del ejercicio 1.',
          },
          {
            title: 'Resultado',
            formula: 'qs = 0.288 h⁻¹ / 0.200 g/g\nqs = 1.44 g glucosa / (g biomasa · h)',
            explanation: 'Por cada gramo de biomasa, se consume 1.44 g de glucosa por hora.',
            isResult: true,
          },
        ],
      },
      {
        part: 'd) Balance de carbono (verificación)',
        steps: [
          {
            title: 'Fórmula empírica celular y PM',
            formula: 'Células: CH₁.₈O₀.₅N₀.₂   →   PM_celular ≈ 24.6 g/mol C\nGlucosa: C₆H₁₂O₆        →   PM = 180 g/mol = 30 g/mol C',
            explanation: 'Se trabaja en base molar de carbono (gC) para verificar el balance.',
          },
          {
            title: 'Fracción másica de C en biomasa',
            formula: 'fC_biomasa = 12 / 24.6 = 0.488 gC/g biomasa\nC en biomasa = 0.488 × 1.80 g/L = 0.878 gC/L',
            explanation: 'El ~48% de la biomasa seca es carbono (valor típico reportado para levaduras).',
          },
          {
            title: 'Fracción másica de C en glucosa',
            formula: 'fC_glucosa = (6×12) / 180 = 0.400 gC/g glucosa\nC en glucosa consumida = 0.400 × 9.0 g/L = 3.60 gC/L',
            explanation: 'El 40% de la glucosa (en masa) es carbono.',
          },
          {
            title: 'Balance de carbono',
            formula: 'C_glucosa = C_biomasa + C_CO₂ + C_subproductos\n3.60 = 0.878 + C_CO₂ + C_otros\nC_CO₂ ≈ 3.60 − 0.878 = 2.72 gC/L → CO₂ liberado',
            explanation: 'El ~24% del C se incorpora a biomasa; el ~76% se libera como CO₂ (respiración). Consistente con Yx/s bajo (posible efecto Crabtree).',
            isResult: true,
          },
        ],
      },
    ],
    answer: 'Yx/s = 0.20 g/g · Px = 0.225 g/L/h · qs = 1.44 g/g/h · ~24% del C a biomasa',
  },

  {
    id: 3,
    title: 'Estimación de parámetros del modelo de Monod y diseño Fed-Batch',
    category: 'Modelo de Monod + Diseño de proceso',
    difficulty: 'Avanzado',
    diffColor: '#ef4444',
    icon: '🔬',
    topic: 'Monod, Ks, μmax, diseño de perfil de alimentación fed-batch',
    statement: `Un microorganismo crece en glucosa con los siguientes datos de la fase exponencial a diferentes concentraciones iniciales de sustrato en cultivos batch separados:

  S = 0.10 g/L  →  μ = 0.100 h⁻¹
  S = 0.20 g/L  →  μ = 0.160 h⁻¹
  S = 0.50 g/L  →  μ = 0.250 h⁻¹
  S = 1.00 g/L  →  μ = 0.330 h⁻¹
  S = 5.00 g/L  →  μ = 0.455 h⁻¹

a) Usando la linealización de Lineweaver-Burk (doble recíproco), estima μmax y Ks.
b) Calcula μ cuando S = 0.30 g/L usando los parámetros estimados.
c) En un biorreactor fed-batch, se desea operar a μ = 0.15 h⁻¹ con Yx/s = 0.45 g/g y X = 30 g/L (V = 10 L). Calcula el caudal de alimentación F (L/h) necesario si Sf = 500 g/L.`,
    data: [
      { symbol: 'S (g/L)', value: '0.10 / 0.20 / 0.50 / 1.00 / 5.00' },
      { symbol: 'μ (h⁻¹)', value: '0.100 / 0.160 / 0.250 / 0.330 / 0.455' },
    ],
    solution: [
      {
        part: 'a) Linealización de Lineweaver-Burk',
        steps: [
          {
            title: 'Transformación doble recíproca',
            formula: '1/μ = (Ks/μmax) · (1/S) + 1/μmax',
            explanation: 'La transformación 1/μ vs 1/S da una línea recta: pendiente = Ks/μmax, intercepto_y = 1/μmax',
          },
          {
            title: 'Tabla de valores recíprocos',
            formula: '1/S: 10.0  5.0   2.0   1.0   0.2\n1/μ:  10.0  6.25  4.0   3.03  2.20',
            explanation: 'Se calculan los inversos de cada par (S, μ) para construir la gráfica LB.',
          },
          {
            title: 'Regresión lineal (puntos extremos orientativos)',
            formula: 'Pendiente = Δ(1/μ) / Δ(1/S) ≈ (10.0 − 2.20) / (10.0 − 0.2)\n= 7.80 / 9.80 = 0.796 h\n\nIntercepto_y ≈ 1/μ cuando 1/S → 0\n≈ 2.00 h  (extrapolando la recta)',
            explanation: 'Con datos reales se usaría mínimos cuadrados. Aquí se usa regresión simple para ilustración.',
          },
          {
            title: 'Estimación de parámetros',
            formula: 'μmax = 1 / intercepto_y = 1 / 2.00 = 0.50 h⁻¹\nKs = pendiente × μmax = 0.796 × 0.50 = 0.40 g/L',
            explanation: 'Ks representa la concentración de sustrato para la que μ = μmax/2 = 0.25 h⁻¹. Verificación: μ(S=0.40) = 0.5×0.40/(0.40+0.40) = 0.25 h⁻¹ ✓',
            isResult: true,
          },
        ],
      },
      {
        part: 'b) Aplicación del modelo: μ cuando S = 0.30 g/L',
        steps: [
          {
            title: 'Aplicar ecuación de Monod',
            formula: 'μ = μmax · S / (Ks + S)\nμ = 0.50 · 0.30 / (0.40 + 0.30)',
            explanation: 'Sustitución directa con μmax = 0.50 h⁻¹ y Ks = 0.40 g/L estimados.',
          },
          {
            title: 'Resultado',
            formula: 'μ = 0.15 / 0.70 = 0.214 h⁻¹',
            explanation: 'S = 0.30 g/L < Ks = 0.40 g/L, por tanto μ < μmax/2 (zona de primer orden aproximado).',
            isResult: true,
          },
        ],
      },
      {
        part: 'c) Diseño del caudal de alimentación Fed-Batch',
        steps: [
          {
            title: 'Balance de masa de biomasa en fed-batch (sin efluente)',
            formula: 'd(V·X)/dt = μ · X · V\n→  V·dX/dt + X·dV/dt = μ·X·V',
            explanation: 'En fed-batch, el volumen V aumenta con el tiempo. dV/dt = F (caudal de entrada).',
          },
          {
            title: 'Balance de masa de sustrato',
            formula: 'dS/dt = F/V · (Sf − S) − (μ/Yx/s)·X\n→ En quasi-estado estacionario: dS/dt ≈ 0',
            explanation: 'Se opera en modo quasi-estacionario donde μ ≈ cte = μset = 0.15 h⁻¹.',
          },
          {
            title: 'Condición quasi-estacionaria (S ≪ Sf)',
            formula: 'F·Sf ≈ (μ/Yx/s) · X · V\n→ F = (μ · X · V) / (Yx/s · Sf)',
            explanation: 'Si S ≪ Sf (sustrato diluido vs. alimentación concentrada), F·S ≈ 0. La glucosa alimentada se consume casi instantáneamente.',
          },
          {
            title: 'Sustitución de valores',
            formula: 'F = (0.15 h⁻¹ × 30 g/L × 10 L) / (0.45 g/g × 500 g/L)',
            explanation: 'μset = 0.15 h⁻¹, X = 30 g/L, V = 10 L, Yx/s = 0.45 g/g, Sf = 500 g/L.',
          },
          {
            title: 'Resultado',
            formula: 'F = 45 g/h / 225 g/L\nF = 0.20 L/h = 200 mL/h',
            explanation: 'Un caudal de 200 mL/h permite mantener μ ≈ 0.15 h⁻¹ en condiciones quasi-estacionarias. En la práctica, F se ajusta dinámicamente con sensores de biomasa en línea (turbidimetría o biosensores).',
            isResult: true,
          },
        ],
      },
    ],
    answer: 'μmax ≈ 0.50 h⁻¹ · Ks ≈ 0.40 g/L · μ(0.30) = 0.214 h⁻¹ · F = 0.20 L/h',
  },
]

export default function PracticalExercises() {
  const [activeEx, setActiveEx] = useState(0)
  const [expandedParts, setExpandedParts] = useState({})
  const [showAll, setShowAll] = useState({})

  const togglePart = (exId, partIdx) => {
    setExpandedParts(prev => {
      const key = `${exId}-${partIdx}`
      return { ...prev, [key]: !prev[key] }
    })
  }

  const toggleShowAll = (exId) => {
    setShowAll(prev => ({ ...prev, [exId]: !prev[exId] }))
    if (!showAll[exId]) {
      // expand all parts
      const ex = EXERCISES.find(e => e.id === exId)
      if (ex) {
        const newParts = {}
        ex.solution.forEach((_, i) => { newParts[`${exId}-${i}`] = true })
        setExpandedParts(prev => ({ ...prev, ...newParts }))
      }
    }
  }

  const ex = EXERCISES[activeEx]

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="MÓDULO 7 · RESOLUCIÓN DE PROBLEMAS"
        title="Ejercicios Prácticos Resueltos"
        sub="Problemas de ingeniería de bioprocesos con planteamiento, balances de masa y solución matemática paso a paso."
      />

      {/* Exercise selector */}
      <div className="grid sm:grid-cols-3 gap-4">
        {EXERCISES.map((e, i) => (
          <button
            key={e.id}
            onClick={() => { setActiveEx(i); setExpandedParts({}); setShowAll({}) }}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeEx === i
                ? 'border-emerald-500/60 bg-emerald-500/10'
                : 'border-slate-700 bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xl">{e.icon}</span>
              <div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ color: e.diffColor, backgroundColor: `${e.diffColor}22`, border: `1px solid ${e.diffColor}44` }}
                >
                  {e.difficulty}
                </span>
              </div>
            </div>
            <h3 className={`text-sm font-bold leading-snug mt-2 ${activeEx === i ? 'text-emerald-300' : 'text-white'}`}>
              Ej. {e.id}: {e.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{e.category}</p>
          </button>
        ))}
      </div>

      {/* Active exercise */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-5 border-b border-slate-700">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{ex.icon}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-500">EJERCICIO {ex.id}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color: ex.diffColor, backgroundColor: `${ex.diffColor}22`, border: `1px solid ${ex.diffColor}44` }}
                  >
                    {ex.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{ex.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  📚 {ex.category} · {ex.topic}
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleShowAll(ex.id)}
              className="flex-shrink-0 px-4 py-2 text-xs font-medium rounded-lg border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
            >
              {showAll[ex.id] ? 'Colapsar todo' : 'Ver solución completa'}
            </button>
          </div>
        </div>

        {/* Statement */}
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">P</span>
            <span className="text-sm font-semibold text-slate-300">Planteamiento del problema</span>
          </div>
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
            <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
              {ex.statement}
            </pre>
          </div>

          {/* Given data */}
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Datos proporcionados</p>
            <div className="flex flex-wrap gap-2">
              {ex.data.map(d => (
                <div
                  key={d.symbol}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs"
                >
                  <span className="text-emerald-400 font-mono font-semibold">{d.symbol}</span>
                  <span className="text-slate-400 mx-1">=</span>
                  <span className="text-cyan-300 font-mono">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Solution steps */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold">S</span>
            <span className="text-sm font-semibold text-slate-300">Solución paso a paso</span>
          </div>

          {ex.solution.map((part, pIdx) => {
            const isOpen = expandedParts[`${ex.id}-${pIdx}`]
            return (
              <div
                key={pIdx}
                className="border border-slate-700 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-all"
                  onClick={() => togglePart(ex.id, pIdx)}
                >
                  <div className="flex items-center gap-3">
                    <div className="step-circle">{pIdx + 1}</div>
                    <span className="font-semibold text-white text-sm">{part.part}</span>
                  </div>
                  <span className="text-slate-400 text-lg">{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-700 p-4 bg-slate-900/30 space-y-3">
                    {part.steps.map((step, sIdx) => (
                      <div
                        key={sIdx}
                        className={`rounded-lg p-4 border ${
                          step.isResult
                            ? 'border-emerald-500/40 bg-emerald-500/5'
                            : 'border-slate-700 bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-slate-500">
                            {step.isResult ? '✅ RESULTADO' : `Paso ${sIdx + 1}`}
                          </span>
                          <span className={`text-xs font-semibold ${step.isResult ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {step.title}
                          </span>
                        </div>
                        <pre
                          className={`font-mono text-sm leading-relaxed whitespace-pre-wrap mb-2 p-3 rounded-lg ${
                            step.isResult
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-slate-800 text-cyan-300'
                          }`}
                        >
                          {step.formula}
                        </pre>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          💡 {step.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Final answer box */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mt-2">
            <div className="text-xs font-semibold text-emerald-400 uppercase mb-2 flex items-center gap-1">
              ✅ Respuesta final
            </div>
            <p className="font-mono text-sm text-emerald-300">{ex.answer}</p>
          </div>
        </div>
      </div>

      {/* Tips Box */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="font-bold text-white mb-4">Estrategia General de Resolución</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { n: '1', title: 'Identifica el sistema', desc: 'Batch, Fed-Batch o Continuo. Define los límites del sistema de control de volumen.', color: '#22c55e' },
            { n: '2', title: 'Escribe los balances', desc: 'dX/dt, dS/dt, dP/dt. Usa la forma general: acum. = entrada − salida + generación.', color: '#06b6d4' },
            { n: '3', title: 'Identifica el régimen', desc: 'Fase exponencial (μ = cte), estado estacionario (d/dt = 0), o transitorio.', color: '#a855f7' },
            { n: '4', title: 'Verifica con unidades', desc: 'Análisis dimensional: g/L, h⁻¹, g/g. Cierra el balance de carbono o energía.', color: '#f59e0b' },
          ].map(tip => (
            <div
              key={tip.n}
              className="rounded-lg p-4 border"
              style={{ borderColor: `${tip.color}33`, backgroundColor: `${tip.color}0a` }}
            >
              <div className="step-circle mb-3" style={{ background: `linear-gradient(135deg, ${tip.color}, ${tip.color}88)` }}>
                {tip.n}
              </div>
              <div className="font-semibold mb-1" style={{ color: tip.color }}>{tip.title}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

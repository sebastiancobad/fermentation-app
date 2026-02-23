import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── Data generation ────────────────────────────────────────────────────────
function generateGrowthData(mu = 0.30, lagEnd = 8, expEnd = 24, statEnd = 36, X0 = 0.5, Xmax = 14) {
  const data = []
  for (let t = 0; t <= 48; t += 0.5) {
    let X
    if (t <= lagEnd) {
      // Lag: minimal growth — slight increase due to adaptation
      X = X0 + 0.005 * t * t
    } else if (t <= expEnd) {
      // Exponential: X = X(lagEnd) · e^(μ·Δt)
      const Xlag = X0 + 0.005 * lagEnd * lagEnd
      X = Xlag * Math.exp(mu * (t - lagEnd))
    } else if (t <= statEnd) {
      // Stationary
      X = Xmax
    } else {
      // Death: first-order decline  kd ≈ 0.06 h⁻¹
      X = Xmax * Math.exp(-0.06 * (t - statEnd))
    }
    X = Math.max(0.01, Math.min(X, Xmax))
    data.push({
      time: parseFloat(t.toFixed(1)),
      biomass: parseFloat(X.toFixed(3)),
      logBiomass: parseFloat(Math.log10(X).toFixed(4)),
      phase: t <= lagEnd ? 'lag' : t <= expEnd ? 'exp' : t <= statEnd ? 'stat' : 'death',
    })
  }
  return data
}

// ─── Phase metadata ──────────────────────────────────────────────────────────
const PHASES = [
  {
    id: 'lag',
    label: 'Fase LAG (Latencia)',
    color: '#f59e0b',
    xStart: 0, xEnd: 8,
    description: [
      'Los microorganismos se adaptan al nuevo ambiente.',
      'Síntesis intensa de ARN, enzimas y cofactores.',
      'Sin división celular observable; X ≈ constante.',
      'Duración afectada por el inóculo, temperatura y pH.',
      'Meta operacional: minimizar esta fase para reducir ciclo.',
    ],
    metabolism: 'Biosíntesis activa de maquinaria enzimática. Alto consumo de ATP sin crecimiento neto.',
  },
  {
    id: 'exp',
    label: 'Fase Exponencial (LOG)',
    color: '#22c55e',
    xStart: 8, xEnd: 24,
    description: [
      'División celular a velocidad máxima y constante.',
      'μ = μmax (sustrato no limitante, sin inhibición).',
      'X(t) = X₀ · e^(μmax · t) — crecimiento geométrico.',
      'Tiempo de duplicación: td = ln(2) / μmax.',
      'Fase objetivo para producción de biomasa y metabolitos primarios.',
    ],
    metabolism: 'Máxima actividad metabólica. Glucólisis + ciclo TCA a plena capacidad. Consumo rápido de sustrato.',
  },
  {
    id: 'stat',
    label: 'Fase Estacionaria',
    color: '#06b6d4',
    xStart: 24, xEnd: 36,
    description: [
      'μ_crecimiento = μ_muerte → μ_neto = 0.',
      'Agotamiento de nutriente limitante o acumulación de inhibidores.',
      'Producción de metabolitos secundarios (antibióticos, pigmentos).',
      'Inducción de respuesta a estrés: esporas, exopolisacáridos.',
      'Fase clave para productos como penicilina (metabolito 2°).',
    ],
    metabolism: 'Metabolismo redirigido hacia producción de metabolitos secundarios. Activación de vías de estrés oxidativo.',
  },
  {
    id: 'death',
    label: 'Fase de Muerte',
    color: '#ef4444',
    xStart: 36, xEnd: 48,
    description: [
      'μ_muerte > μ_crecimiento → declive exponencial de X.',
      'Autólisis: liberación de enzimas intracelulares.',
      'En proceso industrial: se evita terminando el batch antes.',
      'Aporta nutrientes a células supervivientes (canibalismo celular).',
      'kd (tasa de muerte): 0.02–0.2 h⁻¹ según condiciones.',
    ],
    metabolism: 'Agotamiento de reservas energéticas. Colapso del potencial de membrana. Hidrólisis de ARN y proteínas.',
  },
]

const CustomTooltip = ({ active, payload, activePhase }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const phase = PHASES.find(p => p.id === d.phase)
  return (
    <div className="custom-tooltip max-w-xs">
      <div className="text-xs font-mono text-slate-400 mb-1">t = {d.time} h</div>
      <div className="text-emerald-400 font-semibold">
        X = {d.biomass.toFixed(3)} g·L⁻¹
      </div>
      <div className="text-cyan-400 text-xs">
        log₁₀(X) = {d.logBiomass.toFixed(3)}
      </div>
      {phase && (
        <div className="mt-2 pt-2 border-t border-slate-600 text-xs text-slate-300">
          <span style={{ color: phase.color }} className="font-semibold">{phase.label}</span>
          <p className="mt-1 text-slate-400">{phase.metabolism}</p>
        </div>
      )}
    </div>
  )
}

export default function GrowthCurve() {
  const [mu, setMu] = useState(0.30)
  const [lagEnd, setLagEnd] = useState(8)
  const [expEnd, setExpEnd] = useState(24)
  const [statEnd, setStatEnd] = useState(36)
  const [logScale, setLogScale] = useState(false)
  const [activePhase, setActivePhase] = useState(null)
  const [showAnnotations, setShowAnnotations] = useState(true)

  const data = useMemo(
    () => generateGrowthData(mu, lagEnd, expEnd, statEnd),
    [mu, lagEnd, expEnd, statEnd]
  )

  const td = (Math.LN2 / mu).toFixed(2)
  const Xmax = data[data.length - 1] ? 14 : 14

  const highlightedPhase = activePhase ? PHASES.find(p => p.id === activePhase) : null

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="MÓDULO 2 · DINÁMICA POBLACIONAL"
        title="Curva de Crecimiento Microbiano"
        sub="Representación de las cuatro fases de crecimiento con parámetros ajustables. Pasa el cursor sobre la gráfica para información metabólica detallada."
      />

      {/* ─── Controls ─── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Parámetros del Cultivo</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SliderParam
            label="μmax"
            unit="h⁻¹"
            value={mu}
            min={0.05} max={0.80} step={0.01}
            onChange={v => setMu(parseFloat(v))}
            derived={`td = ${td} h`}
            color="#22c55e"
          />
          <SliderParam
            label="Fin Fase LAG"
            unit="h"
            value={lagEnd}
            min={2} max={16} step={1}
            onChange={v => setLagEnd(parseInt(v))}
            color="#f59e0b"
          />
          <SliderParam
            label="Fin Fase EXP"
            unit="h"
            value={expEnd}
            min={lagEnd + 4} max={40} step={1}
            onChange={v => setExpEnd(parseInt(v))}
            color="#22c55e"
          />
          <SliderParam
            label="Fin Fase STAT"
            unit="h"
            value={statEnd}
            min={expEnd + 2} max={46} step={1}
            onChange={v => setStatEnd(parseInt(v))}
            color="#06b6d4"
          />
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-slate-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={logScale}
              onChange={e => setLogScale(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span className="text-sm text-slate-300">Escala logarítmica</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showAnnotations}
              onChange={e => setShowAnnotations(e.target.checked)}
              className="rounded accent-emerald-500"
            />
            <span className="text-sm text-slate-300">Mostrar fases</span>
          </label>
        </div>
      </div>

      {/* ─── Chart ─── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-white">
            Concentración de Biomasa vs Tiempo
          </h3>
          <span className="text-xs font-mono text-slate-500">
            μmax = {mu} h⁻¹ · td = {td} h
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Eje Y: {logScale ? 'log₁₀(X) [adimensional]' : 'X [g·L⁻¹]'}
        </p>

        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            {/* Phase shading */}
            {showAnnotations && PHASES.map(ph => (
              <ReferenceArea
                key={ph.id}
                x1={ph.xStart} x2={ph.xEnd}
                fill={ph.color}
                fillOpacity={activePhase === ph.id ? 0.12 : 0.04}
              />
            ))}

            {/* Phase boundary lines */}
            {showAnnotations && [lagEnd, expEnd, statEnd].map((xVal, i) => (
              <ReferenceLine
                key={i}
                x={xVal}
                stroke={PHASES[i + 1]?.color ?? '#ef4444'}
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            ))}

            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{ value: 'Tiempo (h)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              label={{
                value: logScale ? 'log₁₀(X)' : 'X (g·L⁻¹)',
                angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 12
              }}
            />
            <Tooltip content={<CustomTooltip activePhase={activePhase} />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '10px' }}
            />

            <Line
              type="monotone"
              dataKey={logScale ? 'logBiomass' : 'biomass'}
              name={logScale ? 'log₁₀(X)' : 'Biomasa X (g/L)'}
              stroke="#22c55e"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#22c55e', stroke: '#0f172a', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Phase labels below chart */}
        {showAnnotations && (
          <div className="flex gap-2 flex-wrap mt-2 justify-center">
            {PHASES.map(ph => (
              <button
                key={ph.id}
                onMouseEnter={() => setActivePhase(ph.id)}
                onMouseLeave={() => setActivePhase(null)}
                onClick={() => setActivePhase(prev => prev === ph.id ? null : ph.id)}
                className="text-xs px-3 py-1 rounded-full border transition-all"
                style={{
                  color: ph.color,
                  borderColor: `${ph.color}66`,
                  backgroundColor: activePhase === ph.id ? `${ph.color}22` : 'transparent',
                }}
              >
                {ph.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Phase Details ─── */}
      {highlightedPhase ? (
        <PhaseDetail phase={highlightedPhase} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PHASES.map(ph => (
            <button
              key={ph.id}
              onClick={() => setActivePhase(ph.id)}
              className="bio-card bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:border-opacity-50 transition-all"
              style={{ borderColor: `${ph.color}44` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ph.color }} />
                <span className="font-semibold text-sm" style={{ color: ph.color }}>
                  {ph.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {ph.description[0]}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                t: {ph.xStart}–{ph.xEnd} h (por defecto)
              </p>
            </button>
          ))}
        </div>
      )}

      {/* ─── Mathematical description ─── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="font-bold text-white mb-4">Descripción Matemática del Crecimiento</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-3">
              La fase exponencial se describe por una ecuación diferencial de primer orden:
            </p>
            <div className="formula-block">
              dX/dt = μ · X
            </div>
            <div className="formula-block mt-2">
              Integrada: X(t) = X₀ · e^(μ·t)
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Donde X₀ es la concentración inicial de biomasa al inicio de la fase exponencial.
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-3">
              Parámetros cinéticos derivados:
            </p>
            <div className="space-y-2">
              <FormulaRow eq="td = ln(2) / μmax" desc="Tiempo de duplicación" />
              <FormulaRow eq="μ = Δln(X) / Δt" desc="Tasa de crecimiento específico" />
              <FormulaRow eq="n = t / td" desc="Número de generaciones" />
              <FormulaRow eq="X(t) = X₀ · 2^(t/td)" desc="Forma alternativa" />
            </div>
            <div className="mt-3 bg-slate-900 rounded-lg p-3 font-mono text-sm">
              <span className="text-slate-500">// Para μ = </span>
              <span className="text-emerald-400">{mu}</span>
              <span className="text-slate-500"> h⁻¹</span>
              <br />
              <span className="text-slate-500">td = ln(2) / </span>
              <span className="text-emerald-400">{mu}</span>
              <span className="text-slate-500"> = </span>
              <span className="text-cyan-400">{td} h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SliderParam({ label, unit, value, min, max, step, onChange, derived, color }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className="font-mono text-sm font-bold" style={{ color }}>{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full"
        style={{ accentColor: color }}
      />
      {derived && <div className="text-xs text-slate-500 mt-1 font-mono">{derived}</div>}
    </div>
  )
}

function FormulaRow({ eq, desc }) {
  return (
    <div className="flex items-center gap-3">
      <code className="formula text-xs px-2 py-1 text-emerald-400 flex-shrink-0">{eq}</code>
      <span className="text-xs text-slate-400">{desc}</span>
    </div>
  )
}

function PhaseDetail({ phase }) {
  return (
    <div
      className="rounded-xl border p-6 bg-slate-800 transition-all"
      style={{ borderColor: `${phase.color}55` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: phase.color }} />
        <h3 className="text-lg font-bold" style={{ color: phase.color }}>{phase.label}</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Características</p>
          <ul className="space-y-1.5">
            {phase.description.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span style={{ color: phase.color }} className="mt-1 flex-shrink-0">▸</span>
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase mb-2">Estado Metabólico</p>
          <div
            className="rounded-lg p-4 border text-sm text-slate-300 leading-relaxed"
            style={{ backgroundColor: `${phase.color}11`, borderColor: `${phase.color}33` }}
          >
            {phase.metabolism}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Rango temporal por defecto: <span className="font-mono" style={{ color: phase.color }}>
              {phase.xStart} – {phase.xEnd} h
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

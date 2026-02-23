import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter,
} from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── Calculation logic ───────────────────────────────────────────────────────
function calcMu(X1, t1, X2, t2) {
  if (X1 <= 0 || X2 <= 0 || t2 <= t1) return null
  return (Math.log(X2) - Math.log(X1)) / (t2 - t1)
}

function calcTd(mu) {
  if (mu <= 0) return null
  return Math.LN2 / mu
}

function calcYxs(X1, X2, S1, S2) {
  const deltaX = X2 - X1
  const deltaS = S1 - S2  // substrate consumed
  if (deltaS <= 0 || deltaX < 0) return null
  return deltaX / deltaS
}

// Multi-point μ from array data
function calcMultiPointMu(points) {
  // Linear regression of ln(X) vs t during exponential phase
  const n = points.length
  if (n < 2) return null
  const lnX = points.map(p => Math.log(parseFloat(p.X)))
  const t = points.map(p => parseFloat(p.t))
  const sumT = t.reduce((a, b) => a + b, 0)
  const sumLnX = lnX.reduce((a, b) => a + b, 0)
  const sumT2 = t.reduce((a, b) => a + b * b, 0)  // actually t[i]^2
  const sumTlnX = t.reduce((a, b, i) => a + b * lnX[i], 0)
  const denom = n * sumT2 - sumT * sumT
  if (Math.abs(denom) < 1e-10) return null
  const slope = (n * sumTlnX - sumT * sumLnX) / denom
  const intercept = (sumLnX - slope * sumT) / n
  return { mu: slope, R2: calcR2(t, lnX, slope, intercept), intercept }
}

function calcR2(x, y, slope, intercept) {
  const yMean = y.reduce((a, b) => a + b, 0) / y.length
  const SStot = y.reduce((a, yi) => a + (yi - yMean) ** 2, 0)
  const SSres = x.reduce((a, xi, i) => a + (y[i] - (slope * xi + intercept)) ** 2, 0)
  return 1 - SSres / SStot
}

const EMPTY_POINT = { t: '', X: '', S: '' }

export default function KineticCalculator() {
  // ── Two-point mode ──────────────────────────────────────────────────────
  const [t1, setT1] = useState('2')
  const [X1, setX1] = useState('0.50')
  const [S1, setS1] = useState('10.0')
  const [t2, setT2] = useState('6')
  const [X2, setX2] = useState('4.00')
  const [S2, setS2] = useState('1.00')

  // ── Multi-point mode ────────────────────────────────────────────────────
  const [points, setPoints] = useState([
    { t: '0',  X: '0.10', S: '12.0' },
    { t: '2',  X: '0.18', S: '11.4' },
    { t: '4',  X: '0.33', S: '10.6' },
    { t: '6',  X: '0.60', S: '9.5'  },
    { t: '8',  X: '1.10', S: '7.9'  },
    { t: '10', X: '2.00', S: '5.8'  },
    { t: '12', X: '3.65', S: '3.1'  },
    { t: '14', X: '6.60', S: '0.5'  },
  ])
  const [mode, setMode] = useState('two') // 'two' | 'multi'

  // ── Two-point results ────────────────────────────────────────────────────
  const twoPointResults = useMemo(() => {
    const mu = calcMu(parseFloat(X1), parseFloat(t1), parseFloat(X2), parseFloat(t2))
    const td = mu !== null ? calcTd(mu) : null
    const Yxs = calcYxs(parseFloat(X1), parseFloat(X2), parseFloat(S1), parseFloat(S2))
    return { mu, td, Yxs }
  }, [t1, X1, S1, t2, X2, S2])

  // ── Multi-point results ──────────────────────────────────────────────────
  const multiResults = useMemo(() => {
    const validPts = points.filter(p => p.t !== '' && p.X !== '' && parseFloat(p.X) > 0)
    if (validPts.length < 2) return null
    const reg = calcMultiPointMu(validPts)
    const td = reg ? calcTd(reg.mu) : null
    // Yield from first & last points
    const first = validPts[0], last = validPts[validPts.length - 1]
    const Yxs = first.S !== '' && last.S !== ''
      ? calcYxs(parseFloat(first.X), parseFloat(last.X), parseFloat(first.S), parseFloat(last.S))
      : null
    return { ...reg, td, Yxs }
  }, [points])

  // Chart data for multi-point
  const chartData = useMemo(() => {
    const validPts = points.filter(p => p.t !== '' && p.X !== '' && parseFloat(p.X) > 0)
    const pts = validPts.map(p => ({
      t: parseFloat(p.t),
      lnX: parseFloat(Math.log(parseFloat(p.X)).toFixed(4)),
      X: parseFloat(parseFloat(p.X).toFixed(4)),
      S: p.S !== '' ? parseFloat(parseFloat(p.S).toFixed(3)) : null,
    }))
    if (!multiResults) return { pts, regLine: [] }
    const { mu, intercept } = multiResults
    const tMin = Math.min(...pts.map(p => p.t))
    const tMax = Math.max(...pts.map(p => p.t))
    const regLine = []
    for (let t = tMin; t <= tMax; t += (tMax - tMin) / 20) {
      regLine.push({ t: parseFloat(t.toFixed(2)), lnX_reg: parseFloat((mu * t + intercept).toFixed(4)) })
    }
    return { pts, regLine }
  }, [points, multiResults])

  const updatePoint = (i, field, val) => {
    setPoints(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p))
  }

  const addPoint = () => setPoints(prev => [...prev, { ...EMPTY_POINT }])
  const removePoint = i => setPoints(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="MÓDULO 3 · CÁLCULO CINÉTICO"
        title="Calculadora de Cinética Microbiana"
        sub="Calcula μx, td y Yx/s a partir de datos experimentales usando método de dos puntos o regresión lineal multi-punto."
      />

      {/* ─── Mode Selector ─── */}
      <div className="flex gap-2">
        {[
          { id: 'two', label: 'Método 2 Puntos', desc: 'Cálculo directo' },
          { id: 'multi', label: 'Regresión Multi-Punto', desc: 'Mayor precisión' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              mode === m.id
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {m.label}
            <span className="ml-2 text-xs opacity-60">{m.desc}</span>
          </button>
        ))}
      </div>

      {mode === 'two' ? (
        <TwoPointCalculator
          t1={t1} X1={X1} S1={S1}
          t2={t2} X2={X2} S2={S2}
          setT1={setT1} setX1={setX1} setS1={setS1}
          setT2={setT2} setX2={setX2} setS2={setS2}
          results={twoPointResults}
        />
      ) : (
        <MultiPointCalculator
          points={points}
          updatePoint={updatePoint}
          addPoint={addPoint}
          removePoint={removePoint}
          results={multiResults}
          chartData={chartData}
        />
      )}

      {/* ─── Formula Reference ─── */}
      <FormulaReference />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
function TwoPointCalculator({ t1, X1, S1, t2, X2, S2, setT1, setX1, setS1, setT2, setX2, setS2, results }) {
  const { mu, td, Yxs } = results
  const isValid = mu !== null && !isNaN(mu)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="font-semibold text-white mb-5">Datos Experimentales</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">
              Punto 1 (inicio fase exponencial)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="t₁ (h)" value={t1} onChange={setT1} />
              <InputField label="X₁ (g/L)" value={X1} onChange={setX1} />
              <InputField label="S₁ (g/L)" value={S1} onChange={setS1} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2 block">
              Punto 2 (fin fase exponencial)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="t₂ (h)" value={t2} onChange={setT2} />
              <InputField label="X₂ (g/L)" value={X2} onChange={setX2} />
              <InputField label="S₂ (g/L)" value={S2} onChange={setS2} />
            </div>
          </div>
        </div>

        {/* Step-by-step calculation */}
        <div className="mt-5 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 font-semibold uppercase mb-3">Cálculo paso a paso</p>
          <div className="space-y-2 font-mono text-xs bg-slate-900 rounded-lg p-4 text-slate-300">
            <div className="text-slate-500">{'// Tasa de crecimiento específico'}</div>
            <div>μx = [ln(X₂) − ln(X₁)] / (t₂ − t₁)</div>
            <div>μx = [ln(<span className="text-cyan-400">{X2}</span>) − ln(<span className="text-cyan-400">{X1}</span>)] / (<span className="text-cyan-400">{t2}</span> − <span className="text-cyan-400">{t1}</span>)</div>
            {isValid && (
              <div className="text-emerald-400">
                μx = {mu.toFixed(4)} h⁻¹
              </div>
            )}
            <div className="text-slate-500 mt-2">{'// Tiempo de duplicación'}</div>
            <div>td = ln(2) / μx = 0.6931 / μx</div>
            {td && <div className="text-emerald-400">td = {td.toFixed(4)} h</div>}
            <div className="text-slate-500 mt-2">{'// Coeficiente de rendimiento'}</div>
            <div>Yx/s = ΔX / |ΔS| = (X₂−X₁) / (S₁−S₂)</div>
            {Yxs && (
              <div className="text-emerald-400">
                Yx/s = ({parseFloat(X2)-parseFloat(X1)}) / ({parseFloat(S1)-parseFloat(S2)}) = {Yxs.toFixed(4)} g/g
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <ResultCard
          label="Tasa de Crecimiento Específico"
          symbol="μx"
          value={isValid ? mu.toFixed(4) : '—'}
          unit="h⁻¹"
          formula="μx = Δln(X) / Δt"
          color="#22c55e"
          desc="Fracción de biomasa que se produce por unidad de tiempo. Independiente de la concentración inicial."
          valid={isValid}
        />
        <ResultCard
          label="Tiempo de Duplicación"
          symbol="td"
          value={td ? td.toFixed(4) : '—'}
          unit="h"
          formula="td = ln(2) / μx"
          color="#06b6d4"
          desc="Tiempo necesario para que la concentración de biomasa se duplique. Característico del microorganismo y condiciones."
          valid={!!td}
        />
        <ResultCard
          label="Coeficiente de Rendimiento Biomasa/Sustrato"
          symbol="Yx/s"
          value={Yxs ? Yxs.toFixed(4) : '—'}
          unit="g·g⁻¹"
          formula="Yx/s = ΔX / ΔS"
          color="#a855f7"
          desc="Gramos de biomasa producidos por gramo de sustrato consumido. Parámetro clave para el diseño de procesos."
          valid={!!Yxs}
        />

        {/* Quick reference values */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Valores de referencia típicos</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['E. coli (aerobio)', 'μmax ≈ 0.4–1.0 h⁻¹', 'Yx/s ≈ 0.40–0.50 g/g'],
              ['S. cerevisiae', 'μmax ≈ 0.2–0.4 h⁻¹', 'Yx/s ≈ 0.45–0.50 g/g'],
              ['Penicillium', 'μmax ≈ 0.03–0.10 h⁻¹', 'Yx/s ≈ 0.40–0.60 g/g'],
              ['L. lactis (anaer.)', 'μmax ≈ 0.5–0.8 h⁻¹', 'Yx/s ≈ 0.05–0.15 g/g'],
            ].map(([org, mu, yxs]) => (
              <div key={org} className="bg-slate-900 rounded-lg p-2">
                <div className="text-slate-300 font-medium mb-1">{org}</div>
                <div className="text-emerald-400 font-mono">{mu}</div>
                <div className="text-violet-400 font-mono">{yxs}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
function MultiPointCalculator({ points, updatePoint, addPoint, removePoint, results, chartData }) {
  const isValid = results && results.mu !== null && !isNaN(results.mu)

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">Tabla de Datos Experimentales</h3>
            <button
              onClick={addPoint}
              className="text-xs px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-all"
            >
              + Añadir fila
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700">
                  <th className="pb-2 text-left font-mono">t (h)</th>
                  <th className="pb-2 text-left font-mono">X (g/L)</th>
                  <th className="pb-2 text-left font-mono">S (g/L)</th>
                  <th className="pb-2 text-left font-mono">ln(X)</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        value={p.t}
                        onChange={e => updatePoint(i, 't', e.target.value)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        value={p.X}
                        onChange={e => updatePoint(i, 'X', e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        value={p.S}
                        onChange={e => updatePoint(i, 'S', e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-1 pr-2 font-mono text-emerald-400">
                      {p.X && parseFloat(p.X) > 0
                        ? Math.log(parseFloat(p.X)).toFixed(3)
                        : '—'}
                    </td>
                    <td className="py-1">
                      <button
                        onClick={() => removePoint(i)}
                        disabled={points.length <= 3}
                        className="text-slate-600 hover:text-red-400 disabled:opacity-30 transition-colors"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {isValid && (
            <>
              <ResultCard
                label="Tasa de Crecimiento Específico (regresión)"
                symbol="μx"
                value={results.mu.toFixed(4)}
                unit="h⁻¹"
                formula="pendiente de ln(X) vs t"
                color="#22c55e"
                desc={`R² = ${results.R2.toFixed(4)} — Bondad de ajuste del modelo lineal.`}
                valid
              />
              <ResultCard
                label="Tiempo de Duplicación"
                symbol="td"
                value={results.td.toFixed(4)}
                unit="h"
                formula="td = ln(2) / μx"
                color="#06b6d4"
                desc="Calculado a partir de la pendiente de regresión."
                valid
              />
              {results.Yxs && (
                <ResultCard
                  label="Coeficiente de Rendimiento"
                  symbol="Yx/s"
                  value={results.Yxs.toFixed(4)}
                  unit="g·g⁻¹"
                  formula="ΔX_total / ΔS_total"
                  color="#a855f7"
                  desc="Calculado entre el primer y último punto de datos válidos."
                  valid
                />
              )}
            </>
          )}
          {!isValid && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center text-slate-500 text-sm">
              Ingresa al menos 2 puntos válidos (X &gt; 0) para ver los resultados.
            </div>
          )}
        </div>
      </div>

      {/* ln(X) vs t chart */}
      {chartData.pts.length >= 2 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Gráfica de Regresión: ln(X) vs t — Linealización Fase Exponencial
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Tiempo (h)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'ln(X)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #22c55e44', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#4ade80' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />

              <Line
                data={chartData.pts}
                type="monotone"
                dataKey="lnX"
                name="ln(X) datos"
                stroke="#22c55e"
                strokeWidth={0}
                dot={{ r: 5, fill: '#22c55e', stroke: '#0f172a', strokeWidth: 2 }}
              />
              <Line
                data={chartData.regLine}
                type="monotone"
                dataKey="lnX_reg"
                name="Regresión lineal"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 3"
              />
            </LineChart>
          </ResponsiveContainer>
          {isValid && (
            <div className="mt-3 font-mono text-xs text-slate-400 text-center">
              ln(X) = <span className="text-emerald-400">{results.mu.toFixed(4)}</span> · t
              + <span className="text-cyan-400">{results.intercept.toFixed(4)}</span>
              {'  '}|{'  '}R² = <span className="text-violet-400">{results.R2.toFixed(4)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
function ResultCard({ label, symbol, value, unit, formula, color, desc, valid }) {
  return (
    <div
      className={`bio-card rounded-xl border p-4 bg-slate-800 transition-all ${valid ? '' : 'opacity-60'}`}
      style={{ borderColor: valid ? `${color}44` : '#334155' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs text-slate-400 mb-1">{label}</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-xl" style={{ color }}>
              {value}
            </span>
            <span className="text-sm text-slate-400 font-mono">{unit}</span>
          </div>
          <code className="text-xs text-slate-500 font-mono">{formula}</code>
        </div>
        <div
          className="text-2xl font-bold font-mono px-3 py-2 rounded-lg"
          style={{ color, backgroundColor: `${color}11` }}
        >
          {symbol}
        </div>
      </div>
      {desc && <p className="text-xs text-slate-500 mt-2 border-t border-slate-700 pt-2">{desc}</p>}
    </div>
  )
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block font-mono">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        step="0.01"
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
      />
    </div>
  )
}

function FormulaReference() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="font-bold text-white mb-5">Marco Teórico de las Ecuaciones</h3>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="text-emerald-400 font-semibold text-sm mb-2">
            Tasa de Crecimiento Específico (μx)
          </div>
          <div className="formula-block text-sm">μx = d(ln X)/dt</div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Definición diferencial. Para la fase exponencial, μx = μmax (sustrato en exceso).
            Unidades: h⁻¹ o d⁻¹.
          </p>
          <div className="formula-block text-sm mt-2">
            μx = [ln(X₂/X₁)] / (t₂ − t₁)
          </div>
          <p className="text-xs text-slate-500 mt-1">Forma discreta (2 puntos).</p>
        </div>
        <div>
          <div className="text-cyan-400 font-semibold text-sm mb-2">
            Tiempo de Duplicación (td)
          </div>
          <div className="formula-block text-sm">td = ln(2) / μx ≈ 0.693 / μx</div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Tiempo para que X se duplique. También llamado tiempo de generación (g).
            Válido solo durante la fase exponencial.
          </p>
          <div className="formula-block text-sm mt-2">
            N(t) = N₀ · 2^(t/td)
          </div>
          <p className="text-xs text-slate-500 mt-1">Crecimiento en número de células.</p>
        </div>
        <div>
          <div className="text-violet-400 font-semibold text-sm mb-2">
            Coeficiente de Rendimiento (Yx/s)
          </div>
          <div className="formula-block text-sm">Yx/s = −dX/dS = ΔX/|ΔS|</div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Relación estequiométrica entre biomasa producida y sustrato consumido.
            El signo negativo refleja que S decrece al crecer X.
          </p>
          <div className="formula-block text-sm mt-2">
            Yp/s = ΔP / |ΔS|
          </div>
          <p className="text-xs text-slate-500 mt-1">Rendimiento en producto (análogo).</p>
        </div>
      </div>
    </div>
  )
}

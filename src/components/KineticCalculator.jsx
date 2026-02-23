import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { SectionHeader } from './Dashboard'
import Math from './Math'

// ─── Color constants (audit-compliant variable coding) ──────────────────────
const COLOR = {
  mu:  '#2D6A4F',  // forest-600 → μx always green
  td:  '#1B4965',  // navy-500   → td always navy
  Yxs: '#7B2D8E',  // plum-500   → Yx/s always plum
  S:   '#D4A017',  // amber-600  → substrate
  X:   '#40916C',  // forest-500 → biomass
}

// ─── Calculation logic ───────────────────────────────────────────────────────
function calcMu(X1, t1, X2, t2) {
  if (X1 <= 0 || X2 <= 0 || t2 <= t1) return null
  return (window.Math.log(X2) - window.Math.log(X1)) / (t2 - t1)
}

function calcTd(mu) {
  if (mu <= 0) return null
  return window.Math.LN2 / mu
}

function calcYxs(X1, X2, S1, S2) {
  const deltaX = X2 - X1
  const deltaS = S1 - S2
  if (deltaS <= 0 || deltaX < 0) return null
  return deltaX / deltaS
}

function calcMultiPointMu(points) {
  const n = points.length
  if (n < 2) return null
  const lnX = points.map(p => window.Math.log(parseFloat(p.X)))
  const t = points.map(p => parseFloat(p.t))
  const sumT = t.reduce((a, b) => a + b, 0)
  const sumLnX = lnX.reduce((a, b) => a + b, 0)
  const sumT2 = t.reduce((a, b) => a + b * b, 0)
  const sumTlnX = t.reduce((a, b, i) => a + b * lnX[i], 0)
  const denom = n * sumT2 - sumT * sumT
  if (window.Math.abs(denom) < 1e-10) return null
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

// ─── Smart Validation ────────────────────────────────────────────────────────
function validate2Point(t1, X1, S1, t2, X2, S2) {
  const warnings = []
  const t1n = parseFloat(t1), t2n = parseFloat(t2)
  const X1n = parseFloat(X1), X2n = parseFloat(X2)
  const S1n = parseFloat(S1), S2n = parseFloat(S2)

  // Empty fields
  if ([t1, X1, S1, t2, X2, S2].some(v => v === '' || isNaN(parseFloat(v)))) {
    warnings.push({ type: 'error', msg: 'Completa todos los campos con valores numéricos.' })
    return warnings
  }

  // Negative values
  if (X1n < 0 || X2n < 0 || S1n < 0 || S2n < 0) {
    warnings.push({ type: 'error', msg: 'Las concentraciones (X, S) no pueden ser negativas.' })
  }

  // Temporal validation
  if (t2n <= t1n) {
    warnings.push({ type: 'error', msg: 't₂ debe ser mayor que t₁ (la fermentación avanza en el tiempo).' })
  }

  // Biomass growth check
  if (X2n <= X1n) {
    warnings.push({ type: 'warn', msg: 'X₂ ≤ X₁: la biomasa no creció. Verifica que estés en la fase exponencial.' })
  }

  // Substrate check
  if (S2n >= S1n) {
    warnings.push({ type: 'warn', msg: 'S₂ ≥ S₁: el sustrato no se consumió. El rendimiento Yx/s no será calculable.' })
  }

  // μ range check
  if (X1n > 0 && X2n > 0 && t2n > t1n) {
    const mu = calcMu(X1n, t1n, X2n, t2n)
    if (mu !== null) {
      if (mu > 2.0) {
        warnings.push({ type: 'warn', msg: `μx = ${mu.toFixed(3)} h⁻¹ es inusualmente alto (>2.0). Verifica las unidades y datos.` })
      } else if (mu < 0.01) {
        warnings.push({ type: 'info', msg: `μx = ${mu.toFixed(4)} h⁻¹ es muy bajo. Podría indicar fase estacionaria o datos fuera de la fase exponencial.` })
      }
    }

    // Yx/s range check
    if (S1n > S2n && X2n > X1n) {
      const Yxs = (X2n - X1n) / (S1n - S2n)
      if (Yxs > 1.0) {
        warnings.push({ type: 'warn', msg: `Yx/s = ${Yxs.toFixed(2)} g/g es >1.0 (inusual). Verifica las concentraciones.` })
      }
    }
  }

  return warnings
}

const EMPTY_POINT = { t: '', X: '', S: '' }

export default function KineticCalculator() {
  const [t1, setT1] = useState('2')
  const [X1, setX1] = useState('0.50')
  const [S1, setS1] = useState('10.0')
  const [t2, setT2] = useState('6')
  const [X2, setX2] = useState('4.00')
  const [S2, setS2] = useState('1.00')

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
  const [mode, setMode] = useState('two')

  const twoPointResults = useMemo(() => {
    const mu = calcMu(parseFloat(X1), parseFloat(t1), parseFloat(X2), parseFloat(t2))
    const td = mu !== null ? calcTd(mu) : null
    const Yxs = calcYxs(parseFloat(X1), parseFloat(X2), parseFloat(S1), parseFloat(S2))
    return { mu, td, Yxs }
  }, [t1, X1, S1, t2, X2, S2])

  const validationWarnings = useMemo(
    () => validate2Point(t1, X1, S1, t2, X2, S2),
    [t1, X1, S1, t2, X2, S2]
  )

  const multiResults = useMemo(() => {
    const validPts = points.filter(p => p.t !== '' && p.X !== '' && parseFloat(p.X) > 0)
    if (validPts.length < 2) return null
    const reg = calcMultiPointMu(validPts)
    const td = reg ? calcTd(reg.mu) : null
    const first = validPts[0], last = validPts[validPts.length - 1]
    const Yxs = first.S !== '' && last.S !== ''
      ? calcYxs(parseFloat(first.X), parseFloat(last.X), parseFloat(first.S), parseFloat(last.S))
      : null
    return { ...reg, td, Yxs }
  }, [points])

  const chartData = useMemo(() => {
    const validPts = points.filter(p => p.t !== '' && p.X !== '' && parseFloat(p.X) > 0)
    const pts = validPts.map(p => ({
      t: parseFloat(p.t),
      lnX: parseFloat(window.Math.log(parseFloat(p.X)).toFixed(4)),
      X: parseFloat(parseFloat(p.X).toFixed(4)),
      S: p.S !== '' ? parseFloat(parseFloat(p.S).toFixed(3)) : null,
    }))
    if (!multiResults) return { pts, regLine: [] }
    const { mu, intercept } = multiResults
    const tMin = window.Math.min(...pts.map(p => p.t))
    const tMax = window.Math.max(...pts.map(p => p.t))
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
          { id: 'two',   label: 'Método 2 Puntos',        desc: 'Cálculo directo' },
          { id: 'multi', label: 'Regresión Multi-Punto',   desc: 'Mayor precisión' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
              mode === m.id
                ? 'bg-forest-600/10 border-forest-600 text-forest-700'
                : 'bg-white border-sage-200 text-sage-500 hover:text-forest-600 hover:border-sage-300'
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
          warnings={validationWarnings}
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

      <FormulaReference />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
function TwoPointCalculator({ t1, X1, S1, t2, X2, S2, setT1, setX1, setS1, setT2, setX2, setS2, results, warnings }) {
  const { mu, td, Yxs } = results
  const isValid = mu !== null && !isNaN(mu)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="bg-white rounded-xl border border-sage-200 p-6">
        <h3 className="font-serif font-semibold text-forest-900 mb-5">Datos Experimentales</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-sage-400 font-semibold uppercase tracking-wide mb-2 block">
              Punto 1 (inicio fase exponencial)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="t₁ (h)" value={t1} onChange={setT1} />
              <InputField label="X₁ (g/L)" value={X1} onChange={setX1} color={COLOR.X} />
              <InputField label="S₁ (g/L)" value={S1} onChange={setS1} color={COLOR.S} />
            </div>
          </div>
          <div>
            <label className="text-xs text-sage-400 font-semibold uppercase tracking-wide mb-2 block">
              Punto 2 (fin fase exponencial)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <InputField label="t₂ (h)" value={t2} onChange={setT2} />
              <InputField label="X₂ (g/L)" value={X2} onChange={setX2} color={COLOR.X} />
              <InputField label="S₂ (g/L)" value={S2} onChange={setS2} color={COLOR.S} />
            </div>
          </div>
        </div>

        {/* Validation warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className={`validation-warning ${w.type}`}>
                <span className="flex-shrink-0">{w.type === 'error' ? '✗' : w.type === 'warn' ? '⚠' : 'ℹ'}</span>
                <span>{w.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Step-by-step calculation with KaTeX */}
        <div className="mt-5 pt-4 border-t border-sage-200">
          <p className="text-xs text-sage-400 font-semibold uppercase mb-3">Cálculo paso a paso</p>
          <div className="space-y-3">
            <div className="rounded-lg border border-sage-200 bg-warm-code p-4">
              <div className="text-xs font-semibold text-forest-600 mb-2">Tasa de crecimiento específico</div>
              <Math tex={String.raw`\mu_x = \frac{\ln(X_2) - \ln(X_1)}{t_2 - t_1}`} display />
              <Math
                tex={String.raw`\mu_x = \frac{\ln(${X2}) - \ln(${X1})}{${t2} - ${t1}}`}
                display
                className="mt-2"
              />
              {isValid && (
                <div className="mt-2 font-semibold" style={{ color: COLOR.mu }}>
                  <Math tex={String.raw`\mu_x = ${mu.toFixed(4)} \;\text{h}^{-1}`} display />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-sage-200 bg-warm-code p-4">
              <div className="text-xs font-semibold" style={{ color: COLOR.td }}>Tiempo de duplicación</div>
              <Math tex={String.raw`t_d = \frac{\ln(2)}{\mu_x} = \frac{0.6931}{\mu_x}`} display className="mt-2" />
              {td && (
                <div className="mt-2 font-semibold" style={{ color: COLOR.td }}>
                  <Math tex={String.raw`t_d = ${td.toFixed(4)} \;\text{h}`} display />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-sage-200 bg-warm-code p-4">
              <div className="text-xs font-semibold" style={{ color: COLOR.Yxs }}>Coeficiente de rendimiento</div>
              <Math tex={String.raw`Y_{x/s} = \frac{\Delta X}{|\Delta S|} = \frac{X_2 - X_1}{S_1 - S_2}`} display className="mt-2" />
              {Yxs && (
                <div className="mt-2 font-semibold" style={{ color: COLOR.Yxs }}>
                  <Math tex={String.raw`Y_{x/s} = \frac{${(parseFloat(X2)-parseFloat(X1)).toFixed(2)}}{${(parseFloat(S1)-parseFloat(S2)).toFixed(2)}} = ${Yxs.toFixed(4)} \;\text{g/g}`} display />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <ResultCard
          label="Tasa de Crecimiento Específico"
          symbol={String.raw`\mu_x`}
          value={isValid ? mu.toFixed(4) : '—'}
          unit="h⁻¹"
          tex={String.raw`\mu_x = \frac{\Delta\ln(X)}{\Delta t}`}
          color={COLOR.mu}
          desc="Fracción de biomasa que se produce por unidad de tiempo. Independiente de la concentración inicial."
          valid={isValid}
        />
        <ResultCard
          label="Tiempo de Duplicación"
          symbol={String.raw`t_d`}
          value={td ? td.toFixed(4) : '—'}
          unit="h"
          tex={String.raw`t_d = \frac{\ln(2)}{\mu_x}`}
          color={COLOR.td}
          desc="Tiempo necesario para que la concentración de biomasa se duplique. Característico del microorganismo y condiciones."
          valid={!!td}
        />
        <ResultCard
          label="Coeficiente de Rendimiento Biomasa/Sustrato"
          symbol={String.raw`Y_{x/s}`}
          value={Yxs ? Yxs.toFixed(4) : '—'}
          unit="g·g⁻¹"
          tex={String.raw`Y_{x/s} = \frac{\Delta X}{\Delta S}`}
          color={COLOR.Yxs}
          desc="Gramos de biomasa producidos por gramo de sustrato consumido. Parámetro clave para el diseño de procesos."
          valid={!!Yxs}
        />

        {/* Quick reference values */}
        <div className="bg-white rounded-xl border border-sage-200 p-4">
          <p className="text-xs font-semibold text-sage-400 uppercase mb-3">Valores de referencia típicos</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['E. coli (aerobio)',   'μmax ≈ 0.4–1.0 h⁻¹', 'Yx/s ≈ 0.40–0.50 g/g'],
              ['S. cerevisiae',       'μmax ≈ 0.2–0.4 h⁻¹', 'Yx/s ≈ 0.45–0.50 g/g'],
              ['Penicillium',        'μmax ≈ 0.03–0.10 h⁻¹','Yx/s ≈ 0.40–0.60 g/g'],
              ['L. lactis (anaer.)', 'μmax ≈ 0.5–0.8 h⁻¹',  'Yx/s ≈ 0.05–0.15 g/g'],
            ].map(([org, muRef, yxs]) => (
              <div key={org} className="bg-warm-alt rounded-lg p-2 border border-sage-200">
                <div className="text-forest-900 font-medium mb-1">{org}</div>
                <div className="font-mono" style={{ color: COLOR.mu }}>{muRef}</div>
                <div className="font-mono" style={{ color: COLOR.Yxs }}>{yxs}</div>
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
        <div className="bg-white rounded-xl border border-sage-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-forest-900 text-sm">Tabla de Datos Experimentales</h3>
            <button
              onClick={addPoint}
              className="text-xs px-3 py-1.5 bg-forest-600/10 border border-forest-600/30 text-forest-600 rounded-lg hover:bg-forest-600/15 transition-all"
            >
              + Añadir fila
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-sage-400 border-b border-sage-200">
                  <th className="pb-2 text-left font-mono">t (h)</th>
                  <th className="pb-2 text-left font-mono" style={{ color: COLOR.X }}>X (g/L)</th>
                  <th className="pb-2 text-left font-mono" style={{ color: COLOR.S }}>S (g/L)</th>
                  <th className="pb-2 text-left font-mono">ln(X)</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={i} className="border-b border-sage-100">
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        value={p.t}
                        onChange={e => updatePoint(i, 't', e.target.value)}
                        className="w-16 bg-warm-alt border border-sage-200 rounded px-2 py-1 text-forest-900 focus:border-forest-600 outline-none"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        value={p.X}
                        onChange={e => updatePoint(i, 'X', e.target.value)}
                        className="w-20 bg-warm-alt border border-sage-200 rounded px-2 py-1 text-forest-900 focus:border-forest-600 outline-none"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        value={p.S}
                        onChange={e => updatePoint(i, 'S', e.target.value)}
                        className="w-20 bg-warm-alt border border-sage-200 rounded px-2 py-1 text-forest-900 focus:border-forest-600 outline-none"
                      />
                    </td>
                    <td className="py-1 pr-2 font-mono text-sage-600">
                      {p.X && parseFloat(p.X) > 0
                        ? window.Math.log(parseFloat(p.X)).toFixed(3)
                        : '—'}
                    </td>
                    <td className="py-1">
                      <button
                        onClick={() => removePoint(i)}
                        disabled={points.length <= 3}
                        className="text-sage-300 hover:text-red-500 disabled:opacity-30 transition-colors"
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
                symbol={String.raw`\mu_x`}
                value={results.mu.toFixed(4)}
                unit="h⁻¹"
                tex={String.raw`\text{pendiente de } \ln(X) \text{ vs } t`}
                color={COLOR.mu}
                desc={`R² = ${results.R2.toFixed(4)} — Bondad de ajuste del modelo lineal.`}
                valid
              />
              <ResultCard
                label="Tiempo de Duplicación"
                symbol={String.raw`t_d`}
                value={results.td.toFixed(4)}
                unit="h"
                tex={String.raw`t_d = \frac{\ln(2)}{\mu_x}`}
                color={COLOR.td}
                desc="Calculado a partir de la pendiente de regresión."
                valid
              />
              {results.Yxs && (
                <ResultCard
                  label="Coeficiente de Rendimiento"
                  symbol={String.raw`Y_{x/s}`}
                  value={results.Yxs.toFixed(4)}
                  unit="g·g⁻¹"
                  tex={String.raw`\frac{\Delta X_{\text{total}}}{\Delta S_{\text{total}}}`}
                  color={COLOR.Yxs}
                  desc="Calculado entre el primer y último punto de datos válidos."
                  valid
                />
              )}
            </>
          )}
          {!isValid && (
            <div className="bg-white border border-sage-200 rounded-xl p-6 text-center text-sage-400 text-sm">
              Ingresa al menos 2 puntos válidos (X &gt; 0) para ver los resultados.
            </div>
          )}
        </div>
      </div>

      {/* ln(X) vs t chart */}
      {chartData.pts.length >= 2 && (
        <div className="bg-white rounded-xl border border-sage-200 p-5">
          <h3 className="text-sm font-serif font-semibold text-forest-900 mb-4">
            Gráfica de Regresión: ln(X) vs t — Linealización Fase Exponencial
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                stroke="#879186"
                tick={{ fill: '#879186', fontSize: 11 }}
                label={{ value: 'Tiempo (h)', position: 'insideBottom', offset: -10, fill: '#879186', fontSize: 12 }}
              />
              <YAxis
                stroke="#879186"
                tick={{ fill: '#879186', fontSize: 11 }}
                label={{ value: 'ln(X)', angle: -90, position: 'insideLeft', offset: 15, fill: '#879186', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid #D8DED4', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: COLOR.mu }}
                itemStyle={{ color: COLOR.mu }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#879186' }} />

              <Line
                data={chartData.pts}
                type="monotone"
                dataKey="lnX"
                name="ln(X) datos"
                stroke={COLOR.mu}
                strokeWidth={0}
                dot={{ r: 5, fill: COLOR.mu, stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                data={chartData.regLine}
                type="monotone"
                dataKey="lnX_reg"
                name="Regresión lineal"
                stroke={COLOR.td}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 3"
              />
            </LineChart>
          </ResponsiveContainer>
          {isValid && (
            <div className="mt-3 text-xs text-sage-500 text-center">
              <Math
                tex={String.raw`\ln(X) = ${results.mu.toFixed(4)} \cdot t + (${results.intercept.toFixed(4)}) \quad|\quad R^2 = ${results.R2.toFixed(4)}`}
                className="text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
function ResultCard({ label, symbol, value, unit, tex, color, desc, valid }) {
  return (
    <div
      className={`bio-card rounded-xl border p-4 bg-white transition-all ${valid ? '' : 'opacity-60'}`}
      style={{ borderColor: valid ? `${color}44` : '#D8DED4' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-xs text-sage-400 mb-1">{label}</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono font-bold text-xl" style={{ color }}>
              {value}
            </span>
            <span className="text-sm text-sage-400 font-mono">{unit}</span>
          </div>
          <div className="text-xs text-sage-400 mt-1">
            <Math tex={tex} />
          </div>
        </div>
        <div
          className="px-3 py-2 rounded-lg"
          style={{ color, backgroundColor: `${color}10` }}
        >
          <Math tex={symbol} className="text-lg" />
        </div>
      </div>
      {desc && <p className="text-xs text-sage-400 mt-2 border-t border-sage-100 pt-2">{desc}</p>}
    </div>
  )
}

function InputField({ label, value, onChange, color }) {
  return (
    <div>
      <label className="text-xs text-sage-400 mb-1 block font-mono" style={color ? { color } : {}}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        step="0.01"
        className="w-full bg-warm-alt border border-sage-200 rounded-lg px-3 py-2 text-sm text-forest-900 focus:border-forest-600 focus:outline-none font-mono"
      />
    </div>
  )
}

function FormulaReference() {
  return (
    <div className="bg-white border border-forest-600/15 rounded-xl p-6">
      <h3 className="font-serif font-bold text-forest-900 mb-5">Marco Teórico de las Ecuaciones</h3>
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <div className="font-semibold text-sm mb-2" style={{ color: COLOR.mu }}>
            Tasa de Crecimiento Específico (μx)
          </div>
          <Math tex={String.raw`\mu_x = \frac{d(\ln X)}{dt}`} display className="mb-2" />
          <p className="text-xs text-sage-500 mt-2 leading-relaxed">
            Definición diferencial. Para la fase exponencial, μx = μmax (sustrato en exceso).
            Unidades: h⁻¹ o d⁻¹.
          </p>
          <Math tex={String.raw`\mu_x = \frac{\ln(X_2/X_1)}{t_2 - t_1}`} display className="mt-3" />
          <p className="text-xs text-sage-400 mt-1">Forma discreta (2 puntos).</p>
        </div>
        <div>
          <div className="font-semibold text-sm mb-2" style={{ color: COLOR.td }}>
            Tiempo de Duplicación (td)
          </div>
          <Math tex={String.raw`t_d = \frac{\ln(2)}{\mu_x} \approx \frac{0.693}{\mu_x}`} display className="mb-2" />
          <p className="text-xs text-sage-500 mt-2 leading-relaxed">
            Tiempo para que X se duplique. También llamado tiempo de generación (g).
            Válido solo durante la fase exponencial.
          </p>
          <Math tex={String.raw`N(t) = N_0 \cdot 2^{t/t_d}`} display className="mt-3" />
          <p className="text-xs text-sage-400 mt-1">Crecimiento en número de células.</p>
        </div>
        <div>
          <div className="font-semibold text-sm mb-2" style={{ color: COLOR.Yxs }}>
            Coeficiente de Rendimiento (Yx/s)
          </div>
          <Math tex={String.raw`Y_{x/s} = -\frac{dX}{dS} = \frac{\Delta X}{|\Delta S|}`} display className="mb-2" />
          <p className="text-xs text-sage-500 mt-2 leading-relaxed">
            Relación estequiométrica entre biomasa producida y sustrato consumido.
            El signo negativo refleja que S decrece al crecer X.
          </p>
          <Math tex={String.raw`Y_{p/s} = \frac{\Delta P}{|\Delta S|}`} display className="mt-3" />
          <p className="text-xs text-sage-400 mt-1">Rendimiento en producto (análogo).</p>
        </div>
      </div>
    </div>
  )
}

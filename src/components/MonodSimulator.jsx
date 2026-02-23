import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  ScatterChart, Scatter,
} from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── Model calculations ───────────────────────────────────────────────────────
function monod(S, muMax, Ks) {
  return (muMax * S) / (Ks + S)
}

function generateMonodCurve(muMax, Ks, Smax = 10) {
  const data = []
  for (let S = 0; S <= Smax; S += Smax / 200) {
    data.push({
      S: parseFloat(S.toFixed(3)),
      mu: parseFloat(monod(S, muMax, Ks).toFixed(5)),
      muHalf: parseFloat((muMax / 2).toFixed(5)),
    })
  }
  return data
}

// Lineweaver-Burk: 1/μ = (Ks/μmax)(1/S) + 1/μmax
function generateLBData(muMax, Ks) {
  const data = []
  // Experimental-looking points with slight scatter
  const Svals = [0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 8.0]
  Svals.forEach(S => {
    const mu_true = monod(S, muMax, Ks)
    // Add tiny simulated noise ±2%
    const noise = (Math.random() - 0.5) * 0.04 * mu_true
    const mu_obs = mu_true + noise
    data.push({
      invS: parseFloat((1 / S).toFixed(4)),
      invMu: parseFloat((1 / mu_obs).toFixed(4)),
      S,
    })
  })
  data.sort((a, b) => a.invS - b.invS)
  return data
}

// LB regression line
function generateLBLine(muMax, Ks) {
  const slope = Ks / muMax
  const intercept = 1 / muMax
  const data = []
  for (let invS = -1 / Ks - 0.5; invS <= 6; invS += 0.1) {
    const invMu = slope * invS + intercept
    if (invMu > 0 && invMu < 50) {
      data.push({
        invS: parseFloat(invS.toFixed(3)),
        invMu_line: parseFloat(invMu.toFixed(4)),
      })
    }
  }
  return data
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const MonodTooltip = ({ active, payload, muMax, Ks }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="custom-tooltip">
      <div className="font-mono text-xs text-slate-400">S = {d.S?.toFixed(3)} g·L⁻¹</div>
      <div className="text-emerald-400 font-semibold font-mono">μ = {d.mu?.toFixed(4)} h⁻¹</div>
      <div className="text-xs text-slate-400 mt-1">
        μ/μmax = {d.mu && muMax ? (d.mu / muMax * 100).toFixed(1) : '—'}%
      </div>
      {d.S && Ks && (
        <div className="text-xs text-slate-500 mt-1">
          S/Ks = {(d.S / Ks).toFixed(2)}
        </div>
      )}
    </div>
  )
}

const LBTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="custom-tooltip">
      <div className="font-mono text-xs text-slate-400">1/S = {d.invS?.toFixed(3)} L·g⁻¹</div>
      <div className="text-cyan-400 font-semibold font-mono">1/μ = {d.invMu?.toFixed(4)} h</div>
      <div className="text-xs text-slate-400 mt-1">S = {d.S?.toFixed(2)} g/L</div>
    </div>
  )
}

export default function MonodSimulator() {
  const [muMax, setMuMax] = useState(0.50)
  const [Ks, setKs] = useState(0.20)
  const [view, setView] = useState('monod') // 'monod' | 'lb'
  const [Smax, setSmax] = useState(5)
  const [showAnnotations, setShowAnnotations] = useState(true)

  const monodData = useMemo(
    () => generateMonodCurve(muMax, Ks, Smax),
    [muMax, Ks, Smax]
  )
  const lbData = useMemo(() => generateLBData(muMax, Ks), [muMax, Ks])
  const lbLine = useMemo(() => generateLBLine(muMax, Ks), [muMax, Ks])

  const muHalf = (muMax / 2).toFixed(4)
  const halfSat_S = Ks
  const halfSat_mu = (muMax / 2).toFixed(4)

  // Derived LB parameters
  const lb_slope = (Ks / muMax).toFixed(4)
  const lb_int_y = (1 / muMax).toFixed(4)
  const lb_int_x = (-1 / Ks).toFixed(4)

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="MÓDULO 4 · MODELO DE MONOD"
        title="Simulador del Modelo de Monod"
        sub="Ajusta los parámetros cinéticos con los sliders y observa en tiempo real el efecto sobre la curva de velocidad de crecimiento vs concentración de sustrato."
      />

      {/* ─── Parameter Controls ─── */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="font-semibold text-white mb-1">Parámetros Cinéticos de Monod</h3>
        <p className="text-xs text-slate-500 mb-5">
          Ajusta los parámetros del modelo: la curva se actualiza en tiempo real.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          {/* μmax */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">
                μ<sub>max</sub>
              </label>
              <span className="font-mono font-bold text-emerald-400 text-lg">
                {muMax.toFixed(2)} h⁻¹
              </span>
            </div>
            <input
              type="range" min="0.05" max="2.00" step="0.01"
              value={muMax}
              onChange={e => setMuMax(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Velocidad de crecimiento máxima. Asíntota superior de la curva.
              Rango típico: 0.05–2.0 h⁻¹.
            </p>
          </div>

          {/* Ks */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">
                K<sub>s</sub>
              </label>
              <span className="font-mono font-bold text-cyan-400 text-lg">
                {Ks.toFixed(3)} g·L⁻¹
              </span>
            </div>
            <input
              type="range" min="0.005" max="2.0" step="0.005"
              value={Ks}
              onChange={e => setKs(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Constante de semisaturación. S cuando μ = μmax/2.
              Indica afinidad por el sustrato. Rango: 0.001–2.0 g/L.
            </p>
          </div>

          {/* Smax */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">S<sub>max</sub> (eje)</label>
              <span className="font-mono font-bold text-violet-400 text-lg">{Smax} g·L⁻¹</span>
            </div>
            <input
              type="range" min="1" max="20" step="0.5"
              value={Smax}
              onChange={e => setSmax(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Rango del eje de sustrato para la visualización.
            </p>
          </div>
        </div>

        {/* Derived parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-700">
          {[
            { label: 'μmax/2', val: halfSat_mu, unit: 'h⁻¹', color: '#22c55e' },
            { label: 'Ks (= S @ μmax/2)', val: halfSat_S.toFixed(3), unit: 'g/L', color: '#06b6d4' },
            { label: 'Pendiente LB (Ks/μmax)', val: lb_slope, unit: '', color: '#a855f7' },
            { label: 'Intercep. Y LB (1/μmax)', val: lb_int_y, unit: 'h', color: '#f59e0b' },
          ].map(p => (
            <div key={p.label} className="text-center bg-slate-900 rounded-lg p-3">
              <div className="font-mono font-bold" style={{ color: p.color }}>
                {p.val} <span className="text-xs text-slate-500">{p.unit}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── View Toggle ─── */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('monod')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            view === 'monod'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          Curva de Monod (μ vs S)
        </button>
        <button
          onClick={() => setView('lb')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            view === 'lb'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          Linealización Lineweaver-Burk (1/μ vs 1/S)
        </button>
        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={showAnnotations}
            onChange={e => setShowAnnotations(e.target.checked)}
            className="accent-emerald-500"
          />
          <span className="text-sm text-slate-300">Anotaciones</span>
        </label>
      </div>

      {/* ─── Monod Chart ─── */}
      {view === 'monod' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-white">
              Ecuación de Monod: μ = μmax · S / (Ks + S)
            </h3>
            <div className="font-mono text-xs text-slate-500">
              μmax={muMax} h⁻¹  |  Ks={Ks} g/L
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Comportamiento hiperbólico análogo a la cinética de Michaelis-Menten enzimática.
          </p>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={monodData} margin={{ top: 10, right: 30, bottom: 25, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

              {showAnnotations && (
                <>
                  {/* μmax/2 horizontal */}
                  <ReferenceLine
                    y={muMax / 2}
                    stroke="#06b6d4"
                    strokeDasharray="5 5"
                    strokeOpacity={0.7}
                    label={{ value: `μmax/2 = ${(muMax/2).toFixed(2)}`, position: 'insideRight', fill: '#06b6d4', fontSize: 10 }}
                  />
                  {/* Ks vertical */}
                  <ReferenceLine
                    x={Ks}
                    stroke="#06b6d4"
                    strokeDasharray="5 5"
                    strokeOpacity={0.7}
                    label={{ value: `Ks = ${Ks}`, position: 'insideTopRight', fill: '#06b6d4', fontSize: 10 }}
                  />
                  {/* μmax asymptote */}
                  <ReferenceLine
                    y={muMax}
                    stroke="#22c55e"
                    strokeDasharray="8 4"
                    strokeOpacity={0.5}
                    label={{ value: `μmax = ${muMax}`, position: 'insideTopLeft', fill: '#22c55e', fontSize: 10 }}
                  />
                </>
              )}

              <XAxis
                dataKey="S"
                type="number"
                domain={[0, Smax]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'Concentración de sustrato S (g·L⁻¹)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                domain={[0, muMax * 1.1]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: 'μ (h⁻¹)', angle: -90, position: 'insideLeft', offset: 20, fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip content={<MonodTooltip muMax={muMax} Ks={Ks} />} />

              <Line
                type="monotone"
                dataKey="mu"
                name="μ (Monod)"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: '#22c55e' }}
              />
            </LineChart>
          </ResponsiveContainer>

          {showAnnotations && (
            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
              <AnnotationBox color="#22c55e" title="Zona S ≪ Ks (primer orden)">
                μ ≈ (μmax/Ks) · S → lineal. El sustrato es limitante y cualquier incremento aumenta μ significativamente.
              </AnnotationBox>
              <AnnotationBox color="#06b6d4" title="Zona S = Ks (semisaturación)">
                μ = μmax/2. Punto de inflexión clave para estimar Ks experimentalmente.
              </AnnotationBox>
              <AnnotationBox color="#f59e0b" title="Zona S ≫ Ks (orden cero)">
                μ ≈ μmax. El sustrato no es limitante; μ se satura. Añadir más S no mejora la cinética.
              </AnnotationBox>
            </div>
          )}
        </div>
      )}

      {/* ─── Lineweaver-Burk Chart ─── */}
      {view === 'lb' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="mb-1">
            <h3 className="text-sm font-semibold text-white">
              Gráfica de Lineweaver-Burk: 1/μ = (Ks/μmax)·(1/S) + 1/μmax
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Doble recíproco que linealiza la ecuación de Monod para estimar μmax y Ks gráficamente.
            Los puntos simulan datos experimentales con ~2% de ruido.
          </p>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart margin={{ top: 10, right: 30, bottom: 25, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

              {showAnnotations && (
                <>
                  {/* y-intercept */}
                  <ReferenceLine
                    y={1 / muMax}
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                    strokeOpacity={0.6}
                    label={{ value: `1/μmax = ${lb_int_y}`, position: 'insideRight', fill: '#22c55e', fontSize: 10 }}
                  />
                  {/* x-intercept */}
                  <ReferenceLine
                    x={-1 / Ks}
                    stroke="#06b6d4"
                    strokeDasharray="5 5"
                    strokeOpacity={0.6}
                    label={{ value: `−1/Ks = ${lb_int_x}`, position: 'insideTopRight', fill: '#06b6d4', fontSize: 10 }}
                  />
                </>
              )}

              <XAxis
                dataKey="invS"
                type="number"
                domain={['dataMin - 0.5', 'dataMax + 0.2']}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: '1/S (L·g⁻¹)', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, 'auto']}
                label={{ value: '1/μ (h)', angle: -90, position: 'insideLeft', offset: 20, fill: '#64748b', fontSize: 12 }}
              />
              <Tooltip content={<LBTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />

              {/* Regression line */}
              <Line
                data={lbLine}
                type="linear"
                dataKey="invMu_line"
                name="Regresión LB"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
              />
              {/* Data scatter */}
              <Line
                data={lbData}
                type="linear"
                dataKey="invMu"
                name="Datos 1/μ"
                stroke="#22c55e"
                strokeWidth={0}
                dot={{ r: 5, fill: '#22c55e', stroke: '#0f172a', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* LB equations */}
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
              <div className="text-slate-500 text-xs mb-2">// Ecuación de la recta</div>
              <div className="text-cyan-400">1/μ = ({lb_slope}) · (1/S) + ({lb_int_y})</div>
              <div className="text-slate-500 text-xs mt-3 mb-1">// Parámetros estimados</div>
              <div className="text-emerald-400">μmax = 1/intercepto_y = {muMax.toFixed(3)} h⁻¹</div>
              <div className="text-emerald-400">Ks = pendiente × μmax = {Ks.toFixed(3)} g/L</div>
            </div>
            <div className="space-y-2">
              <div className="bg-slate-900 rounded-lg p-3 text-xs">
                <div className="text-violet-400 font-semibold mb-1">Intersección eje Y</div>
                <div className="font-mono text-slate-300">1/μ cuando 1/S → 0 (S → ∞)</div>
                <div className="font-mono text-emerald-400">= 1/μmax = {lb_int_y} h</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 text-xs">
                <div className="text-cyan-400 font-semibold mb-1">Intersección eje X</div>
                <div className="font-mono text-slate-300">1/S cuando 1/μ = 0</div>
                <div className="font-mono text-cyan-400">= −1/Ks = {lb_int_x} L/g</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300">
                ⚠ El gráfico LB amplia el error experimental en las regiones de bajo S (alta 1/S).
                Preferir métodos no lineales de estimación (Marquardt-Levenberg) en la práctica.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Theory Box ─── */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="font-bold text-white mb-4">Base Teórica del Modelo de Monod</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              El modelo propuesto por <strong className="text-white">Jacques Monod (1949)</strong> describe
              la dependencia de la tasa de crecimiento específico con la concentración del sustrato
              limitante. Es empírico —no mecanístico— pero constituye el fundamento de la cinética
              microbiana aplicada.
            </p>
            <div className="formula-block text-base">
              μ = μmax · S / (Ks + S)
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-400">
              <p><strong className="text-slate-300">μ</strong>: tasa de crecimiento específico (h⁻¹)</p>
              <p><strong className="text-slate-300">μmax</strong>: tasa máxima (sustrato no limitante)</p>
              <p><strong className="text-slate-300">S</strong>: concentración del sustrato limitante (g/L)</p>
              <p><strong className="text-slate-300">Ks</strong>: constante de semisaturación (g/L) — S para μ = μmax/2</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-3">
              <strong className="text-white">Casos límite:</strong>
            </p>
            <div className="space-y-2 font-mono text-xs bg-slate-900 rounded-lg p-4">
              <div className="text-slate-500">{'// Orden 1 (S << Ks):'}</div>
              <div className="text-emerald-400">μ ≈ (μmax/Ks) · S</div>
              <div className="text-slate-500 mt-2">{'// Semisaturación (S = Ks):'}</div>
              <div className="text-cyan-400">μ = μmax/2</div>
              <div className="text-slate-500 mt-2">{'// Orden 0 (S >> Ks):'}</div>
              <div className="text-violet-400">μ ≈ μmax (saturado)</div>
              <div className="text-slate-500 mt-3">{'// Balance de masa biomasa:'}</div>
              <div className="text-amber-400">dX/dt = (μ − kd) · X</div>
              <div className="text-amber-400">dS/dt = −(μ/Yx/s) · X − ms·X</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnnotationBox({ color, title, children }) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{ borderColor: `${color}33`, backgroundColor: `${color}0d` }}
    >
      <div className="font-semibold mb-1" style={{ color }}>{title}</div>
      <div className="text-slate-400 leading-relaxed">{children}</div>
    </div>
  )
}

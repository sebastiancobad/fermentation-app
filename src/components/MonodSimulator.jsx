import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { SectionHeader } from './Dashboard'
import Math from './Math'

// ─── Audit-compliant colors ──────────────────────────────────────────────────
const COLOR = {
  mu:    '#2D6A4F',  // forest-600 — main curve / μ
  ks:    '#1B4965',  // navy-500   — Ks references
  amber: '#D4A017',  // amber-600  — saturation zone
  plum:  '#7B2D8E',  // plum-500   — LB slope
  grid:  '#D8DED4',
  tick:  '#879186',
  axis:  '#879186',
}

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
    })
  }
  return data
}

function generateLBData(muMax, Ks) {
  const data = []
  const Svals = [0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0, 3.0, 5.0, 8.0]
  Svals.forEach(S => {
    const mu_true = monod(S, muMax, Ks)
    const noise = (window.Math.random() - 0.5) * 0.04 * mu_true
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

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const MonodTooltip = ({ active, payload, muMax, Ks }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="custom-tooltip">
      <div className="font-mono text-xs text-sage-400">S = {d.S?.toFixed(3)} g·L⁻¹</div>
      <div className="font-semibold font-mono" style={{ color: COLOR.mu }}>μ = {d.mu?.toFixed(4)} h⁻¹</div>
      <div className="text-xs text-sage-500 mt-1">
        μ/μmax = {d.mu && muMax ? (d.mu / muMax * 100).toFixed(1) : '—'}%
      </div>
      {d.S && Ks && (
        <div className="text-xs text-sage-400 mt-1">
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
      <div className="font-mono text-xs text-sage-400">1/S = {d.invS?.toFixed(3)} L·g⁻¹</div>
      <div className="font-semibold font-mono" style={{ color: COLOR.ks }}>1/μ = {d.invMu?.toFixed(4)} h</div>
      <div className="text-xs text-sage-500 mt-1">S = {d.S?.toFixed(2)} g/L</div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MonodSimulator() {
  const [muMax, setMuMax] = useState(0.50)
  const [Ks, setKs] = useState(0.20)
  const [view, setView] = useState('monod')
  const [Smax, setSmax] = useState(5)
  const [showAnnotations, setShowAnnotations] = useState(true)

  const monodData = useMemo(
    () => generateMonodCurve(muMax, Ks, Smax),
    [muMax, Ks, Smax]
  )
  const lbData  = useMemo(() => generateLBData(muMax, Ks), [muMax, Ks])
  const lbLine  = useMemo(() => generateLBLine(muMax, Ks), [muMax, Ks])

  const halfSat_mu = (muMax / 2).toFixed(4)
  const lb_slope   = (Ks / muMax).toFixed(4)
  const lb_int_y   = (1 / muMax).toFixed(4)
  const lb_int_x   = (-1 / Ks).toFixed(4)

  return (
    <div className="space-y-8">
      <SectionHeader
        tag="MÓDULO 4 · MODELO DE MONOD"
        title="Simulador del Modelo de Monod"
        sub="Ajusta los parámetros cinéticos con los sliders y observa en tiempo real el efecto sobre la curva de velocidad de crecimiento vs concentración de sustrato."
      />

      {/* ─── Parameter Controls ─── */}
      <div className="bg-white rounded-xl border border-sage-200 p-6">
        <h3 className="font-serif font-semibold text-forest-900 mb-1">Parámetros Cinéticos de Monod</h3>
        <p className="text-xs text-sage-400 mb-5">
          Ajusta los parámetros del modelo: la curva se actualiza en tiempo real.
        </p>
        <div className="grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium" style={{ color: COLOR.mu }}>
                <Math tex={String.raw`\mu_{\max}`} />
              </label>
              <span className="font-mono font-bold text-lg" style={{ color: COLOR.mu }}>
                {muMax.toFixed(2)} h⁻¹
              </span>
            </div>
            <input
              type="range" min="0.05" max="2.00" step="0.01"
              value={muMax}
              onChange={e => setMuMax(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-sage-400 mt-1">
              Velocidad de crecimiento máxima. Asíntota superior de la curva.
              Rango típico: 0.05–2.0 h⁻¹.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium" style={{ color: COLOR.ks }}>
                <Math tex={String.raw`K_s`} />
              </label>
              <span className="font-mono font-bold text-lg" style={{ color: COLOR.ks }}>
                {Ks.toFixed(3)} g·L⁻¹
              </span>
            </div>
            <input
              type="range" min="0.005" max="2.0" step="0.005"
              value={Ks}
              onChange={e => setKs(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-sage-400 mt-1">
              Constante de semisaturación. S cuando μ = μmax/2.
              Indica afinidad por el sustrato. Rango: 0.001–2.0 g/L.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium" style={{ color: COLOR.amber }}>
                <Math tex={String.raw`S_{\max}`} /> (eje)
              </label>
              <span className="font-mono font-bold text-lg" style={{ color: COLOR.amber }}>{Smax} g·L⁻¹</span>
            </div>
            <input
              type="range" min="1" max="20" step="0.5"
              value={Smax}
              onChange={e => setSmax(parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-sage-400 mt-1">
              Rango del eje de sustrato para la visualización.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-sage-200">
          {[
            { label: 'μmax/2', val: halfSat_mu, unit: 'h⁻¹', color: COLOR.mu },
            { label: 'Ks (= S @ μmax/2)', val: Ks.toFixed(3), unit: 'g/L', color: COLOR.ks },
            { label: 'Pendiente LB (Ks/μmax)', val: lb_slope, unit: '', color: COLOR.plum },
            { label: 'Intercep. Y LB (1/μmax)', val: lb_int_y, unit: 'h', color: COLOR.amber },
          ].map(p => (
            <div key={p.label} className="text-center bg-warm-alt rounded-lg p-3 border border-sage-200">
              <div className="font-mono font-bold" style={{ color: p.color }}>
                {p.val} <span className="text-xs text-sage-400">{p.unit}</span>
              </div>
              <div className="text-xs text-sage-500 mt-1">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── View Toggle ─── */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setView('monod')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            view === 'monod'
              ? 'bg-forest-600/10 border-forest-600 text-forest-700'
              : 'bg-white border-sage-200 text-sage-500 hover:text-forest-600 hover:border-sage-300'
          }`}
        >
          Curva de Monod (μ vs S)
        </button>
        <button
          onClick={() => setView('lb')}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
            view === 'lb'
              ? 'bg-navy-500/10 border-navy-500 text-navy-500'
              : 'bg-white border-sage-200 text-sage-500 hover:text-navy-500 hover:border-sage-300'
          }`}
        >
          Linealización Lineweaver-Burk (1/μ vs 1/S)
        </button>
        <label className="flex items-center gap-2 ml-auto cursor-pointer">
          <input
            type="checkbox"
            checked={showAnnotations}
            onChange={e => setShowAnnotations(e.target.checked)}
            className="accent-forest-600"
          />
          <span className="text-sm text-sage-600">Anotaciones</span>
        </label>
      </div>

      {/* ─── Monod Chart ─── */}
      {view === 'monod' && (
        <div className="bg-white rounded-xl border border-sage-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-serif font-semibold text-forest-900">
              Ecuación de Monod: <Math tex={String.raw`\mu = \mu_{\max} \cdot \frac{S}{K_s + S}`} />
            </h3>
            <div className="font-mono text-xs text-sage-400">
              μmax={muMax} h⁻¹  |  Ks={Ks} g/L
            </div>
          </div>
          <p className="text-xs text-sage-400 mb-4">
            Comportamiento hiperbólico análogo a la cinética de Michaelis-Menten enzimática.
          </p>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={monodData} margin={{ top: 10, right: 30, bottom: 25, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLOR.grid} />

              {showAnnotations && (
                <>
                  <ReferenceLine
                    y={muMax / 2}
                    stroke={COLOR.ks}
                    strokeDasharray="5 5"
                    strokeOpacity={0.7}
                    label={{ value: `μmax/2 = ${(muMax/2).toFixed(2)}`, position: 'insideRight', fill: COLOR.ks, fontSize: 10 }}
                  />
                  <ReferenceLine
                    x={Ks}
                    stroke={COLOR.ks}
                    strokeDasharray="5 5"
                    strokeOpacity={0.7}
                    label={{ value: `Ks = ${Ks}`, position: 'insideTopRight', fill: COLOR.ks, fontSize: 10 }}
                  />
                  <ReferenceLine
                    y={muMax}
                    stroke={COLOR.mu}
                    strokeDasharray="8 4"
                    strokeOpacity={0.5}
                    label={{ value: `μmax = ${muMax}`, position: 'insideTopLeft', fill: COLOR.mu, fontSize: 10 }}
                  />
                </>
              )}

              <XAxis
                dataKey="S"
                type="number"
                domain={[0, Smax]}
                stroke={COLOR.axis}
                tick={{ fill: COLOR.tick, fontSize: 11 }}
                label={{ value: 'Concentración de sustrato S (g·L⁻¹)', position: 'insideBottom', offset: -12, fill: COLOR.axis, fontSize: 12 }}
              />
              <YAxis
                domain={[0, muMax * 1.1]}
                stroke={COLOR.axis}
                tick={{ fill: COLOR.tick, fontSize: 11 }}
                label={{ value: 'μ (h⁻¹)', angle: -90, position: 'insideLeft', offset: 20, fill: COLOR.axis, fontSize: 12 }}
              />
              <Tooltip content={<MonodTooltip muMax={muMax} Ks={Ks} />} />

              <Line
                type="monotone"
                dataKey="mu"
                name="μ (Monod)"
                stroke={COLOR.mu}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: COLOR.mu }}
              />
            </LineChart>
          </ResponsiveContainer>

          {showAnnotations && (
            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-xs">
              <AnnotationBox color={COLOR.mu} title="Zona S ≪ Ks (primer orden)">
                μ ≈ (μmax/Ks) · S → lineal. El sustrato es limitante y cualquier incremento aumenta μ significativamente.
              </AnnotationBox>
              <AnnotationBox color={COLOR.ks} title="Zona S = Ks (semisaturación)">
                μ = μmax/2. Punto de inflexión clave para estimar Ks experimentalmente.
              </AnnotationBox>
              <AnnotationBox color={COLOR.amber} title="Zona S ≫ Ks (orden cero)">
                μ ≈ μmax. El sustrato no es limitante; μ se satura. Añadir más S no mejora la cinética.
              </AnnotationBox>
            </div>
          )}
        </div>
      )}

      {/* ─── Lineweaver-Burk Chart ─── */}
      {view === 'lb' && (
        <div className="bg-white rounded-xl border border-sage-200 p-5">
          <div className="mb-1">
            <h3 className="text-sm font-serif font-semibold text-forest-900">
              Gráfica de Lineweaver-Burk: <Math tex={String.raw`\frac{1}{\mu} = \frac{K_s}{\mu_{\max}} \cdot \frac{1}{S} + \frac{1}{\mu_{\max}}`} />
            </h3>
          </div>
          <p className="text-xs text-sage-400 mb-4">
            Doble recíproco que linealiza la ecuación de Monod para estimar μmax y Ks gráficamente.
            Los puntos simulan datos experimentales con ~2% de ruido.
          </p>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart margin={{ top: 10, right: 30, bottom: 25, left: 15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLOR.grid} />

              {showAnnotations && (
                <>
                  <ReferenceLine
                    y={1 / muMax}
                    stroke={COLOR.mu}
                    strokeDasharray="5 5"
                    strokeOpacity={0.6}
                    label={{ value: `1/μmax = ${lb_int_y}`, position: 'insideRight', fill: COLOR.mu, fontSize: 10 }}
                  />
                  <ReferenceLine
                    x={-1 / Ks}
                    stroke={COLOR.ks}
                    strokeDasharray="5 5"
                    strokeOpacity={0.6}
                    label={{ value: `−1/Ks = ${lb_int_x}`, position: 'insideTopRight', fill: COLOR.ks, fontSize: 10 }}
                  />
                </>
              )}

              <XAxis
                dataKey="invS"
                type="number"
                domain={['dataMin - 0.5', 'dataMax + 0.2']}
                stroke={COLOR.axis}
                tick={{ fill: COLOR.tick, fontSize: 11 }}
                label={{ value: '1/S (L·g⁻¹)', position: 'insideBottom', offset: -12, fill: COLOR.axis, fontSize: 12 }}
              />
              <YAxis
                stroke={COLOR.axis}
                tick={{ fill: COLOR.tick, fontSize: 11 }}
                domain={[0, 'auto']}
                label={{ value: '1/μ (h)', angle: -90, position: 'insideLeft', offset: 20, fill: COLOR.axis, fontSize: 12 }}
              />
              <Tooltip content={<LBTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#879186' }} />

              <Line
                data={lbLine}
                type="linear"
                dataKey="invMu_line"
                name="Regresión LB"
                stroke={COLOR.ks}
                strokeWidth={2}
                dot={false}
              />
              <Line
                data={lbData}
                type="linear"
                dataKey="invMu"
                name="Datos 1/μ"
                stroke={COLOR.mu}
                strokeWidth={0}
                dot={{ r: 5, fill: COLOR.mu, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <div className="bg-warm-code rounded-lg p-4 border border-sage-200">
              <div className="text-xs font-semibold text-forest-600 mb-2">Ecuación de la recta</div>
              <Math tex={String.raw`\frac{1}{\mu} = (${lb_slope}) \cdot \frac{1}{S} + (${lb_int_y})`} display />
              <div className="mt-3 text-xs text-sage-500 space-y-1">
                <div><Math tex={String.raw`\mu_{\max} = \frac{1}{\text{intercepto}_y} = ${muMax.toFixed(3)} \;\text{h}^{-1}`} /></div>
                <div><Math tex={String.raw`K_s = \text{pendiente} \times \mu_{\max} = ${Ks.toFixed(3)} \;\text{g/L}`} /></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-warm-alt rounded-lg p-3 text-xs border border-sage-200">
                <div className="font-semibold mb-1" style={{ color: COLOR.plum }}>Intersección eje Y</div>
                <div className="text-sage-500">1/μ cuando 1/S → 0 (S → ∞)</div>
                <div className="font-mono mt-1" style={{ color: COLOR.mu }}>= 1/μmax = {lb_int_y} h</div>
              </div>
              <div className="bg-warm-alt rounded-lg p-3 text-xs border border-sage-200">
                <div className="font-semibold mb-1" style={{ color: COLOR.ks }}>Intersección eje X</div>
                <div className="text-sage-500">1/S cuando 1/μ = 0</div>
                <div className="font-mono mt-1" style={{ color: COLOR.ks }}>= −1/Ks = {lb_int_x} L/g</div>
              </div>
              <div className="validation-warning warn">
                <span>⚠</span>
                <span>El gráfico LB amplía el error experimental en las regiones de bajo S (alta 1/S).
                Preferir métodos no lineales de estimación (Marquardt-Levenberg) en la práctica.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Theory Box ─── */}
      <div className="bg-white border border-forest-600/15 rounded-xl p-6">
        <h3 className="font-serif font-bold text-forest-900 mb-4">Base Teórica del Modelo de Monod</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-sage-500 leading-relaxed mb-4">
              El modelo propuesto por <strong className="text-forest-900">Jacques Monod (1949)</strong> describe
              la dependencia de la tasa de crecimiento específico con la concentración del sustrato
              limitante. Es empírico —no mecanístico— pero constituye el fundamento de la cinética
              microbiana aplicada.
            </p>
            <Math tex={String.raw`\mu = \mu_{\max} \cdot \frac{S}{K_s + S}`} display />
            <div className="mt-3 space-y-2 text-xs text-sage-500">
              <p><strong style={{ color: COLOR.mu }}>μ</strong>: tasa de crecimiento específico (h⁻¹)</p>
              <p><strong style={{ color: COLOR.mu }}>μmax</strong>: tasa máxima (sustrato no limitante)</p>
              <p><strong style={{ color: COLOR.amber }}>S</strong>: concentración del sustrato limitante (g/L)</p>
              <p><strong style={{ color: COLOR.ks }}>Ks</strong>: constante de semisaturación (g/L) — S para μ = μmax/2</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-sage-500 mb-3">
              <strong className="text-forest-900">Casos límite:</strong>
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border border-sage-200 bg-warm-code p-4">
                <div className="text-xs font-semibold text-forest-600 mb-2">Orden 1 (S ≪ Ks)</div>
                <Math tex={String.raw`\mu \approx \frac{\mu_{\max}}{K_s} \cdot S`} display />
              </div>
              <div className="rounded-lg border border-sage-200 bg-warm-code p-4">
                <div className="text-xs font-semibold" style={{ color: COLOR.ks }}>Semisaturación (S = Ks)</div>
                <Math tex={String.raw`\mu = \frac{\mu_{\max}}{2}`} display />
              </div>
              <div className="rounded-lg border border-sage-200 bg-warm-code p-4">
                <div className="text-xs font-semibold" style={{ color: COLOR.amber }}>Orden 0 (S ≫ Ks)</div>
                <Math tex={String.raw`\mu \approx \mu_{\max} \;\text{(saturado)}`} display />
              </div>
              <div className="rounded-lg border border-sage-200 bg-warm-code p-4">
                <div className="text-xs font-semibold" style={{ color: COLOR.plum }}>Balance de masa biomasa</div>
                <Math tex={String.raw`\frac{dX}{dt} = (\mu - k_d) \cdot X`} display />
                <Math tex={String.raw`\frac{dS}{dt} = -\frac{\mu}{Y_{x/s}} \cdot X - m_s \cdot X`} display className="mt-1" />
              </div>
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
      <div className="font-semibold mb-1 text-xs" style={{ color }}>{title}</div>
      <div className="text-sage-500 leading-relaxed">{children}</div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
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
    <div className="bg-white border border-[#E6F7ED] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="font-mono text-xs text-[#879186]">S = {d.S?.toFixed(3)} g·L⁻¹</div>
      <div className="text-[#1a1a1a] font-medium font-mono text-base mt-1">μ = {d.mu?.toFixed(4)} h⁻¹</div>
      <div className="text-xs text-[#879186] mt-2 pt-2 border-t border-[#E6F7ED]/50 flex justify-between gap-4">
        <span>μ/μmax = {d.mu && muMax ? (d.mu / muMax * 100).toFixed(1) : '—'}%</span>
        {d.S && Ks && <span>S/Ks = {(d.S / Ks).toFixed(2)}</span>}
      </div>
    </div>
  )
}

const LBTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-white border border-[#E6F7ED] p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div className="font-mono text-xs text-[#879186]">1/S = {d.invS?.toFixed(3)} L·g⁻¹</div>
      <div className="text-[#1a1a1a] font-medium font-mono text-base mt-1">1/μ = {d.invMu?.toFixed(4)} h</div>
      <div className="text-xs text-[#879186] mt-2 pt-2 border-t border-[#E6F7ED]/50">S = {d.S?.toFixed(2)} g/L</div>
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
    <div className="space-y-16 animate-in fade-in duration-700">
      <SectionHeader
        tag="MÓDULO 4 · MODELO DE MONOD"
        title="Simulador del Modelo de Monod"
        sub="Ajuste los parámetros cinéticos empíricos y analice el comportamiento de saturación hiperbólica. Alterne entre el modelo directo y la linealización recíproca."
      />

      {/* ─── Parameter Controls ─── */}
      <div className="bg-white rounded-[2rem] border border-[#E6F7ED] p-8 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <h3 className="font-medium text-[#1a1a1a] mb-2 text-xl tracking-tight">Parámetros Cinéticos</h3>
        <p className="text-sm text-[#879186] mb-8 font-light">
          Ajuste los valores de entrada. La renderización de la gráfica es en tiempo real.
        </p>
        
        <div className="grid md:grid-cols-3 gap-10">
          {/* μmax */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-medium text-[#879186] tracking-widest uppercase">
                Tasa Máx (μ_max)
              </label>
              <span className="font-mono text-[#1a1a1a] text-lg">{muMax.toFixed(2)} h⁻¹</span>
            </div>
            <input
              type="range" min="0.05" max="2.00" step="0.01"
              value={muMax}
              onChange={e => setMuMax(parseFloat(e.target.value))}
              className="w-full accent-[#879186]"
            />
            <p className="text-xs text-[#879186] mt-3 font-light leading-relaxed">
              Velocidad de crecimiento máxima teórica (asíntota superior). Rango: 0.05–2.0 h⁻¹.
            </p>
          </div>

          {/* Ks */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-medium text-[#879186] tracking-widest uppercase">
                Afinidad (K_s)
              </label>
              <span className="font-mono text-[#1a1a1a] text-lg">{Ks.toFixed(3)} g/L</span>
            </div>
            <input
              type="range" min="0.005" max="2.0" step="0.005"
              value={Ks}
              onChange={e => setKs(parseFloat(e.target.value))}
              className="w-full accent-[#879186]"
            />
            <p className="text-xs text-[#879186] mt-3 font-light leading-relaxed">
              Constante de semisaturación. Concentración S cuando μ = μ_max/2.
            </p>
          </div>

          {/* Smax */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-medium text-[#879186] tracking-widest uppercase">
                Escala (S_max)
              </label>
              <span className="font-mono text-[#1a1a1a] text-lg">{Smax} g/L</span>
            </div>
            <input
              type="range" min="1" max="20" step="0.5"
              value={Smax}
              onChange={e => setSmax(parseFloat(e.target.value))}
              className="w-full accent-[#879186]"
            />
            <p className="text-xs text-[#879186] mt-3 font-light leading-relaxed">
              Rango de visualización en el eje de las abscisas.
            </p>
          </div>
        </div>

        {/* Derived parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-[#E6F7ED]">
          {[
            { label: 'Tasa Media (μmax/2)', val: halfSat_mu, unit: 'h⁻¹' },
            { label: 'Const. Afinidad (Ks)', val: halfSat_S.toFixed(3), unit: 'g/L' },
            { label: 'Pendiente LB', val: lb_slope, unit: 'L/g·h' },
            { label: 'Intersección Y LB', val: lb_int_y, unit: 'h' },
          ].map(p => (
            <div key={p.label} className="bg-[#fafcfb] rounded-xl p-5 border border-[#E6F7ED]/50 flex flex-col justify-center">
              <div className="font-mono font-medium text-[#1a1a1a] text-lg">
                {p.val} <span className="text-xs text-[#879186] font-sans font-normal">{p.unit}</span>
              </div>
              <div className="text-xs text-[#879186] mt-2 uppercase tracking-wide">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── View Toggle & Charts ─── */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex bg-[#fafcfb] p-1.5 rounded-full border border-[#E6F7ED]">
            <button
              onClick={() => setView('monod')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                view === 'monod'
                  ? 'bg-white border border-[#E6F7ED] text-[#1a1a1a] shadow-sm'
                  : 'bg-transparent text-[#879186] hover:text-[#1a1a1a]'
              }`}
            >
              Curva Hiperbólica
            </button>
            <button
              onClick={() => setView('lb')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                view === 'lb'
                  ? 'bg-white border border-[#E6F7ED] text-[#1a1a1a] shadow-sm'
                  : 'bg-transparent text-[#879186] hover:text-[#1a1a1a]'
              }`}
            >
              Lineweaver-Burk
            </button>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-sm text-[#879186] group-hover:text-[#1a1a1a] transition-colors">Mostrar Guías</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showAnnotations}
                onChange={e => setShowAnnotations(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showAnnotations ? 'bg-[#879186]' : 'bg-[#E6F7ED]'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showAnnotations ? 'translate-x-4' : ''}`}></div>
            </div>
          </label>
        </div>

        {/* ─── Monod Chart ─── */}
        {view === 'monod' && (
          <div className="bg-white border border-[#E6F7ED] rounded-[2rem] p-8 md:p-12 animate-in fade-in">
            <div className="mb-8">
              <h3 className="text-xl font-light text-[#1a1a1a] tracking-tight">
                Cinética de Saturación
              </h3>
              <p className="text-sm text-[#879186] mt-2 font-light">
                Comportamiento análogo a la cinética de Michaelis-Menten. μ = μ_max · S / (K_s + S)
              </p>
            </div>
            
            

[Image of Monod kinetics graph]


            <div className="h-[450px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monodData} margin={{ top: 20, right: 30, bottom: 25, left: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6F7ED" />

                  {showAnnotations && (
                    <>
                      <ReferenceLine
                        y={muMax / 2}
                        stroke="#879186"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                        label={{ value: `μ_max/2`, position: 'insideRight', fill: '#879186', fontSize: 11, fontWeight: 300 }}
                      />
                      <ReferenceLine
                        x={Ks}
                        stroke="#879186"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                        label={{ value: `K_s`, position: 'insideTopRight', fill: '#879186', fontSize: 11, fontWeight: 300 }}
                      />
                      <ReferenceLine
                        y={muMax}
                        stroke="#1a1a1a"
                        strokeDasharray="2 2"
                        strokeOpacity={0.2}
                        label={{ value: `Asíntota (μ_max)`, position: 'insideTopLeft', fill: '#879186', fontSize: 11, fontWeight: 300 }}
                      />
                    </>
                  )}

                  <XAxis
                    dataKey="S"
                    type="number"
                    domain={[0, Smax]}
                    stroke="#879186"
                    tick={{ fill: '#879186', fontSize: 12, fontWeight: 300 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E6F7ED' }}
                    dy={10}
                    label={{ value: 'Concentración de Sustrato (g/L)', position: 'insideBottom', offset: -15, fill: '#879186', fontSize: 12, fontWeight: 300 }}
                  />
                  <YAxis
                    domain={[0, muMax * 1.1]}
                    stroke="#879186"
                    tick={{ fill: '#879186', fontSize: 12, fontWeight: 300 }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                    label={{ value: 'Tasa Específica μ (h⁻¹)', angle: -90, position: 'insideLeft', offset: 0, fill: '#879186', fontSize: 12, fontWeight: 300 }}
                  />
                  <Tooltip content={<MonodTooltip muMax={muMax} Ks={Ks} />} />

                  <Line
                    type="monotone"
                    dataKey="mu"
                    name="μ (Monod)"
                    stroke="#1a1a1a"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: '#1a1a1a', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {showAnnotations && (
              <div className="mt-10 grid sm:grid-cols-3 gap-6 pt-8 border-t border-[#E6F7ED]/50">
                <AnnotationBox title="Zona S ≪ Ks (Primer orden)">
                  μ ≈ (μmax/Ks) · S. Relación lineal. El sustrato es estrictamente limitante.
                </AnnotationBox>
                <AnnotationBox title="Zona S = Ks (Semisaturación)">
                  μ = μmax/2. Punto de inflexión crítico para el diseño experimental.
                </AnnotationBox>
                <AnnotationBox title="Zona S ≫ Ks (Orden cero)">
                  μ ≈ μmax. El sistema metabólico está saturado, añadir más sustrato no aumenta la tasa.
                </AnnotationBox>
              </div>
            )}
          </div>
        )}

        {/* ─── Lineweaver-Burk Chart ─── */}
        {view === 'lb' && (
          <div className="bg-white border border-[#E6F7ED] rounded-[2rem] p-8 md:p-12 animate-in fade-in">
            <div className="mb-8">
              <h3 className="text-xl font-light text-[#1a1a1a] tracking-tight">
                Linealización de Doble Recíproco
              </h3>
              <p className="text-sm text-[#879186] mt-2 font-light">
                Método clásico para estimar visualmente K_s y μ_max. 1/μ = (K_s/μ_max)·(1/S) + 1/μ_max
              </p>
            </div>
            
            

            <div className="h-[450px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 20, right: 30, bottom: 25, left: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6F7ED" />

                  {showAnnotations && (
                    <>
                      <ReferenceLine
                        y={1 / muMax}
                        stroke="#879186"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                        label={{ value: `1/μ_max`, position: 'insideRight', fill: '#879186', fontSize: 11, fontWeight: 300 }}
                      />
                      <ReferenceLine
                        x={-1 / Ks}
                        stroke="#879186"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                        label={{ value: `−1/K_s`, position: 'insideTopRight', fill: '#879186', fontSize: 11, fontWeight: 300 }}
                      />
                    </>
                  )}

                  <XAxis
                    dataKey="invS"
                    type="number"
                    domain={['dataMin - 0.5', 'dataMax + 0.2']}
                    stroke="#879186"
                    tick={{ fill: '#879186', fontSize: 12, fontWeight: 300 }}
                    tickLine={false}
                    axisLine={{ stroke: '#E6F7ED' }}
                    dy={10}
                    label={{ value: '1/S (L/g)', position: 'insideBottom', offset: -15, fill: '#879186', fontSize: 12, fontWeight: 300 }}
                  />
                  <YAxis
                    stroke="#879186"
                    tick={{ fill: '#879186', fontSize: 12, fontWeight: 300 }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                    domain={[0, 'auto']}
                    label={{ value: '1/μ (h)', angle: -90, position: 'insideLeft', offset: 0, fill: '#879186', fontSize: 12, fontWeight: 300 }}
                  />
                  <Tooltip content={<LBTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#879186', paddingTop: '10px' }} iconType="circle" />

                  <Line
                    data={lbLine}
                    type="linear"
                    dataKey="invMu_line"
                    name="Regresión Teórica"
                    stroke="#E6F7ED"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    data={lbData}
                    type="linear"
                    dataKey="invMu"
                    name="Datos Exp. (Simulados)"
                    stroke="#1a1a1a"
                    strokeWidth={0}
                    dot={{ r: 4, fill: '#ffffff', stroke: '#1a1a1a', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#1a1a1a', stroke: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* LB equations & Notes */}
            <div className="mt-10 grid md:grid-cols-2 gap-8 pt-8 border-t border-[#E6F7ED]/50">
              <div className="bg-[#fafcfb] rounded-xl p-6 border border-[#E6F7ED]">
                <div className="text-xs font-medium text-[#879186] uppercase tracking-widest mb-4">Parámetros Estimados</div>
                <div className="space-y-3 font-mono text-[#1a1a1a] text-sm">
                  <div className="flex justify-between border-b border-[#E6F7ED] pb-2">
                    <span>1/μ_max (Corte Y)</span>
                    <span className="font-medium">{lb_int_y} h</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E6F7ED] pb-2">
                    <span>-1/K_s (Corte X)</span>
                    <span className="font-medium">{lb_int_x} L/g</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span>Pendiente (K_s/μ_max)</span>
                    <span className="font-medium">{lb_slope}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="flex items-start gap-4 p-5 bg-white border border-[#E6F7ED] rounded-xl">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h4 className="font-medium text-[#1a1a1a] text-sm mb-1">Nota Metodológica</h4>
                    <p className="text-xs text-[#879186] font-light leading-relaxed">
                      La linealización recíproca amplifica desproporcionadamente los errores experimentales a bajas concentraciones de sustrato (alta 1/S). En la práctica industrial, se prefiere la regresión no lineal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Theory Box ─── */}
      <div className="bg-white border border-[#E6F7ED] rounded-[2rem] p-8 md:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <h3 className="text-xl font-light text-[#1a1a1a] tracking-tight mb-6 flex items-center gap-3">
          <span className="text-[#879186] font-light">|</span> Fundamento Teórico
        </h3>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <p className="text-[#879186] leading-relaxed font-light text-sm mb-6">
              Propuesto por Jacques Monod (1949), este modelo vincula la tasa de crecimiento celular con el nutriente limitante. Aunque es un modelo empírico estructurado de "caja negra", sigue siendo el estándar en ingeniería bioquímica.
            </p>
            <div className="bg-[#fafcfb] border border-[#E6F7ED] rounded-xl p-5 font-mono text-center text-[#1a1a1a] text-lg">
              μ = μ_max · S / (K_s + S)
            </div>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-xs font-medium text-[#879186] uppercase tracking-widest">Balance de Masa Típico</h4>
            <div className="bg-[#fafcfb] border border-[#E6F7ED] rounded-xl p-6 font-mono text-sm space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-[#879186]">Biomasa (X):</span>
                <span className="text-[#1a1a1a]">dX/dt = (μ − k_d) · X</span>
              </div>
              <div className="w-full h-px bg-[#E6F7ED]"></div>
              <div className="flex items-start justify-between">
                <span className="text-[#879186]">Sustrato (S):</span>
                <span className="text-[#1a1a1a]">dS/dt = −(μ/Y_xs)·X − m_s·X</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AnnotationBox({ title, children }) {
  return (
    <div className="border-l-2 border-[#879186] pl-4">
      <h4 className="font-medium text-[#1a1a1a] text-sm mb-1">{title}</h4>
      <p className="text-xs text-[#879186] leading-relaxed font-light">{children}</p>
    </div>
  )
}

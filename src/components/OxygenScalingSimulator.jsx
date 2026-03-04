import { useState, useMemo, useRef, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ReferenceLine } from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── Scaling Calculations ────────────────────────────────────────────────────
const SCALES = [
  { label: 'Lab',    V: 10,    D: 0.20 },
  { label: 'Piloto', V: 100,   D: 0.40 },
  { label: 'Prod.',  V: 1000,  D: 0.80 },
  { label: 'Indust.',V: 10000, D: 1.60 },
]

// Geometry helpers
function reactorGeometry(V) {
  // Aspect ratio H/D = 2.5 for STR
  // V = π(D/2)²·H = π(D/2)²·2.5D = π·2.5·D³/4
  // D³ = 4V/(π·2.5) → D = cbrt(4V/(π·2.5))
  const D = Math.cbrt(4 * V / (Math.PI * 2.5))
  const H = 2.5 * D
  const A = Math.PI * (D / 2) ** 2
  return { D, H, A }
}

function impellerD(vesselD) { return vesselD * 0.4 } // D_imp = 0.4·D_vessel

function calculateScale(V, criterion, globalParams) {
  const { OUR, vvmBase, Cstar } = globalParams
  const geom = reactorGeometry(V)
  const { D, H, A } = geom
  const Di = impellerD(D)
  const refV = SCALES[0].V
  const refGeom = reactorGeometry(refV)

  let rpm, PperV
  const refRPM = 200 // lab RPM baseline

  switch (criterion) {
    case 'PV': {
      // Constant P/V = 2 kW/m³ across scales
      PperV = 2000 // W/m³
      // P ∝ ρ·N³·Di⁵ → N = cbrt(P/(ρ·Di⁵))
      // Using Np ≈ 5 (Rushton), P = Np·ρ·N³·Di⁵
      const Np = 5, rho = 1000
      const N3 = PperV * (V / 1000) / (Np * rho * Di ** 5)
      rpm = Math.cbrt(N3) * 60
      break
    }
    case 'tip': {
      // Constant tip speed u_tip = π·Di·N/60 = const
      const refDi = impellerD(refGeom.D)
      const refTip = Math.PI * refDi * refRPM / 60
      rpm = refTip * 60 / (Math.PI * Di)
      const Np = 5, rho = 1000
      const N_rps = rpm / 60
      PperV = Np * rho * N_rps ** 3 * Di ** 5 / (V / 1000) // W/m³
      break
    }
    case 'kLa': {
      // kLa = 0.002·rpm^0.7·vvm^0.4, target kLa from lab scale
      const refKla = 0.002 * refRPM ** 0.7 * vvmBase ** 0.4
      // Solve: refKla = 0.002·N^0.7·vvm^0.4 → N = (refKla/(0.002·vvm^0.4))^(1/0.7)
      rpm = (refKla / (0.002 * vvmBase ** 0.4)) ** (1 / 0.7)
      const Np = 5, rho = 1000
      const N_rps = rpm / 60
      PperV = Np * rho * N_rps ** 3 * Di ** 5 / (V / 1000)
      break
    }
    case 'tmix': {
      // Constant mixing time τ_mix ∝ (V/P)^(1/3), τ_mix = 15s
      // τ_mix ≈ 5.9·(V/P)^(0.33) → P/V = (5.9/τmix)^3·V^0
      // Simplified: P/V scales to maintain τ_mix
      const refTmix = 15
      const Np = 5, rho = 1000
      // τ_mix ≈ 5·N^(-1)·(D/Di)^2 → N = 5/(τ_mix)·(D/Di)^2
      rpm = 5 / refTmix * (D / Di) ** 2 * 60
      const N_rps = rpm / 60
      PperV = Np * rho * N_rps ** 3 * Di ** 5 / (V / 1000)
      break
    }
    default: rpm = 200; PperV = 2000
  }

  rpm = Math.round(Math.max(5, rpm))
  const vvm = vvmBase
  const kLa = Math.max(1, 0.002 * rpm ** 0.7 * vvm ** 0.4)
  const OTR = kLa * (Cstar - 0.5 * Cstar) // assume C = 0.5·C* at steady state mmol/L·h ≈ using mg → rough
  const tipSpeed = Math.PI * Di * rpm / 60
  const P = (PperV * V) / 1000 // kW
  const tauMix = 5 * 60 / rpm * (D / Di) ** 2 // seconds
  const pO2 = OTR > OUR ? 65 : Math.max(5, 40 - (OUR - OTR) * 5)

  return { V, label: SCALES.find(s => s.V === V)?.label ?? V + 'L', D: +D.toFixed(2), H: +H.toFixed(2), Di: +Di.toFixed(2), rpm, kLa: +kLa.toFixed(1), P: +P.toFixed(2), PperV: +PperV.toFixed(0), tipSpeed: +tipSpeed.toFixed(2), tauMix: +tauMix.toFixed(1), pO2: +pO2.toFixed(0) }
}

// ─── Single 3D Reactor ────────────────────────────────────────────────────────
function ScaleBubbles({ active, count }) {
  const ref = useRef()
  const n = count
  const pos = useMemo(() => {
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { a[i*3] = (Math.random()-.5)*1.5; a[i*3+1] = Math.random()*2.4-1.2; a[i*3+2] = (Math.random()-.5)*1.5 }
    return a
  }, [n])
  useFrame(() => {
    if (!active || !ref.current) return
    const a = ref.current.geometry.attributes.position.array
    for (let i = 0; i < n; i++) {
      a[i*3+1] += 0.015
      if (a[i*3+1] > 1.3) { a[i*3+1] = -1.2; a[i*3] = (Math.random()-.5)*1.5; a[i*3+2] = (Math.random()-.5)*1.5 }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={n} itemSize={3} /></bufferGeometry>
      <pointsMaterial color="white" size={0.07} transparent opacity={0.7} />
    </points>
  )
}

function ScaleImpeller({ active, rpm }) {
  const ref = useRef()
  useFrame(() => { if (ref.current) ref.current.rotation.y += (rpm / 60) * 0.08 })
  return (
    <group ref={ref}>
      <mesh><cylinderGeometry args={[0.03, 0.03, 2.8, 8]} /><meshStandardMaterial color="#666" /></mesh>
      {[0,60,120,180,240,300].map(d => (
        <mesh key={d} rotation={[0, d*Math.PI/180, 0]} position={[0.35, 0, 0]}>
          <boxGeometry args={[0.65, 0.05, 0.15]} /><meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function ScaleReactor({ pO2, rpm, active }) {
  const liquidColor = useMemo(() => {
    const c = new THREE.Color()
    if (pO2 > 40) c.setHSL(0.33, 0.7, 0.6)      // green
    else if (pO2 > 20) c.setHSL(0.15, 0.8, 0.6)  // yellow
    else c.setHSL(0.0, 0.75, 0.5)                  // red
    return c
  }, [pO2])
  const bubbleCount = Math.min(30, Math.max(5, Math.round(rpm / 20)))

  return (
    <group>
      <mesh><cylinderGeometry args={[1,1,3,32,1,true]} /><meshPhongMaterial color="#d4eaff" transparent opacity={0.2} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0,1.5,0]}><torusGeometry args={[1,0.04,8,32]} /><meshStandardMaterial color="#aaa" metalness={0.7} /></mesh>
      <mesh position={[0,-1.5,0]}><circleGeometry args={[1,32]} /><meshPhongMaterial color="#b8d4cc" transparent opacity={0.4} /></mesh>
      <mesh><cylinderGeometry args={[0.93,0.93,2.7,32]} /><meshPhongMaterial color={liquidColor} transparent opacity={0.75} /></mesh>
      <ScaleImpeller active={active} rpm={rpm} />
      <ScaleBubbles active={active} count={bubbleCount} />
    </group>
  )
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({ label, unit, value, min, max, step, onChange, color = '#2D6A4F' }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-sage-500">{label}</label>
        <span className="text-xs font-mono font-bold" style={{ color }}>{value} {unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)} className="w-full" style={{ accentColor: color }} />
    </div>
  )
}

const CRITERIA = [
  { key: 'PV',   label: 'P/V constante',         desc: '2 kW/m³' },
  { key: 'tip',  label: 'Tip speed constante',     desc: '~2 m/s' },
  { key: 'kLa',  label: 'kLa constante',           desc: 'mismo kLa' },
  { key: 'tmix', label: 'τ_mezcla constante',      desc: '~15 s' },
]

export default function OxygenScalingSimulator() {
  const [criterion, setCriterion] = useState('PV')
  const [globalParams, setGlobalParams] = useState({ OUR: 20, vvmBase: 1.0, Cstar: 8.0 })
  const [simActive, setSimActive] = useState(false)

  const set = k => v => setGlobalParams(p => ({ ...p, [k]: v }))
  const results = useMemo(() => SCALES.map(s => calculateScale(s.V, criterion, globalParams)), [criterion, globalParams])

  const barData = results.map(r => ({ label: r.label, 'RPM': r.rpm, 'kLa (h⁻¹)': r.kLa, 'P (kW)': r.P, 'τ_mix (s)': r.tauMix }))

  const pO2Color = (pO2) => pO2 > 40 ? '#22c55e' : pO2 > 20 ? '#f59e0b' : '#ef4444'

  return (
    <div className="space-y-6">
      <SectionHeader tag="SIMULADOR 5 · O₂ + ESCALADO" title="Transferencia de Oxígeno y Criterios de Escalado"
        sub="Compara 4 escalas de reactor simultáneamente. El color del líquido indica la tensión de O₂ disuelto según el criterio de escalado." />

      {/* Criterion + global controls */}
      <div className="bg-white rounded-xl border border-sage-200 p-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-forest-900 mb-2">Criterio de Escalado</h3>
            <div className="space-y-2">
              {CRITERIA.map(c => (
                <label key={c.key} className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${criterion === c.key ? 'border-forest-600 bg-forest-50' : 'border-sage-200'}`}>
                  <input type="radio" name="criterion" value={c.key} checked={criterion === c.key} onChange={() => setCriterion(c.key)} className="accent-forest-600" />
                  <div>
                    <div className="text-sm font-medium text-forest-900">{c.label}</div>
                    <div className="text-xs text-sage-400">{c.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-forest-900 mb-2">Parámetros Globales</h3>
            <Slider label="OUR (demanda O₂)" unit="mmol/L/h" min={5} max={50} step={1} value={globalParams.OUR} onChange={set('OUR')} color="#ef4444" />
            <Slider label="vvm base" unit="vvm" min={0.1} max={2.0} step={0.1} value={globalParams.vvmBase} onChange={set('vvmBase')} color="#3b82f6" />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setSimActive(p => !p)}
                className="flex-1 py-1.5 rounded-lg text-sm font-medium bg-forest-600 text-white hover:bg-forest-700 transition-colors">
                {simActive ? '⏸ Pausar reactores' : '▶ Animar reactores'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Reactors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {results.map((r, i) => (
          <div key={r.label} className="bg-white rounded-xl border border-sage-200 overflow-hidden">
            <div className="p-2 border-b border-sage-100 text-center">
              <div className="text-xs font-bold text-forest-900">{r.label}</div>
              <div className="text-xs text-sage-400">{r.V.toLocaleString()} L</div>
            </div>
            <div className="h-44">
              <Canvas camera={{ position: [3, 1, 3], fov: 45 }} gl={{ antialias: true }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 8, 5]} intensity={1.2} />
                <ScaleReactor pO2={r.pO2} rpm={r.rpm} active={simActive} />
                <OrbitControls enablePan={false} minDistance={2.5} maxDistance={6} />
              </Canvas>
            </div>
            {/* kLa badge */}
            <div className="p-2 text-center border-t border-sage-100">
              <div className="text-xs font-mono font-bold" style={{ color: pO2Color(r.pO2) }}>
                kLa = {r.kLa} h⁻¹
              </div>
              <div className="text-xs text-sage-400">{r.rpm} RPM · pO₂ ≈ {r.pO2}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-xl border border-sage-200 overflow-hidden">
        <div className="p-4 border-b border-sage-100">
          <h3 className="text-sm font-semibold text-forest-900">Tabla Comparativa de Escalado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-sage-50">
              <tr>
                {['Escala', 'V (L)', 'D (m)', 'H (m)', 'RPM', 'kLa (h⁻¹)', 'P (kW)', 'P/V (W/m³)', 'Tip (m/s)', 'τ_mix (s)', 'pO₂ (%)'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-sage-500 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.label} className={i % 2 === 0 ? 'bg-white' : 'bg-sage-50'}>
                  <td className="px-3 py-2 font-semibold text-forest-700">{r.label}</td>
                  <td className="px-3 py-2 font-mono">{r.V.toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono">{r.D}</td>
                  <td className="px-3 py-2 font-mono">{r.H}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: '#1B4965' }}>{r.rpm}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: '#2D6A4F' }}>{r.kLa}</td>
                  <td className="px-3 py-2 font-mono">{r.P}</td>
                  <td className="px-3 py-2 font-mono">{r.PperV}</td>
                  <td className="px-3 py-2 font-mono">{r.tipSpeed}</td>
                  <td className="px-3 py-2 font-mono">{r.tauMix}</td>
                  <td className="px-3 py-2 font-mono font-bold" style={{ color: pO2Color(r.pO2) }}>{r.pO2}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparative bar charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {[
          { key: 'RPM', label: 'RPM por escala', color: '#1B4965' },
          { key: 'kLa (h⁻¹)', label: 'kLa por escala (h⁻¹)', color: '#2D6A4F' },
          { key: 'P (kW)', label: 'Potencia por escala (kW)', color: '#7B2D8E' },
          { key: 'τ_mix (s)', label: 'Tiempo de mezcla (s)', color: '#D4A017' },
        ].map(ch => (
          <div key={ch.key} className="bg-white rounded-xl border border-sage-200 p-4">
            <div className="text-xs font-semibold text-sage-500 mb-2">{ch.label}</div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={barData} margin={{ top: 2, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="#879186" />
                <YAxis tick={{ fontSize: 9 }} stroke="#879186" />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Bar dataKey={ch.key} fill={ch.color} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-sage-200 p-4">
        <h3 className="text-sm font-semibold text-forest-900 mb-2">Interpretación del Color del Líquido</h3>
        <div className="flex gap-6 text-xs">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-green-500" /><span>pO₂ &gt; 40% — Buena oxigenación</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-400" /><span>pO₂ 20–40% — Limitación moderada</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-500" /><span>pO₂ &lt; 20% — Hipoxia crítica</span></div>
        </div>
        <p className="text-xs text-sage-400 mt-2">
          kLa calculado con: kLa = 0.002 · RPM⁰·⁷ · vvm⁰·⁴ (correlación empírica de Pirt, 1975)
        </p>
      </div>
    </div>
  )
}

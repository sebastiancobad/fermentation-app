import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell,
} from 'recharts'
import { SectionHeader } from './Dashboard'

// ─── Knowledge Base ──────────────────────────────────────────────────────────
const SUBSTRATES = {
  glucose: {
    label: 'Glucosa',
    icon: '🍬',
    formula: 'C₆H₁₂O₆',
    color: '#D4A017',
    desc: 'Fuente de carbono más común. Metabolismo rápido, bien caracterizado.',
    S0_default: 20,
  },
  lactose: {
    label: 'Lactosa',
    icon: '🥛',
    formula: 'C₁₂H₂₂O₁₁',
    color: '#a78bfa',
    desc: 'Disacárido. Requiere sistema lac operon. Liberación lenta → menor riesgo de overflow.',
    S0_default: 30,
  },
  glycerol: {
    label: 'Glicerol',
    icon: '🫙',
    formula: 'C₃H₈O₃',
    color: '#34d399',
    desc: 'Subproducto del biodiesel. Metabolismo oxidativo, menor acetato en E. coli.',
    S0_default: 25,
  },
  methanol: {
    label: 'Metanol',
    icon: '⚗️',
    formula: 'CH₃OH',
    color: '#f87171',
    desc: 'Sustrato de P. pastoris. Alta toxicidad — requiere control estricto de concentración.',
    S0_default: 5,
  },
  sucrose: {
    label: 'Sacarosa',
    icon: '🍚',
    formula: 'C₁₂H₂₂O₁₁',
    color: '#fb923c',
    desc: 'Invertida por sacarasa. Estándar para fermentaciones de levaduras industriales.',
    S0_default: 40,
  },
}

const MICROORGANISMS = {
  ecoli: {
    label: 'E. coli',
    icon: '🦠',
    type: 'Bacteria',
    color: '#2D6A4F',
    desc: 'Modelo de expresión proteica. Rápido, bien caracterizado genéticamente.',
    substrates: ['glucose', 'glycerol', 'lactose'],
    params: {
      glucose:  { muMax: 0.90, Ks: 0.15, Yxs: 0.50 },
      glycerol: { muMax: 0.55, Ks: 0.20, Yxs: 0.45 },
      lactose:  { muMax: 0.40, Ks: 0.40, Yxs: 0.48 },
    },
  },
  yeast: {
    label: 'S. cerevisiae',
    icon: '🍺',
    type: 'Levadura',
    color: '#D4A017',
    desc: 'Levadura de panadería y cervecería. Produce etanol anaeróbicamente.',
    substrates: ['glucose', 'sucrose'],
    params: {
      glucose: { muMax: 0.40, Ks: 0.25, Yxs: 0.12 },
      sucrose: { muMax: 0.35, Ks: 0.50, Yxs: 0.10 },
    },
  },
  pichia: {
    label: 'P. pastoris',
    icon: '🔬',
    type: 'Levadura',
    color: '#7B2D8E',
    desc: 'Producción de proteínas recombinantes. Usa metanol como inductor y fuente de C.',
    substrates: ['methanol', 'glycerol'],
    params: {
      methanol: { muMax: 0.18, Ks: 0.10, Yxs: 0.38 },
      glycerol: { muMax: 0.28, Ks: 0.15, Yxs: 0.42 },
    },
  },
  cho: {
    label: 'Células CHO',
    icon: '🧬',
    type: 'Célula animal',
    color: '#1B4965',
    desc: 'Producción de anticuerpos monoclonales. Lento, frágil, alto valor agregado.',
    substrates: ['glucose'],
    params: {
      glucose: { muMax: 0.030, Ks: 0.50, Yxs: 0.15 },
    },
  },
  bacillus: {
    label: 'B. subtilis',
    icon: '💊',
    type: 'Bacteria',
    color: '#059669',
    desc: 'Producción de enzimas y antibióticos. Esporula bajo estrés — robusto.',
    substrates: ['glucose', 'sucrose'],
    params: {
      glucose: { muMax: 0.70, Ks: 0.10, Yxs: 0.45 },
      sucrose: { muMax: 0.55, Ks: 0.25, Yxs: 0.42 },
    },
  },
  lactobacillus: {
    label: 'Lactobacillus',
    icon: '🧀',
    type: 'Bacteria LAB',
    color: '#dc2626',
    desc: 'Producción de ácido láctico. Fermentación homoláctica estricta, pH ácido.',
    substrates: ['glucose', 'lactose'],
    params: {
      glucose: { muMax: 0.45, Ks: 0.30, Yxs: 0.20 },
      lactose: { muMax: 0.30, Ks: 0.60, Yxs: 0.18 },
    },
  },
}

const REACTORS = {
  batch: {
    label: 'Batch',
    icon: '🫙',
    color: '#2D6A4F',
    desc: 'Sistema cerrado. Sin adición de nutrientes. Fases LAG → EXP → ESTACIONARIA.',
    pros: ['Simple operación', 'Bajo riesgo contaminación', 'Flexible'],
    cons: ['Tiempo muerto entre lotes', 'Limitación por S₀', 'Baja productividad volumétrica'],
  },
  fedbatch: {
    label: 'Fed-Batch',
    icon: '💧',
    color: '#1B4965',
    desc: 'Adición continua de sustrato. Evita inhibición por sustrato. Estándar industrial.',
    pros: ['Alta densidad celular', 'Control µ = µset', 'Reduce inhibición'],
    cons: ['Volumen variable', 'Control complejo', 'Dilución de producto'],
  },
  continuous: {
    label: 'Continuo (Quimiostato)',
    icon: '♻️',
    color: '#7B2D8E',
    desc: 'Entrada y salida continuas. Estado estacionario. Máxima productividad volumétrica.',
    pros: ['Estado estacionario estable', 'Máxima productividad', 'Fácil automatización'],
    cons: ['Riesgo washout', 'Alto costo capital', 'Sensible a perturbaciones'],
  },
}

// ─── ODE Solvers ─────────────────────────────────────────────────────────────
function monodMu(S, muMax, Ks) { return muMax * Math.max(0, S) / (Ks + Math.max(0, S)) }

function solveBatch(p) {
  const { muMax, Ks, Yxs, S0, X0, tf } = p
  const dt = 0.1, steps = Math.ceil(tf / dt)
  let X = X0, S = S0, t = 0
  const out = [{ t: 0, X, S, mu: monodMu(S, muMax, Ks), P: 0 }]
  for (let i = 1; i <= steps; i++) {
    const mu = monodMu(Math.max(0, S), muMax, Ks)
    X = Math.max(0, X + dt * mu * X)
    S = Math.max(0, S - dt * (mu * X) / Yxs)
    t += dt
    if (i % 2 === 0)
      out.push({ t: +t.toFixed(1), X: +X.toFixed(4), S: +S.toFixed(4), mu: +monodMu(S, muMax, Ks).toFixed(4), P: +(X * 1).toFixed(3) })
  }
  return out
}

function solveFedBatch(p) {
  const { muMax, Ks, Yxs, S0, X0, tf, F0, Sf, muSet } = p
  const dt = 0.1, steps = Math.ceil(tf / dt)
  let X = X0, S = S0, V = 1.0, t = 0
  const out = [{ t: 0, X, S, V, mu: monodMu(S, muMax, Ks), Prod: X * V }]
  for (let i = 1; i <= steps; i++) {
    const mu = monodMu(Math.max(0, S), muMax, Ks)
    const F = F0 * Math.exp(muSet * t)
    const dXdt = mu * X - (F / V) * X
    const dSdt = (F / V) * (Sf - S) - (mu * X) / Yxs
    const dVdt = F
    X = Math.max(0, X + dt * dXdt)
    S = Math.max(0, S + dt * dSdt)
    V = Math.min(V + dt * dVdt, 10)
    t += dt
    if (i % 2 === 0)
      out.push({ t: +t.toFixed(1), X: +X.toFixed(4), S: +S.toFixed(4), V: +V.toFixed(3), mu: +monodMu(S, muMax, Ks).toFixed(4), Prod: +(X * V).toFixed(3) })
  }
  return out
}

function solveContinuous(p) {
  const { muMax, Ks, Yxs, S0, X0, D, tf } = p
  const dt = 0.1, steps = Math.ceil(tf / dt)
  let X = X0, S = S0, t = 0
  const out = [{ t: 0, X, S, mu: monodMu(S, muMax, Ks), D }]
  for (let i = 1; i <= steps; i++) {
    const mu = monodMu(Math.max(0, S), muMax, Ks)
    X = Math.max(0, X + dt * ((mu - D) * X))
    S = Math.max(0, S + dt * (D * (S0 - S) - (mu * X) / Yxs))
    t += dt
    if (i % 2 === 0)
      out.push({ t: +t.toFixed(1), X: +X.toFixed(4), S: +S.toFixed(4), mu: +monodMu(S, muMax, Ks).toFixed(4), D })
  }
  return out
}

// ─── 3D Reactor ──────────────────────────────────────────────────────────────
function Bubbles({ active, n = 25 }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      arr[i*3]   = (Math.random() - 0.5) * 1.4
      arr[i*3+1] = Math.random() * 2.2 - 1.1
      arr[i*3+2] = (Math.random() - 0.5) * 1.4
    }
    return arr
  }, [])
  useFrame(() => {
    if (!active || !ref.current) return
    const a = ref.current.geometry.attributes.position.array
    for (let i = 0; i < n; i++) {
      a[i*3+1] += 0.02
      if (a[i*3+1] > 1.2) { a[i*3+1] = -1.1; a[i*3] = (Math.random()-0.5)*1.4; a[i*3+2] = (Math.random()-0.5)*1.4 }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={n} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="white" size={0.07} transparent opacity={0.8} />
    </points>
  )
}

function Impeller({ rpm, active }) {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.y += (active ? rpm / 60 : 0.5) * 0.016
  })
  return (
    <group ref={ref} position={[0, -0.5, 0]}>
      {[0,1,2,3,4,5].map(i => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
          <boxGeometry args={[0.7, 0.04, 0.14]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      <mesh><cylinderGeometry args={[0.04, 0.04, 0.5, 8]} /><meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} /></mesh>
    </group>
  )
}

function IntegratedReactor3D({ biomassRatio, active, reactorType, orgColor }) {
  const hexColor = orgColor || '#2D6A4F'
  const h = new THREE.Color(hexColor)
  const liquidColor = `hsl(${Math.round(h.getHSL({}).h * 360)}, 50%, ${30 + biomassRatio * 20}%)`

  return (
    <group>
      {/* vessel */}
      <mesh>
        <cylinderGeometry args={[0.9, 0.9, 3.0, 32, 1, true]} />
        <meshStandardMaterial color="#e2e8f0" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* liquid */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.88, 0.88, 2.4 * (0.3 + biomassRatio * 0.6), 32]} />
        <meshStandardMaterial color={liquidColor} transparent opacity={0.75} />
      </mesh>
      <Bubbles active={active} />
      <Impeller rpm={180} active={active} />
      {/* top plate */}
      <mesh position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.06, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* bottom plate */}
      <mesh position={[0, -1.52, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.06, 32]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* feed pipe (fedbatch only) */}
      {reactorType === 'fedbatch' && (
        <mesh position={[0.7, 1.8, 0]} rotation={[0, 0, Math.PI/4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
          <meshStandardMaterial color="#1B4965" />
        </mesh>
      )}
      {/* outlet pipe (continuous) */}
      {reactorType === 'continuous' && (
        <mesh position={[0.92, 0.4, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshStandardMaterial color="#7B2D8E" />
        </mesh>
      )}
    </group>
  )
}

// ─── Utility Components ───────────────────────────────────────────────────────
function SelectCard({ item, selected, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative text-left p-3 rounded-xl border-2 transition-all duration-150 w-full
        ${disabled ? 'opacity-30 cursor-not-allowed border-sage-100 bg-sage-50'
          : selected
            ? 'border-forest-500 bg-forest-50 shadow-md'
            : 'border-sage-200 bg-white hover:border-forest-300 hover:shadow-sm'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{item.icon}</span>
        <span className="font-semibold text-sm text-forest-900">{item.label}</span>
        {item.type && <span className="text-xs px-1.5 py-0.5 rounded-full bg-sage-100 text-sage-500">{item.type}</span>}
      </div>
      <p className="text-xs text-sage-500 leading-relaxed">{item.desc}</p>
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-forest-500 flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
}

function StepIndicator({ step, current }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-medium transition-colors
      ${current > step ? 'text-forest-600' : current === step ? 'text-forest-700' : 'text-sage-400'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
        ${current > step ? 'bg-forest-500 text-white' : current === step ? 'bg-forest-600 text-white' : 'bg-sage-200 text-sage-400'}`}>
        {current > step ? '✓' : step}
      </div>
    </div>
  )
}

const CHART_COLORS = { X: '#2D6A4F', S: '#D4A017', mu: '#1B4965', V: '#7B2D8E', Prod: '#e11d48' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-sage-200 rounded-lg shadow-lg p-2 text-xs">
      <div className="font-medium text-sage-500 mb-1">t = {label} h</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-sage-600">{p.name}:</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
const STEPS = ['Sustrato', 'Microorganismo', 'Reactor', 'Simulación']

export default function IntegratedSimulator() {
  const [step, setStep] = useState(1)
  const [substrateKey, setSubstrateKey] = useState(null)
  const [orgKey, setOrgKey] = useState(null)
  const [reactorKey, setReactorKey] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [tIdx, setTIdx] = useState(0)
  const [speed, setSpeed] = useState(5)

  const substrate = substrateKey ? SUBSTRATES[substrateKey] : null
  const org = orgKey ? MICROORGANISMS[orgKey] : null
  const reactor = reactorKey ? REACTORS[reactorKey] : null

  // Auto-populate kinetic params
  const kinetics = useMemo(() => {
    if (!org || !substrateKey || !org.params[substrateKey]) return null
    return org.params[substrateKey]
  }, [org, substrateKey])

  // Simulation params derived from selection
  const simParams = useMemo(() => {
    if (!kinetics || !substrate) return null
    const base = {
      muMax: kinetics.muMax,
      Ks: kinetics.Ks,
      Yxs: kinetics.Yxs,
      S0: substrate.S0_default,
      X0: org?.label === 'Células CHO' ? 0.05 : 0.1,
    }
    if (reactorKey === 'batch') return { ...base, tf: Math.min(120, Math.ceil(6 / kinetics.muMax) * 10) }
    if (reactorKey === 'fedbatch') return { ...base, tf: Math.ceil(4 / kinetics.muMax) * 10, F0: 0.01, Sf: substrate.S0_default * 5, muSet: kinetics.muMax * 0.5 }
    if (reactorKey === 'continuous') return { ...base, D: kinetics.muMax * 0.6, tf: Math.min(120, Math.ceil(6 / kinetics.muMax) * 10) }
    return null
  }, [kinetics, substrate, reactorKey, org])

  const trajectory = useMemo(() => {
    if (!simParams) return []
    if (reactorKey === 'batch') return solveBatch(simParams)
    if (reactorKey === 'fedbatch') return solveFedBatch(simParams)
    if (reactorKey === 'continuous') return solveContinuous(simParams)
    return []
  }, [simParams, reactorKey])

  const reset = useCallback(() => { setPlaying(false); setTIdx(0) }, [])

  useEffect(() => {
    if (!playing || !trajectory.length) return
    const id = setInterval(() => {
      setTIdx(i => {
        if (i >= trajectory.length - 1) { setPlaying(false); return i }
        return Math.min(i + speed, trajectory.length - 1)
      })
    }, 100)
    return () => clearInterval(id)
  }, [playing, speed, trajectory.length])

  const current = trajectory[Math.min(tIdx, trajectory.length - 1)]
  const maxX = useMemo(() => Math.max(...trajectory.map(d => d.X), 0.01), [trajectory])
  const biomassRatio = current ? current.X / maxX : 0
  const chartData = trajectory.slice(0, tIdx + 1)

  // Metrics
  const finalPoint = trajectory[trajectory.length - 1]
  const maxMu = useMemo(() => Math.max(...trajectory.map(d => d.mu), 0), [trajectory])

  const canGoStep2 = substrateKey !== null
  const canGoStep3 = canGoStep2 && orgKey !== null && org?.params?.[substrateKey]
  const canGoStep4 = canGoStep3 && reactorKey !== null
  const canSimulate = canGoStep4

  function handleSubstrate(key) {
    setSubstrateKey(key)
    // reset downstream if incompatible
    if (orgKey && !MICROORGANISMS[orgKey].substrates.includes(key)) {
      setOrgKey(null)
      setReactorKey(null)
      setStep(2)
    }
  }

  function handleOrg(key) {
    setOrgKey(key)
    if (reactorKey) { setReactorKey(null); setStep(3) }
  }

  const exportCSV = () => {
    const keys = Object.keys(trajectory[0] || {})
    const rows = [keys.join(','), ...trajectory.map(d => keys.map(k => d[k]).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv,' + encodeURIComponent(rows)
    a.download = `sim_${orgKey}_${reactorKey}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        tag="MÓDULO INTEGRADO · DISEÑO DE BIOPROCESOS"
        title="Selector de Sistema de Fermentación"
        sub="Elige el sustrato, microorganismo y tipo de reactor. El sistema pre-carga los parámetros cinéticos y ejecuta la simulación ODE automáticamente."
      />

      {/* Step indicator */}
      <div className="bg-white rounded-xl border border-sage-200 p-4">
        <div className="flex items-center gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => i + 1 < step && setStep(i + 1)}
                className="flex items-center gap-2 group"
                disabled={i + 1 >= step}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${step > i + 1 ? 'bg-forest-500 border-forest-500 text-white' : step === i + 1 ? 'bg-white border-forest-600 text-forest-600' : 'bg-sage-50 border-sage-200 text-sage-400'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:inline transition-colors
                  ${step > i + 1 ? 'text-forest-600' : step === i + 1 ? 'text-forest-700' : 'text-sage-400'}`}>
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${step > i + 1 ? 'bg-forest-400' : 'bg-sage-200'}`} />
              )}
            </div>
          ))}
        </div>
        {/* Selection summary chips */}
        {(substrateKey || orgKey || reactorKey) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-sage-100">
            {substrateKey && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
                {SUBSTRATES[substrateKey].icon} {SUBSTRATES[substrateKey].label}
                <button onClick={() => { setSubstrateKey(null); setOrgKey(null); setReactorKey(null); setStep(1) }} className="ml-1 text-amber-400 hover:text-amber-700">×</button>
              </span>
            )}
            {orgKey && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-forest-50 border border-forest-200 text-xs text-forest-700 font-medium">
                {MICROORGANISMS[orgKey].icon} {MICROORGANISMS[orgKey].label}
                <button onClick={() => { setOrgKey(null); setReactorKey(null); setStep(2) }} className="ml-1 text-forest-400 hover:text-forest-700">×</button>
              </span>
            )}
            {reactorKey && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-plum-50 border border-plum-200 text-xs text-plum-700 font-medium">
                {REACTORS[reactorKey].icon} {REACTORS[reactorKey].label}
                <button onClick={() => { setReactorKey(null); setStep(3) }} className="ml-1 text-plum-400 hover:text-plum-700">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Step 1: Substrate ─── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-forest-900">Paso 1 — Selecciona el Sustrato</h2>
            <span className="text-xs text-sage-400">Fuente de carbono y energía</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(SUBSTRATES).map(([key, s]) => (
              <SelectCard key={key} item={s} selected={substrateKey === key}
                onClick={() => { handleSubstrate(key); if (step === 1) setStep(2) }} />
            ))}
          </div>
          {/* Info panel */}
          {substrateKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
              <div className="text-3xl">{substrate.icon}</div>
              <div>
                <div className="font-semibold text-amber-800">{substrate.label} — {substrate.formula}</div>
                <div className="text-sm text-amber-700 mt-0.5">{substrate.desc}</div>
                <div className="text-xs text-amber-600 mt-1">Concentración inicial sugerida: <strong>{substrate.S0_default} g/L</strong></div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={() => setStep(2)} disabled={!canGoStep2}
              className="px-5 py-2 bg-forest-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-forest-700 transition-colors">
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Microorganism ─── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-forest-900">Paso 2 — Selecciona el Microorganismo</h2>
            <span className="text-xs text-sage-400">Compatible con {substrate?.label}</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(MICROORGANISMS).map(([key, o]) => (
              <SelectCard key={key} item={o} selected={orgKey === key}
                disabled={!o.substrates.includes(substrateKey)}
                onClick={() => { handleOrg(key); setStep(3) }} />
            ))}
          </div>
          {orgKey && kinetics && (
            <div className="bg-forest-50 border border-forest-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{org.icon}</span>
                <div>
                  <div className="font-semibold text-forest-800">{org.label}</div>
                  <div className="text-xs text-forest-600">{org.type} · Parámetros cinéticos (Monod)</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'µmax', val: kinetics.muMax.toFixed(3), unit: 'h⁻¹', color: '#2D6A4F' },
                  { label: 'Ks', val: kinetics.Ks.toFixed(3), unit: 'g/L', color: '#D4A017' },
                  { label: 'YX/S', val: kinetics.Yxs.toFixed(3), unit: 'g/g', color: '#1B4965' },
                ].map(p => (
                  <div key={p.label} className="bg-white rounded-lg p-2.5 text-center border border-forest-100">
                    <div className="text-xs text-sage-400 mb-0.5">{p.label}</div>
                    <div className="font-mono text-lg font-bold" style={{ color: p.color }}>{p.val}</div>
                    <div className="text-xs text-sage-400">{p.unit}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-sage-500 hover:text-forest-600 transition-colors">← Anterior</button>
            <button onClick={() => setStep(3)} disabled={!canGoStep3}
              className="px-5 py-2 bg-forest-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-forest-700 transition-colors">
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Reactor ─── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-forest-900">Paso 3 — Selecciona el Tipo de Reactor</h2>
            <span className="text-xs text-sage-400">Modo de operación</span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(REACTORS).map(([key, r]) => (
              <button key={key} onClick={() => { setReactorKey(key); setStep(4); reset() }}
                className={`text-left p-4 rounded-xl border-2 transition-all duration-150
                  ${reactorKey === key ? 'border-forest-500 bg-forest-50 shadow-md' : 'border-sage-200 bg-white hover:border-forest-300 hover:shadow-sm'}`}>
                <div className="text-3xl mb-2">{r.icon}</div>
                <div className="font-semibold text-forest-900 mb-1">{r.label}</div>
                <p className="text-xs text-sage-500 mb-3 leading-relaxed">{r.desc}</p>
                <div className="space-y-1">
                  {r.pros.slice(0, 2).map(p => <div key={p} className="flex items-start gap-1 text-xs text-green-700"><span className="flex-shrink-0 mt-0.5">✓</span>{p}</div>)}
                  {r.cons.slice(0, 1).map(c => <div key={c} className="flex items-start gap-1 text-xs text-red-600"><span className="flex-shrink-0 mt-0.5">✗</span>{c}</div>)}
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-sage-500 hover:text-forest-600 transition-colors">← Anterior</button>
            <button onClick={() => { setStep(4); reset() }} disabled={!canGoStep4}
              className="px-5 py-2 bg-forest-600 text-white text-sm font-medium rounded-lg disabled:opacity-40 hover:bg-forest-700 transition-colors">
              Simular →
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Simulation ─── */}
      {step === 4 && canSimulate && trajectory.length > 0 && (
        <div className="space-y-4">
          {/* Header bar */}
          <div className="bg-gradient-to-r from-forest-600 to-forest-700 rounded-xl p-4 text-white flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-3xl">{org.icon}</span>
              <div>
                <div className="font-bold text-lg leading-tight">{org.label} · {substrate.label}</div>
                <div className="text-forest-200 text-sm">{reactor.icon} {reactor.label} · µmax = {kinetics.muMax} h⁻¹ · Ks = {kinetics.Ks} g/L · YX/S = {kinetics.Yxs} g/g</div>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {[1, 5, 10, 50].map(s => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 text-xs rounded font-mono border transition-colors
                    ${speed === s ? 'bg-white text-forest-700 border-white' : 'bg-transparent text-forest-200 border-forest-400 hover:border-white'}`}>
                  {s}x
                </button>
              ))}
              <button onClick={() => { if (tIdx >= trajectory.length - 1) reset(); setPlaying(p => !p) }}
                className="px-4 py-1.5 bg-white text-forest-700 text-sm font-semibold rounded-lg hover:bg-forest-50 transition-colors">
                {playing ? '⏸ Pausar' : '▶ Iniciar'}
              </button>
              <button onClick={reset} className="px-3 py-1.5 bg-forest-500 text-white text-sm rounded-lg hover:bg-forest-400 transition-colors">↺</button>
              <button onClick={exportCSV} className="px-3 py-1.5 bg-forest-500 text-white text-sm rounded-lg hover:bg-forest-400 transition-colors text-xs">↓ CSV</button>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-4">
            {/* 3D Reactor */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-sage-200 overflow-hidden">
              <div className="p-3 border-b border-sage-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-forest-700">Biorreactor 3D — {reactor.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: org.color }} />
                  <span className="text-xs text-sage-400">{org.label}</span>
                </div>
              </div>
              <div className="h-64 lg:h-[320px]">
                <Canvas camera={{ position: [3, 1.5, 3.5], fov: 45 }} gl={{ antialias: true }}>
                  <ambientLight intensity={0.6} />
                  <directionalLight position={[5, 8, 5]} intensity={1.2} />
                  <pointLight position={[-3, 3, -3]} intensity={0.4} color="#c7e8ff" />
                  <IntegratedReactor3D biomassRatio={biomassRatio} active={playing} reactorType={reactorKey} orgColor={org.color} />
                  <OrbitControls enablePan={false} minDistance={2.5} maxDistance={7} />
                </Canvas>
              </div>
              {/* Live metrics */}
              {current && (
                <div className="grid grid-cols-3 divide-x divide-sage-100 border-t border-sage-100">
                  {[
                    { label: 'X', val: current.X.toFixed(3), unit: 'g/L', color: CHART_COLORS.X },
                    { label: 'S', val: current.S.toFixed(3), unit: 'g/L', color: CHART_COLORS.S },
                    { label: 'µ', val: current.mu.toFixed(4), unit: 'h⁻¹', color: CHART_COLORS.mu },
                  ].map(m => (
                    <div key={m.label} className="py-2 px-1 text-center">
                      <div className="text-xs text-sage-400">{m.label}</div>
                      <div className="font-mono text-sm font-bold" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-xs text-sage-400">{m.unit}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Final metrics summary */}
              {finalPoint && (
                <div className="p-3 border-t border-sage-100 bg-sage-50">
                  <div className="text-xs font-semibold text-sage-500 mb-2">Resultados Finales</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-sage-400">X final</span><span className="font-mono font-bold text-forest-700">{finalPoint.X.toFixed(3)} g/L</span></div>
                    <div className="flex justify-between"><span className="text-sage-400">S final</span><span className="font-mono font-bold text-amber-600">{finalPoint.S.toFixed(3)} g/L</span></div>
                    <div className="flex justify-between"><span className="text-sage-400">µmax obs.</span><span className="font-mono font-bold text-navy-700">{maxMu.toFixed(4)} h⁻¹</span></div>
                    <div className="flex justify-between"><span className="text-sage-400">t final</span><span className="font-mono font-bold text-sage-600">{finalPoint.t} h</span></div>
                    {reactorKey === 'fedbatch' && finalPoint.V && (
                      <div className="flex justify-between col-span-2"><span className="text-sage-400">Biomasa total</span><span className="font-mono font-bold text-plum-700">{(finalPoint.X * finalPoint.V).toFixed(2)} g</span></div>
                    )}
                    {reactorKey === 'continuous' && simParams?.D && (
                      <div className="flex justify-between col-span-2"><span className="text-sage-400">Productividad</span><span className="font-mono font-bold text-plum-700">{(finalPoint.X * simParams.D).toFixed(3)} g/L·h</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="lg:col-span-3 space-y-3">
              {/* Chart 1: X and S vs time */}
              <div className="bg-white rounded-xl border border-sage-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-forest-900">Biomasa & Sustrato vs Tiempo</h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded inline-block bg-forest-600" /> X (g/L)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded inline-block bg-amber-500" /> S (g/L)</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" strokeOpacity={0.6} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#879186' }} stroke="#D8DED4"
                      label={{ value: 'Tiempo (h)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#879186' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#879186' }} stroke="#D8DED4"
                      label={{ value: 'g/L', angle: -90, position: 'insideLeft', offset: 8, fontSize: 10, fill: '#879186' }} />
                    <Tooltip content={<CustomTooltip />} />
                    {reactorKey === 'continuous' && simParams?.D && (
                      <ReferenceLine x={finalPoint?.t} stroke="#94a3b8" strokeDasharray="4 4"
                        label={{ value: 'Estado estac.', position: 'insideTopRight', fontSize: 9, fill: '#94a3b8' }} />
                    )}
                    <Line type="monotone" dataKey="X" stroke={CHART_COLORS.X} strokeWidth={2.5} dot={false} isAnimationActive={false} name="X (g/L)" />
                    <Line type="monotone" dataKey="S" stroke={CHART_COLORS.S} strokeWidth={2.5} dot={false} isAnimationActive={false} name="S (g/L)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2: µ(t) and/or V(t) */}
              <div className="bg-white rounded-xl border border-sage-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-forest-900">
                    Tasa de crecimiento µ(t)
                    {reactorKey === 'fedbatch' ? ' & Volumen' : ''}
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded inline-block bg-navy-600" /> µ (h⁻¹)</span>
                    {reactorKey === 'fedbatch' && <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded inline-block bg-plum-600" /> V (L)</span>}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" strokeOpacity={0.6} />
                    <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#879186' }} stroke="#D8DED4"
                      label={{ value: 'Tiempo (h)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#879186' }} />
                    <YAxis yAxisId="mu" tick={{ fontSize: 10, fill: '#879186' }} stroke="#D8DED4"
                      label={{ value: 'h⁻¹', angle: -90, position: 'insideLeft', offset: 8, fontSize: 10, fill: '#879186' }} />
                    {reactorKey === 'fedbatch' && (
                      <YAxis yAxisId="V" orientation="right" tick={{ fontSize: 10, fill: '#879186' }} stroke="#D8DED4"
                        label={{ value: 'V (L)', angle: 90, position: 'insideRight', fontSize: 10, fill: '#879186' }} />
                    )}
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine yAxisId="mu" y={kinetics.muMax} stroke="#ef4444" strokeDasharray="4 4"
                      label={{ value: `µmax=${kinetics.muMax}`, position: 'insideTopRight', fontSize: 9, fill: '#ef4444' }} />
                    <Line yAxisId="mu" type="monotone" dataKey="mu" stroke={CHART_COLORS.mu} strokeWidth={2} dot={false} isAnimationActive={false} name="µ (h⁻¹)" />
                    {reactorKey === 'fedbatch' && (
                      <Line yAxisId="V" type="monotone" dataKey="V" stroke={CHART_COLORS.V} strokeWidth={2} dot={false} isAnimationActive={false} name="V (L)" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 3: Productivity / Yield bar chart */}
              <div className="bg-white rounded-xl border border-sage-200 p-4">
                <h3 className="text-sm font-semibold text-forest-900 mb-2">
                  {reactorKey === 'fedbatch' ? 'Biomasa Total en Reactor (g)' : 'Comparativa de Métricas Finales'}
                </h3>
                {reactorKey === 'fedbatch' ? (
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#D8DED4" strokeOpacity={0.6} />
                      <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#879186' }} stroke="#D8DED4"
                        label={{ value: 'Tiempo (h)', position: 'insideBottom', offset: -12, fontSize: 10, fill: '#879186' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#879186' }} stroke="#D8DED4"
                        label={{ value: 'g', angle: -90, position: 'insideLeft', offset: 8, fontSize: 10, fill: '#879186' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Prod" stroke={CHART_COLORS.Prod} strokeWidth={2.5} dot={false} isAnimationActive={false} name="X·V (g)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="grid grid-cols-3 gap-3 mt-1">
                    {finalPoint && [
                      { label: 'X final', val: finalPoint.X.toFixed(2), unit: 'g/L', color: CHART_COLORS.X },
                      { label: 'S consumida', val: (simParams.S0 - finalPoint.S).toFixed(2), unit: 'g/L', color: CHART_COLORS.S },
                      { label: 'Rend. obs.', val: finalPoint.S > 0.01 ? ((finalPoint.X - simParams.X0) / (simParams.S0 - finalPoint.S)).toFixed(3) : kinetics.Yxs.toFixed(3), unit: 'g/g', color: '#7B2D8E' },
                    ].map(m => (
                      <div key={m.label} className="rounded-lg p-3 text-center border border-sage-100 bg-sage-50">
                        <div className="text-xs text-sage-400 mb-1">{m.label}</div>
                        <div className="font-mono text-xl font-bold" style={{ color: m.color }}>{m.val}</div>
                        <div className="text-xs text-sage-400">{m.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reactor info footer */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Kinetic params recap */}
            <div className="bg-white rounded-xl border border-sage-200 p-4">
              <h4 className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">Parámetros Cinéticos</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sage-400 w-16">µmax</span>
                  <div className="flex-1 bg-sage-100 rounded-full h-1.5">
                    <div className="bg-forest-500 h-1.5 rounded-full" style={{ width: `${Math.min(kinetics.muMax / 1.5 * 100, 100)}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-forest-700 w-16 text-right">{kinetics.muMax} h⁻¹</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sage-400 w-16">Ks</span>
                  <div className="flex-1 bg-sage-100 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${Math.min(kinetics.Ks / 1.0 * 100, 100)}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-600 w-16 text-right">{kinetics.Ks} g/L</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sage-400 w-16">YX/S</span>
                  <div className="flex-1 bg-sage-100 rounded-full h-1.5">
                    <div className="bg-navy-500 h-1.5 rounded-full" style={{ width: `${kinetics.Yxs / 0.7 * 100}%` }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-navy-700 w-16 text-right">{kinetics.Yxs} g/g</span>
                </div>
              </div>
            </div>
            {/* Reactor pros/cons */}
            <div className="bg-white rounded-xl border border-sage-200 p-4">
              <h4 className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">{reactor.label} — Análisis</h4>
              <div className="space-y-1">
                {reactor.pros.map(p => <div key={p} className="flex items-start gap-1.5 text-xs text-green-700"><span className="mt-0.5 flex-shrink-0">✓</span>{p}</div>)}
                {reactor.cons.map(c => <div key={c} className="flex items-start gap-1.5 text-xs text-red-600"><span className="mt-0.5 flex-shrink-0">✗</span>{c}</div>)}
              </div>
            </div>
            {/* Change selection */}
            <div className="bg-white rounded-xl border border-sage-200 p-4">
              <h4 className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">Modificar Selección</h4>
              <div className="space-y-2">
                <button onClick={() => setStep(1)} className="w-full text-left px-3 py-2 rounded-lg border border-sage-200 text-xs text-sage-600 hover:border-amber-300 hover:bg-amber-50 transition-colors flex items-center gap-2">
                  <span className="text-lg">{substrate.icon}</span>
                  <span className="flex-1">Sustrato: <strong>{substrate.label}</strong></span>
                  <span className="text-sage-400">✎</span>
                </button>
                <button onClick={() => setStep(2)} className="w-full text-left px-3 py-2 rounded-lg border border-sage-200 text-xs text-sage-600 hover:border-forest-300 hover:bg-forest-50 transition-colors flex items-center gap-2">
                  <span className="text-lg">{org.icon}</span>
                  <span className="flex-1">Microorg.: <strong>{org.label}</strong></span>
                  <span className="text-sage-400">✎</span>
                </button>
                <button onClick={() => setStep(3)} className="w-full text-left px-3 py-2 rounded-lg border border-sage-200 text-xs text-sage-600 hover:border-plum-300 hover:bg-plum-50 transition-colors flex items-center gap-2">
                  <span className="text-lg">{reactor.icon}</span>
                  <span className="flex-1">Reactor: <strong>{reactor.label}</strong></span>
                  <span className="text-sage-400">✎</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {step === 4 && !canSimulate && (
        <div className="text-center py-16 text-sage-400">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-sm">Completa los 3 pasos de selección para ejecutar la simulación.</p>
          <button onClick={() => setStep(1)} className="mt-4 px-4 py-2 bg-forest-600 text-white text-sm rounded-lg hover:bg-forest-700 transition-colors">Comenzar →</button>
        </div>
      )}
    </div>
  )
}
